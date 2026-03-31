/**
 * Stripe integration — payments, invoicing, subscriptions.
 *
 * Handles:
 * - Creating checkout sessions for invoice payments
 * - Processing subscription billing ($49/mo platform fee)
 * - Sending payment links
 * - Webhook handling for payment confirmations
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured. Add it to .env.local");
  }

  _stripe = new Stripe(key);

  return _stripe;
}

/** Convenience accessor — throws if not configured */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ── Helper functions ──

/** Create a checkout session for a one-time invoice payment */
export async function createInvoicePaymentSession(params: {
  invoiceId: string;
  workspaceId: string;
  invoiceNumber?: string;
  amount: number; // in cents
  currency?: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const client = getStripeClient();
  return client.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency ?? "aud",
          product_data: { name: `Invoice ${params.invoiceNumber ?? params.invoiceId}` },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      invoiceId: params.invoiceId,
      workspaceId: params.workspaceId,
    },
  });
}

/** Create a subscription for the platform fee */
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
}) {
  const client = getStripeClient();
  return client.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });
}

/** Verify a webhook signature */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const client = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return client.webhooks.constructEvent(payload, signature, secret);
}
