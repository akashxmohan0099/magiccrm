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
  sanitizeClientText,
} from "@/lib/server/public-booking";
import { resolveDuration, resolvePrice } from "@/lib/services/price";
import { mapServiceFromDB } from "@/lib/db/services";
import { mapClientFromDB } from "@/lib/db/clients";
import { checkPatchTest } from "@/lib/services/patch-test";
import { shouldRequireDeposit } from "@/lib/services/deposit";
import { planMembershipDebits, type ActiveMembership } from "@/lib/services/membership-debit";
import type { Service } from "@/types/models";
import { runAutomationRules } from "@/lib/server/automation-runner";

interface BasketItem {
  serviceId: string;
  variantId?: string;
  addonIds?: string[];
  artistId?: string; // Pattern 1 — pinned per item
  /** Inline intake answers, keyed by ServiceIntakeQuestion.id. */
  intakeAnswers?: Record<string, string>;
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
      clientName: rawClientName,
      clientEmail,
      clientPhone: rawClientPhone,
      notes: rawNotes,
      date,
      time,
      items,
      sharedArtistId,
      locationId,
      address: rawAddress,
      stripeCustomerId,
      stripeSetupIntentId,
      giftCardCode,
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
      address?: string;
      stripeCustomerId?: string;
      stripeSetupIntentId?: string;
      giftCardCode?: string;
    };

    // Strip HTML tags and control characters before any downstream channel
    // (SMS, email, Stripe descriptions) interpolates the value.
    const clientName = sanitizeClientText(rawClientName ?? "", 80);
    const clientPhone = sanitizeClientText(rawClientPhone ?? "", 30);
    const notes = sanitizeClientText(rawNotes ?? "", 1000);
    const customerAddress = sanitizeClientText(rawAddress ?? "", 200);

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
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(clientEmail)) {
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
      if (s.enabled === false) continue;
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

    // ── Location validation. The customer-facing flow auto-selects when only
    // one enabled location exists, so we accept either the explicit pick or no
    // selection at all (the latter only when the workspace truly has zero / one
    // location). When a location is supplied we verify it belongs to the
    // workspace, is enabled, and that every service in the basket is allowed
    // there. Mobile locations also require a customer drop-off address.
    let resolvedLocation: {
      id: string;
      kind: "studio" | "mobile";
      name: string;
      address: string;
    } | null = null;
    if (locationId) {
      const { data: locRow } = await supabase
        .from("locations")
        .select("id, name, address, kind, enabled")
        .eq("workspace_id", workspaceId)
        .eq("id", locationId)
        .maybeSingle();
      if (!locRow || locRow.enabled === false) {
        return NextResponse.json(
          { error: "Selected location isn't available." },
          { status: 400 },
        );
      }
      resolvedLocation = {
        id: locRow.id as string,
        kind: ((locRow.kind as "studio" | "mobile") ?? "studio"),
        name: (locRow.name as string) ?? "",
        address: (locRow.address as string | null) ?? "",
      };
      for (const it of items) {
        const svc = serviceById.get(it.serviceId)!;
        if (svc.locationIds && svc.locationIds.length > 0 && !svc.locationIds.includes(locationId)) {
          return NextResponse.json(
            { error: `${svc.name} isn't offered at ${resolvedLocation.name}.` },
            { status: 400 },
          );
        }
      }

      // Resource-by-location validation. Bail early if any required resource
      // isn't physically present at the picked location — otherwise we'd
      // create a booking that the studio physically can't fulfill.
      const requiredResourceIds = Array.from(
        new Set(
          items.flatMap((it) => serviceById.get(it.serviceId)?.requiredResourceIds ?? []),
        ),
      );
      if (requiredResourceIds.length > 0) {
        const { data: rsrcRows } = await supabase
          .from("resources")
          .select("id, name, location_ids")
          .eq("workspace_id", workspaceId)
          .in("id", requiredResourceIds);
        for (const r of rsrcRows ?? []) {
          const ids = (r.location_ids as string[] | null) ?? [];
          if (ids.length > 0 && !ids.includes(locationId)) {
            return NextResponse.json(
              {
                error: `${r.name} isn't available at ${resolvedLocation.name}; this booking can't run here.`,
              },
              { status: 400 },
            );
          }
        }
      }

      if (resolvedLocation.kind === "mobile" && !customerAddress) {
        return NextResponse.json(
          { error: "An address is required for mobile bookings." },
          { status: 400 },
        );
      }
    } else {
      // No location supplied — only acceptable when the workspace doesn't have
      // 2+ enabled locations to choose from. Otherwise the customer skipped a
      // required step.
      const { count } = await supabase
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("enabled", true);
      if ((count ?? 0) >= 2) {
        return NextResponse.json(
          { error: "Please choose a location for this booking." },
          { status: 400 },
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
      resolvedPrice: number;
      intakeAnswers: Record<string, string>;
    };
    const plan: Plan[] = [];
    let cursor = time;

    for (let idx = 0; idx < items.length; idx += 1) {
      const it = items[idx];
      const service = serviceById.get(it.serviceId)!;

      // F8: validate guestOf + group rules before building the slot.
      const isGuest = typeof it.guestOf === "number";
      if (isGuest) {
        const parentIdx = it.guestOf!;
        if (
          !Number.isInteger(parentIdx) ||
          parentIdx < 0 ||
          parentIdx >= idx ||
          typeof items[parentIdx].guestOf === "number"
        ) {
          return NextResponse.json(
            { error: "Invalid guest reference in basket." },
            { status: 400 },
          );
        }
        const parentService = serviceById.get(items[parentIdx].serviceId);
        if (!parentService?.allowGroupBooking) {
          return NextResponse.json(
            { error: `${parentService?.name ?? "This service"} doesn't allow group bookings.` },
            { status: 400 },
          );
        }
        const guestsAlreadyForParent = items
          .slice(0, idx)
          .filter((x) => x.guestOf === parentIdx).length;
        const cap = parentService.maxGroupSize ?? Infinity;
        if (guestsAlreadyForParent + 1 + 1 > cap) {
          return NextResponse.json(
            {
              error: `${parentService.name} caps the group at ${cap} (incl. primary).`,
            },
            { status: 400 },
          );
        }
      }

      // F5: validate variant + addon picks against the service's actual rules.
      const itemAddonIds = Array.isArray(it.addonIds) ? it.addonIds : [];
      const itemAllAddons = service.addons ?? [];
      if (service.priceType === "variants") {
        const ok = service.variants?.some((v) => v.id === it.variantId);
        if (!ok) {
          return NextResponse.json(
            {
              error: `Please pick one of the available variants for ${service.name}.`,
            },
            { status: 400 },
          );
        }
      }
      for (const id of itemAddonIds) {
        if (!itemAllAddons.some((a) => a.id === id)) {
          return NextResponse.json(
            { error: `One of the selected add-ons for ${service.name} isn't available.` },
            { status: 400 },
          );
        }
      }
      for (const grp of service.addonGroups ?? []) {
        const picksInGroup = itemAddonIds.filter((id) => {
          const a = itemAllAddons.find((x) => x.id === id);
          return a?.groupId === grp.id;
        }).length;
        if (picksInGroup < (grp.minSelect ?? 0)) {
          return NextResponse.json(
            { error: `Pick at least ${grp.minSelect} from "${grp.name}" on ${service.name}.` },
            { status: 400 },
          );
        }
        if (grp.maxSelect != null && picksInGroup > grp.maxSelect) {
          return NextResponse.json(
            { error: `At most ${grp.maxSelect} from "${grp.name}" on ${service.name}.` },
            { status: 400 },
          );
        }
      }

      // Inline intake answers for this item.
      const itemIntakeAnswers: Record<string, string> = {};
      const rawAnswers = it.intakeAnswers && typeof it.intakeAnswers === "object" ? it.intakeAnswers : {};
      for (const q of service.intakeQuestions ?? []) {
        const raw = (rawAnswers as Record<string, unknown>)[q.id];
        const value = typeof raw === "string" ? raw.trim() : "";
        if (q.required && !value) {
          return NextResponse.json(
            { error: `Please answer "${q.label}" for ${service.name}.` },
            { status: 400 },
          );
        }
        if (value) itemIntakeAnswers[q.id] = value;
      }

      // Sum addon durations BEFORE availability so the slot envelope reflects
      // the booking's true length.
      const addonsTotalDuration = itemAddonIds.reduce((sum, id) => {
        const a = itemAllAddons.find((x) => x.id === id);
        return sum + (a?.duration ?? 0);
      }, 0);
      const addonsTotalPrice = itemAddonIds.reduce((sum, id) => {
        const a = itemAllAddons.find((x) => x.id === id);
        return sum + (a?.price ?? 0);
      }, 0);

      // Guests run parallel to their primary item: same start time, no
      // chain advance. Their artist comes from a different free member at
      // that exact slot.
      const startTime = isGuest ? plan[it.guestOf!].startTime : cursor;

      const availableMembers = await getAvailableMembersForSlot({
        workspaceId,
        serviceId: service.id,
        date,
        startTime,
        defaultAvailability: availability,
        variantId: it.variantId,
        extraDurationMinutes: addonsTotalDuration,
        locationId: resolvedLocation?.id,
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

      // Pull this assigned member's per-service overrides so price + duration
      // resolution honors them.
      const { data: msRow } = await supabase
        .from("member_services")
        .select("price_override, duration_override")
        .eq("workspace_id", workspaceId)
        .eq("service_id", service.id)
        .eq("member_id", assigned)
        .maybeSingle();
      const memberPriceOverride =
        msRow?.price_override === null || msRow?.price_override === undefined
          ? undefined
          : Number(msRow.price_override);
      const memberDurationOverride =
        msRow?.duration_override === null || msRow?.duration_override === undefined
          ? undefined
          : Number(msRow.duration_override);

      const baseDurationMinutes = resolveDuration(service, {
        memberId: assigned,
        variantId: it.variantId,
        memberDurationOverride,
      });
      const durationMinutes = baseDurationMinutes + addonsTotalDuration;
      const itemEnd = addMinutes(startTime, durationMinutes);

      const basePrice = resolvePrice(service, {
        memberId: assigned,
        memberPriceOverride,
        variantId: it.variantId,
        startAt: `${date}T${startTime}:00`,
      });
      const itemResolvedPrice = Math.max(
        0,
        Math.round((basePrice + addonsTotalPrice) * 100) / 100,
      );

      plan.push({
        item: it,
        service,
        startTime,
        endTime: itemEnd,
        assignedMemberId: assigned,
        durationMinutes,
        resolvedPrice: itemResolvedPrice,
        intakeAnswers: itemIntakeAnswers,
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

    // ── Pre-compute membership eligibility (read-only). For each primary
    // basket item we pick a still-active membership covering that service
    // with sessions remaining. The same membership can debit multiple times
    // in one basket. Guest items skip debit — they share the lead client_id
    // but represent a different attendee.
    const memberships: ActiveMembership[] = [];
    // Track baseline sessions_used per id so the post-insert update writes
    // sessions_used + debit count, not just the debit count.
    const baselineUsedById = new Map<string, number>();

    if (clientId) {
      const { data: activeMems } = await supabase
        .from("client_memberships")
        .select("id, plan_id, sessions_used")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .eq("status", "active");
      const memRows = (activeMems ?? []) as Array<{
        id: string;
        plan_id: string;
        sessions_used: number;
      }>;
      if (memRows.length > 0) {
        const planIds = Array.from(new Set(memRows.map((m) => m.plan_id)));
        const { data: planRows } = await supabase
          .from("membership_plans")
          .select("id, sessions_per_period, service_ids")
          .in("id", planIds);
        for (const m of memRows) {
          const planRow = planRows?.find((p) => p.id === m.plan_id);
          if (!planRow) continue;
          const used = Number(m.sessions_used) || 0;
          baselineUsedById.set(m.id, used);
          memberships.push({
            id: m.id,
            sessionsUsed: used,
            sessionsPerPeriod: Number(planRow.sessions_per_period) || 0,
            serviceIds: new Set((planRow.service_ids ?? []) as string[]),
          });
        }
      }
    }

    const debitPlan = planMembershipDebits(
      memberships,
      plan.map((p) => ({
        serviceId: p.service.id,
        isGuest: typeof p.item.guestOf === "number",
      })),
    );

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
        // FK to the location row + a snapshot of the kind for at-a-glance
        // filtering. Mobile bookings carry the customer's drop-off address;
        // studio bookings leave `address` null (the location's own address
        // is the source of truth for those).
        location_id: resolvedLocation?.id ?? null,
        location_type: resolvedLocation?.kind ?? null,
        address:
          resolvedLocation?.kind === "mobile" ? customerAddress || null : null,
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
        membership_id: debitPlan.perItem[i] ?? null,
        resolved_price: p.resolvedPrice,
        intake_answers: p.intakeAnswers,
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

    // ---- membership debit (post-insert, best-effort) ----
    // Runs only after every booking insert succeeded. A rollback above
    // returns early before reaching here, so we never debit a session
    // against an uncreated booking. Failures are logged but don't roll
    // back — the booking is real, the operator can correct usage manually.
    for (const [memId, count] of debitPlan.debits.entries()) {
      if (count <= 0) continue;
      const baseline = baselineUsedById.get(memId) ?? 0;
      const { error } = await supabase
        .from("client_memberships")
        .update({
          sessions_used: baseline + count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memId);
      if (error) {
        console.warn("[public/book/basket] membership debit failed:", error.message);
      }
    }

    // ---- gift card debit (non-critical; mirrors the single-item /book route) ----
    if (giftCardCode) {
      const totalResolved = plan.reduce((sum, p) => sum + p.resolvedPrice, 0);
      if (totalResolved > 0) {
        try {
          const { data: card } = await supabase
            .from("gift_cards")
            .select("id, remaining_balance, status")
            .eq("workspace_id", workspaceId)
            .eq("code", giftCardCode)
            .maybeSingle();
          if (card && card.status === "active") {
            const draw = Math.min(Number(card.remaining_balance), totalResolved);
            const remaining = Number(card.remaining_balance) - draw;
            await supabase
              .from("gift_cards")
              .update({
                remaining_balance: remaining,
                status: remaining <= 0 ? "redeemed" : "active",
                updated_at: new Date().toISOString(),
              })
              .eq("id", card.id);
          }
        } catch (err) {
          console.warn("[public/book/basket] gift card debit failed:", err);
        }
      }
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
      leadPlan != null
        ? await shouldRequireDeposit({
            supabase,
            workspaceId,
            service: leadPlan.service,
            clientEmail,
          })
        : false;

    return NextResponse.json({
      success: true,
      bookings: plan.map((p, i) => ({
        id: createdIds[i],
        serviceName: p.service.name,
        startTime: p.startTime,
        endTime: p.endTime,
        duration: p.durationMinutes,
        price: p.resolvedPrice,
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
