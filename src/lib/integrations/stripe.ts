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

/**
 * Create a Stripe Checkout session for a service deposit at booking time.
 * Uses Stripe Connect's `on_behalf_of` so funds settle directly to the
 * workspace's connected account; the platform takes its cut via
 * `application_fee_amount`.
 *
 * `connectedAccountId` is required — it's the workspace's stripe_account_id
 * from workspace_settings. If the workspace hasn't completed onboarding,
 * skip the deposit charge entirely (caller responsibility).
 */
export async function createDepositCheckoutSession(params: {
  bookingId: string;
  workspaceId: string;
  connectedAccountId: string;
  serviceName: string;
  /** Deposit amount in cents. */
  amountCents: number;
  /** Platform fee (cents) taken from the deposit. Optional. */
  applicationFeeCents?: number;
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
          product_data: { name: `Deposit · ${params.serviceName}` },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: params.applicationFeeCents,
      on_behalf_of: params.connectedAccountId,
      transfer_data: { destination: params.connectedAccountId },
      metadata: {
        bookingId: params.bookingId,
        workspaceId: params.workspaceId,
        kind: "deposit",
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      bookingId: params.bookingId,
      workspaceId: params.workspaceId,
      kind: "deposit",
    },
  });
}

/**
 * Create a SetupIntent for card-on-file. Used when a service charges a
 * no-show fee or when the operator wants to charge the card later for
 * cancellation outside the window. The card is attached to a Customer on
 * the workspace's connected account.
 */
export async function createCardOnFileSetupIntent(params: {
  workspaceId: string;
  connectedAccountId: string;
  customerEmail: string;
  customerName?: string;
  /** Booking the card-on-file is associated with (for later charges). */
  bookingId?: string;
}) {
  const client = getStripeClient();
  // Create a Customer on the connected account and attach the SetupIntent to it.
  const customer = await client.customers.create(
    {
      email: params.customerEmail,
      name: params.customerName,
      metadata: {
        workspaceId: params.workspaceId,
        bookingId: params.bookingId ?? "",
      },
    },
    { stripeAccount: params.connectedAccountId },
  );

  const setupIntent = await client.setupIntents.create(
    {
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        workspaceId: params.workspaceId,
        bookingId: params.bookingId ?? "",
        kind: "card_on_file",
      },
    },
    { stripeAccount: params.connectedAccountId },
  );

  return { customerId: customer.id, clientSecret: setupIntent.client_secret };
}

/**
 * Charge a stored card off-session — used for no-show fees / late cancellations.
 * Throws if Stripe rejects the charge (declined card, etc.).
 */
export async function chargeCardOnFile(params: {
  connectedAccountId: string;
  customerId: string;
  amountCents: number;
  currency?: string;
  description: string;
  bookingId: string;
  applicationFeeCents?: number;
}) {
  const client = getStripeClient();
  // Default payment method on the customer is what the SetupIntent attached.
  return client.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: params.currency ?? "aud",
      customer: params.customerId,
      off_session: true,
      confirm: true,
      description: params.description,
      application_fee_amount: params.applicationFeeCents,
      metadata: {
        bookingId: params.bookingId,
        kind: "no_show_fee",
      },
    },
    { stripeAccount: params.connectedAccountId },
  );
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
