import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/integrations/stripe";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Stripe webhook handler.
 * Processes payment confirmations and subscription events.
 *
 * Configure in Stripe Dashboard → Webhooks → Add endpoint:
 * URL: https://yourapp.com/api/webhooks/stripe
 * Events: checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const event = verifyWebhookSignature(body, signature);
    const supabase = await createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as Record<string, unknown>;
        const metadata = session.metadata as Record<string, string> | undefined;
        const invoiceId = metadata?.invoiceId;
        let workspaceId = metadata?.workspaceId;
        const amountTotal = session.amount_total as number | undefined;

        if (invoiceId && !workspaceId) {
          const { data: invoice, error: invoiceLookupError } = await supabase
            .from("payment_documents")
            .select("workspace_id")
            .eq("id", invoiceId)
            .maybeSingle();

          if (invoiceLookupError) {
            console.error("[Stripe] Failed to look up workspace for legacy session:", invoiceLookupError.message);
          } else {
            workspaceId = invoice?.workspace_id;
          }
        }

        if (invoiceId && workspaceId) {
          // Mark invoice as paid in Supabase
          const { error } = await supabase
            .from("payment_documents")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "stripe",
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceId)
            .eq("workspace_id", workspaceId);

          if (error) {
            console.error("[Stripe] Failed to mark invoice paid:", error.message);
          } else {
            console.log(`[Stripe] Invoice ${invoiceId} marked as paid`);
          }

          // Log activity
          await supabase.from("activity_log").insert({
            workspace_id: workspaceId,
            type: "update",
            entity_type: "payment_documents",
            entity_id: invoiceId,
            description: `Payment received via Stripe — $${amountTotal ? (amountTotal / 100).toFixed(2) : "0.00"}`,
          }).then(({ error: logErr }) => {
            if (logErr) console.error("[Stripe] Activity log failed:", logErr.message);
          });
        }
        break;
      }

      case "invoice.paid": {
        // TODO: Wire to client_memberships once stripe_subscription_id column is added
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string | undefined;
        if (subscriptionId) {
          console.warn(
            `[Stripe] invoice.paid for subscription ${subscriptionId} — client_memberships lacks stripe_subscription_id. Skipping.`
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const metadata = subscription.metadata as Record<string, string> | undefined;
        const workspaceId = metadata?.workspaceId;
        if (workspaceId) {
          const planTier = metadata?.tierId || null;
          const subStatus = subscription.status as string;
          await supabase
            .from("workspace_settings")
            .update({
              stripe_subscription_id: subscription.id as string,
              plan_tier: subStatus === "canceled" ? "free" : planTier,
            })
            .eq("workspace_id", workspaceId);
          console.log(`[Stripe] subscription.updated for workspace ${workspaceId}: ${subStatus}, tier=${planTier}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const metadata = subscription.metadata as Record<string, string> | undefined;
        const workspaceId = metadata?.workspaceId;
        if (workspaceId) {
          await supabase
            .from("workspace_settings")
            .update({
              stripe_subscription_id: null,
              plan_tier: "free",
            })
            .eq("workspace_id", workspaceId);
          console.log(`[Stripe] subscription.deleted for workspace ${workspaceId}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as unknown as Record<string, unknown>;
        const metadata = intent.metadata as Record<string, string> | undefined;
        const giftCardId = metadata?.giftCardId;
        const workspaceId = metadata?.workspaceId;

        // Handle gift card purchase
        if (giftCardId && workspaceId) {
          await supabase
            .from("gift_cards")
            .update({
              status: "active",
              purchased_at: new Date().toISOString(),
            })
            .eq("id", giftCardId)
            .eq("workspace_id", workspaceId);

          console.log(`[Stripe] Gift card ${giftCardId} activated`);
        }
        break;
      }

      // ── SaaS platform subscription events ──────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const metadata = subscription.metadata as Record<string, string> | undefined;
        const workspaceId = metadata?.workspaceId;
        const tierId = metadata?.tierId || "growth";
        if (workspaceId) {
          await supabase
            .from("workspace_settings")
            .update({
              stripe_subscription_id: subscription.id as string,
              plan_tier: tierId,
            })
            .eq("workspace_id", workspaceId);
          console.log(`[Stripe] SaaS subscription created for workspace ${workspaceId}: tier=${tierId}`);
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook Error]", error);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
