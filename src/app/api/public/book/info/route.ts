import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Public booking info endpoint. No auth required.
 *
 * GET /api/public/book/info?slug=xxx
 *   Returns: workspace info, services, and availability for the public booking page.
 *
 * GET /api/public/book/info?workspaceId=xxx&bookingsFrom=yyyy-mm-dd&bookingsTo=yyyy-mm-dd
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
    const workspaceIdParam = searchParams.get("workspaceId");
    const bookingsFrom = searchParams.get("bookingsFrom");
    const bookingsTo = searchParams.get("bookingsTo");

    const supabase = await createAdminClient();

    // ---- If fetching bookings for conflict detection ----
    if (workspaceIdParam && bookingsFrom && bookingsTo) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_at, end_at")
        .eq("workspace_id", workspaceIdParam)
        .neq("status", "cancelled")
        .gte("start_at", `${bookingsFrom}T00:00:00`)
        .lte("start_at", `${bookingsTo}T23:59:59`);

      return NextResponse.json({ existingBookings: bookings ?? [] });
    }

    // ---- Find workspace by slug or ID ----
    if (!slug && !workspaceIdParam) {
      return NextResponse.json({ error: "Missing slug or workspaceId" }, { status: 400 });
    }

    let workspaceId: string | null = null;
    let businessName = "Business";

    if (slug) {
      // Try to find workspace by matching the slug
      // The slug can be the workspace ID or a custom booking slug stored in settings
      // First, try treating the slug as a workspace ID
      const { data: wsById } = await supabase
        .from("workspaces")
        .select("id, name")
        .eq("id", slug)
        .maybeSingle();

      if (wsById) {
        workspaceId = wsById.id;
        businessName = wsById.name || "Business";
      } else {
        // Try matching slug in workspace_settings.booking_page_slug
        const { data: settingsBySlug } = await supabase
          .from("workspace_settings")
          .select("workspace_id")
          .eq("booking_page_slug", slug)
          .maybeSingle();

        if (settingsBySlug) {
          workspaceId = settingsBySlug.workspace_id;
          const { data: ws } = await supabase
            .from("workspaces")
            .select("name")
            .eq("id", workspaceId)
            .single();
          businessName = ws?.name || "Business";
        } else {
          // Also try matching workspace name slugified
          const { data: allWs } = await supabase
            .from("workspaces")
            .select("id, name");

          const match = (allWs ?? []).find((w) => {
            const nameSlug = (w.name || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            return nameSlug === slug.toLowerCase();
          });

          if (match) {
            workspaceId = match.id;
            businessName = match.name || "Business";
          }
        }
      }
    } else {
      workspaceId = workspaceIdParam;
      const { data: ws } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();
      businessName = ws?.name || "Business";
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
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
