// Form-state shapes for the ServiceDrawer editor.
//
// All numeric fields are kept as strings during editing so partial input
// ("1." while typing) doesn't crash the parser. They get coerced back to
// numbers on submit.

import type {
  ServicePriceType,
  ServiceIntakeQuestionType,
  DepositAppliesTo,
} from "@/types/models";

export interface VariantInput {
  id: string;
  name: string;
  price: string;
  duration: string;
}

export interface TierInput {
  id: string;
  name: string;
  price: string;
  duration: string; // empty = inherit base duration
  memberIds: string[];
}

export interface AddonInput {
  id: string;
  name: string;
  price: string;
  duration: string;
  groupId: string; // "" = ungrouped
}

export interface AddonGroupInput {
  id: string;
  name: string;
  minSelect: string;
  maxSelect: string; // "" = unlimited
}

export interface IntakeInput {
  id: string;
  label: string;
  type: ServiceIntakeQuestionType;
  required: boolean;
  options: string; // comma-separated for input ease
  hint: string;
}

export interface PackageItemInput {
  id: string;
  serviceId: string;
  variantId: string; // "" if no variant or service has no variants
}

export interface DynamicPriceRuleInput {
  id: string;
  label: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  modifierType: "percent" | "amount";
  modifierValue: string;
}

export interface FormState {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  // Pricing
  priceType: ServicePriceType;
  price: string; // base / fixed / "from" anchor
  /** Optional upper bound for "from" pricing — empty = open-ended "From $X". */
  priceMax: string;
  variants: VariantInput[];
  priceTiers: TierInput[];
  addons: AddonInput[];
  addonGroups: AddonGroupInput[];
  isPackage: boolean;
  packageItems: PackageItemInput[];
  // Time
  durationSplit: boolean;
  duration: string;
  durationActiveBefore: string;
  durationProcessing: string;
  durationActiveAfter: string;
  // Existing
  bufferBefore: string;
  bufferAfter: string;
  minNoticeHours: string;
  maxAdvanceDays: string;
  availableWeekdays: number[];
  requiresConfirmation: boolean;
  requiresCardOnFile: boolean;
  depositType: "none" | "percentage" | "fixed";
  depositAmount: string;
  depositAppliesTo: DepositAppliesTo;
  depositNoShowFee: string;
  depositAutoCancelHours: string;
  cancellationWindowHours: string;
  cancellationFee: string;
  intakeQuestions: IntakeInput[];
  intakeFormId: string;
  featured: boolean;
  promoLabel: string;
  /** Discount type — picks which of promoPrice / promoPercent we write. */
  promoType: "fixed" | "percent";
  promoPrice: string;
  promoPercent: string;
  promoStart: string;
  promoEnd: string;
  tagsRaw: string; // comma-separated for input
  /** Empty = all locations (or no multi-location at all). */
  locationIds: string[];
  /** Resource ids required for this service. */
  requiredResourceIds: string[];
  // Patch test
  requiresPatchTest: boolean;
  patchTestValidityDays: string;
  patchTestMinLeadHours: string;
  patchTestCategory: string;
  // Rebook
  rebookAfterDays: string;
  // Group bookings
  allowGroupBooking: boolean;
  maxGroupSize: string;
  // Dynamic pricing
  dynamicPriceRules: DynamicPriceRuleInput[];
  enabled: boolean;
}
