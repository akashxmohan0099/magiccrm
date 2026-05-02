import { describe, it, expect } from "vitest";
import { mapWorkspaceSettingsFromDB } from "../settings";

describe("mapWorkspaceSettingsFromDB", () => {
  it("maps a fully populated settings row", () => {
    const row = {
      workspace_id: "ws-1",
      business_name: "Glow Studio",
      logo_url: "https://cdn/logo.png",
      contact_email: "hello@glow.com",
      contact_phone: "0412345678",
      address: "42 Palm Ave",
      stripe_account_id: "acct_123",
      stripe_onboarding_complete: true,
      working_hours: { mon: { start: "09:00", end: "18:00" } },
      cancellation_window_hours: 24,
      deposit_percentage: 20,
      no_show_fee: 50,
      message_templates: { booking_confirmation: "Hi {client_name}" },
      notification_defaults: "sms",
      branding: { primaryColor: "#8B5CF6", accentColor: "#EC4899" },
      booking_page_slug: "glow-studio",
      currency: "AUD",
      locale: "en-AU",
      calendar_sync_enabled: true,
      min_notice_hours: 4,
      max_advance_days: 56,
      auto_reply_enabled: true,
      artist_type: "hair",
      work_location: "studio",
      team_size: "small",
      booking_channels: ["website", "instagram"],
      payment_methods: ["card", "cash"],
      resolved_persona: "hair-salon",
      selected_onboarding_actions: ["import-clients"],
      onboarding_follow_ups: { reviewedHours: true },
      enabled_addons: ["marketing", "loyalty"],
      enabled_features: ["resources"],
      updated_at: "2026-05-01T00:00:00Z",
    };

    const s = mapWorkspaceSettingsFromDB(row);

    expect(s).toMatchObject({
      workspaceId: "ws-1",
      businessName: "Glow Studio",
      logoUrl: "https://cdn/logo.png",
      contactEmail: "hello@glow.com",
      stripeOnboardingComplete: true,
      cancellationWindowHours: 24,
      depositPercentage: 20,
      noShowFee: 50,
      notificationDefaults: "sms",
      bookingPageSlug: "glow-studio",
      currency: "AUD",
      calendarSyncEnabled: true,
      minNoticeHours: 4,
      maxAdvanceDays: 56,
      autoReplyEnabled: true,
      artistType: "hair",
    });
    expect(s.workingHours.mon).toEqual({ start: "09:00", end: "18:00" });
    expect(s.messageTemplates.booking_confirmation).toBe("Hi {client_name}");
    expect(s.bookingChannels).toEqual(["website", "instagram"]);
    expect(s.enabledAddons).toEqual(["marketing", "loyalty"]);
  });

  it("applies defaults that the dashboard depends on", () => {
    // The dashboard reads many of these on first paint; null/undefined
    // would crash setting toggles or block onboarding.
    const s = mapWorkspaceSettingsFromDB({
      workspace_id: "ws-2",
      updated_at: "x",
    });

    expect(s.workingHours).toEqual({});
    expect(s.cancellationWindowHours).toBe(0);
    expect(s.depositPercentage).toBe(0);
    expect(s.noShowFee).toBe(0);
    expect(s.messageTemplates).toEqual({});
    expect(s.notificationDefaults).toBe("email");
    expect(s.branding).toEqual({});
    expect(s.calendarSyncEnabled).toBe(false);
    expect(s.minNoticeHours).toBe(4);
    expect(s.maxAdvanceDays).toBe(56);
    expect(s.autoReplyEnabled).toBe(false);
    expect(s.bookingChannels).toEqual([]);
    expect(s.paymentMethods).toEqual([]);
    expect(s.selectedOnboardingActions).toEqual([]);
    expect(s.onboardingFollowUps).toEqual({});
    expect(s.enabledAddons).toEqual([]);
    expect(s.enabledFeatures).toEqual([]);
  });
});
