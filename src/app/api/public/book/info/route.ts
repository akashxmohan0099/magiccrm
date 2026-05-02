import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import {
  fetchWorkspaceAvailability,
  getAvailableTimeSlots,
  resolveBookingWorkspaceBySlug,
} from "@/lib/server/public-booking";
import { maxDuration } from "@/lib/services/price";
import { mapPublicServiceFromDB, mapServiceFromDB } from "@/lib/db/services";

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
    const durationOverride = Number(searchParams.get("durationMinutes")) || 0;

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

      const { data: serviceRow } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (!serviceRow || serviceRow.enabled === false) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      // Conservative slot duration: take the longest possible duration across
      // all tiers/variants so a Junior who's slower than base never gets booked
      // into a slot too short for them. The actual booking duration is
      // recomputed once we auto-assign the member at insert time.
      const service = mapServiceFromDB(serviceRow);
      // durationOverride lets a multi-service cart ask for slots big enough
      // to fit the *whole* cart end-to-end. Falls back to the service's own
      // longest duration so single-service requests still pass through.
      const slotDuration = durationOverride > 0 ? durationOverride : maxDuration(service);

      const locationIdParam = searchParams.get("locationId") || undefined;
      const availableSlots = await getAvailableTimeSlots({
        workspaceId,
        serviceId,
        date: bookingsDate,
        durationMinutes: slotDuration,
        defaultAvailability: availability,
        locationId: locationIdParam,
      });

      return NextResponse.json({ availableSlots });
    }

    // ---- fetch services ----
    // Public-safe allowlist. We do NOT use mapServiceFromDB because it pulls
    // server-only fields (cancellation fees, internal pricing rules, etc.).
    // category_id resolves to the canonical category name below; legacy
    // free-text `category` is retained as a fallback.
    const { data: services } = await supabase
      .from("services")
      .select(
        "id, name, description, image_url, duration, price, price_max, category, category_id, price_type, variants, price_tiers, addons, addon_groups, deposit_type, deposit_amount, deposit_applies_to, deposit_no_show_fee, deposit_auto_cancel_hours, cancellation_window_hours, cancellation_fee, requires_card_on_file, requires_confirmation, min_notice_hours, max_advance_days, requires_patch_test, patch_test_validity_days, patch_test_min_lead_hours, patch_test_category, intake_questions, allow_group_booking, max_group_size, rebook_after_days, location_ids, available_weekdays, featured, promo_label, promo_price, promo_percent, promo_start, promo_end, tags, is_package, package_items",
      )
      .eq("workspace_id", workspaceId)
      .eq("enabled", true)
      .order("name", { ascending: true });

    // Resolve the canonical category name from the (small) categories table
    // once and inject it into each service before mapping to the public shape.
    const { data: categoryRows } = await supabase
      .from("service_categories")
      .select("id, name")
      .eq("workspace_id", workspaceId);
    const categoryNameById = new Map<string, string>();
    for (const c of categoryRows ?? []) {
      categoryNameById.set(c.id as string, c.name as string);
    }

    // ---- fetch enabled locations (only surfaced to the customer when 2+) ----
    const { data: locationsData } = await supabase
      .from("locations")
      .select("id, name, address, kind, sort_order")
      .eq("workspace_id", workspaceId)
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    // ---- fetch active team members (public profile fields only) ----
    const { data: members } = await supabase
      .from("workspace_members")
      .select("id, name, avatar_url, bio, social_links, role")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name", { ascending: true });

    // ---- fetch which member can perform which service ----
    const { data: memberServices } = await supabase
      .from("member_services")
      .select("member_id, service_id")
      .eq("workspace_id", workspaceId);

    // ---- fetch brand settings ----
    const { data: wsSettings } = await supabase
      .from("workspace_settings")
      .select("branding")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const brand = (wsSettings?.branding as { brandColor?: string; logoBase64?: string } | null) ?? {};

    // Index services by id so package children resolve to display names
    // without an extra round-trip. Variants are looked up inline from the
    // child's variants JSONB.
    type ServiceRow = Record<string, unknown> & { id: string };
    const serviceById = new Map<string, ServiceRow>();
    for (const s of services ?? []) {
      serviceById.set((s as ServiceRow).id, s as ServiceRow);
    }

    const serviceList = (services ?? []).map((s) => {
      // Prefer the canonical category name (via category_id) over the
      // legacy free-text column. Falls back to the legacy column when no
      // category row matches (or when nothing is set).
      const canonicalName =
        (s.category_id && categoryNameById.get(s.category_id as string)) || undefined;
      const row = canonicalName
        ? { ...s, category: canonicalName }
        : (s as Record<string, unknown>);
      const out = mapPublicServiceFromDB(row as Record<string, unknown>);

      // Resolve package inclusions inline so the public page can surface a
      // "what's included" list without another fetch.
      if (out.isPackage) {
        const items = ((s as ServiceRow).package_items as Array<{
          id?: string;
          serviceId?: string;
          variantId?: string;
          quantity?: number;
        }> | null) ?? [];
        out.packageInclusions = items
          .filter((it) => Boolean(it.serviceId))
          .map((it) => {
            const child = serviceById.get(it.serviceId as string);
            const variants = (child?.variants as Array<{ id: string; name: string }> | null) ?? [];
            const variant = it.variantId ? variants.find((v) => v.id === it.variantId) : undefined;
            return {
              serviceId: it.serviceId as string,
              serviceName: (child?.name as string) ?? "",
              variantId: it.variantId,
              variantName: variant?.name,
              quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
            };
          });
      }

      return out;
    });

    const locationList = (locationsData ?? []).map((l) => ({
      id: l.id as string,
      name: l.name as string,
      address: (l.address as string | null) ?? "",
      kind: (l.kind as "studio" | "mobile") ?? "studio",
      sortOrder: Number(l.sort_order ?? 0),
    }));

    const memberList = (members ?? []).map((m) => ({
      id: m.id as string,
      name: m.name as string,
      avatarUrl: (m.avatar_url as string) || "",
      bio: (m.bio as string) || "",
      socialLinks: (m.social_links as Record<string, string>) || {},
      role: m.role as string,
    }));

    const memberServiceMap = ((memberServices ?? []) as { member_id: string; service_id: string }[])
      .reduce<Record<string, string[]>>((acc, row) => {
        if (!acc[row.service_id]) acc[row.service_id] = [];
        acc[row.service_id].push(row.member_id);
        return acc;
      }, {});

    return NextResponse.json({
      workspaceId,
      businessName,
      brandColor: brand.brandColor || "#34D399",
      logoBase64: brand.logoBase64 || "",
      services: serviceList,
      availability,
      members: memberList,
      memberServiceMap,
      locations: locationList,
    });
  } catch (error) {
    console.error("[public/book/info] Error:", error);
    return NextResponse.json({ error: "Failed to load booking page" }, { status: 500 });
  }
}
