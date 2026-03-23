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

/**
 * Check which integrations are configured (have env vars set).
 * Useful for the Settings page to show connection status.
 */
export function getIntegrationStatus() {
  return {
    supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    unipile: !!process.env.UNIPILE_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
    googleCalendar: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    xero: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET),
    geocoding: !!process.env.OPENCAGE_API_KEY,
  };
}
