import { describe, expect, it } from "vitest";
import {
  buildOnboardingActivation,
  getFollowUpOptions,
  getFollowUpPrompt,
  getOnboardingChecklistItems,
  resolvePersona,
} from "@/lib/onboarding";
import type {
  OnboardingArtistType,
  OnboardingTeamSize,
  OnboardingWorkLocation,
  WorkspaceSettings,
} from "@/types/models";

describe("resolvePersona", () => {
  const cases: Array<{
    artistType: OnboardingArtistType;
    workLocation: OnboardingWorkLocation;
    teamSize: OnboardingTeamSize;
    persona: string;
  }> = [
    { artistType: "hair_stylist", workLocation: "studio", teamSize: "solo", persona: "hair_stylist_solo" },
    { artistType: "hair_stylist", workLocation: "studio", teamSize: "small_team", persona: "hair_stylist_team" },
    { artistType: "nail_technician", workLocation: "studio", teamSize: "solo", persona: "nail_technician_solo" },
    { artistType: "nail_technician", workLocation: "studio", teamSize: "large_team", persona: "nail_technician_team" },
    { artistType: "makeup_artist", workLocation: "mobile", teamSize: "solo", persona: "makeup_artist_mobile" },
    { artistType: "makeup_artist", workLocation: "studio", teamSize: "solo", persona: "makeup_artist_studio" },
    { artistType: "lash_brow_artist", workLocation: "both", teamSize: "solo", persona: "lash_brow_artist" },
    { artistType: "esthetician_facialist", workLocation: "studio", teamSize: "solo", persona: "esthetician_facialist" },
    { artistType: "barber", workLocation: "studio", teamSize: "solo", persona: "barber_solo" },
    { artistType: "barber", workLocation: "studio", teamSize: "small_team", persona: "barber_team" },
    { artistType: "massage_therapist", workLocation: "studio", teamSize: "solo", persona: "massage_therapist_studio" },
    { artistType: "massage_therapist", workLocation: "both", teamSize: "solo", persona: "massage_therapist_mobile" },
    { artistType: "tattoo_artist", workLocation: "studio", teamSize: "solo", persona: "tattoo_artist" },
    { artistType: "spa_wellness", workLocation: "studio", teamSize: "small_team", persona: "spa_wellness" },
  ];

  it("maps the locked persona variants correctly", () => {
    for (const testCase of cases) {
      expect(resolvePersona(testCase.artistType, testCase.workLocation, testCase.teamSize)).toBe(testCase.persona);
    }
  });
});

describe("follow-up mapping", () => {
  it("exposes the five supported follow-up prompts", () => {
    expect(getFollowUpPrompt("depositPreference")).toBe("How much deposit do you usually take?");
    expect(getFollowUpPrompt("noShowFeePreference")).toBe("How much do you charge for no-shows?");
    expect(getFollowUpPrompt("travelFeePreference")).toBe("How do you charge for travel?");
    expect(getFollowUpPrompt("serviceAreaPreference")).toBe("How do you define your service area?");
    expect(getFollowUpPrompt("membershipPreference")).toBe("What kind of memberships?");
  });

  it("returns the expected option counts for each follow-up type", () => {
    expect(getFollowUpOptions("depositPreference")).toHaveLength(4);
    expect(getFollowUpOptions("noShowFeePreference")).toHaveLength(4);
    expect(getFollowUpOptions("travelFeePreference")).toHaveLength(3);
    expect(getFollowUpOptions("serviceAreaPreference")).toHaveLength(3);
    expect(getFollowUpOptions("membershipPreference")).toHaveLength(4);
  });
});

describe("activation mapping", () => {
  it("maps actions to features, add-ons, defaults, services, and automations", () => {
    const activation = buildOnboardingActivation({
      artistType: "makeup_artist",
      workLocation: "mobile",
      teamSize: "solo",
      bookingChannels: ["email", "phone_text"],
      paymentMethods: ["stripe"],
      selectedActions: [
        "proposals_addon",
        "travel_fee_calculation",
        "service_area",
        "deposit_requirements",
        "review_request_automation",
      ],
      followUps: {
        depositPreference: "50_percent",
        travelFeePreference: "per_km_rate",
        serviceAreaPreference: "specific_postcodes",
      },
    }, "ws-1");

    expect(activation.resolvedPersona).toBe("makeup_artist_mobile");
    expect(activation.enabledAddons).toContain("proposals");
    expect(activation.enabledFeatures).toEqual(expect.arrayContaining(["travel-fee", "service-area", "deposits", "review-request-automation"]));
    expect(activation.settingsUpdate.depositPercentage).toBe(50);
    expect(activation.settingsUpdate.travelFeeMode).toBe("per_km");
    expect(activation.settingsUpdate.serviceAreaMode).toBe("postcodes");
    expect(activation.settingsUpdate.notificationDefaults).toBe("both");
    expect(activation.automationTypesToEnable).toContain("review_request");
    expect(activation.services.every((service) => service.locationType === "mobile")).toBe(true);
  });

  it("builds checklist items from onboarding answers", () => {
    const settings: WorkspaceSettings = {
      workspaceId: "ws-1",
      businessName: "Glow Studio",
      stripeOnboardingComplete: false,
      workingHours: {},
      cancellationWindowHours: 24,
      depositPercentage: 0,
      noShowFee: 0,
      messageTemplates: {},
      notificationDefaults: "email",
      branding: {},
      calendarSyncEnabled: false,
      minNoticeHours: 4,
      maxAdvanceDays: 56,
      autoReplyEnabled: false,
      enabledAddons: ["memberships", "documents"],
      enabledFeatures: ["deposits", "card-on-file", "questionnaire"],
      artistType: "spa_wellness",
      workLocation: "studio",
      teamSize: "small_team",
      bookingChannels: [],
      paymentMethods: ["stripe"],
      resolvedPersona: "spa_wellness",
      selectedOnboardingActions: [
        "deposit_requirements",
        "card_on_file_no_show_fee",
        "pre_appointment_questionnaire",
        "memberships_addon",
        "documents_addon",
      ],
      onboardingFollowUps: {
        depositPreference: "set_later",
        noShowFeePreference: "decide_later",
      },
      updatedAt: new Date().toISOString(),
    };

    const items = getOnboardingChecklistItems(settings);
    expect(items.map((item) => item.id)).toEqual(expect.arrayContaining([
      "connect-stripe",
      "finish-deposit-rules",
      "set-no-show-fee",
      "create-questionnaire",
      "invite-team",
      "create-membership",
      "create-document-template",
    ]));
  });
});
