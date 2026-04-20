/**
 * Integration clients for Magic.
 *
 * Each integration is lazily initialized -- clients are only created
 * when first accessed, and throw clear errors if env vars are missing.
 *
 * Usage:
 *   import { stripe } from "@/lib/integrations";
 *   const session = await stripe.checkout.sessions.create({ ... });
 */

export { getStripeClient, stripe } from "./stripe";
export { getTwilioClient } from "./twilio";
export { sendEmail, interpolateTemplate, wrapInEmailLayout } from "./email";
