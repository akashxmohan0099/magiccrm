// v2 onboarding — persona-first questionnaire.
// Question copy is intentionally rough; tighten in a separate pass.

import type { LucideIcon } from "lucide-react";
import {
  Brush,
  Scissors,
  User,
  Eye,
  Sparkles,
  Gem,
  Hand,
  Building2,
} from "lucide-react";

export type PersonaSlug =
  | "mua"
  | "hair"
  | "barber"
  | "lash"
  | "nail"
  | "esthetician"
  | "massage"
  | "salon-owner";

export interface Persona {
  slug: PersonaSlug;
  label: string;
  example: string;
  icon: LucideIcon;
  // Tailwind classes for the icon tile when not selected.
  iconBg: string;
  iconColor: string;
}

export const PERSONAS: Persona[] = [
  { slug: "mua",          label: "Makeup Artist",       example: "weddings, editorial, events",   icon: Brush,     iconBg: "bg-rose-100",     iconColor: "text-rose-600" },
  { slug: "hair",         label: "Hair Stylist",        example: "cuts, color, styling",          icon: Scissors,  iconBg: "bg-violet-100",   iconColor: "text-violet-600" },
  { slug: "barber",       label: "Barber",              example: "cuts, fades, beard work",       icon: User,      iconBg: "bg-blue-100",     iconColor: "text-blue-600" },
  { slug: "lash",         label: "Lash & Brow",         example: "extensions, lifts, lamination", icon: Eye,       iconBg: "bg-amber-100",    iconColor: "text-amber-700" },
  { slug: "nail",         label: "Nail Tech",           example: "manicures, gel, art",           icon: Sparkles,  iconBg: "bg-pink-100",     iconColor: "text-pink-600" },
  { slug: "esthetician",  label: "Esthetician",         example: "facials, peels, skincare",      icon: Gem,       iconBg: "bg-emerald-100",  iconColor: "text-emerald-600" },
  { slug: "massage",      label: "Massage Therapist",   example: "deep tissue, sports, spa",      icon: Hand,      iconBg: "bg-teal-100",     iconColor: "text-teal-600" },
  { slug: "salon-owner",  label: "Salon / Spa Owner",   example: "multi-staff, multi-location",   icon: Building2, iconBg: "bg-indigo-100",   iconColor: "text-indigo-600" },
];

export function getPersona(slug: PersonaSlug | null): Persona | null {
  if (!slug) return null;
  return PERSONAS.find((p) => p.slug === slug) ?? null;
}

// ── Structural questions ───────────────────────────────────

export interface StructuralOption { value: string; label: string }
export interface StructuralQuestion {
  id: string;
  title: string;
  options: StructuralOption[];
}

const TEAM_SIZE: StructuralQuestion = {
  id: "team-size",
  title: "Solo or with a team?",
  options: [
    { value: "solo",  label: "Just me" },
    { value: "small", label: "Small team (2–5)" },
    { value: "large", label: "Larger team (6+)" },
  ],
};

const LOCATION_MODEL: StructuralQuestion = {
  id: "location-model",
  title: "Where do you work?",
  options: [
    { value: "studio", label: "Fixed studio or salon" },
    { value: "mobile", label: "Travel to clients" },
    { value: "both",   label: "Both" },
  ],
};

const SALON_LOCATIONS: StructuralQuestion = {
  id: "locations",
  title: "How many locations?",
  options: [
    { value: "one",  label: "Single location" },
    { value: "few",  label: "2–3 locations" },
    { value: "many", label: "4+ locations" },
  ],
};

export function getStructuralQuestions(persona: PersonaSlug | null): StructuralQuestion[] {
  if (persona === "salon-owner") return [TEAM_SIZE, LOCATION_MODEL, SALON_LOCATIONS];
  return [TEAM_SIZE, LOCATION_MODEL];
}

// ── Multi-select option banks ──────────────────────────────

export interface MultiOption { id: string; label: string; description: string }

const SOLUTIONS: MultiOption[] = [
  { id: "deposits",          label: "Take deposits at booking",   description: "Lock in serious clients with a deposit." },
  { id: "online-booking",    label: "Online booking link",        description: "A 24/7 booking page clients can use without messaging you." },
  { id: "travel-fee",        label: "Charge for travel",          description: "Auto-add fees for mobile or out-of-area appointments." },
  { id: "product-sales",     label: "Sell retail products",       description: "Track product sales alongside services." },
  { id: "payment-reminders", label: "Auto payment reminders",     description: "Nudge clients about outstanding balances on autopilot." },
  { id: "waivers",           label: "Pre-appointment forms",      description: "Send waivers, intake, or consent forms before each visit." },
  { id: "packages",          label: "Sell service packages",      description: "Bundle multiple sessions into a single purchase." },
  { id: "gift-cards",        label: "Gift cards",                 description: "Sell and redeem gift cards in-store and online." },
  { id: "staff-scheduling",  label: "Manage team schedules",      description: "Coordinate working hours and time-off across staff." },
];

const MARKETING: MultiOption[] = [
  { id: "promo-emails",      label: "Promotional emails",                  description: "Broadcast offers and announcements to your client list." },
  { id: "sms-broadcast",     label: "SMS broadcasts",                       description: "Send mass texts for last-minute openings or promos." },
  { id: "birthday-messages", label: "Birthday & anniversary messages",      description: "Automatic greetings on client milestones." },
  { id: "social-scheduling", label: "Social post scheduling",               description: "Plan and schedule Instagram and Facebook posts." },
  { id: "referral-program",  label: "Referral rewards",                     description: "Reward clients who bring friends." },
];

const BILLING: MultiOption[] = [
  { id: "card-payments", label: "Accept card payments",         description: "Charge cards in person and online via Stripe." },
  { id: "invoices",      label: "Send invoices",                description: "Branded invoices with a pay-now link." },
  { id: "recurring",     label: "Recurring / subscription billing", description: "Automatic monthly charges for memberships or packages." },
  { id: "tax",           label: "Tax handling (GST/VAT)",       description: "Apply tax to services and itemize on receipts." },
  { id: "tips",          label: "Tip collection",               description: "Collect tips at checkout, online or in-person." },
  { id: "proposals",     label: "Custom quotes & proposals",    description: "Send branded proposals for higher-ticket bookings." },
];

const ENGAGEMENT: MultiOption[] = [
  { id: "post-appt-followup", label: "Post-appointment follow-up", description: "Auto thank-you and aftercare instructions after each visit." },
  { id: "loyalty",            label: "Points-based loyalty",       description: "Reward repeat visits with points clients can redeem." },
  { id: "review-collection",  label: "Review requests",            description: "Ask happy clients to leave Google or Instagram reviews." },
  { id: "win-back",           label: "Win back lapsed clients",    description: "Spot clients who stopped visiting and re-engage them." },
  { id: "vip-offers",         label: "VIP-only offers",            description: "Exclusive perks for your top regulars." },
  { id: "birthday-gifts",     label: "Birthday discounts",         description: "Auto-send a discount code on a client's birthday." },
];

// Solo personas don't run team scheduling.
export function getSolutionsOptions(persona: PersonaSlug | null): MultiOption[] {
  if (persona === "salon-owner") return SOLUTIONS;
  return SOLUTIONS.filter((o) => o.id !== "staff-scheduling");
}

export function getMarketingOptions(_persona: PersonaSlug | null): MultiOption[] {
  return MARKETING;
}

// Barbers and nail techs rarely send formal proposals.
export function getBillingOptions(persona: PersonaSlug | null): MultiOption[] {
  if (persona === "barber" || persona === "nail") {
    return BILLING.filter((o) => o.id !== "proposals");
  }
  return BILLING;
}

export function getEngagementOptions(_persona: PersonaSlug | null): MultiOption[] {
  return ENGAGEMENT;
}

// Helper for the summary screen — looks up an option by id across all banks.
export function findOption(id: string): MultiOption | null {
  for (const bank of [SOLUTIONS, MARKETING, BILLING, ENGAGEMENT]) {
    const found = bank.find((o) => o.id === id);
    if (found) return found;
  }
  return null;
}

// ── Selection → addon mapping ─────────────────────────────

const SELECTION_TO_ADDONS: Record<string, string[]> = {
  packages:            ["memberships"],
  "gift-cards":        ["gift-cards"],
  waivers:             ["documents"],
  "promo-emails":      ["marketing"],
  "sms-broadcast":     ["marketing"],
  "birthday-messages": ["marketing"],
  "social-scheduling": ["marketing"],
  "referral-program":  ["loyalty"],
  recurring:           ["memberships"],
  proposals:           ["proposals"],
  loyalty:             ["loyalty"],
  "review-collection": ["marketing"],
  "win-back":          ["win-back"],
  "vip-offers":        ["loyalty"],
  "birthday-gifts":    ["loyalty", "marketing"],
};

// ── Draft type + helpers ──────────────────────────────────

export interface OnboardingDraft {
  persona: PersonaSlug | null;
  structure: Record<string, string>;
  solutions: string[];
  marketing: string[];
  billing: string[];
  engagement: string[];
}

export function emptyDraft(): OnboardingDraft {
  return {
    persona: null,
    structure: {},
    solutions: [],
    marketing: [],
    billing: [],
    engagement: [],
  };
}

export function resolveEnabledAddons(draft: OnboardingDraft): string[] {
  const enabled = new Set<string>();
  const all = [...draft.solutions, ...draft.marketing, ...draft.billing, ...draft.engagement];
  for (const sel of all) {
    const addons = SELECTION_TO_ADDONS[sel];
    if (addons) addons.forEach((a) => enabled.add(a));
  }
  return Array.from(enabled);
}
