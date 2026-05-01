/**
 * Public gift-card purchase. Creates a `pending` gift card row and a
 * Stripe Checkout session whose metadata carries giftCardId. The
 * existing webhook handler activates the card on payment.succeeded.
 *
 * POST /api/public/gift-cards/purchase
 * Body: { slug, amount, purchaserName, purchaserEmail,
 *         recipientName?, recipientEmail?, returnUrl }
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import { getStripeClient } from "@/lib/integrations/stripe";
import { resolveBookingWorkspaceBySlug } from "@/lib/server/public-booking";

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-giftcard:${ip}`, 5, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const body = await req.json();
    const {
      slug,
      amount,
      purchaserName,
      purchaserEmail,
      recipientName,
      recipientEmail,
      returnUrl,
    } = body;

    if (!slug || !amount || !purchaserName || !purchaserEmail || !returnUrl) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum < 5 || amountNum > 5000) {
      return NextResponse.json({ error: "Amount must be between $5 and $5,000" }, { status: 400 });
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

    const id = generateId();
    const code = generateGiftCode();
    const now = new Date().toISOString();
    const { error: insertErr } = await supabase.from("gift_cards").insert({
      id,
      workspace_id: resolved.workspaceId,
      code,
      original_amount: amountNum,
      remaining_balance: amountNum,
      status: "pending",
      purchaser_name: purchaserName,
      purchaser_email: purchaserEmail,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      created_at: now,
      updated_at: now,
    });
    if (insertErr) {
      console.error("[gift-cards/purchase] insert error:", insertErr);
      return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
    }

    const client = getStripeClient();
    const session = await client.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: { name: `Gift Card · ${resolved.businessName}` },
            unit_amount: Math.round(amountNum * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        on_behalf_of: settings.stripe_account_id,
        transfer_data: { destination: settings.stripe_account_id },
        metadata: {
          giftCardId: id,
          workspaceId: resolved.workspaceId,
        },
      },
      metadata: {
        giftCardId: id,
        workspaceId: resolved.workspaceId,
      },
      success_url: `${returnUrl}?gift=ok&code=${encodeURIComponent(code)}`,
      cancel_url: `${returnUrl}?gift=cancelled`,
    });

    return NextResponse.json({ url: session.url, code });
  } catch (err) {
    console.error("[gift-cards/purchase] error:", err);
    return NextResponse.json({ error: "Failed to start purchase" }, { status: 500 });
  }
}
