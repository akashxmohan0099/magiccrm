import type {
  OnboardingArtistType,
  OnboardingBookingChannel,
  OnboardingFollowUps,
  OnboardingPaymentMethod,
  OnboardingTeamSize,
  OnboardingWorkLocation,
} from "@/types/models";
import type { OnboardingOption } from "./onboarding-types";

// Make const-only options exported so onboarding.ts re-exports them via getters.
export const ARTIST_OPTIONS: OnboardingOption<OnboardingArtistType>[] = [
  { value: "hair_stylist", label: "Hair stylist" },
  { value: "nail_technician", label: "Nail technician" },
  { value: "makeup_artist", label: "Makeup artist" },
  { value: "lash_brow_artist", label: "Lash and brow artist" },
  { value: "esthetician_facialist", label: "Esthetician / facialist" },
  { value: "barber", label: "Barber" },
  { value: "massage_therapist", label: "Massage therapist" },
  { value: "tattoo_artist", label: "Tattoo artist" },
  { value: "spa_wellness", label: "Spa / wellness" },
  { value: "other", label: "Other" },
];

export const WORK_LOCATION_OPTIONS: OnboardingOption<OnboardingWorkLocation>[] = [
  { value: "studio", label: "At my own studio or salon" },
  { value: "mobile", label: "I travel to clients" },
  { value: "both", label: "Both" },
];

export const TEAM_SIZE_OPTIONS: OnboardingOption<OnboardingTeamSize>[] = [
  { value: "solo", label: "It's just me" },
  { value: "small_team", label: "I have a small team (2-5 people)" },
  { value: "large_team", label: "I have a larger team (6+ people)" },
];

export const BOOKING_CHANNEL_OPTIONS: OnboardingOption<OnboardingBookingChannel>[] = [
  { value: "phone_text", label: "Phone or text" },
  { value: "instagram_dms", label: "Instagram DMs" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook_messenger", label: "Facebook Messenger" },
  { value: "email", label: "Email" },
  { value: "website", label: "My website" },
  { value: "walk_ins", label: "Walk-ins" },
  { value: "booking_platform", label: "Another booking platform" },
];

export const PAYMENT_METHOD_OPTIONS: OnboardingOption<OnboardingPaymentMethod>[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card_terminal", label: "Card terminal in person" },
  { value: "stripe", label: "Stripe" },
  { value: "square", label: "Square" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export const DEPOSIT_PREFERENCE_OPTIONS: OnboardingOption<NonNullable<OnboardingFollowUps["depositPreference"]>>[] = [
  { value: "25_percent", label: "25%" },
  { value: "50_percent", label: "50%" },
  { value: "fixed_amount", label: "Fixed $" },
  { value: "set_later", label: "set per service later" },
];

export const NO_SHOW_FEE_OPTIONS: OnboardingOption<NonNullable<OnboardingFollowUps["noShowFeePreference"]>>[] = [
  { value: "50_percent", label: "50%" },
  { value: "100_percent", label: "100%" },
  { value: "fixed_amount", label: "Fixed $" },
  { value: "decide_later", label: "decide later" },
];

export const TRAVEL_FEE_OPTIONS: OnboardingOption<NonNullable<OnboardingFollowUps["travelFeePreference"]>>[] = [
  { value: "per_km_rate", label: "Per-km rate" },
  { value: "zone_flat_fee", label: "Zone-based flat fee" },
  { value: "set_up_later", label: "set up later" },
];

export const SERVICE_AREA_OPTIONS: OnboardingOption<NonNullable<OnboardingFollowUps["serviceAreaPreference"]>>[] = [
  { value: "radius_from_base", label: "Radius from base" },
  { value: "specific_postcodes", label: "Specific postcodes" },
  { value: "set_up_later", label: "set up later" },
];

export const MEMBERSHIP_OPTIONS: OnboardingOption<NonNullable<OnboardingFollowUps["membershipPreference"]>>[] = [
  { value: "subscription", label: "Subscription" },
  { value: "bundles", label: "Bundles" },
  { value: "both", label: "Both" },
  { value: "set_up_later", label: "set up later" },
];

