/**
 * Cron endpoint — charge no-show fees against saved cards.
 *
 * GET /api/cron/charge-no-shows
 *
 * For each booking marked status='no_show' with a saved Stripe customer
 * and not yet charged, computes the no-show fee from the service's
 * depositNoShowFee (% of price), runs an off-session PaymentIntent via
 * the workspace's Connect account, and stamps the booking.
 *
 * Runs hourly via Vercel Cron. Protect with CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { chargeCardOnFile } from "@/lib/integrations/stripe";
import { mapServiceFromDB } from "@/lib/db/services";

export async function GET(req: NextRequest) {
  // Vercel-style cron protection
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Pull no-show bookings that have a saved card and haven't been charged.
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, workspace_id, service_id, stripe_customer_id, client_id")
    .eq("status", "no_show")
    .not("stripe_customer_id", "is", null)
    .is("no_show_charge_attempted_at", null)
    .limit(100);

  if (error) {
    console.error("[charge-no-shows] fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ charged: 0, attempted: 0 });
  }

  // Cache settings + services per workspace.
  const settingsByWorkspace = new Map<
    string,
    { stripeAccountId: string | null; onboardingComplete: boolean }
  >();
  const serviceCache = new Map<string, ReturnType<typeof mapServiceFromDB>>();

  let charged = 0;
  let attempted = 0;

  for (const b of bookings) {
    const workspaceId = b.workspace_id as string;
    let settings = settingsByWorkspace.get(workspaceId);
    if (!settings) {
      const { data } = await supabase
        .from("workspace_settings")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      settings = {
        stripeAccountId: (data?.stripe_account_id as string) ?? null,
        onboardingComplete: (data?.stripe_onboarding_complete as boolean) ?? false,
      };
      settingsByWorkspace.set(workspaceId, settings);
    }
    if (!settings.stripeAccountId || !settings.onboardingComplete) continue;

    const serviceId = b.service_id as string;
    let service = serviceCache.get(serviceId);
    if (!service) {
      const { data: srow } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .maybeSingle();
      if (!srow) continue;
      service = mapServiceFromDB(srow as Record<string, unknown>);
      serviceCache.set(serviceId, service);
    }

    // No-show fee = service.depositNoShowFee % of service.price.
    const feePct = service.depositNoShowFee ?? 0;
    if (feePct <= 0 || !service.price) continue;
    const amountCents = Math.round((service.price * feePct) / 100 * 100);
    if (amountCents <= 0) continue;

    attempted += 1;
    const now = new Date().toISOString();

    try {
      const intent = await chargeCardOnFile({
        connectedAccountId: settings.stripeAccountId,
        customerId: b.stripe_customer_id as string,
        amountCents,
        description: `No-show fee — ${service.name}`,
        bookingId: b.id as string,
      });

      await supabase
        .from("bookings")
        .update({
          no_show_charge_attempted_at: now,
          no_show_charge_intent_id: intent.id,
          no_show_charge_status: intent.status,
          updated_at: now,
        })
        .eq("id", b.id as string);
      charged += 1;
    } catch (err) {
      console.warn(`[charge-no-shows] charge failed for ${b.id}:`, err);
      // Stamp the attempt so we don't retry forever; operator can manually
      // re-issue if the card was the issue.
      await supabase
        .from("bookings")
        .update({
          no_show_charge_attempted_at: now,
          no_show_charge_status: "failed",
          updated_at: now,
        })
        .eq("id", b.id as string);
    }
  }

  return NextResponse.json({ charged, attempted, total: bookings.length });
}
