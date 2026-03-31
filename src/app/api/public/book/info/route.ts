import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";

/**
 * Public booking info endpoint. No auth required.
 *
 * GET /api/public/book/info?slug=xxx
 *   Returns: workspace info, services, and availability for the public booking page.
 *
 * GET /api/public/book/info?slug=xxx&bookingsFrom=yyyy-mm-dd&bookingsTo=yyyy-mm-dd
 *   Returns: existing bookings for conflict checking on the selected date range.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`book-info:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const bookingsFrom = searchParams.get("bookingsFrom");
    const bookingsTo = searchParams.get("bookingsTo");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const resolvedWorkspace = await resolveBookingWorkspaceBySlug(slug);
    if (!resolvedWorkspace) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const { workspaceId, businessName } = resolvedWorkspace;
    const supabase = await createAdminClient();

    // ---- If fetching bookings for conflict detection ----
    if (bookingsFrom && bookingsTo) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("workspace_id", workspaceId)
        .neq("status", "cancelled")
        .gte("start_at", `${bookingsFrom}T00:00:00`)
        .lte("start_at", `${bookingsTo}T23:59:59`);

      return NextResponse.json({ existingBookings: bookings ?? [] });
    }

    // ---- fetch services ----
    const { data: services } = await supabase
      .from("services")
      .select("id, name, duration, price, category")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });

    // ---- fetch availability from workspace_modules settings ----
    const { data: moduleSettings } = await supabase
      .from("workspace_modules")
      .select("settings")
      .eq("workspace_id", workspaceId)
      .eq("module_id", "bookings-calendar")
      .maybeSingle();

    let availability: { day: number; startTime: string; endTime: string; enabled: boolean }[] = [];
    if (moduleSettings?.settings) {
      const settings = moduleSettings.settings as { availability?: typeof availability };
      availability = settings.availability || [];
    }

    // If no availability configured, use sensible defaults (Mon-Fri 9-5)
    if (availability.length === 0) {
      availability = [
        { day: 1, startTime: "09:00", endTime: "17:00", enabled: true },
        { day: 2, startTime: "09:00", endTime: "17:00", enabled: true },
        { day: 3, startTime: "09:00", endTime: "17:00", enabled: true },
        { day: 4, startTime: "09:00", endTime: "17:00", enabled: true },
        { day: 5, startTime: "09:00", endTime: "17:00", enabled: true },
        { day: 6, startTime: "09:00", endTime: "12:00", enabled: false },
        { day: 0, startTime: "09:00", endTime: "12:00", enabled: false },
      ];
    }

    return NextResponse.json({
      workspaceId,
      businessName,
      services: (services ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: s.price,
        category: s.category,
      })),
      availability,
    });
  } catch (error) {
    console.error("[public/book/info] Error:", error);
    return NextResponse.json({ error: "Failed to load booking page" }, { status: 500 });
  }
}
