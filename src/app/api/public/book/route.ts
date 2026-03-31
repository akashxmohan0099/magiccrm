import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";
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
  const { allowed } = rateLimit(`public-book:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { slug, serviceId, date, time, clientName, clientEmail, clientPhone, notes } = body;

    // ---- validation ----
    if (!slug || !serviceId || !date || !time || !clientName || !clientEmail) {
      return NextResponse.json(
        { error: "Missing required fields: slug, serviceId, date, time, clientName, clientEmail" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    // ---- fetch the service (try services table, fall back to products) ----
    let service: { id: string; name: string; duration: number; price: number } | null = null;

    const { data: svc } = await supabase
      .from("services")
      .select("id, name, duration, price")
      .eq("id", serviceId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (svc) {
      service = svc;
    } else {
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, duration, price")
        .eq("id", serviceId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (prod) service = prod;
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const durationMinutes = service.duration || 60;
    const endMinutes = parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]) + durationMinutes;
    const endHours = String(Math.floor(endMinutes / 60)).padStart(2, "0");
    const endMins = String(endMinutes % 60).padStart(2, "0");
    const endTime = `${endHours}:${endMins}`;

    const startAt = `${date}T${time}:00`;
    const endAt = `${date}T${endTime}:00`;

    // ---- check for conflicts ----
    const { data: conflicting } = await supabase
      .from("bookings")
      .select("id")
      .eq("workspace_id", workspaceId)
      .neq("status", "cancelled")
      .lt("start_at", endAt)
      .gt("end_at", startAt)
      .limit(1);

    if (conflicting && conflicting.length > 0) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    // ---- check availability settings ----
    const { data: moduleSettings } = await supabase
      .from("workspace_modules")
      .select("settings")
      .eq("workspace_id", workspaceId)
      .eq("module_id", "bookings-calendar")
      .maybeSingle();

    if (moduleSettings?.settings) {
      const settings = moduleSettings.settings as { availability?: { day: number; startTime: string; endTime: string; enabled: boolean }[] };
      const availability = settings.availability;
      if (availability && availability.length > 0) {
        const bookingDay = new Date(`${date}T12:00:00`).getDay();
        const daySlot = availability.find((s) => s.day === bookingDay);
        if (!daySlot || !daySlot.enabled) {
          return NextResponse.json(
            { error: "Bookings are not available on this day." },
            { status: 400 }
          );
        }
        if (time < daySlot.startTime || endTime > daySlot.endTime) {
          return NextResponse.json(
            { error: "Selected time is outside business hours." },
            { status: 400 }
          );
        }
      }
    }

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
        status: "active",
        source: "booking",
        created_at: now,
        updated_at: now,
      });
      if (!clientErr) {
        clientId = newClientId;
      }
    }

    // ---- create the booking ----
    const bookingId = generateId();
    const now = new Date().toISOString();

    const { error: bookingErr } = await supabase.from("bookings").insert({
      id: bookingId,
      workspace_id: workspaceId,
      title: `${service.name} — ${clientName}`,
      client_id: clientId,
      start_at: startAt,
      end_at: endAt,
      status: "confirmed",
      booking_type: "appointment",
      notes: notes || "",
      service_id: serviceId,
      service_name: service.name,
      price: service.price ?? null,
      duration: durationMinutes,
      created_at: now,
      updated_at: now,
    });

    if (bookingErr) {
      console.error("[public/book] Insert error:", bookingErr);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // ---- log activity (non-critical) ----
    try {
      await supabase.from("activity_log").insert({
        workspace_id: workspaceId,
        action: "create",
        entity_type: "bookings",
        entity_id: bookingId,
        description: `Online booking: "${service.name}" by ${clientName} on ${date} at ${time}`,
      });
    } catch {
      // non-critical
    }

    // ---- fire automation trigger (non-critical) ----
    try {
      await runAutomationRules({
        workspaceId,
        trigger: "booking-created",
        entityId: bookingId,
        entityData: {
          type: "booking",
          table: "bookings",
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
        await sendSMS({
          to: clientPhone,
          body: `Hi ${clientName}, your ${service.name} booking is confirmed for ${formattedDate} at ${time}. — ${businessName}`,
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
        await resend.emails.send({
          from: `${businessName} <bookings@magiccrm.app>`,
          to: clientEmail,
          subject: `Booking Confirmed — ${service.name} on ${formattedDate}`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
              <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">Booking Confirmed</h1>
              <p style="font-size:14px;color:#666;margin:0 0 24px;">${businessName}</p>
              <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 12px;"><strong style="color:#111;">Service:</strong> <span style="color:#333;">${service.name}</span></p>
                <p style="margin:0 0 12px;"><strong style="color:#111;">Date:</strong> <span style="color:#333;">${formattedDate}</span></p>
                <p style="margin:0 0 12px;"><strong style="color:#111;">Time:</strong> <span style="color:#333;">${time} — ${endTime}</span></p>
                ${service.price ? `<p style="margin:0;"><strong style="color:#111;">Price:</strong> <span style="color:#333;">$${Number(service.price).toFixed(2)}</span></p>` : ""}
              </div>
              <p style="font-size:12px;color:#999;margin:0;">Powered by Magic</p>
            </div>
          `,
        });
      }
    } catch {
      // Email failure should not block booking confirmation
    }

    return NextResponse.json({
      success: true,
      bookingId,
      message: "Your booking has been confirmed!",
      booking: {
        id: bookingId,
        serviceName: service.name,
        date,
        time,
        endTime,
        duration: durationMinutes,
        price: service.price,
        status: "confirmed",
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
