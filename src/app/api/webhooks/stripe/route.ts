import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/integrations/stripe";

/**
 * Stripe webhook handler.
 * Receives payment confirmations, subscription events, etc.
 *
 * Configure in Stripe Dashboard → Webhooks → Add endpoint:
 * URL: https://yourapp.com/api/webhooks/stripe
 * Events: checkout.session.completed, invoice.paid, customer.subscription.updated
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const event = verifyWebhookSignature(body, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const invoiceId = (session as unknown as Record<string, Record<string, string>>).metadata?.invoiceId;
        // TODO: Mark invoice as paid in Supabase
        console.log(`[Stripe] Payment completed for invoice ${invoiceId}`);
        break;
      }

      case "invoice.paid": {
        // TODO: Handle subscription payment
        console.log("[Stripe] Subscription invoice paid");
        break;
      }

      case "customer.subscription.updated": {
        // TODO: Handle subscription status changes
        console.log("[Stripe] Subscription updated");
        break;
      }

      case "customer.subscription.deleted": {
        // TODO: Handle cancellation
        console.log("[Stripe] Subscription cancelled");
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
