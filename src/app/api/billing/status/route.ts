import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import Stripe from "stripe";

export type BillingStatus = {
  plan: "free" | "trial" | "active" | "past_due" | "cancelled";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

/**
 * GET /api/billing/status?workspaceId=xxx
 * Returns the current subscription status for a workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Billing not configured -- treat as free/unlimited (dev mode)
      return NextResponse.json({
        plan: "free",
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      } satisfies BillingStatus);
    }

    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Verify user belongs to workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get Stripe customer ID
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("settings")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const customerId = (settings?.settings as Record<string, unknown>)?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return NextResponse.json({
        plan: "free",
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      } satisfies BillingStatus);
    }

    const stripe = new Stripe(stripeKey);

    // Get the customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    const sub = subscriptions.data[0];

    if (!sub) {
      return NextResponse.json({
        plan: "free",
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      } satisfies BillingStatus);
    }

    const plan: BillingStatus["plan"] =
      sub.status === "trialing" ? "trial" :
      sub.status === "active" ? "active" :
      sub.status === "past_due" ? "past_due" :
      (sub.status === "canceled" || sub.status === "incomplete_expired") ? "cancelled" :
      "free";

    return NextResponse.json({
      plan,
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      currentPeriodEnd: new Date(((sub as unknown as Record<string, number>).current_period_end ?? 0) * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    } satisfies BillingStatus);
  } catch (error) {
    console.error("[Billing] Status error:", error);
    return NextResponse.json({ error: "Failed to check billing status" }, { status: 500 });
  }
}
