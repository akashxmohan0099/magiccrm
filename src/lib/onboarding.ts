import type {
  AutomationType,
  OnboardingActionId,
  OnboardingArtistType,
  OnboardingBookingChannel,
  OnboardingFollowUpKey,
  OnboardingFollowUps,
  OnboardingPaymentMethod,
  OnboardingPersona,
  OnboardingTeamSize,
  OnboardingWorkLocation,
  Service,
  WorkspaceSettings,
} from "@/types/models";

export interface OnboardingOption<T extends string> {
  value: T;
  label: string;
}

export interface PersonaActionDefinition {
  id: OnboardingActionId;
  label: string;
  featureIds?: string[];
  addonIds?: string[];
  followUpKey?: OnboardingFollowUpKey;
  automationTypes?: AutomationType[];
}

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface OnboardingAnswers {
  artistType: OnboardingArtistType;
  workLocation: OnboardingWorkLocation;
  teamSize: OnboardingTeamSize;
  bookingChannels: OnboardingBookingChannel[];
  paymentMethods: OnboardingPaymentMethod[];
  selectedActions: OnboardingActionId[];
  followUps: OnboardingFollowUps;
}

export interface OnboardingActivation {
  resolvedPersona: OnboardingPersona;
  enabledFeatures: string[];
  enabledAddons: string[];
  settingsUpdate: Partial<WorkspaceSettings>;
  services: Omit<Service, "id" | "createdAt" | "updatedAt">[];
  automationTypesToEnable: AutomationType[];
}

const ARTIST_OPTIONS: OnboardingOption<OnboardingArtistType>[] = [
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

const WORK_LOCATION_OPTIONS: OnboardingOption<OnboardingWorkLocation>[] = [
  { value: "studio", label: "At my own studio or salon" },
  { value: "mobile", label: "I travel to clients" },
  { value: "both", label: "Both" },
];

const TEAM_SIZE_OPTIONS: OnboardingOption<OnboardingTeamSize>[] = [
  { value: "solo", label: "It's just me" },
  { value: "small_team", label: "I have a small team (2-5 people)" },
  { value: "large_team", label: "I have a larger team (6+ people)" },
];

const BOOKING_CHANNEL_OPTIONS: OnboardingOption<OnboardingBookingChannel>[] = [
  { value: "phone_text", label: "Phone or text" },
  { value: "instagram_dms", label: "Instagram DMs" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook_messenger", label: "Facebook Messenger" },
  { value: "email", label: "Email" },
  { value: "website", label: "My website" },
  { value: "walk_ins", label: "Walk-ins" },
  { value: "booking_platform", label: "Another booking platform" },
];

const PAYMENT_METHOD_OPTIONS: OnboardingOption<OnboardingPaymentMethod>[] = [
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

const ACTION_DEFINITIONS: Record<OnboardingActionId, PersonaActionDefinition> = {
  treatment_notes: {
    id: "treatment_notes",
    label: "Keep notes on each client's treatment history",
    featureIds: ["treatment-notes"],
  },
  deposit_requirements: {
    id: "deposit_requirements",
    label: "Take deposits for bookings",
    featureIds: ["deposits"],
    followUpKey: "depositPreference",
  },
  card_on_file_no_show_fee: {
    id: "card_on_file_no_show_fee",
    label: "Save card details for cancellation protection",
    featureIds: ["card-on-file", "no-show-fee"],
    followUpKey: "noShowFeePreference",
  },
  reminder_automations: {
    id: "reminder_automations",
    label: "Send appointment reminders",
    featureIds: ["reminder-automations"],
    automationTypes: ["appointment_reminder"],
  },
  recurring_bookings: {
    id: "recurring_bookings",
    label: "Let regulars book recurring appointments",
    featureIds: ["recurring-bookings"],
  },
  rebooking_prompt: {
    id: "rebooking_prompt",
    label: "Send a rebooking nudge after each visit",
    featureIds: ["rebooking-prompt"],
    automationTypes: ["post_service_followup"],
  },
  before_after_photos: {
    id: "before_after_photos",
    label: "Save before and after photos to client profiles",
    featureIds: ["before-after-photos"],
  },
  pre_appointment_questionnaire: {
    id: "pre_appointment_questionnaire",
    label: "Send a consultation form before appointments",
    featureIds: ["questionnaire"],
  },
  review_request_automation: {
    id: "review_request_automation",
    label: "Automatically request reviews",
    featureIds: ["review-request-automation"],
    automationTypes: ["review_request"],
  },
  tips: {
    id: "tips",
    label: "Track earnings and tips separately",
    featureIds: ["tips"],
  },
  proposals_addon: {
    id: "proposals_addon",
    label: "Send branded proposals",
    addonIds: ["proposals"],
  },
  travel_fee_calculation: {
    id: "travel_fee_calculation",
    label: "Charge a travel fee",
    featureIds: ["travel-fee"],
    followUpKey: "travelFeePreference",
  },
  service_area: {
    id: "service_area",
    label: "Define a service area",
    featureIds: ["service-area"],
    followUpKey: "serviceAreaPreference",
  },
  group_bookings: {
    id: "group_bookings",
    label: "Take group bookings",
    featureIds: ["group-bookings"],
  },
  memberships_addon: {
    id: "memberships_addon",
    label: "Offer membership packages",
    addonIds: ["memberships"],
    followUpKey: "membershipPreference",
  },
  documents_addon: {
    id: "documents_addon",
    label: "Send waivers and consent forms",
    addonIds: ["documents"],
  },
  booking_approval_mode: {
    id: "booking_approval_mode",
    label: "Manually approve bookings before confirming",
    featureIds: ["booking-approval"],
  },
};

const PERSONA_ACTIONS: Record<OnboardingPersona, { label: string; options: { id: OnboardingActionId; label: string }[] }> = {
  hair_stylist_solo: {
    label: "Hair Stylist (Solo)",
    options: [
      { id: "treatment_notes", label: "Keep colour formulas and treatment notes for each client" },
      { id: "deposit_requirements", label: "Take deposits for colour and longer services" },
      { id: "card_on_file_no_show_fee", label: "Save card details for cancellation protection" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "recurring_bookings", label: "Have regulars book the same slot every few weeks" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each visit" },
      { id: "before_after_photos", label: "Save before and after photos to client profiles" },
      { id: "pre_appointment_questionnaire", label: "Send a quick consultation form to new clients before their first visit" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  hair_stylist_team: {
    label: "Hair Stylist (Team)",
    options: [
      { id: "treatment_notes", label: "Keep colour formulas and treatment notes for each client" },
      { id: "deposit_requirements", label: "Take deposits for colour and longer services" },
      { id: "card_on_file_no_show_fee", label: "Save card details for cancellation protection" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "recurring_bookings", label: "Have regulars book the same slot every few weeks" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each visit" },
      { id: "before_after_photos", label: "Save before and after photos to client profiles" },
      { id: "pre_appointment_questionnaire", label: "Send a quick consultation form to new clients before their first visit" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
      { id: "tips", label: "Track each stylist's earnings and tips separately" },
    ],
  },
  nail_technician_solo: {
    label: "Nail Technician (Solo)",
    options: [
      { id: "treatment_notes", label: "Keep notes on each client's preferred shape, length, and colours" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "recurring_bookings", label: "Have clients book regular fills every few weeks" },
      { id: "deposit_requirements", label: "Take a deposit for longer or detailed sets" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each visit" },
      { id: "before_after_photos", label: "Save before and after photos to my client profiles" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  nail_technician_team: {
    label: "Nail Technician (Team)",
    options: [
      { id: "treatment_notes", label: "Keep notes on each client's preferred shape, length, and colours" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "recurring_bookings", label: "Have clients book regular fills every few weeks" },
      { id: "deposit_requirements", label: "Take a deposit for longer or detailed sets" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each visit" },
      { id: "before_after_photos", label: "Save before and after photos to my client profiles" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
      { id: "tips", label: "Track each tech's earnings and tips separately" },
    ],
  },
  makeup_artist_mobile: {
    label: "Makeup Artist (Mobile)",
    options: [
      { id: "proposals_addon", label: "Send branded proposals for weddings and events" },
      { id: "travel_fee_calculation", label: "Charge a travel fee based on distance" },
      { id: "service_area", label: "Define the area I'm willing to travel to" },
      { id: "deposit_requirements", label: "Require deposits to lock in dates" },
      { id: "pre_appointment_questionnaire", label: "Send pre-appointment consultation forms to brides" },
      { id: "group_bookings", label: "Take group bookings for bridal parties" },
      { id: "review_request_automation", label: "Automatically request reviews after the event" },
    ],
  },
  makeup_artist_studio: {
    label: "Makeup Artist (Studio)",
    options: [
      { id: "proposals_addon", label: "Send branded proposals for events and shoots" },
      { id: "deposit_requirements", label: "Require deposits to lock in dates" },
      { id: "pre_appointment_questionnaire", label: "Send pre-appointment consultation forms" },
      { id: "group_bookings", label: "Take group bookings for bridal parties or events" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  lash_brow_artist: {
    label: "Lash & Brow Artist",
    options: [
      { id: "treatment_notes", label: "Keep lash maps and treatment notes for each client" },
      { id: "pre_appointment_questionnaire", label: "Send a consultation form before first appointments" },
      { id: "recurring_bookings", label: "Have clients automatically book their fills every 2-3 weeks" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each visit" },
      { id: "before_after_photos", label: "Save before and after photos to client profiles" },
      { id: "deposit_requirements", label: "Take deposits for full sets and longer services" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  esthetician_facialist: {
    label: "Esthetician / Facialist",
    options: [
      { id: "pre_appointment_questionnaire", label: "Send a skin consultation form before first visits" },
      { id: "treatment_notes", label: "Keep treatment notes and product history for each client" },
      { id: "memberships_addon", label: "Offer membership packages for regular facials" },
      { id: "recurring_bookings", label: "Have clients book recurring monthly treatments" },
      { id: "before_after_photos", label: "Save before and after photos to client profiles" },
      { id: "deposit_requirements", label: "Take deposits for longer or premium treatments" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  barber_solo: {
    label: "Barber (Solo)",
    options: [
      { id: "recurring_bookings", label: "Have regulars book the same slot every few weeks" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each cut" },
      { id: "card_on_file_no_show_fee", label: "Save card details for cancellation protection" },
    ],
  },
  barber_team: {
    label: "Barber (Team)",
    options: [
      { id: "recurring_bookings", label: "Have regulars book the same slot every few weeks" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "rebooking_prompt", label: "Send a rebooking nudge after each cut" },
      { id: "card_on_file_no_show_fee", label: "Save card details for cancellation protection" },
      { id: "tips", label: "Track each barber's earnings and tips separately" },
    ],
  },
  massage_therapist_studio: {
    label: "Massage Therapist (Studio)",
    options: [
      { id: "pre_appointment_questionnaire", label: "Send an intake form before first appointments" },
      { id: "treatment_notes", label: "Keep treatment notes for each client" },
      { id: "memberships_addon", label: "Offer membership packages for regular sessions" },
      { id: "recurring_bookings", label: "Have clients book recurring weekly or monthly sessions" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
    ],
  },
  massage_therapist_mobile: {
    label: "Massage Therapist (Mobile)",
    options: [
      { id: "pre_appointment_questionnaire", label: "Send an intake form before first appointments" },
      { id: "treatment_notes", label: "Keep treatment notes for each client" },
      { id: "memberships_addon", label: "Offer membership packages for regular sessions" },
      { id: "recurring_bookings", label: "Have clients book recurring weekly or monthly sessions" },
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "travel_fee_calculation", label: "Charge a travel fee based on distance" },
      { id: "service_area", label: "Define the area I'm willing to travel to" },
    ],
  },
  tattoo_artist: {
    label: "Tattoo Artist",
    options: [
      { id: "deposit_requirements", label: "Require deposits before confirming any booking" },
      { id: "pre_appointment_questionnaire", label: "Send a design brief or consultation form before first sessions" },
      { id: "documents_addon", label: "Send waivers and consent forms for clients to sign before sessions" },
      { id: "booking_approval_mode", label: "Manually approve bookings before confirming" },
      { id: "before_after_photos", label: "Save before and after photos of tattoos to client profiles" },
      { id: "review_request_automation", label: "Automatically request reviews after sessions" },
    ],
  },
  spa_wellness: {
    label: "Spa / Wellness",
    options: [
      { id: "memberships_addon", label: "Offer membership packages for clients" },
      { id: "pre_appointment_questionnaire", label: "Send consultation forms before first treatments" },
      { id: "documents_addon", label: "Send waivers and consent forms for clients to sign" },
      { id: "treatment_notes", label: "Keep treatment notes for each client" },
      { id: "recurring_bookings", label: "Have clients book recurring sessions" },
      { id: "tips", label: "Track each therapist's earnings and tips separately" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
  other: {
    label: "Other",
    options: [
      { id: "reminder_automations", label: "Send appointment reminders so clients don't forget" },
      { id: "pre_appointment_questionnaire", label: "Send a consultation form before first appointments" },
      { id: "review_request_automation", label: "Automatically request reviews after services" },
    ],
  },
};

type ServiceSeed = Pick<Service, "name" | "description" | "duration" | "price" | "category">;

const SERVICE_TEMPLATES: Record<OnboardingArtistType, ServiceSeed[]> = {
  hair_stylist: [
    { name: "Cut & Blow Dry", duration: 60, price: 85, description: "Precision cut with blow dry finish", category: "Hair" },
    { name: "Full Colour", duration: 120, price: 180, description: "Root to tip single-process colour", category: "Hair" },
    { name: "Balayage", duration: 180, price: 320, description: "Hand-painted highlights for natural depth", category: "Hair" },
  ],
  nail_technician: [
    { name: "Builder Gel Full Set", duration: 90, price: 110, description: "Builder gel set with shaping and finish", category: "Nails" },
    { name: "Gel Refill", duration: 75, price: 85, description: "Rebalance and refresh for existing gel sets", category: "Nails" },
    { name: "Nail Art Add-On", duration: 20, price: 25, description: "Custom nail art add-on", category: "Nails" },
  ],
  makeup_artist: [
    { name: "Event Makeup", duration: 75, price: 140, description: "Full-face makeup for events and photoshoots", category: "Makeup" },
    { name: "Bridal Trial", duration: 90, price: 170, description: "Wedding makeup trial and consultation", category: "Makeup" },
    { name: "Bridal Party Booking", duration: 180, price: 420, description: "Group booking for bridal parties", category: "Makeup" },
  ],
  lash_brow_artist: [
    { name: "Classic Full Set", duration: 120, price: 140, description: "Classic lash extension full set", category: "Lashes & Brows" },
    { name: "Lash Fill", duration: 60, price: 85, description: "Maintenance fill for returning clients", category: "Lashes & Brows" },
    { name: "Brow Lamination & Tint", duration: 45, price: 80, description: "Shape, tint, and set brows", category: "Lashes & Brows" },
  ],
  esthetician_facialist: [
    { name: "Signature Facial", duration: 60, price: 130, description: "Deep cleanse, exfoliation, and hydration", category: "Skin" },
    { name: "Advanced Peel", duration: 75, price: 165, description: "Targeted peel for texture and pigmentation", category: "Skin" },
    { name: "LED Add-On", duration: 20, price: 35, description: "LED light therapy add-on", category: "Skin" },
  ],
  barber: [
    { name: "Standard Cut", duration: 30, price: 45, description: "Clipper and scissor cut with finish", category: "Barbering" },
    { name: "Skin Fade", duration: 45, price: 55, description: "Detailed fade with blend and styling", category: "Barbering" },
    { name: "Beard Trim", duration: 20, price: 25, description: "Beard shaping and tidy-up", category: "Barbering" },
  ],
  massage_therapist: [
    { name: "Relaxation Massage", duration: 60, price: 110, description: "Full-body relaxation massage", category: "Massage & Spa" },
    { name: "Deep Tissue Massage", duration: 60, price: 130, description: "Targeted tension relief massage", category: "Massage & Spa" },
    { name: "90-Minute Session", duration: 90, price: 165, description: "Extended massage session", category: "Massage & Spa" },
  ],
  tattoo_artist: [
    { name: "Consultation", duration: 30, price: 0, description: "Tattoo concept and placement consultation", category: "Tattoo" },
    { name: "Half-Day Session", duration: 240, price: 600, description: "Half-day tattoo booking", category: "Tattoo" },
    { name: "Full-Day Session", duration: 420, price: 1000, description: "Full-day tattoo booking", category: "Tattoo" },
  ],
  spa_wellness: [
    { name: "Wellness Treatment", duration: 60, price: 125, description: "Signature spa treatment", category: "Spa & Wellness" },
    { name: "Body Ritual", duration: 90, price: 180, description: "Body exfoliation and massage ritual", category: "Spa & Wellness" },
    { name: "Infrared Session", duration: 45, price: 70, description: "Infrared sauna or wellness session", category: "Spa & Wellness" },
  ],
  other: [
    { name: "Signature Service", duration: 60, price: 100, description: "Starter service template for your business", category: "Services" },
    { name: "Extended Session", duration: 90, price: 150, description: "Longer appointment template", category: "Services" },
  ],
};

export function getArtistOptions() {
  return ARTIST_OPTIONS;
}

export function getWorkLocationOptions() {
  return WORK_LOCATION_OPTIONS;
}

export function getTeamSizeOptions() {
  return TEAM_SIZE_OPTIONS;
}

export function getBookingChannelOptions() {
  return BOOKING_CHANNEL_OPTIONS;
}

export function getPaymentMethodOptions() {
  return PAYMENT_METHOD_OPTIONS;
}

export function getPersonaActions(persona: OnboardingPersona) {
  return PERSONA_ACTIONS[persona];
}

export function getActionDefinition(actionId: OnboardingActionId) {
  return ACTION_DEFINITIONS[actionId];
}

export function normalizeTeamVariant(teamSize: OnboardingTeamSize): "solo" | "team" {
  return teamSize === "solo" ? "solo" : "team";
}

export function resolvePersona(
  artistType: OnboardingArtistType,
  workLocation: OnboardingWorkLocation,
  teamSize: OnboardingTeamSize,
): OnboardingPersona {
  const teamVariant = normalizeTeamVariant(teamSize);
  const mobileVariant = workLocation === "studio" ? "studio" : "mobile";

  switch (artistType) {
    case "hair_stylist":
      return teamVariant === "solo" ? "hair_stylist_solo" : "hair_stylist_team";
    case "nail_technician":
      return teamVariant === "solo" ? "nail_technician_solo" : "nail_technician_team";
    case "makeup_artist":
      return mobileVariant === "mobile" ? "makeup_artist_mobile" : "makeup_artist_studio";
    case "lash_brow_artist":
      return "lash_brow_artist";
    case "esthetician_facialist":
      return "esthetician_facialist";
    case "barber":
      return teamVariant === "solo" ? "barber_solo" : "barber_team";
    case "massage_therapist":
      return mobileVariant === "mobile" ? "massage_therapist_mobile" : "massage_therapist_studio";
    case "tattoo_artist":
      return "tattoo_artist";
    case "spa_wellness":
      return "spa_wellness";
    default:
      return "other";
  }
}

export function getNotificationDefaults(
  channels: OnboardingBookingChannel[],
): WorkspaceSettings["notificationDefaults"] {
  const hasEmail = channels.includes("email") || channels.includes("website");
  const hasSmsLike = channels.some((channel) =>
    channel === "phone_text"
    || channel === "whatsapp"
    || channel === "instagram_dms"
    || channel === "facebook_messenger",
  );

  if (hasEmail && hasSmsLike) return "both";
  if (hasSmsLike) return "sms";
  return "email";
}

function buildServiceSeeds(
  artistType: OnboardingArtistType,
  workLocation: OnboardingWorkLocation,
  workspaceId: string,
): Omit<Service, "id" | "createdAt" | "updatedAt">[] {
  const templates = SERVICE_TEMPLATES[artistType] || SERVICE_TEMPLATES.other;
  const locationType = workLocation === "studio"
    ? "studio"
    : workLocation === "mobile"
      ? "mobile"
      : "both";

  return templates.map((template, index) => ({
    workspaceId,
    name: template.name,
    description: template.description,
    duration: template.duration,
    price: template.price,
    category: template.category,
    enabled: true,
    sortOrder: index,
    bufferMinutes: 0,
    requiresConfirmation: false,
    depositType: "none",
    depositAmount: 0,
    locationType,
  }));
}

export function buildOnboardingActivation(
  answers: OnboardingAnswers,
  workspaceId: string,
): OnboardingActivation {
  const resolvedPersona = resolvePersona(answers.artistType, answers.workLocation, answers.teamSize);
  const enabledFeatures = new Set<string>();
  const enabledAddons = new Set<string>();
  const automationTypesToEnable = new Set<AutomationType>();

  for (const actionId of answers.selectedActions) {
    const definition = ACTION_DEFINITIONS[actionId];
    definition.featureIds?.forEach((featureId) => enabledFeatures.add(featureId));
    definition.addonIds?.forEach((addonId) => enabledAddons.add(addonId));
    definition.automationTypes?.forEach((type) => automationTypesToEnable.add(type));
  }

  const settingsUpdate: Partial<WorkspaceSettings> = {
    artistType: answers.artistType,
    workLocation: answers.workLocation,
    teamSize: answers.teamSize,
    bookingChannels: answers.bookingChannels,
    paymentMethods: answers.paymentMethods,
    resolvedPersona,
    selectedOnboardingActions: answers.selectedActions,
    onboardingFollowUps: answers.followUps,
    notificationDefaults: getNotificationDefaults(answers.bookingChannels),
    enabledFeatures: Array.from(enabledFeatures),
    enabledAddons: Array.from(enabledAddons),
  };

  if (answers.followUps.depositPreference === "25_percent") {
    settingsUpdate.depositPercentage = 25;
  } else if (answers.followUps.depositPreference === "50_percent") {
    settingsUpdate.depositPercentage = 50;
  }

  if (answers.followUps.serviceAreaPreference === "radius_from_base") {
    settingsUpdate.serviceAreaMode = "radius";
  } else if (answers.followUps.serviceAreaPreference === "specific_postcodes") {
    settingsUpdate.serviceAreaMode = "postcodes";
  }

  if (answers.followUps.travelFeePreference === "per_km_rate") {
    settingsUpdate.travelFeeMode = "per_km";
  } else if (answers.followUps.travelFeePreference === "zone_flat_fee") {
    settingsUpdate.travelFeeMode = "zone";
  }

  return {
    resolvedPersona,
    enabledFeatures: Array.from(enabledFeatures),
    enabledAddons: Array.from(enabledAddons),
    settingsUpdate,
    services: buildServiceSeeds(answers.artistType, answers.workLocation, workspaceId),
    automationTypesToEnable: Array.from(automationTypesToEnable),
  };
}

function needsStripeChecklist(settings: WorkspaceSettings) {
  return settings.paymentMethods?.includes("stripe")
    || settings.enabledFeatures.includes("card-on-file")
    || settings.enabledFeatures.includes("no-show-fee")
    || settings.enabledFeatures.includes("deposits")
    || settings.enabledAddons.includes("proposals")
    || settings.enabledAddons.includes("memberships");
}

export function getOnboardingChecklistItems(
  settings: WorkspaceSettings | null | undefined,
): OnboardingChecklistItem[] {
  if (!settings?.selectedOnboardingActions?.length) return [];

  const actions = new Set(settings.selectedOnboardingActions);
  const items: OnboardingChecklistItem[] = [];

  if (needsStripeChecklist(settings) && !settings.stripeOnboardingComplete) {
    items.push({
      id: "connect-stripe",
      title: "Connect Stripe",
      description: "Finish Stripe setup for deposits, proposals, memberships, and saved cards.",
      href: "/dashboard/settings",
    });
  }

  if (
    actions.has("deposit_requirements")
    && (settings.onboardingFollowUps?.depositPreference === "fixed_amount"
      || settings.onboardingFollowUps?.depositPreference === "set_later")
  ) {
    items.push({
      id: "finish-deposit-rules",
      title: "Finish deposit rules",
      description: "Set the exact deposit amount or service-specific rules in Settings.",
      href: "/dashboard/settings",
    });
  }

  if (
    actions.has("card_on_file_no_show_fee")
    && (settings.onboardingFollowUps?.noShowFeePreference === "fixed_amount"
      || settings.onboardingFollowUps?.noShowFeePreference === "decide_later")
  ) {
    items.push({
      id: "set-no-show-fee",
      title: "Set your no-show fee",
      description: "Choose the exact no-show fee before using cancellation protection.",
      href: "/dashboard/settings",
    });
  }

  if (actions.has("service_area")) {
    items.push({
      id: "configure-service-area",
      title: "Configure service area",
      description: "Add your radius or postcodes so mobile bookings are validated properly.",
      href: "/dashboard/settings",
    });
  }

  if (actions.has("travel_fee_calculation")) {
    items.push({
      id: "configure-travel-fee",
      title: "Configure travel fees",
      description: "Set your per-km rate or zone fees for mobile bookings.",
      href: "/dashboard/settings",
    });
  }

  if (actions.has("pre_appointment_questionnaire")) {
    items.push({
      id: "create-questionnaire",
      title: "Create your questionnaire",
      description: "Add the consultation or intake form clients should receive before appointments.",
      href: "/dashboard/forms",
    });
  }

  if (
    actions.has("reminder_automations")
    || actions.has("review_request_automation")
    || actions.has("rebooking_prompt")
  ) {
    items.push({
      id: "review-automations",
      title: "Review your automations",
      description: "Check the reminder, follow-up, and review messages that were enabled for you.",
      href: "/dashboard/automations",
    });
  }

  if (settings.teamSize && settings.teamSize !== "solo") {
    items.push({
      id: "invite-team",
      title: "Invite your team",
      description: "Add team members so bookings and earnings can be assigned correctly.",
      href: "/dashboard/teams",
    });
  }

  if (actions.has("memberships_addon")) {
    items.push({
      id: "create-membership",
      title: "Create a membership offer",
      description: "Add your first membership plan or bundle before sharing it with clients.",
      href: "/dashboard/memberships",
    });
  }

  if (actions.has("documents_addon")) {
    items.push({
      id: "create-document-template",
      title: "Create a document template",
      description: "Set up the waiver or consent form clients should sign before treatment.",
      href: "/dashboard/documents",
    });
  }

  if (actions.has("proposals_addon")) {
    items.push({
      id: "review-proposals",
      title: "Review proposals",
      description: "Create a proposal template for weddings, events, or premium bookings.",
      href: "/dashboard/proposals",
    });
  }

  return items;
}

export function getFollowUpPrompt(key: OnboardingFollowUpKey) {
  switch (key) {
    case "depositPreference":
      return "How much deposit do you usually take?";
    case "noShowFeePreference":
      return "How much do you charge for no-shows?";
    case "travelFeePreference":
      return "How do you charge for travel?";
    case "serviceAreaPreference":
      return "How do you define your service area?";
    case "membershipPreference":
      return "What kind of memberships?";
  }
}

export function getFollowUpOptions(key: OnboardingFollowUpKey) {
  switch (key) {
    case "depositPreference":
      return DEPOSIT_PREFERENCE_OPTIONS;
    case "noShowFeePreference":
      return NO_SHOW_FEE_OPTIONS;
    case "travelFeePreference":
      return TRAVEL_FEE_OPTIONS;
    case "serviceAreaPreference":
      return SERVICE_AREA_OPTIONS;
    case "membershipPreference":
      return MEMBERSHIP_OPTIONS;
  }
}

export function getFollowUpSummary(key: OnboardingFollowUpKey, followUps: OnboardingFollowUps) {
  const value = followUps[key];
  if (!value) return null;
  const options = getFollowUpOptions(key);
  return options.find((option) => option.value === value)?.label ?? null;
}

export function isActionSelected(actions: OnboardingActionId[], actionId: OnboardingActionId) {
  return actions.includes(actionId);
}

export function getArtistLabel(artistType: OnboardingArtistType) {
  return ARTIST_OPTIONS.find((option) => option.value === artistType)?.label ?? "Business";
}

export function getPersonaLabel(persona: OnboardingPersona) {
  return PERSONA_ACTIONS[persona].label;
}
