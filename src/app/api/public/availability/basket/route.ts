import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import {
  fetchWorkspaceAvailability,
  getAvailableBasketSlots,
  resolveBookingWorkspaceBySlug,
  type BasketItemRequest,
} from "@/lib/server/public-booking";

/**
 * Multi-service basket availability.
 *
 * Closes the gap between the client's single-service slot estimate and the
 * server's per-item validation at submit time. Run on the same engine the
 * submit handler uses, so any returned slot is bookable end-to-end for
 * every basket item.
 *
 * POST /api/public/availability/basket
 * Body:
 *   {
 *     slug: string,
 *     date: "YYYY-MM-DD",
 *     items: [{
 *       serviceId: string,
 *       variantId?: string,
 *       extraDurationMinutes?: number,  // sum of selected addon durations
 *       preferredMemberId?: string,
 *     }],
 *     locationId?: string,
 *   }
 *
 * Returns:
 *   {
 *     slots: [{
 *       time: "HH:MM",
 *       startAt: ISO,
 *       endAt: ISO,
 *       assignments: [{ serviceId, memberId, startAt, endAt }],
 *     }]
 *   }
 *
 * Empty `slots` is the correct answer when no time fits the whole basket;
 * the UI should render "no times available" rather than treating it as an
 * error.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`avail-basket:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { slug, date, items, locationId } = body as Record<string, unknown>;

  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Empty basket" }, { status: 400 });
  }

  // Cap basket size — protects the engine from an attacker submitting a
  // huge synthetic basket that would walk every slot N times.
  if (items.length > 10) {
    return NextResponse.json({ error: "Basket too large" }, { status: 400 });
  }

  const validItems: BasketItemRequest[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid basket item" }, { status: 400 });
    }
    const it = raw as Record<string, unknown>;
    if (typeof it.serviceId !== "string" || !it.serviceId) {
      return NextResponse.json({ error: "Item missing serviceId" }, { status: 400 });
    }
    validItems.push({
      serviceId: it.serviceId,
      variantId: typeof it.variantId === "string" ? it.variantId : undefined,
      extraDurationMinutes:
        typeof it.extraDurationMinutes === "number" && it.extraDurationMinutes > 0
          ? Math.min(it.extraDurationMinutes, 600) // sanity cap at 10h
          : undefined,
      preferredMemberId:
        typeof it.preferredMemberId === "string" ? it.preferredMemberId : undefined,
    });
  }

  try {
    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const availability = await fetchWorkspaceAvailability(resolved.workspaceId);

    const slots = await getAvailableBasketSlots({
      workspaceId: resolved.workspaceId,
      date,
      items: validItems,
      defaultAvailability: availability,
      locationId: typeof locationId === "string" ? locationId : undefined,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("[public/availability/basket] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute basket availability" },
      { status: 500 },
    );
  }
}
