import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripeClient } from "@/lib/integrations/stripe";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription.
 *
 * Body: { workspaceId }
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = await rateLimit(`billing-portal:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

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

    // Get Stripe customer ID
    const { data: ws } = await supabase
      .from("workspace_settings")
      .select("stripe_customer_id")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!ws?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found. Please subscribe first." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: ws.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/portal] Error:", err);
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 });
  }
}
