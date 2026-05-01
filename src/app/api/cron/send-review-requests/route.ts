/**
 * Cron — send Google review requests after a service.
 *
 * GET /api/cron/send-review-requests
 *
 * For each workspace with an enabled `review_request` automation rule,
 * find completed bookings that ended within the rule's configured window
 * (timing_value/unit AFTER end_at) and haven't been review-requested yet.
 * Fires runAutomationRules so the workspace's channel + template apply,
 * then stamps `reviewRequestSentAt` to dedupe.
 *
 * Hourly via Vercel Cron. Protect with CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runAutomationRules } from "@/lib/server/automation-runner";

interface Rule {
  id: string;
  workspace_id: string;
  timing_value: number | null;
  timing_unit: "minutes" | "hours" | "days" | null;
}

function timingToMs(rule: Rule, fallbackMs: number): number {
  const value = rule.timing_value;
  const unit = rule.timing_unit;
  if (value == null || unit == null) return fallbackMs;
  const factor = unit === "minutes" ? 60_000 : unit === "hours" ? 3_600_000 : 86_400_000;
  return value * factor;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { data: rules } = await supabase
    .from("automation_rules")
    .select("id, workspace_id, timing_value, timing_unit")
    .eq("type", "review_request")
    .eq("enabled", true);

  if (!rules || rules.length === 0) {
    return NextResponse.json({ sent: 0, rules: 0 });
  }

  const now = Date.now();
  let sent = 0;

  for (const rule of rules as Rule[]) {
    // Default: 24h after appointment end.
    const offsetMs = timingToMs(rule, 24 * 3_600_000);
    // Window: bookings whose end_at falls between (now - offset - 1h) and (now - offset).
    // Run hourly so an hour-wide window is enough to catch every booking
    // exactly once, given the dedupe stamp.
    const upper = new Date(now - offsetMs).toISOString();
    const lower = new Date(now - offsetMs - 3_600_000).toISOString();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, date, start_at, service_id")
      .eq("workspace_id", rule.workspace_id)
      .in("status", ["confirmed", "completed"])
      .gte("end_at", lower)
      .lt("end_at", upper)
      .is("review_request_sent_at", null);

    if (!bookings || bookings.length === 0) continue;

    for (const b of bookings) {
      try {
        // Pull service name for the template substitution.
        const { data: srow } = await supabase
          .from("services")
          .select("name")
          .eq("id", b.service_id as string)
          .maybeSingle();

        await runAutomationRules({
          workspaceId: rule.workspace_id,
          type: "review_request",
          entityId: b.client_id as string,
          entityData: {
            bookingId: b.id,
            serviceName: (srow?.name as string) ?? "your service",
            date: b.date,
          },
        });

        await supabase
          .from("bookings")
          .update({
            review_request_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", b.id as string);
        sent += 1;
      } catch (err) {
        console.warn(`[send-review-requests] failed for booking ${b.id}:`, err);
      }
    }
  }

  return NextResponse.json({ sent, rules: rules.length });
}
