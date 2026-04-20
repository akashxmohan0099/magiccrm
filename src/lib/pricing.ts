/**
 * Pricing tiers for Magic CRM.
 *
 * Stripe Price IDs are stored in env vars so they can differ between
 * test/live modes. The constants here define the public-facing structure.
 */

export interface PricingTier {
  id: "starter" | "growth" | "scale";
  name: string;
  price: number;        // AUD per month
  priceYearly: number;  // AUD per month when billed yearly
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  /** Stripe Price IDs — set via env vars */
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    priceYearly: 24,
    description: "For solo operators getting organised.",
    cta: "Start free trial",
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || "",
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_YEARLY || "",
    features: [
      "1 team member",
      "Clients, bookings, calendar",
      "Invoicing & payments",
      "Online booking page",
      "Email reminders",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 59,
    priceYearly: 49,
    description: "For growing salons that need automation.",
    highlighted: true,
    cta: "Start free trial",
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_MONTHLY || "",
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH_YEARLY || "",
    features: [
      "Up to 5 team members",
      "Everything in Starter",
      "Automations & workflows",
      "SMS reminders & campaigns",
      "Business Insights",
      "CSV import / export",
      "Embeddable booking widget",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 99,
    priceYearly: 79,
    description: "For multi-location or high-volume businesses.",
    cta: "Start free trial",
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE_MONTHLY || "",
    stripePriceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE_YEARLY || "",
    features: [
      "Unlimited team members",
      "Everything in Growth",
      "Client portal",
      "Proposals & e-signatures",
      "Memberships & packages",
      "Marketing campaigns",
      "Gift cards & loyalty",
      "Priority support",
    ],
  },
];

/** Look up tier by ID */
export function getTier(id: string): PricingTier | undefined {
  return PRICING_TIERS.find((t) => t.id === id);
}

/** Get Stripe price ID for a tier and billing interval */
export function getStripePriceId(
  tierId: string,
  interval: "monthly" | "yearly",
): string | null {
  const tier = getTier(tierId);
  if (!tier) return null;
  const priceId = interval === "yearly" ? tier.stripePriceIdYearly : tier.stripePriceIdMonthly;
  return priceId || null;
}
