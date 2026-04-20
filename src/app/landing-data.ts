/**
 * Landing page data consolidation
 * This file contains all data constants for the landing page:
 * personas, comparisons, add-ons, journey configuration, animations, and comparison table data.
 * Component-specific JSX (preview cards, icon components) remain in page.tsx.
 */

// ── Animation configuration ──

export const sectionHeadingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const sectionTransition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

export const viewportConfig = { once: true, margin: "-40px" as const };

export const ctaPulseVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

// ── Personas: single source of truth ──

export interface Persona {
  label: string;
  accent: string;
  iconName: string;
}

export const PERSONAS: Persona[] = [
  { label: "Hair Salon", accent: "#8B5CF6", iconName: "Scissors" },
  { label: "Lash Tech", accent: "#EC4899", iconName: "Eye" },
  { label: "Makeup Artist", accent: "#F59E0B", iconName: "Paintbrush" },
  { label: "Nail Tech", accent: "#10B981", iconName: "HandMetal" },
  { label: "Spa Owner", accent: "#6366F1", iconName: "Flower2" },
];

// ── Comparison section: features by specialty ──

export interface ComparisonItem {
  label: string;
  sublabel: string;
}

export interface ComparisonPersona {
  label: string;
  accent: string;
  items: ComparisonItem[];
}

export const COMPARISON_PERSONAS: ComparisonPersona[] = [
  {
    label: "Hair Salon",
    accent: "#8B5CF6",
    items: [
      { label: "Clients", sublabel: "With hair type, colour formula, allergies" },
      { label: "Appointments", sublabel: "Calendar with services and rebooking" },
      { label: "Services", sublabel: "Your cuts, colours, and treatments with pricing" },
      { label: "Receipts", sublabel: "Pay-at-chair billing, no quotes or proposals" },
      { label: "Inquiries", sublabel: "Instagram DMs → leads, one click" },
    ],
  },
  {
    label: "Lash Tech",
    accent: "#EC4899",
    items: [
      { label: "Clients", sublabel: "Allergies, skin type, preferred products" },
      { label: "Appointments", sublabel: "With set durations and no-show deposits" },
      { label: "Service Menu", sublabel: "Classic, volume, lifts — with pricing" },
      { label: "Receipts", sublabel: "Pay after service, tips included" },
      { label: "Aftercare", sublabel: "Auto-send care instructions post-appointment" },
    ],
  },
  {
    label: "Makeup Artist",
    accent: "#F59E0B",
    items: [
      { label: "Inquiries", sublabel: "Wedding date, party size, budget — captured upfront" },
      { label: "Proposals", sublabel: "Branded quotes with packages and e-signature" },
      { label: "Invoicing", sublabel: "Deposit-based billing with milestone payments" },
      { label: "Clients", sublabel: "Skin tone, foundation shade, allergy notes" },
      { label: "Trial Bookings", sublabel: "Separate trial and wedding-day scheduling" },
    ],
  },
  {
    label: "Nail Tech",
    accent: "#10B981",
    items: [
      { label: "Clients", sublabel: "Nail shape, gel vs acrylic, allergy flags" },
      { label: "Service Menu", sublabel: "Manicure, pedicure, nail art — with durations" },
      { label: "Appointments", sublabel: "Home studio + mobile bookings" },
      { label: "Receipts", sublabel: "Card and cash tracking per session" },
      { label: "Reminders", sublabel: "Auto nudge when fill or maintenance is due" },
    ],
  },
  {
    label: "Spa Owner",
    accent: "#6366F1",
    items: [
      { label: "Clients", sublabel: "Pressure preferences, contraindications, history" },
      { label: "Team Schedule", sublabel: "Multi-therapist calendar across rooms" },
      { label: "Treatment Menu", sublabel: "Massages, facials, body wraps with pricing" },
      { label: "Receipts", sublabel: "Front-desk checkout with tips and upsells" },
      { label: "Reporting", sublabel: "Revenue by therapist, utilisation, rebooking rate" },
    ],
  },
];

// ── Add-ons filtering ──

export const ADDON_PERSONAS = ["All", "Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"] as const;

// NOTE: ADDONS_DATA lives in page.tsx because each addon has an icon component and JSX preview.

// ── Add-on border colors ──

export const ADDON_BORDER_COLORS: Record<string, string> = {
  pink: "hover:border-pink-200",
  amber: "hover:border-amber-200",
  emerald: "hover:border-emerald-200",
  purple: "hover:border-purple-200",
  cyan: "hover:border-cyan-200",
  teal: "hover:border-teal-200",
  indigo: "hover:border-indigo-200",
  sky: "hover:border-sky-200",
  violet: "hover:border-violet-200",
  orange: "hover:border-orange-200",
};

// NOTE: JOURNEY_PERSONAS, PERSONA_MODULES, PERSONA_CALENDAR, AI_CHAT_CONVERSATIONS,
// and COMPARISON_TABLE_ROWS live in page.tsx because they require icon component refs.
// Only text/config data that doesn't need JSX belongs here.

