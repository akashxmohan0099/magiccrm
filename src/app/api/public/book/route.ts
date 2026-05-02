import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import {
  fetchWorkspaceAvailability,
  getAvailableMembersForSlot,
  resolveBookingWorkspaceBySlug,
  sanitizeClientText,
} from "@/lib/server/public-booking";
import { resolveDuration, resolvePrice } from "@/lib/services/price";
import { mapServiceFromDB } from "@/lib/db/services";
import { mapClientFromDB } from "@/lib/db/clients";
import { checkPatchTest } from "@/lib/services/patch-test";
import { shouldRequireDeposit } from "@/lib/services/deposit";
import { runAutomationRules } from "@/lib/server/automation-runner";

/**
 * Public booking endpoint. No auth required.
 *
 * POST /api/public/book
 * Body: { slug, serviceId, date, time, clientName, clientEmail, clientPhone?, notes? }
 *
 * Validates the time slot is available, creates the booking in Supabase,
 * creates or links a client record, fires the "booking-created" automation trigger,
 * and sends an SMS confirmation if the client has a phone number.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-book:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      slug,
      serviceId,
      date,
      time,
      clientName: rawClientName,
      clientEmail,
      clientPhone: rawClientPhone,
      notes: rawNotes,
      locationId,
      stripeCustomerId,
      stripeSetupIntentId,
      variantId,
      addonIds,
      giftCardCode,
      intakeAnswers,
    } = body;

    // Strip HTML tags / control characters before any of the downstream
    // SMS/email/Stripe-description templates can interpolate the value —
    // those channels don't go through React so they don't get free escaping.
    const clientName = sanitizeClientText(rawClientName ?? "", 80);
    const clientPhone = sanitizeClientText(rawClientPhone ?? "", 30);
    const notes = sanitizeClientText(rawNotes ?? "", 1000);

    // ---- validation ----
    if (!slug || !serviceId || !date || !time || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: "Missing required fields: slug, serviceId, date, time, clientName, clientEmail" },
        { status: 400 }
      );
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json({ error: "Invalid time format. Use HH:MM" }, { status: 400 });
    }

    // Don't allow booking in the past
    const bookingDateTime = new Date(`${date}T${time}:00`);
    if (bookingDateTime < new Date()) {
      return NextResponse.json({ error: "Cannot book a time in the past" }, { status: 400 });
    }

    const resolvedWorkspace = await resolveBookingWorkspaceBySlug(slug);
    if (!resolvedWorkspace) {
      return NextResponse.json({ error: "Booking page not found" }, { status: 404 });
    }

    const { workspaceId, businessName } = resolvedWorkspace;
    const supabase = await createAdminClient();
    const availability = await fetchWorkspaceAvailability(workspaceId);

    // ---- fetch the service ----
    const { data: serviceRow } = await supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!serviceRow || serviceRow.enabled === false) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const service = mapServiceFromDB(serviceRow);

    // Card-on-file gate: services flagged requiresCardOnFile must arrive
    // with a Stripe customer + SetupIntent id. The booking page collects
    // these via /api/public/book/setup-card before submitting.
    if (service.requiresCardOnFile && !stripeCustomerId) {
      return NextResponse.json(
        { error: "This service requires a card on file. Please add a card and try again." },
        { status: 400 },
      );
    }

    // Patch-test gate: when required, the client must have a non-expired
    // matching test on file. Anonymous bookings (no existing client row)
    // are always rejected — we have no history to consult.
    if (service.requiresPatchTest) {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("email", clientEmail)
        .maybeSingle();
      const client = clientRow ? mapClientFromDB(clientRow) : null;
      const status = checkPatchTest(service, client, `${date}T${time}:00`);
      if (!status.passes) {
        return NextResponse.json(
          { error: status.reason ?? "Patch test required.", patchTestRequired: true },
          { status: 400 },
        );
      }
    }

    // Validate variant + addon picks against the service's actual rules
    // BEFORE running availability so we don't reserve a slot that ultimately
    // can't be created.
    const allAddons = service.addons ?? [];
    const selectedAddonIds: string[] = Array.isArray(addonIds) ? addonIds : [];
    if (service.priceType === "variants") {
      const ok = service.variants?.some((v) => v.id === variantId);
      if (!ok) {
        return NextResponse.json(
          { error: "Please pick one of the available variants for this service." },
          { status: 400 },
        );
      }
    }
    for (const id of selectedAddonIds) {
      if (!allAddons.some((a) => a.id === id)) {
        return NextResponse.json(
          { error: "One of the selected add-ons isn't available for this service." },
          { status: 400 },
        );
      }
    }
    for (const grp of service.addonGroups ?? []) {
      const picksInGroup = selectedAddonIds.filter((id) => {
        const a = allAddons.find((x) => x.id === id);
        return a?.groupId === grp.id;
      }).length;
      if (picksInGroup < (grp.minSelect ?? 0)) {
        return NextResponse.json(
          { error: `Please pick at least ${grp.minSelect} from "${grp.name}".` },
          { status: 400 },
        );
      }
      if (grp.maxSelect != null && picksInGroup > grp.maxSelect) {
        return NextResponse.json(
          { error: `You can pick at most ${grp.maxSelect} from "${grp.name}".` },
          { status: 400 },
        );
      }
    }

    // Validate inline intake question answers. Required questions must have
    // a non-empty answer; trim() handles "all whitespace" inputs.
    const intakeAnswersClean: Record<string, string> = {};
    if (intakeAnswers && typeof intakeAnswers === "object") {
      for (const q of service.intakeQuestions ?? []) {
        const raw = (intakeAnswers as Record<string, unknown>)[q.id];
        const value = typeof raw === "string" ? raw.trim() : "";
        if (q.required && !value) {
          return NextResponse.json(
            { error: `Please answer "${q.label}".` },
            { status: 400 },
          );
        }
        if (value) intakeAnswersClean[q.id] = value;
      }
    } else {
      for (const q of service.intakeQuestions ?? []) {
        if (q.required) {
          return NextResponse.json(
            { error: `Please answer "${q.label}".` },
            { status: 400 },
          );
        }
      }
    }

    // Sum addon durations + prices once — used both for sizing the slot
    // envelope (so availability rejects partial overlaps) and for the final
    // resolved price.
    const addonsTotalDuration = selectedAddonIds.reduce((sum, id) => {
      const a = allAddons.find((x) => x.id === id);
      return sum + (a?.duration ?? 0);
    }, 0);
    const addonsTotalPrice = selectedAddonIds.reduce((sum, id) => {
      const a = allAddons.find((x) => x.id === id);
      return sum + (a?.price ?? 0);
    }, 0);

    // Slot reservation: hold the longest possible duration so the chosen
    // member is guaranteed to fit. The actual stored duration is recomputed
    // below from the assigned member's tier.
    const startMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const startAt = `${date}T${time}:00`;

    const availableMembers = await getAvailableMembersForSlot({
      workspaceId,
      serviceId,
      date,
      startTime: time,
      defaultAvailability: availability,
      variantId,
      extraDurationMinutes: addonsTotalDuration,
    });

    if (availableMembers.length === 0) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    // Now that we know which member is taking it, resolve the actual
    // duration for that member's tier. A Master with a faster duration
    // gets a tighter booking; the slack between slotDuration and
    // durationMinutes is left free on the calendar.
    const assignedMemberId = availableMembers[0].id;

    // Pull this member's overrides for the service so price + duration
    // resolution sees them. Variants/tiers/dynamic rules layer on top.
    const { data: msRow } = await supabase
      .from("member_services")
      .select("price_override, duration_override")
      .eq("workspace_id", workspaceId)
      .eq("service_id", serviceId)
      .eq("member_id", assignedMemberId)
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
      memberId: assignedMemberId,
      variantId,
      memberDurationOverride,
    });
    const durationMinutes = baseDurationMinutes + addonsTotalDuration;
    const endMinutes = startMinutes + durationMinutes;
    const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const endMins = String(endMinutes % 60).padStart(2, "0");
    const endTime = `${endHours}:${endMins}`;
    const endAt = `${date}T${endTime}:00`;

    // Canonical price: base (with overrides/variant/tier/dynamic rule) + addons.
    const basePrice = resolvePrice(service, {
      memberId: assignedMemberId,
      memberPriceOverride,
      variantId,
      startAt,
    });
    const resolvedPrice = Math.max(0, Math.round((basePrice + addonsTotalPrice) * 100) / 100);

    // ---- find or create client ----
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
      const newClientId = generateId();
      const now = new Date().toISOString();
      const { error: clientErr } = await supabase.from("clients").insert({
        id: newClientId,
        workspace_id: workspaceId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone || "",
        created_at: now,
        updated_at: now,
      });
      if (!clientErr) {
        clientId = newClientId;
      }
    }

    // ---- pre-compute membership eligibility (read-only) ----
    // Find a candidate active membership covering this service with sessions
    // remaining. Actual decrement happens AFTER the booking insert succeeds
    // so a slot conflict (race) doesn't leave a debited but uncreated booking.
    let membershipCandidate: { id: string; sessions_used: number } | null = null;
    if (clientId) {
      const { data: activeMems } = await supabase
        .from("client_memberships")
        .select("id, plan_id, sessions_used")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .eq("status", "active");
      if (activeMems && activeMems.length > 0) {
        const planIds = activeMems.map((m) => m.plan_id as string);
        const { data: plans } = await supabase
          .from("membership_plans")
          .select("id, sessions_per_period, service_ids")
          .in("id", planIds);
        const found = (activeMems as Array<{
          id: string;
          plan_id: string;
          sessions_used: number;
        }>).find((m) => {
          const plan = plans?.find((p) => p.id === m.plan_id);
          if (!plan) return false;
          const ids = (plan.service_ids ?? []) as string[];
          if (!ids.includes(service.id)) return false;
          const limit = (plan.sessions_per_period as number) ?? 0;
          return limit === 0 || m.sessions_used < limit;
        });
        if (found) membershipCandidate = { id: found.id, sessions_used: found.sessions_used };
      }
    }

    // ---- create the booking ----
    const bookingId = generateId();
    const now = new Date().toISOString();

    // Pending vs confirmed: a service marked `requiresConfirmation` always
    // lands as 'pending' — the operator approves manually before it locks.
    const status = service.requiresConfirmation ? "pending" : "confirmed";

    const { error: bookingErr } = await supabase.from("bookings").insert({
      id: bookingId,
      workspace_id: workspaceId,
      assigned_to_id: assignedMemberId,
      client_id: clientId,
      service_id: serviceId,
      date,
      start_at: startAt,
      end_at: endAt,
      status,
      notes: notes || "",
      // locationType is the legacy free-text field; only set when caller passes
      // a location id we can dereference. Dedicated location_id column lands
      // when the bookings table picks up the multi-location columns.
      location_type: locationId || null,
      stripe_customer_id: stripeCustomerId || null,
      stripe_setup_intent_id: stripeSetupIntentId || null,
      selected_variant_id: variantId || null,
      selected_addon_ids:
        Array.isArray(addonIds) && addonIds.length > 0 ? addonIds : null,
      gift_card_code: giftCardCode || null,
      membership_id: membershipCandidate?.id ?? null,
      intake_answers: intakeAnswersClean,
      resolved_price: resolvedPrice,
      created_at: now,
      updated_at: now,
    });

    if (bookingErr) {
      // Postgres exclusion-constraint violation = another request grabbed
      // this slot between our availability check and our insert. Surface
      // as 409 so the client can refresh availability and pick again.
      const isOverlap =
        // Postgres surfaces exclusion violations as code 23P01.
        (bookingErr as { code?: string }).code === "23P01" ||
        /no_overlapping_bookings_per_member/i.test(bookingErr.message ?? "");
      if (isOverlap) {
        return NextResponse.json(
          { error: "This time slot was just booked. Please pick another time." },
          { status: 409 },
        );
      }
      console.error("[public/book] Insert error:", bookingErr);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // ---- post-insert side effects: membership debit, gift card draw-down ----
    // Both are best-effort: the booking is already real; failing to debit
    // either is logged but doesn't roll back. Operator can manually correct
    // if needed.
    if (membershipCandidate) {
      await supabase
        .from("client_memberships")
        .update({
          sessions_used: membershipCandidate.sessions_used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membershipCandidate.id)
        .then(({ error }) => {
          if (error) console.warn("[public/book] membership debit failed:", error.message);
        });
    }
    if (giftCardCode && resolvedPrice > 0) {
      const { data: card } = await supabase
        .from("gift_cards")
        .select("id, remaining_balance, status")
        .eq("workspace_id", workspaceId)
        .eq("code", giftCardCode)
        .maybeSingle();
      if (card && card.status === "active") {
        const draw = Math.min(Number(card.remaining_balance), resolvedPrice);
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
    }

    // ---- log activity (non-critical, but logged on failure) ----
    try {
      const { error: logError } = await supabase.from("activity_log").insert({
        workspace_id: workspaceId,
        type: "create",
        entity_type: "bookings",
        entity_id: bookingId,
        description: `Online booking: "${service.name}" by ${clientName} on ${date} at ${time}`,
      });
      if (logError) {
        console.warn("[public/book] activity_log insert failed:", logError);
      }
    } catch (err) {
      console.warn("[public/book] activity_log insert threw:", err);
    }

    // ---- fire automation trigger (non-critical) ----
    try {
      await runAutomationRules({
        workspaceId,
        type: "booking_confirmation",
        entityId: clientId,
        entityData: {
          bookingId,
          clientName,
          clientEmail,
          serviceName: service.name,
          date,
          time,
        },
      });
    } catch {
      // Automation failures should not block booking confirmation
    }

    // ---- send SMS confirmation if phone number provided (non-critical) ----
    // Calls Twilio directly (not via the auth-protected API route) since this is a public endpoint
    if (clientPhone) {
      try {
        const { sendSMS } = await import("@/lib/integrations/twilio");
        const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const smsBody =
          status === "pending"
            ? `Hi ${clientName}, your ${service.name} booking request for ${formattedDate} at ${time} is received and pending confirmation. — ${businessName}`
            : `Hi ${clientName}, your ${service.name} booking is confirmed for ${formattedDate} at ${time}. — ${businessName}`;
        await sendSMS({
          to: clientPhone,
          body: smsBody,
        });
      } catch {
        // SMS failure should not block booking confirmation
        // Twilio may not be configured for all workspaces
      }
    }

    // ---- send confirmation email via Resend (non-critical) ----
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && clientEmail) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendKey);
        const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const isPending = status === "pending";
        const heading = isPending ? "Booking Request Received" : "Booking Confirmed";
        const subjectPrefix = isPending ? "Booking Request" : "Booking Confirmed";
        const intro = isPending
          ? `<p style="font-size:14px;color:#666;margin:0 0 24px;">${businessName} will review your request and confirm shortly.</p>`
          : `<p style="font-size:14px;color:#666;margin:0 0 24px;">${businessName}</p>`;
        await resend.emails.send({
          from: `${businessName} <bookings@magiccrm.app>`,
          to: clientEmail,
          subject: `${subjectPrefix} — ${service.name} on ${formattedDate}`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">${heading}</h1>
              ${intro}
              <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;"><strong style="color:#111;">Service:</strong> <span style="color:#333;">${service.name}</span></p>
                <p style="margin:0 0 12px;"><strong style="color:#111;">Date:</strong> <span style="color:#333;">${formattedDate}</span></p>
                <p style="margin:0 0 12px;"><strong style="color:#111;">Time:</strong> <span style="color:#333;">${time} — ${endTime}</span></p>
                ${resolvedPrice ? `<p style="margin:0;"><strong style="color:#111;">Price:</strong> <span style="color:#333;">$${Number(resolvedPrice).toFixed(2)}</span></p>` : ""}
              </div>
              <p style="font-size:12px;color:#999;margin:0;">Powered by Magic</p>
            </div>
          `,
        });
      }
    } catch {
      // Email failure should not block booking confirmation
    }

    // Server decides whether the client must be redirected to the deposit
    // checkout, honoring the service's `depositAppliesTo` (all/new/flagged).
    // The booking page reads this flag instead of computing it client-side.
    const requiresDeposit = await shouldRequireDeposit({
      supabase,
      workspaceId,
      service,
      clientEmail,
    });

    return NextResponse.json({
      success: true,
      bookingId,
      requiresDeposit,
      message:
        status === "pending"
          ? "Your booking request has been received and is awaiting confirmation."
          : "Your booking has been confirmed!",
      booking: {
        id: bookingId,
        serviceName: service.name,
        date,
        time,
        endTime,
        duration: durationMinutes,
        price: resolvedPrice,
        status,
      },
    });
  } catch (error) {
    console.error("[public/book] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
