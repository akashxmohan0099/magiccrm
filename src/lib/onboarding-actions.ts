import type { OnboardingActionId, OnboardingPersona } from "@/types/models";
import type { PersonaActionDefinition } from "./onboarding-types";

export const ACTION_DEFINITIONS: Record<OnboardingActionId, PersonaActionDefinition> = {
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

export const PERSONA_ACTIONS: Record<OnboardingPersona, { label: string; options: { id: OnboardingActionId; label: string }[] }> = {
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
