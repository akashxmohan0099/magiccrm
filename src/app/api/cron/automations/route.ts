import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runAutomationRules } from "@/lib/server/automation-runner";

/**
 * Cron endpoint: Process time-based automations.
 *
 * Runs on a schedule (e.g. every hour via Vercel Cron).
 * Handles:
 *  1. Post-appointment follow-up   — N hours after a completed booking
 *  2. Review request               — N days after a completed booking
 *  3. Rebooking nudge              — N days after a client's last visit
 *
 * Event-driven automations (booking_confirmation, cancellation_confirmation,
 * no_show_followup) are handled inline in their respective API routes via
 * runAutomationRules().
 *
 * All handlers delegate message rendering and delivery to runAutomationRules,
 * so the user's configured channel and message template are honored.
 */

type Supabase = Awaited<ReturnType<typeof createAdminClient>>;

interface ProcessingResult {
  followUps: number;
  reviewRequests: number;
  rebookingNudges: number;
  errors: number;
}

interface TimingRule {
  id: string;
  workspace_id: string;
  timing_value: number | null;
  timing_unit: "minutes" | "hours" | "days" | null;
}

async function verifyAuthorization(req: NextRequest): Promise<boolean> {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = bearer || req.headers.get("x-cron-secret");
  return provided === expected;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Fetch all enabled rules of a given type across workspaces. */
async function fetchEnabledRules(
  supabase: Supabase,
  type: string,
): Promise<TimingRule[]> {
  const { data } = await supabase
    .from("automation_rules")
    .select("id, workspace_id, timing_value, timing_unit")
    .eq("type", type)
    .eq("enabled", true);

  return (data ?? []) as TimingRule[];
}

/** Convert timingValue + unit → milliseconds. Falls back to a default. */
function timingToMs(
  rule: TimingRule,
  fallbackMs: number,
): number {
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

/**
 * Returns the subset of entityIds for which NO activity_log entry with the
 * given `descriptionFragment` has been recorded recently.
 */
async function filterAlreadySent(
  supabase: Supabase,
  workspaceId: string,
  entityIds: string[],
  descriptionFragment: string,
  lookbackMs: number,
): Promise<Set<string>> {
  if (entityIds.length === 0) return new Set();

  const cutoff = new Date(Date.now() - lookbackMs).toISOString();
  const { data } = await supabase
    .from("activity_log")
    .select("entity_id")
    .eq("workspace_id", workspaceId)
    .in("entity_id", entityIds)
    .like("description", `%${descriptionFragment}%`)
    .gte("created_at", cutoff);

  return new Set((data ?? []).map((l) => l.entity_id as string));
}

// ---------------------------------------------------------------------------
// 1. Post-appointment follow-up (N hours after completed booking)
// ---------------------------------------------------------------------------

async function processPostAppointmentFollowUps(
  supabase: Supabase,
): Promise<number> {
  const rules = await fetchEnabledRules(supabase, "post_service_followup");
  if (rules.length === 0) return 0;

  let sent = 0;
  const now = Date.now();

  for (const rule of rules) {
    // Default window: 23–25 hours after completion
    const delayMs = timingToMs(rule, 24 * 60 * 60 * 1000);
    const windowStart = new Date(now - delayMs - 60 * 60 * 1000);
    const windowEnd = new Date(now - delayMs + 60 * 60 * 1000);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, service_id, end_at, services!inner(name)")
      .eq("workspace_id", rule.workspace_id)
      .eq("status", "completed")
      .gte("end_at", windowStart.toISOString())
      .lte("end_at", windowEnd.toISOString());

    if (!bookings || bookings.length === 0) continue;

    const bookingIds = bookings.map((b) => b.id as string);
    const alreadySent = await filterAlreadySent(
      supabase,
      rule.workspace_id,
      bookingIds,
      "post_service_followup",
      7 * 24 * 60 * 60 * 1000,
    );

    for (const booking of bookings) {
      if (alreadySent.has(booking.id as string)) continue;

      const serviceName =
        (booking.services as unknown as { name: string } | null)?.name ||
        "your appointment";

      const result = await runAutomationRules({
        workspaceId: rule.workspace_id,
        type: "post_service_followup",
        entityId: booking.client_id as string,
        entityData: {
          bookingId: booking.id,
          serviceName,
        },
      });

      if (result.results.some((r) => r.emailSent || r.smsSent)) {
        sent++;
      }
    }
  }

  return sent;
}

// ---------------------------------------------------------------------------
// 2. Review request (N days after completed booking)
// ---------------------------------------------------------------------------

async function processReviewRequests(supabase: Supabase): Promise<number> {
  const rules = await fetchEnabledRules(supabase, "review_request");
  if (rules.length === 0) return 0;

  let sent = 0;
  const now = Date.now();

  for (const rule of rules) {
    // Default window: 3 days ± 12 hours after completion
    const delayMs = timingToMs(rule, 3 * 24 * 60 * 60 * 1000);
    const windowStart = new Date(now - delayMs - 12 * 60 * 60 * 1000);
    const windowEnd = new Date(now - delayMs + 12 * 60 * 60 * 1000);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, client_id, service_id, end_at, services!inner(name)")
      .eq("workspace_id", rule.workspace_id)
      .eq("status", "completed")
      .gte("end_at", windowStart.toISOString())
      .lte("end_at", windowEnd.toISOString());

    if (!bookings || bookings.length === 0) continue;

    const bookingIds = bookings.map((b) => b.id as string);
    const alreadySent = await filterAlreadySent(
      supabase,
      rule.workspace_id,
      bookingIds,
      "review_request",
      30 * 24 * 60 * 60 * 1000,
    );

    for (const booking of bookings) {
      if (alreadySent.has(booking.id as string)) continue;

      const serviceName =
        (booking.services as unknown as { name: string } | null)?.name ||
        "your appointment";

      const result = await runAutomationRules({
        workspaceId: rule.workspace_id,
        type: "review_request",
        entityId: booking.client_id as string,
        entityData: {
          bookingId: booking.id,
          serviceName,
        },
      });

      if (result.results.some((r) => r.emailSent || r.smsSent)) {
        sent++;
      }
    }
  }

  return sent;
}

// ---------------------------------------------------------------------------
// 3. Rebooking nudge (N days after client's last completed booking)
// ---------------------------------------------------------------------------

async function processRebookingNudges(supabase: Supabase): Promise<number> {
  const rules = await fetchEnabledRules(supabase, "rebooking_nudge");
  if (rules.length === 0) return 0;

  let sent = 0;
  const now = Date.now();

  for (const rule of rules) {
    // Default inactivity threshold: 30 days
    const thresholdMs = timingToMs(rule, 30 * 24 * 60 * 60 * 1000);
    const cutoff = new Date(now - thresholdMs);

    // Pull a batch of clients for this workspace (hard cap per run)
    const { data: clients } = await supabase
      .from("clients")
      .select("id")
      .eq("workspace_id", rule.workspace_id)
      .limit(200);

    if (!clients || clients.length === 0) continue;

    const clientIds = clients.map((c) => c.id as string);

    // Last completed booking per client
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("client_id, end_at")
      .eq("workspace_id", rule.workspace_id)
      .eq("status", "completed")
      .in("client_id", clientIds)
      .order("end_at", { ascending: false });

    const lastBookingMap = new Map<string, Date>();
    for (const b of allBookings ?? []) {
      const cid = b.client_id as string;
      if (!lastBookingMap.has(cid)) {
        lastBookingMap.set(cid, new Date(b.end_at as string));
      }
    }

    // Clients with a last visit before the cutoff
    const staleIds = clientIds.filter((cid) => {
      const last = lastBookingMap.get(cid);
      return last && last < cutoff;
    });

    if (staleIds.length === 0) continue;

    const alreadyNudged = await filterAlreadySent(
      supabase,
      rule.workspace_id,
      staleIds,
      "rebooking_nudge",
      30 * 24 * 60 * 60 * 1000,
    );

    const eligible = staleIds.filter((id) => !alreadyNudged.has(id)).slice(0, 20);

    for (const clientId of eligible) {
      const lastDate = lastBookingMap.get(clientId)!;
      const daysSince = Math.floor(
        (now - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const result = await runAutomationRules({
        workspaceId: rule.workspace_id,
        type: "rebooking_nudge",
        entityId: clientId,
        entityData: { daysSince },
      });

      if (result.results.some((r) => r.emailSent || r.smsSent)) {
        sent++;
      }
    }
  }

  return sent;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

async function handleRequest(req: NextRequest): Promise<NextResponse> {
  if (!(await verifyAuthorization(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const result: ProcessingResult = {
    followUps: 0,
    reviewRequests: 0,
    rebookingNudges: 0,
    errors: 0,
  };

  try {
    result.followUps = await processPostAppointmentFollowUps(supabase);
  } catch (err) {
    console.error("[cron/automations] post_service_followup error:", err);
    result.errors++;
  }

  try {
    result.reviewRequests = await processReviewRequests(supabase);
  } catch (err) {
    console.error("[cron/automations] review_request error:", err);
    result.errors++;
  }

  try {
    result.rebookingNudges = await processRebookingNudges(supabase);
  } catch (err) {
    console.error("[cron/automations] rebooking_nudge error:", err);
    result.errors++;
  }

  const message = `Sent ${result.followUps} follow-ups, ${result.reviewRequests} review requests, ${result.rebookingNudges} rebooking nudges`;
  const status = result.errors > 0 ? 207 : 200;
  return NextResponse.json({ success: true, ...result, message }, { status });
}

export const POST = handleRequest;
export const GET = handleRequest;
