import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import Stripe from "stripe";

/**
 * Create a Stripe Checkout session for the Magic CRM $49/mo subscription.
 * Called when a user completes onboarding and needs to start their subscription,
 * or when they want to upgrade from a trial.
 */
export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
    }

    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId, returnUrl } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Verify user is owner of this workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only workspace owners can manage billing" }, { status: 403 });
    }

    const stripe = new Stripe(stripeKey);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    // Check if workspace already has a Stripe customer
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("settings")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const existingCustomerId = (settings?.settings as Record<string, unknown>)?.stripeCustomerId as string | undefined;

    let customerId = existingCustomerId;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          workspaceId,
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to workspace settings
      await supabase
        .from("workspace_settings")
        .update({
          settings: {
            ...(settings?.settings as Record<string, unknown> ?? {}),
            stripeCustomerId: customerId,
          },
        })
        .eq("workspace_id", workspaceId);
    }

    // Get or create the price for $49/mo
    // In production, create this in Stripe Dashboard and use the price ID from env
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Subscription price not configured" }, { status: 503 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}${returnUrl ?? "/dashboard"}?billing=success`,
      cancel_url: `${origin}${returnUrl ?? "/dashboard/settings"}?billing=cancelled`,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          workspaceId,
        },
      },
      metadata: {
        workspaceId,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[Billing] Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
