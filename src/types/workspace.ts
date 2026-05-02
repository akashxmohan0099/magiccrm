// ── Workspace & Settings ────────────────────────────

import type { WorkingHours } from './team';

export type OnboardingArtistType =
  | 'hair_stylist'
  | 'nail_technician'
  | 'makeup_artist'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber'
  | 'massage_therapist'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingWorkLocation = 'studio' | 'mobile' | 'both';

export type OnboardingTeamSize = 'solo' | 'small_team' | 'large_team';

export type OnboardingBookingChannel =
  | 'phone_text'
  | 'instagram_dms'
  | 'whatsapp'
  | 'facebook_messenger'
  | 'email'
  | 'website'
  | 'walk_ins'
  | 'booking_platform';

export type OnboardingPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'card_terminal'
  | 'stripe'
  | 'square'
  | 'paypal'
  | 'other';

export type OnboardingActionId =
  | 'treatment_notes'
  | 'deposit_requirements'
  | 'card_on_file_no_show_fee'
  | 'reminder_automations'
  | 'recurring_bookings'
  | 'rebooking_prompt'
  | 'before_after_photos'
  | 'pre_appointment_questionnaire'
  | 'review_request_automation'
  | 'tips'
  | 'proposals_addon'
  | 'travel_fee_calculation'
  | 'service_area'
  | 'group_bookings'
  | 'memberships_addon'
  | 'documents_addon'
  | 'booking_approval_mode';

export type OnboardingPersona =
  | 'hair_stylist_solo'
  | 'hair_stylist_team'
  | 'nail_technician_solo'
  | 'nail_technician_team'
  | 'makeup_artist_mobile'
  | 'makeup_artist_studio'
  | 'lash_brow_artist'
  | 'esthetician_facialist'
  | 'barber_solo'
  | 'barber_team'
  | 'massage_therapist_studio'
  | 'massage_therapist_mobile'
  | 'tattoo_artist'
  | 'spa_wellness'
  | 'other';

export type OnboardingDepositPreference = '25_percent' | '50_percent' | 'fixed_amount' | 'set_later';
export type OnboardingNoShowFeePreference = '50_percent' | '100_percent' | 'fixed_amount' | 'decide_later';
export type OnboardingTravelFeePreference = 'per_km_rate' | 'zone_flat_fee' | 'set_up_later';
export type OnboardingServiceAreaPreference = 'radius_from_base' | 'specific_postcodes' | 'set_up_later';
export type OnboardingMembershipPreference = 'subscription' | 'bundles' | 'both' | 'set_up_later';

export interface OnboardingFollowUps {
  depositPreference?: OnboardingDepositPreference;
  noShowFeePreference?: OnboardingNoShowFeePreference;
  travelFeePreference?: OnboardingTravelFeePreference;
  serviceAreaPreference?: OnboardingServiceAreaPreference;
  membershipPreference?: OnboardingMembershipPreference;
}

export type OnboardingFollowUpKey = keyof OnboardingFollowUps;

export interface Workspace {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  workspaceId: string;
  businessName?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  stripeAccountId?: string;
  stripeOnboardingComplete: boolean;
  workingHours: Record<string, WorkingHours>;
  cancellationWindowHours: number;
  depositPercentage: number;
  noShowFee: number;
  messageTemplates: Record<string, string>;
  notificationDefaults: 'email' | 'sms' | 'both';
  branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
    /** Wide hero photo shown above the booking page header. Data URL or remote URL. */
    coverImage?: string;
    /** Font pairing id, e.g. "modern-clean", "editorial". Drives heading + body. */
    fontPairing?: string;
  };
  bookingPageSlug?: string;
  // Platform features
  /** ISO 4217 currency code (e.g. "USD", "AUD", "GBP"). Defaults to "USD". */
  currency?: string;
  /** BCP-47 locale used for currency/date formatting (e.g. "en-US", "en-AU"). */
  locale?: string;
  taxRate?: number;
  taxId?: string;
  termsContent?: string;
  calendarSyncEnabled: boolean;
  minNoticeHours: number;
  maxAdvanceDays: number;
  autoReplyEnabled: boolean;
  autoReplyTemplate?: string;
  serviceAreaMode?: 'radius' | 'postcodes';
  radiusKm?: number;
  servicedPostcodes?: string[];
  travelFeeMode?: 'per_km' | 'zone';
  perKmRate?: number;
  travelZones?: { postcodes: string[]; fee: number }[];
  artistType?: OnboardingArtistType;
  workLocation?: OnboardingWorkLocation;
  teamSize?: OnboardingTeamSize;
  bookingChannels?: OnboardingBookingChannel[];
  paymentMethods?: OnboardingPaymentMethod[];
  resolvedPersona?: OnboardingPersona;
  selectedOnboardingActions?: OnboardingActionId[];
  onboardingFollowUps?: OnboardingFollowUps;
  // v2 onboarding: persona slug + raw answers stash so re-running the
  // questionnaire from settings can pre-populate the existing draft.
  persona?: string;
  onboardingAnswers?: {
    persona: string;
    structure: Record<string, string>;
    solutions: string[];
    marketing: string[];
    billing: string[];
    engagement: string[];
  };
  enabledAddons: string[];    // dashboard add-on module IDs
  enabledFeatures: string[];   // toggle-on feature IDs
  // Dev-only override used by /dev to flip the dashboard between owner/staff
  // views without re-authenticating. Real auth populates `member.role` from
  // workspace_members; this is only consulted when there's no real session.
  role?: 'owner' | 'staff';
  updatedAt: string;
}
