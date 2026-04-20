import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runAutomationRules } from "@/lib/server/automation-runner";

/**
 * Cron endpoint: Send pre-appointment reminders.
 *
 * GET /api/cron/send-booking-reminders
 *
 * For each workspace with an enabled `appointment_reminder` automation rule,
 * finds confirmed bookings that start within the rule's configured window
 * (timing_value / timing_unit ahead of now) and delivers the reminder via
 * `runAutomationRules` — so the user's configured channel and message
 * template are honored.
 *
 * Runs hourly via Vercel Cron (or similar). Protect with CRON_SECRET.
 * Dedup: uses `bookings.reminder_sent_at` to avoid double-sending.
 */

type Supabase = Awaited<ReturnType<typeof createAdminClient>>;

interface TimingRule {
  id: string;
  workspace_id: string;
  timing_value: number | null;
  timing_unit: "minutes" | "hours" | "days" | null;
}

function timingToMs(rule: TimingRule, fallbackMs: number): number {
  const value = rule.timing_value;
  const unit = rule.timing_unit;
  if (!value || !unit) return fallbackMs;
  switch (unit) {
    case "minutes": return value * 60 * 1000;
    case "hours":   return value * 60 * 60 * 1000;
    case "days":    return value * 24 * 60 * 60 * 1000;
    default:        return fallbackMs;
  }
}

async function processWorkspaceReminders(
  supabase: Supabase,
  rule: TimingRule,
): Promise<{ sent: number; skipped: number }> {
  // Target window: bookings starting within ±1 hour of (now + timingMs)
  const leadMs = timingToMs(rule, 24 * 60 * 60 * 1000);
  const center = Date.now() + leadMs;
  const windowStart = new Date(center - 60 * 60 * 1000);
  const windowEnd = new Date(center + 60 * 60 * 1000);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id, client_id, service_id, start_at,
      services!inner(name)
    `)
    .eq("workspace_id", rule.workspace_id)
    .eq("status", "confirmed")
    .gte("start_at", windowStart.toISOString())
    .lte("start_at", windowEnd.toISOString())
    .is("reminder_sent_at", null)
    .limit(100);

  if (error || !bookings || bookings.length === 0) {
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;

  for (const booking of bookings) {
    try {
      const startAt = new Date(booking.start_at as string);
      const formattedDate = startAt.toLocaleDateString("en-AU", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = startAt.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const serviceName =
        (booking.services as unknown as { name: string } | null)?.name ||
        "your appointment";

      const result = await runAutomationRules({
        workspaceId: rule.workspace_id,
        type: "appointment_reminder",
        entityId: booking.client_id as string,
        entityData: {
          bookingId: booking.id,
          serviceName,
          date: formattedDate,
          time: formattedTime,
        },
      });

      const delivered = result.results.some((r) => r.emailSent || r.smsSent);

      if (delivered) {
        // Mark reminder as sent so we don't double-dispatch
        await supabase
          .from("bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);
        sent++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(
        `[cron/reminders] Failed for booking ${booking.id}:`,
        err,
      );
      skipped++;
    }
  }

  return { sent, skipped };
}

async function handleRequest(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/reminders] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const providedSecret = bearerToken || req.headers.get("x-cron-secret");
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();

    const { data: rules } = await supabase
      .from("automation_rules")
      .select("id, workspace_id, timing_value, timing_unit")
      .eq("type", "appointment_reminder")
      .eq("enabled", true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: "No workspaces with appointment_reminder enabled" });
    }

    let totalSent = 0;
    let totalSkipped = 0;

    for (const rule of rules as TimingRule[]) {
      try {
        const { sent, skipped } = await processWorkspaceReminders(supabase, rule);
        totalSent += sent;
        totalSkipped += skipped;
      } catch (err) {
        console.error(
          `[cron/reminders] Workspace ${rule.workspace_id} failed:`,
          err,
        );
      }
    }

    return NextResponse.json({
      sent: totalSent,
      skipped: totalSkipped,
      workspaces: rules.length,
      message: `Sent ${totalSent} reminder${totalSent !== 1 ? "s" : ""} across ${rules.length} workspace${rules.length !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    console.error("[cron/reminders] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
