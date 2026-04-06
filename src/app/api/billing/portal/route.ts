import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import Stripe from "stripe";

/**
 * Create a Stripe Customer Portal session.
 * Lets workspace owners manage their subscription, update payment method,
 * view invoices, and cancel.
 */
export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
    }

    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Verify user is owner
    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!member || member.role !== "owner") {
      return NextResponse.json({ error: "Only workspace owners can manage billing" }, { status: 403 });
    }

    // Get Stripe customer ID
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("settings")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const customerId = (settings?.settings as Record<string, unknown>)?.stripeCustomerId as string | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "No billing account found. Please subscribe first." }, { status: 404 });
    }

    const stripe = new Stripe(stripeKey);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Billing] Portal error:", error);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
