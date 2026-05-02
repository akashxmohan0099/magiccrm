export type PublicPriceType = "fixed" | "from" | "variants" | "tiered";
export type PublicDepositType = "none" | "percentage" | "fixed";

export interface PublicVariant {
  id: string;
  name: string;
  price: number;
  duration: number;
  sortOrder: number;
}

export interface PublicPriceTier {
  id: string;
  name: string;
  price: number;
  duration?: number;
  memberIds: string[];
  sortOrder: number;
}

export interface PublicAddon {
  id: string;
  name: string;
  price: number;
  duration: number;
  sortOrder: number;
  groupId?: string;
}

export interface PublicAddonGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect?: number;
  sortOrder: number;
}

/** Inline intake question authored on the service. Rendered in Details. */
export type PublicIntakeQuestionType = "text" | "longtext" | "select" | "yesno" | "date" | "number";
export interface PublicIntakeQuestion {
  id: string;
  label: string;
  type: PublicIntakeQuestionType;
  required: boolean;
  options?: string[];
  hint?: string;
  sortOrder: number;
}

/** Service shape served by /api/public/book/info. */
export interface PublicService {
  id: string;
  name: string;
  /** Marketing copy shown under the name on the card. May be empty. */
  description: string;
  /** Optional hero/thumbnail; empty string = no image. */
  imageUrl: string;
  duration: number;     // minutes
  price: number;        // AUD
  category: string;     // empty string when uncategorized
  priceType: PublicPriceType;
  variants: PublicVariant[];
  priceTiers: PublicPriceTier[];
  addons: PublicAddon[];
  addonGroups: PublicAddonGroup[];
  depositType: PublicDepositType;
  /** Percentage 0–100 when depositType='percentage'; absolute AUD when 'fixed'. */
  depositAmount: number;
  /** When true, the visitor must save a card via Stripe before submit. */
  requiresCardOnFile: boolean;
  /** When true, show a patch-test consent notice in the Details step. */
  requiresPatchTest: boolean;
  /** Days a patch test stays valid — used in the consent notice. */
  patchTestValidityDays?: number;
  /** Minimum hours between patch-test and booking — used in the consent notice. */
  patchTestMinLeadHours?: number;
  /** Per-service intake questions rendered in the Details step. */
  intakeQuestions: PublicIntakeQuestion[];
  /** Group bookings + max party size — needed to gate the friends UI. */
  allowGroupBooking: boolean;
  maxGroupSize?: number;
  /** Used by the Confirmation card to show "book your next" CTA. */
  rebookAfterDays?: number;
  /**
   * Locations this service is offered at. Empty array = available everywhere.
   * Used to filter the catalog when the workspace has multiple locations.
   */
  locationIds: string[];
  /**
   * ISO weekdays (0 = Sunday) the service is bookable on. Empty/undefined
   * means "any weekday the workspace is open". Intersected with workspace
   * working_hours when sizing the date strip.
   */
  availableWeekdays?: number[];
  /** Sort hint — operator-flagged services bubble to the top of their section. */
  featured: boolean;
  /** Free-text label shown next to a discounted price (e.g. "Spring special"). */
  promoLabel: string;
  /** Discounted price; undefined = no promo running. */
  promoPrice?: number;
  /** ISO date — promo only applies on/after this date. */
  promoStart?: string;
  /** ISO date — promo only applies on/before this date. */
  promoEnd?: string;
  /** Free-text labels — surfaced for future filtering, not yet rendered. */
  tags: string[];
  /** True when this service represents a bundle. The card surfaces a badge
   *  and a list of inclusions. */
  isPackage: boolean;
  /** Resolved child services included in the bundle. Each entry is shown
   *  in the card so the customer knows what they're booking. */
  packageInclusions: PublicPackageInclusion[];
}

export interface PublicPackageInclusion {
  serviceId: string;
  serviceName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
}

/** Public-safe location shape served by /api/public/book/info. */
export interface PublicLocation {
  id: string;
  name: string;
  /** Optional street address, shown in the picker and on confirmation. */
  address: string;
  /** "studio" = customer comes to a fixed address; "mobile" = artist travels. */
  kind: "studio" | "mobile";
  sortOrder: number;
}

/** A category section of the catalog. */
export interface CategorySection {
  /** Display label — e.g. "Hair", "Nails". Empty string is rendered as "Other". */
  category: string;
  services: PublicService[];
}

/** Public-safe team member shape served by /api/public/book/info. */
export interface PublicMember {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  socialLinks: Record<string, string>;
  role: string;
}
