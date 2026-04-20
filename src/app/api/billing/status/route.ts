import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripeClient } from "@/lib/integrations/stripe";

/**
 * GET /api/billing/status?workspaceId=xxx
 * Returns subscription status for the workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user belongs to this workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get workspace subscription info
    const { data: ws } = await supabase
      .from("workspace_settings")
      .select("stripe_customer_id, stripe_subscription_id, plan_tier")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!ws?.stripe_subscription_id) {
      return NextResponse.json({
        plan: ws?.plan_tier || "free",
        tier: ws?.plan_tier || null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }

    // Fetch live status from Stripe
    try {
      const stripe = getStripeClient();
      const sub = await stripe.subscriptions.retrieve(ws.stripe_subscription_id) as unknown as {
        status: string;
        trial_end: number | null;
        current_period_end: number;
        cancel_at_period_end: boolean;
      };

      let plan: string;
      if (sub.status === "trialing") plan = "trial";
      else if (sub.status === "active") plan = "active";
      else if (sub.status === "past_due") plan = "past_due";
      else if (sub.status === "canceled" || sub.status === "unpaid") plan = "cancelled";
      else plan = sub.status;

      return NextResponse.json({
        plan,
        tier: ws.plan_tier || null,
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    } catch {
      // Stripe not configured or sub missing
      return NextResponse.json({
        plan: ws.plan_tier || "free",
        tier: ws.plan_tier || null,
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }
  } catch (err) {
    console.error("[billing/status] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
