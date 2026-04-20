/**
 * Addon module definitions.
 * These are optional modules users can toggle on/off from Settings.
 * Core modules (11) are always visible and cannot be toggled.
 */

export interface AddonModule {
  id: string;
  name: string;
  description: string;
  icon: string;           // lucide icon name
  route: string;          // dashboard route slug
  dependencies?: string[]; // other addon IDs that must be enabled
  activatesPortal?: boolean;
}

export const ADDON_MODULES: AddonModule[] = [
  {
    id: "analytics",
    name: "Analytics",
    description: "Dashboard with funnel metrics, revenue trends, and performance data.",
    icon: "BarChart3",
    route: "analytics",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Email and SMS campaigns, client segmentation, promotions.",
    icon: "Megaphone",
    route: "marketing",
  },
  {
    id: "gift-cards",
    name: "Gift Cards",
    description: "Issue, sell, and redeem gift card codes.",
    icon: "Ticket",
    route: "gift-cards",
  },
  {
    id: "loyalty",
    name: "Loyalty & Referrals",
    description: "Points-per-booking system and refer-a-friend program.",
    icon: "Gift",
    route: "loyalty",
  },
  {
    id: "ai-insights",
    name: "Business Insights",
    description: "Key metrics, trends, and recommendations from your data.",
    icon: "Lightbulb",
    route: "ai-insights",
  },
  {
    id: "win-back",
    name: "Win-Back",
    description: "Dedicated view of lapsed clients with one-click re-engagement.",
    icon: "UserCheck",
    route: "win-back",
  },
  {
    id: "proposals",
    name: "Proposals",
    description: "Branded, multi-page proposal documents with payment link.",
    icon: "ScrollText",
    route: "proposals",
    activatesPortal: true,
  },
  {
    id: "memberships",
    name: "Memberships",
    description: "Recurring packages with session tracking and auto-renewal.",
    icon: "Crown",
    route: "memberships",
    activatesPortal: true,
  },
  {
    id: "documents",
    name: "Documents",
    description: "Waivers, contracts, consent forms with e-signature and tracking.",
    icon: "FileSignature",
    route: "documents",
    activatesPortal: true,
  },
];

/** Get an addon by ID */
export function getAddon(id: string): AddonModule | undefined {
  return ADDON_MODULES.find((m) => m.id === id);
}

/** Check if enabling this addon should activate the Client Portal */
export function shouldActivatePortal(enabledIds: string[]): boolean {
  return ADDON_MODULES.some((m) => m.activatesPortal && enabledIds.includes(m.id));
}
