import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { runAutomationRules } from "@/lib/server/automation-runner";
import { rateLimit } from "@/lib/rate-limit";
import { fanOutWaitlistForBooking } from "@/lib/server/waitlist-fanout";

/**
 * Fire event-driven automation rules for the current user's workspace.
 *
 * Used by the dashboard UI after in-place status changes that can't otherwise
 * trigger server-side logic (e.g. toggling a booking to cancelled / no_show).
 *
 * POST /api/automations/trigger
 * Body: { type, entityId?, entityData? }
 *
 * Only the workspace member who owns the session can trigger rules for their
 * workspace — the workspaceId is resolved from the authenticated session.
 */

const ALLOWED_TYPES = new Set([
  "booking_confirmation",
  "appointment_reminder",
  "post_service_followup",
  "review_request",
  "rebooking_nudge",
  "no_show_followup",
  "invoice_auto_send",
  "cancellation_confirmation",
]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`automation-trigger:${ip}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    type?: string;
    entityId?: string;
    entityData?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, entityId, entityData } = body;

  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid automation type" }, { status: 400 });
  }

  // Resolve the caller's active workspace.
  const admin = await createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!member?.workspace_id) {
    return NextResponse.json({ error: "No active workspace" }, { status: 403 });
  }

  try {
    const result = await runAutomationRules({
      workspaceId: member.workspace_id as string,
      type,
      entityId: entityId ?? null,
      entityData: entityData ?? undefined,
    });

    // Side effect: a booking-cancellation also fans out a "slot opened" SMS
    // to every active waitlist entry that matches the freed slot. Best-effort
    // — we don't roll back the cancellation if the fanout fails.
    if (type === "cancellation_confirmation" && entityData?.bookingId) {
      const bookingId = entityData.bookingId as string;
      const wsId = member.workspace_id as string;
      void fanOutWaitlistForBooking(wsId, bookingId).catch((err) => {
        console.warn("[automations/trigger] waitlist fanout failed:", err);
      });

      // Cascade: cancelling a group parent cancels every child guest
      // booking under it. Children inherit the cancellation reason so
      // operators see the same context everywhere.
      void admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Cancelled with group parent",
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", wsId)
        .eq("group_parent_booking_id", bookingId)
        .neq("status", "cancelled")
        .then(({ error }) => {
          if (error)
            console.warn("[automations/trigger] group cascade failed:", error.message);
        });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[automations/trigger] Error:", err);
    return NextResponse.json(
      { error: "Failed to run automation rules" },
      { status: 500 },
    );
  }
}
