/**
 * Persona Operating Profiles
 *
 * Local knowledge base describing how each persona typically operates
 * in Australia. Used to give the AI rich context about each business
 * type during onboarding question generation and rewording.
 *
 * These profiles are NOT visible to the user — they feed the AI prompts
 * so it can ask smarter, more contextual questions.
 */

export type OperatingModel = "studio" | "mobile" | "on-site" | "hybrid" | "remote";

export interface PersonaProfile {
  id: string;
  industryId: string;
  operatingModel: OperatingModel;
  travelPattern: string;
  typicalServices: string;
  paymentModel: string;
  clientInteraction: string;
  commonChallenges: string;
}

export const PERSONA_PROFILES: PersonaProfile[] = [
  // ═══════════════════════════════════════════════════
  // Beauty & Wellness
  // ═══════════════════════════════════════════════════
  {
    id: "hair-salon",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients come to the salon. Occasional home visits for elderly or bridal parties.",
    typicalServices: "Cuts, colours, blowdries, treatments, bridal styling.",
    paymentModel: "Per-service payment at point of sale. Package deals for regulars.",
    clientInteraction: "Repeat clients every 4-8 weeks. Relationship-driven with strong rebooking patterns.",
    commonChallenges: "No-shows, last-minute cancellations, managing chair utilisation across stylists.",
  },
  {
    id: "barber",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients always come to the shop. No travel.",
    typicalServices: "Haircuts, fades, beard trims, hot towel shaves.",
    paymentModel: "Cash and card at point of sale. Walk-ins are common.",
    clientInteraction: "High-frequency regulars every 2-4 weeks. Walk-in heavy.",
    commonChallenges: "Walk-in queue management, peak-hour bottlenecks, managing multiple barbers.",
  },
  {
    id: "nail-tech",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Mostly studio-based. Some mobile work for events or bridal parties.",
    typicalServices: "Gel nails, acrylics, nail art, manicures, pedicures.",
    paymentModel: "Per-service payment at point of sale. Some session packs for regulars.",
    clientInteraction: "Repeat clients every 2-4 weeks. Instagram-driven new client acquisition.",
    commonChallenges: "Appointment gaps, product cost management, no-shows on long services.",
  },
  {
    id: "lash-brow-tech",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Studio or home studio. Occasional mobile for events.",
    typicalServices: "Lash extensions, lash lifts, brow lamination, microblading, tinting.",
    paymentModel: "Per-service payment. Deposits common for lengthy services like extensions.",
    clientInteraction: "Repeat clients every 2-6 weeks depending on service type.",
    commonChallenges: "Long appointment times, booking management, managing patch test requirements.",
  },
  {
    id: "makeup-artist",
    industryId: "beauty-wellness",
    operatingModel: "mobile",
    travelPattern: "Travels to client locations for weddings and events. Studio for lessons and editorial.",
    typicalServices: "Bridal makeup, event makeup, editorial, makeup lessons.",
    paymentModel: "Per-booking with deposits required. Travel fees charged for distance.",
    clientInteraction: "Event-based with seasonal peaks during wedding season. Some repeat clients for lessons.",
    commonChallenges: "Seasonal demand, early morning starts, multi-location days, travel costs eating into margins.",
  },
  {
    id: "spa-massage",
    industryId: "beauty-wellness",
    operatingModel: "studio",
    travelPattern: "Clients always come to the venue.",
    typicalServices: "Remedial massage, relaxation massage, facials, body treatments.",
    paymentModel: "Per-service at point of sale. Health fund rebates. Monthly memberships.",
    clientInteraction: "Mix of regulars and one-offs. Health fund clients tend to be loyal.",
    commonChallenges: "Therapist availability, room scheduling, health fund paperwork and claims.",
  },
];

/** Look up a persona profile by ID */
export function getPersonaProfile(personaId: string): PersonaProfile | undefined {
  return PERSONA_PROFILES.find((p) => p.id === personaId);
}

/** Get a text summary of a persona's operating context for AI prompts */
export function getProfileForAIPrompt(personaId: string): string {
  const profile = getPersonaProfile(personaId);
  if (!profile) return "";
  return [
    `Operating model: ${profile.operatingModel}`,
    `Travel: ${profile.travelPattern}`,
    `Services: ${profile.typicalServices}`,
    `Payment: ${profile.paymentModel}`,
    `Client interaction: ${profile.clientInteraction}`,
    `Challenges: ${profile.commonChallenges}`,
  ].join(". ");
}
