/**
 * Public booking waitlist join endpoint. Clients use this when their
 * preferred slot wasn't free; the cancel-hook later fans out to matching
 * entries when a booking opens up.
 *
 * POST /api/public/waitlist
 * Body: { slug, serviceId, preferredDate, preferredDateEnd?, artistId?,
 *         clientName, clientEmail, clientPhone?, notes? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-waitlist:${ip}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const body = await req.json();
    const {
      slug,
      serviceId,
      preferredDate,
      preferredDateEnd,
      artistId,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = body;

    if (!slug || !serviceId || !preferredDate || !clientName || !clientEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const supabase = await createAdminClient();
    // Reuse the client row when their email already exists; keeps the
    // waitlist linked so the operator sees it on their profile.
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("workspace_id", resolved.workspaceId)
      .eq("email", clientEmail)
      .maybeSingle();

    const id = generateId();
    const now = new Date().toISOString();
    const { error } = await supabase.from("booking_waitlist").insert({
      id,
      workspace_id: resolved.workspaceId,
      client_id: existingClient?.id ?? null,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || null,
      service_id: serviceId,
      preferred_date: preferredDate,
      preferred_date_end: preferredDateEnd || null,
      artist_id: artistId || null,
      notes: notes || null,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("[public/waitlist] insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error("[public/waitlist] error:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }
}
