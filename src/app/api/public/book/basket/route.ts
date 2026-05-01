/**
 * Public multi-service booking endpoint. Accepts a basket of items and
 * creates one client + a chain of back-to-back bookings (Pattern 3 — one
 * artist for the whole basket — or Pattern 1, where each item carries its
 * own artistId).
 *
 * Response shape mirrors the single-item route but with `bookings: [...]`.
 *
 * Failure semantics: if any insert fails, all created bookings are rolled
 * back so the client doesn't end up with a half-confirmed basket.
 *
 * POST /api/public/book/basket
 * Body: {
 *   slug, clientName, clientEmail, clientPhone?, notes?,
 *   date, time, locationId?,
 *   items: [{ serviceId, variantId?, addonIds?, artistId? }],
 *   useArtistPerService?: boolean,
 *   sharedArtistId?: string,   // when useArtistPerService is false
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import {
  getAvailableMembersForSlot,
  fetchWorkspaceAvailability,
  resolveBookingWorkspaceBySlug,
} from "@/lib/server/public-booking";
import { resolveDuration, maxDuration } from "@/lib/services/price";
import { mapServiceFromDB } from "@/lib/db/services";
import { mapClientFromDB } from "@/lib/db/clients";
import { checkPatchTest } from "@/lib/services/patch-test";
import type { Service } from "@/types/models";
import { runAutomationRules } from "@/lib/server/automation-runner";

interface BasketItem {
  serviceId: string;
  variantId?: string;
  addonIds?: string[];
  artistId?: string; // Pattern 1 — pinned per item
  /**
   * Group booking: when set, this item is for an additional guest under
   * the lead booking. The guest's booking starts at the same time as the
   * primary item (parallel chairs, same service window) instead of
   * chaining back-to-back.
   */
  guestName?: string;
  guestOf?: number; // index of the primary item in the basket
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-basket:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      slug,
      clientName,
      clientEmail,
      clientPhone,
      notes,
      date,
      time,
      items,
      sharedArtistId,
      locationId,
      stripeCustomerId,
      stripeSetupIntentId,
    } = body as {
      slug: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      notes?: string;
      date: string;
      time: string;
      items: BasketItem[];
      useArtistPerService?: boolean;
      sharedArtistId?: string;
      locationId?: string;
      stripeCustomerId?: string;
      stripeSetupIntentId?: string;
    };

    if (
      !slug ||
      !clientName ||
      !clientEmail ||
      !date ||
      !time ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (items.length > 10) {
      return NextResponse.json(
        { error: "Basket can contain at most 10 items." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Invalid date/time format" }, { status: 400 });
    }
    if (new Date(`${date}T${time}:00`) < new Date()) {
      return NextResponse.json({ error: "Cannot book in the past" }, { status: 400 });
    }

    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }
    const { workspaceId, businessName } = resolved;
    const supabase = await createAdminClient();
    const availability = await fetchWorkspaceAvailability(workspaceId);

    // Fetch every service referenced in the basket in one round-trip.
    const serviceIds = Array.from(new Set(items.map((i) => i.serviceId)));
    const { data: serviceRows } = await supabase
      .from("services")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("id", serviceIds);

    const serviceById = new Map<string, Service>();
    for (const r of serviceRows ?? []) {
      const s = mapServiceFromDB(r as Record<string, unknown>);
      serviceById.set(s.id, s);
    }
    for (const it of items) {
      if (!serviceById.has(it.serviceId)) {
        return NextResponse.json(
          { error: `Service ${it.serviceId} not found` },
          { status: 404 },
        );
      }
    }

    // Card-on-file gate. If ANY service in the basket requires a card
    // on file, the caller must pre-collect via /api/public/book/setup-card
    // and pass back the customer + setup-intent ids.
    const needsCardOnFile = items.some(
      (it) => serviceById.get(it.serviceId)?.requiresCardOnFile,
    );
    if (needsCardOnFile && !stripeCustomerId) {
      return NextResponse.json(
        { error: "This booking requires a card on file. Please add a card and try again." },
        { status: 400 },
      );
    }

    // Patch-test gate for the basket. Any item whose service requires a
    // patch test must clear against the primary client's history. Guest
    // items are NOT individually checked (we don't have their client rows
    // yet), so a service with patch-test required + group bookings is
    // structurally restricted to the lead client only.
    const needsPatchTest = items.some(
      (it) => serviceById.get(it.serviceId)?.requiresPatchTest,
    );
    if (needsPatchTest) {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("email", clientEmail)
        .maybeSingle();
      const client = clientRow ? mapClientFromDB(clientRow) : null;
      for (const it of items) {
        const svc = serviceById.get(it.serviceId)!;
        if (!svc.requiresPatchTest) continue;
        // Block group items entirely when patch-test is required — we
        // can't verify guests' tests without their own client records.
        if (typeof it.guestOf === "number") {
          return NextResponse.json(
            {
              error: `${svc.name} requires a patch test on file. Guest bookings aren't supported for this service — each guest must book separately.`,
            },
            { status: 400 },
          );
        }
        const status = checkPatchTest(svc, client, `${date}T${time}:00`);
        if (!status.passes) {
          return NextResponse.json(
            { error: status.reason ?? "Patch test required.", patchTestRequired: true },
            { status: 400 },
          );
        }
      }
    }

    // ── Walk the basket and reserve a slot per item.
    // Each item gets the ASSIGNED member's resolved duration; the next item
    // starts where this one ends. We hold the longest possible duration for
    // the AVAILABILITY check so the artist isn't booked tightly when their
    // tier is faster than the slot envelope.
    type Plan = {
      item: BasketItem;
      service: Service;
      startTime: string;
      endTime: string;
      assignedMemberId: string;
      durationMinutes: number;
    };
    const plan: Plan[] = [];
    let cursor = time;

    for (let idx = 0; idx < items.length; idx += 1) {
      const it = items[idx];
      const service = serviceById.get(it.serviceId)!;
      // Guests run parallel to their primary item: same start time, no
      // chain advance. Their artist comes from a different free member at
      // that exact slot.
      const isGuest = typeof it.guestOf === "number";
      const startTime = isGuest ? plan[it.guestOf!].startTime : cursor;
      const slotDuration = maxDuration(service);
      const slotEnd = addMinutes(startTime, slotDuration);

      const availableMembers = await getAvailableMembersForSlot({
        workspaceId,
        serviceId: service.id,
        date,
        startTime,
        endTime: slotEnd,
        defaultAvailability: availability,
      });

      // Already-assigned members can't double-book themselves across guests.
      const alreadyAssigned = new Set(
        plan
          .filter((p) => p.startTime === startTime)
          .map((p) => p.assignedMemberId),
      );
      const candidates = availableMembers.filter((m) => !alreadyAssigned.has(m.id));

      const requested = it.artistId || (isGuest ? undefined : sharedArtistId);
      let assigned: string | undefined;
      if (requested) {
        if (candidates.some((m) => m.id === requested)) {
          assigned = requested;
        } else {
          return NextResponse.json(
            {
              error: `The selected artist isn't free for ${service.name} at ${startTime}.`,
            },
            { status: 409 },
          );
        }
      } else {
        assigned = candidates[0]?.id;
      }
      if (!assigned) {
        return NextResponse.json(
          { error: `No artist is available for ${service.name} at ${startTime}.` },
          { status: 409 },
        );
      }

      const durationMinutes = resolveDuration(service, {
        memberId: assigned,
        variantId: it.variantId,
      });
      const itemEnd = addMinutes(startTime, durationMinutes);

      plan.push({
        item: it,
        service,
        startTime,
        endTime: itemEnd,
        assignedMemberId: assigned,
        durationMinutes,
      });

      if (!isGuest) {
        // Only primary items advance the chain; guests share the slot.
        cursor = itemEnd;
      }
    }

    // ── Find or create the client (one client for the entire basket).
    let clientId: string | null = null;
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", clientEmail)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newId = generateId();
      const now = new Date().toISOString();
      const { error: clientErr } = await supabase.from("clients").insert({
        id: newId,
        workspace_id: workspaceId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone || "",
        created_at: now,
        updated_at: now,
      });
      if (!clientErr) clientId = newId;
    }

    // ── Insert each booking, rolling back on failure so we never leave a
    // partially-confirmed basket. The DB exclusion constraint catches races
    // even between our availability check and our insert.
    const createdIds: string[] = [];
    // Map plan-index → resulting booking id, so guest items can stamp their
    // groupParentBookingId after the lead row is in.
    const idByPlanIndex: string[] = [];

    for (let i = 0; i < plan.length; i += 1) {
      const p = plan[i];
      const bookingId = generateId();
      const now = new Date().toISOString();
      const status = p.service.requiresConfirmation ? "pending" : "confirmed";

      const guestOf = p.item.guestOf;
      const groupParentId =
        typeof guestOf === "number" ? idByPlanIndex[guestOf] : null;

      const { error: bookingErr } = await supabase.from("bookings").insert({
        id: bookingId,
        workspace_id: workspaceId,
        assigned_to_id: p.assignedMemberId,
        client_id: clientId,
        service_id: p.service.id,
        date,
        start_at: `${date}T${p.startTime}:00`,
        end_at: `${date}T${p.endTime}:00`,
        status,
        notes: notes || "",
        location_type: locationId || null,
        group_parent_booking_id: groupParentId,
        group_guest_name: p.item.guestName || null,
        // Per-item variant + addon picks come from the basket item; the
        // operator views these on each booking detail row.
        selected_variant_id: p.item.variantId || null,
        selected_addon_ids:
          Array.isArray(p.item.addonIds) && p.item.addonIds.length > 0
            ? p.item.addonIds
            : null,
        // Stripe card-on-file is captured once for the basket; we stamp it
        // on every primary item that required it (guests inherit via the
        // parent linkage). Storing on guests too lets the no-show cron
        // charge each guest's row independently if they ghost.
        stripe_customer_id: stripeCustomerId || null,
        stripe_setup_intent_id: stripeSetupIntentId || null,
        created_at: now,
        updated_at: now,
      });

      if (bookingErr) {
        // Rollback whatever we've already inserted.
        if (createdIds.length > 0) {
          await supabase.from("bookings").delete().in("id", createdIds);
        }
        const isOverlap =
          (bookingErr as { code?: string }).code === "23P01" ||
          /no_overlapping_bookings_per_member/i.test(bookingErr.message ?? "");
        return NextResponse.json(
          {
            error: isOverlap
              ? "Someone just took part of this slot. Please pick another time."
              : "Failed to create booking.",
          },
          { status: isOverlap ? 409 : 500 },
        );
      }
      createdIds.push(bookingId);
      idByPlanIndex[i] = bookingId;
    }

    // Fire automation trigger once for the basket (using the first booking).
    try {
      await runAutomationRules({
        workspaceId,
        type: "booking_confirmation",
        entityId: clientId,
        entityData: {
          bookingIds: createdIds,
          clientName,
          clientEmail,
          serviceNames: plan.map((p) => p.service.name),
          date,
          time,
        },
      });
    } catch {
      // non-critical
    }

    // Surface a "deposit required" hint so the client can redirect to
    // /api/public/book/deposit for the lead booking. We only ever take
    // ONE deposit per basket — the lead service's. If guests' services
    // also have deposits the operator captures those manually.
    const leadIdx = plan.findIndex((p) => typeof p.item.guestOf !== "number");
    const leadPlan = leadIdx >= 0 ? plan[leadIdx] : null;
    const leadId = leadIdx >= 0 ? createdIds[leadIdx] : null;
    const requiresDeposit =
      leadPlan != null &&
      leadPlan.service.depositType !== "none" &&
      !!leadPlan.service.depositAmount &&
      leadPlan.service.depositAmount > 0;

    return NextResponse.json({
      success: true,
      bookings: plan.map((p, i) => ({
        id: createdIds[i],
        serviceName: p.service.name,
        startTime: p.startTime,
        endTime: p.endTime,
        duration: p.durationMinutes,
        assignedMemberId: p.assignedMemberId,
        status: p.service.requiresConfirmation ? "pending" : "confirmed",
      })),
      leadBookingId: leadId,
      requiresDeposit,
      depositServiceId: requiresDeposit ? leadPlan!.service.id : null,
      message: `${createdIds.length} booking${createdIds.length === 1 ? "" : "s"} created`,
      businessName,
    });
  } catch (err) {
    console.error("[public/book/basket] error:", err);
    return NextResponse.json({ error: "Failed to create bookings" }, { status: 500 });
  }
}
