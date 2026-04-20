import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-server";
import { getStripeClient } from "@/lib/integrations/stripe";
import { getStripePriceId } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for subscription signup.
 *
 * Body: { workspaceId, tierId?, interval?, returnUrl? }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimit(`billing-checkout:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { workspaceId, tierId = "growth", interval = "monthly", returnUrl } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify owner
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only workspace owners can manage billing" }, { status: 403 });
    }

    // Resolve Stripe price ID
    const priceId = getStripePriceId(tierId, interval);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid tier or billing interval" }, { status: 400 });
    }

    const stripe = getStripeClient();
    const admin = await createAdminClient();

    // Get or create Stripe customer
    const { data: ws } = await admin
      .from("workspace_settings")
      .select("stripe_customer_id, name")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    let customerId = ws?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { workspaceId },
        name: (ws?.name as string) || undefined,
      });
      customerId = customer.id;
      await admin
        .from("workspace_settings")
        .update({ stripe_customer_id: customerId })
        .eq("workspace_id", workspaceId);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const successUrl = `${baseUrl}${returnUrl || "/dashboard/settings"}?billing=success`;
    const cancelUrl = `${baseUrl}${returnUrl || "/dashboard/settings"}?billing=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { workspaceId, tierId },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { workspaceId, tierId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout] Error:", err);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}
