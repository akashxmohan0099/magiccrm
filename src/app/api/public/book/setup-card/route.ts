/**
 * Public SetupIntent endpoint — when a service requires a card on file the
 * booking page calls this BEFORE creating the booking to collect a
 * payment method. The returned client secret powers a Stripe Elements
 * card form on the client; on confirm the booking POST follows with
 * stripeCustomerId + stripeSetupIntentId so future no-show charges have
 * something to charge against.
 *
 * POST /api/public/book/setup-card
 * Body: { slug, customerEmail, customerName? }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { createCardOnFileSetupIntent } from "@/lib/integrations/stripe";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-setupcard:${ip}`, 10, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const body = await req.json();
    const { slug, customerEmail, customerName } = body;
    if (!slug || !customerEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resolved = await resolveBookingWorkspaceBySlug(slug);
    if (!resolved) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    const supabase = await createAdminClient();
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("workspace_id", resolved.workspaceId)
      .maybeSingle();

    if (!settings?.stripe_account_id || !settings.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Workspace hasn't finished Stripe onboarding." },
        { status: 503 },
      );
    }

    const { customerId, clientSecret } = await createCardOnFileSetupIntent({
      workspaceId: resolved.workspaceId,
      connectedAccountId: settings.stripe_account_id,
      customerEmail,
      customerName,
    });

    return NextResponse.json({
      customerId,
      clientSecret,
      connectedAccountId: settings.stripe_account_id,
    });
  } catch (err) {
    console.error("[public/book/setup-card] error:", err);
    return NextResponse.json({ error: "Failed to set up card" }, { status: 500 });
  }
}
