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
        const workspaceId = metadata?.workspaceId;
        const amountTotal = session.amount_total as number | undefined;

        if (invoiceId && workspaceId) {
          // Mark invoice as paid in Supabase
          const { error } = await supabase
            .from("invoices")
            .update({
              status: "paid",
              paid_amount: amountTotal ? amountTotal / 100 : null,
              paid_at: new Date().toISOString(),
              payment_method: "stripe",
              stripe_session_id: session.id,
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
            action: "update",
            entity_type: "invoices",
            entity_id: invoiceId,
            description: `Payment received via Stripe — $${amountTotal ? (amountTotal / 100).toFixed(2) : "0.00"}`,
          }).then(({ error: logErr }) => {
            if (logErr) console.error("[Stripe] Activity log failed:", logErr.message);
          });
        }
        break;
      }

      case "invoice.paid": {
        // Stripe subscription invoice paid (platform fee or recurring membership)
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;
        const amountPaid = invoice.amount_paid as number | undefined;

        if (subscriptionId && customerId) {
          // Update membership status if this is a membership subscription
          const { data: membership } = await supabase
            .from("memberships")
            .select("id, workspace_id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (membership) {
            await supabase
              .from("memberships")
              .update({
                status: "active",
                last_payment_at: new Date().toISOString(),
                last_payment_amount: amountPaid ? amountPaid / 100 : null,
              })
              .eq("id", membership.id)
              .eq("workspace_id", membership.workspace_id);

            console.log(`[Stripe] Membership ${membership.id} payment recorded`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = subscription.id as string;
        const status = subscription.status as string;

        // Map Stripe status to our status
        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "past_due",
          unpaid: "past_due",
          canceled: "cancelled",
          incomplete: "pending",
          incomplete_expired: "cancelled",
          trialing: "active",
          paused: "paused",
        };

        const mappedStatus = statusMap[status] || status;

        const { error } = await supabase
          .from("memberships")
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("[Stripe] Failed to update subscription:", error.message);
        } else {
          console.log(`[Stripe] Subscription ${subscriptionId} updated to ${mappedStatus}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = subscription.id as string;

        const { error } = await supabase
          .from("memberships")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("[Stripe] Failed to cancel subscription:", error.message);
        } else {
          console.log(`[Stripe] Subscription ${subscriptionId} cancelled`);
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

      default:
        console.log(`[Stripe] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook Error]", error);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }
}
