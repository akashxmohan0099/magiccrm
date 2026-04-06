/**
 * Integration clients for Magic.
 *
 * Each integration is lazily initialized — clients are only created
 * when first accessed, and throw clear errors if env vars are missing.
 *
 * Usage:
 *   import { stripe } from "@/lib/integrations";
 *   const session = await stripe.checkout.sessions.create({ ... });
 */

export { getStripeClient, stripe } from "./stripe";
export { getTwilioClient } from "./twilio";
export { getUnipileClient } from "./unipile";
export { getGoogleCalendarClient } from "./google-calendar";
export { getXeroClient } from "./xero";
export { geocodeAddress, reverseGeocode } from "./geocoding";
