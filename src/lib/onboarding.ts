import type {
  AutomationType,
  OnboardingActionId,
  OnboardingArtistType,
  OnboardingBookingChannel,
  OnboardingFollowUpKey,
  OnboardingFollowUps,
  OnboardingPersona,
  OnboardingTeamSize,
  OnboardingWorkLocation,
  Service,
  WorkspaceSettings,
} from "@/types/models";
import {
  ARTIST_OPTIONS,
  WORK_LOCATION_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BOOKING_CHANNEL_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "./onboarding-options";
import { ACTION_DEFINITIONS, PERSONA_ACTIONS } from "./onboarding-actions";
import { SERVICE_TEMPLATES } from "./onboarding-service-templates";

// Re-export shared types from onboarding-types so existing
// `from "@/lib/onboarding"` imports keep working.
import type {
  OnboardingChecklistItem,
  OnboardingAnswers,
  OnboardingActivation,
} from "./onboarding-types";
export type {
  OnboardingOption,
  PersonaActionDefinition,
  OnboardingChecklistItem,
  OnboardingAnswers,
  OnboardingActivation,
} from "./onboarding-types";

// Follow-up option arrays — imported locally so getFollowUpOptions/Summary
// still resolve them, and re-exported for callers that reach by name.
import {
  DEPOSIT_PREFERENCE_OPTIONS,
  NO_SHOW_FEE_OPTIONS,
  TRAVEL_FEE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  MEMBERSHIP_OPTIONS,
} from "./onboarding-options";
export {
  DEPOSIT_PREFERENCE_OPTIONS,
  NO_SHOW_FEE_OPTIONS,
  TRAVEL_FEE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  MEMBERSHIP_OPTIONS,
} from "./onboarding-options";

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
