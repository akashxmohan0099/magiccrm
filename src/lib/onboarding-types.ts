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
