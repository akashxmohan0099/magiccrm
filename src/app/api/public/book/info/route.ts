import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import {
  fetchWorkspaceAvailability,
  getAvailableTimeSlots,
  resolveBookingWorkspaceBySlug,
} from "@/lib/server/public-booking";

/**
 * Public booking info endpoint. No auth required.
 *
 * GET /api/public/book/info?slug=xxx
 *   Returns: workspace info, services, and availability for the public booking page.
 *
 * GET /api/public/book/info?slug=xxx&bookingsDate=yyyy-mm-dd&serviceId=uuid
 *   Returns: computed available slots for the selected day and service.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`book-info:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const bookingsDate = searchParams.get("bookingsDate");
    const serviceId = searchParams.get("serviceId");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const resolvedWorkspace = await resolveBookingWorkspaceBySlug(slug);
    if (!resolvedWorkspace) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const { workspaceId, businessName } = resolvedWorkspace;
    const supabase = await createAdminClient();
    const availability = await fetchWorkspaceAvailability(workspaceId);

    // ---- If fetching available slots for a selected date/service ----
    if (bookingsDate && serviceId) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingsDate)) {
        return NextResponse.json({ error: "Invalid bookingsDate" }, { status: 400 });
      }

      const { data: service } = await supabase
        .from("services")
        .select("id, duration")
        .eq("id", serviceId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      const availableSlots = await getAvailableTimeSlots({
        workspaceId,
        serviceId,
        date: bookingsDate,
        durationMinutes: Number(service.duration ?? 60),
        defaultAvailability: availability,
      });

      return NextResponse.json({ availableSlots });
    }

    // ---- fetch services ----
    const { data: services } = await supabase
      .from("services")
      .select("id, name, duration, price, category")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    // ---- fetch brand settings ----
    const { data: wsSettings } = await supabase
      .from("workspace_settings")
      .select("branding")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const brand = (wsSettings?.branding as { brandColor?: string; logoBase64?: string } | null) ?? {};

    const serviceList = (services ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      duration: Number(s.duration ?? 60),
      price: Number(s.price ?? 0),
      category: s.category as string ?? "",
    }));

    return NextResponse.json({
      workspaceId,
      businessName,
      brandColor: brand.brandColor || "#34D399",
      logoBase64: brand.logoBase64 || "",
      services: serviceList,
      availability,
    });
  } catch (error) {
    console.error("[public/book/info] Error:", error);
    return NextResponse.json({ error: "Failed to load booking page" }, { status: 500 });
  }
}
