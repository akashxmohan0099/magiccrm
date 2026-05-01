/**
 * Mint a Stripe Checkout URL for a booking deposit. The booking has already
 * been created (typically as `pending` when a deposit is required, or
 * `confirmed` with status flipped post-payment by the webhook). The client
 * is redirected to this URL; on success Stripe sends them to `successUrl`.
 *
 * This route assumes:
 *  - The workspace has completed Stripe Connect onboarding (stripe_account_id set).
 *  - The service's depositType + depositAmount produce a non-zero deposit.
 *  - The caller (the booking page) computed the deposit amount correctly;
 *    we still re-compute server-side so a client can't tamper with it.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { createDepositCheckoutSession } from "@/lib/integrations/stripe";
import { mapServiceFromDB } from "@/lib/db/services";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-deposit:${ip}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const body = await req.json();
    const { slug, bookingId, serviceId, customerEmail, returnUrl } = body;

    if (!slug || !bookingId || !serviceId || !customerEmail || !returnUrl) {
      return NextResponse.json(
        { error: "Missing required fields: slug, bookingId, serviceId, customerEmail, returnUrl" },
        { status: 400 },
      );
    }

    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const supabase = await createAdminClient();
    const [{ data: settings }, { data: serviceRow }, { data: booking }] = await Promise.all([
      supabase
        .from("workspace_settings")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("workspace_id", resolved.workspaceId)
        .maybeSingle(),
      supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .eq("workspace_id", resolved.workspaceId)
        .maybeSingle(),
      supabase
        .from("bookings")
        .select("id, workspace_id")
        .eq("id", bookingId)
        .eq("workspace_id", resolved.workspaceId)
        .maybeSingle(),
    ]);

    if (!serviceRow) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (!settings?.stripe_account_id || !settings.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Workspace hasn't finished Stripe onboarding — deposits are disabled." },
        { status: 503 },
      );
    }

    const service = mapServiceFromDB(serviceRow);
    if (service.depositType === "none" || !service.depositAmount) {
      return NextResponse.json({ error: "This service has no deposit." }, { status: 400 });
    }

    // Server-recompute the deposit amount so a client can't pass a low number.
    const depositCents =
      service.depositType === "fixed"
        ? Math.round(service.depositAmount * 100)
        : Math.round((service.price * service.depositAmount) / 100 * 100);

    const session = await createDepositCheckoutSession({
      bookingId,
      workspaceId: resolved.workspaceId,
      connectedAccountId: settings.stripe_account_id,
      serviceName: service.name,
      amountCents: depositCents,
      customerEmail,
      successUrl: `${returnUrl}?deposit=ok&booking=${bookingId}`,
      cancelUrl: `${returnUrl}?deposit=cancelled&booking=${bookingId}`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[public/book/deposit] error:", err);
    return NextResponse.json({ error: "Failed to create deposit session" }, { status: 500 });
  }
}
