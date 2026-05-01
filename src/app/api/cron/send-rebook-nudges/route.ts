/**
 * Cron — rebook nudges. For each completed booking whose service has
 * `rebook_after_days` set, fire the `rebooking_nudge` automation N days
 * after end_at. Stamps `rebook_nudge_sent_at` to dedupe.
 *
 * Daily via Vercel Cron. Protect with CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runAutomationRules } from "@/lib/server/automation-runner";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = Date.now();

  // Pull recent-ish completed bookings whose service has a rebook cadence.
  // We grab at most 90 days of history so the query stays bounded; older
  // bookings aren't worth nudging on.
  const horizon = new Date(now - 90 * 86_400_000).toISOString();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, workspace_id, client_id, service_id, end_at,
      services!inner(rebook_after_days, name)
    `)
    .in("status", ["confirmed", "completed"])
    .gte("end_at", horizon)
    .lte("end_at", new Date(now).toISOString())
    .is("rebook_nudge_sent_at", null)
    .not("services.rebook_after_days", "is", null);

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const b of bookings as unknown as Array<Record<string, unknown>>) {
    const service = b.services as { rebook_after_days: number | null; name: string } | undefined;
    const cadence = service?.rebook_after_days;
    if (!cadence || cadence <= 0) continue;

    const endAtMs = new Date(b.end_at as string).getTime();
    const triggerAt = endAtMs + cadence * 86_400_000;
    // Only fire when we've crossed the trigger time. Since we run daily,
    // a 24-hour window catches every booking within one cron pass.
    if (triggerAt > now || triggerAt < now - 86_400_000) continue;

    try {
      await runAutomationRules({
        workspaceId: b.workspace_id as string,
        type: "rebooking_nudge",
        entityId: b.client_id as string,
        entityData: {
          bookingId: b.id,
          serviceId: b.service_id,
          serviceName: service?.name ?? "your service",
          rebookAfterDays: cadence,
        },
      });

      await supabase
        .from("bookings")
        .update({
          rebook_nudge_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", b.id as string);
      sent += 1;
    } catch (err) {
      console.warn(`[send-rebook-nudges] failed for ${b.id}:`, err);
    }
  }

  return NextResponse.json({ sent, candidates: bookings.length });
}
