import { describe, it, expect } from "vitest";
import {
  getFeatureOverrides,
  getRelatedFeatures,
} from "@/lib/feature-dedup";

describe("getFeatureOverrides", () => {
  it("returns empty overrides when no modules are enabled", () => {
    const result = getFeatureOverrides([], []);
    expect(result).toEqual({});
  });

  it("returns empty overrides when only a single module is enabled (no overlap)", () => {
    const result = getFeatureOverrides(["leads-pipeline"], []);
    expect(result).toEqual({});
  });

  // ── Individual rule tests ──

  it("rule 1: leads + clients → hides client-source-tracking in client-database", () => {
    const result = getFeatureOverrides(["leads-pipeline", "client-database"], []);
    expect(result["client-database:client-source-tracking"]).toBeDefined();
    expect(result["client-database:client-source-tracking"].featureId).toBe("client-source-tracking");
    expect(result["client-database:client-source-tracking"].inModule).toBe("client-database");
    expect(result["client-database:client-source-tracking"].managedBy).toBe("Leads");
  });

  it("rule 2: marketing + clients → hides client-referral-tracking in client-database", () => {
    const result = getFeatureOverrides(["marketing", "client-database"], []);
    expect(result["client-database:client-referral-tracking"]).toBeDefined();
    expect(result["client-database:client-referral-tracking"].featureId).toBe("client-referral-tracking");
    expect(result["client-database:client-referral-tracking"].managedBy).toBe("Marketing");
  });

  it("rule 3: invoicing + payments → hides late-reminders in quotes-invoicing", () => {
    const result = getFeatureOverrides(["quotes-invoicing", "payments"], []);
    expect(result["quotes-invoicing:late-reminders"]).toBeDefined();
    expect(result["quotes-invoicing:late-reminders"].managedBy).toBe("Payments");
  });

  it("rule 4: communication + leads → hides auto-response in leads-pipeline", () => {
    const result = getFeatureOverrides(["communication", "leads-pipeline"], []);
    expect(result["leads-pipeline:auto-response"]).toBeDefined();
    expect(result["leads-pipeline:auto-response"].managedBy).toBe("Messages");
  });

  it("rule 5: communication + clients → hides contact-timeline in communication", () => {
    const result = getFeatureOverrides(["communication", "client-database"], []);
    expect(result["communication:contact-timeline"]).toBeDefined();
    expect(result["communication:contact-timeline"].managedBy).toBe("Clients");
  });

  it("rule 6: marketing + clients → hides audience-segmentation in marketing", () => {
    const result = getFeatureOverrides(["marketing", "client-database"], []);
    expect(result["marketing:audience-segmentation"]).toBeDefined();
    expect(result["marketing:audience-segmentation"].managedBy).toBe("Clients");
  });

  it("rule 7: bookings + support → hides post-appointment-followup in bookings-calendar", () => {
    const result = getFeatureOverrides(["bookings-calendar", "support"], []);
    expect(result["bookings-calendar:post-appointment-followup"]).toBeDefined();
    expect(result["bookings-calendar:post-appointment-followup"].managedBy).toBe("Support");
  });

  it("rule 8: jobs + documents → hides file-attachments in jobs-projects", () => {
    const result = getFeatureOverrides(["jobs-projects", "documents"], []);
    expect(result["jobs-projects:file-attachments"]).toBeDefined();
    expect(result["jobs-projects:file-attachments"].managedBy).toBe("Documents");
  });

  it("rule 9: support + communication → hides auto-responses in support", () => {
    const result = getFeatureOverrides(["support", "communication"], []);
    expect(result["support:auto-responses"]).toBeDefined();
    expect(result["support:auto-responses"].managedBy).toBe("Messages");
  });

  // ── Partial-module tests (rules should NOT fire) ──

  it("does not fire rule 1 when only leads-pipeline is enabled (missing client-database)", () => {
    const result = getFeatureOverrides(["leads-pipeline"], []);
    expect(result["client-database:client-source-tracking"]).toBeUndefined();
  });

  it("does not fire rule 3 when only payments is enabled (missing quotes-invoicing)", () => {
    const result = getFeatureOverrides(["payments"], []);
    expect(result["quotes-invoicing:late-reminders"]).toBeUndefined();
  });

  it("does not fire rule 7 when only support is enabled (missing bookings-calendar)", () => {
    const result = getFeatureOverrides(["support"], []);
    expect(result["bookings-calendar:post-appointment-followup"]).toBeUndefined();
  });

  // ── Multiple rules firing simultaneously ──

  it("fires multiple rules when many overlapping modules are enabled", () => {
    const result = getFeatureOverrides(
      ["marketing", "client-database", "communication", "leads-pipeline"],
      []
    );

    // marketing + client-database → two overrides
    expect(result["client-database:client-referral-tracking"]).toBeDefined();
    expect(result["marketing:audience-segmentation"]).toBeDefined();

    // communication + leads-pipeline
    expect(result["leads-pipeline:auto-response"]).toBeDefined();

    // communication + client-database
    expect(result["communication:contact-timeline"]).toBeDefined();
  });

  // ── Override key format ──

  it("uses the format 'module:featureId' for all override keys", () => {
    const result = getFeatureOverrides(
      ["leads-pipeline", "client-database", "support", "communication"],
      ["client-portal"]
    );

    for (const key of Object.keys(result)) {
      expect(key).toMatch(/^[a-z-]+:[a-z-]+$/);
      const [mod, feat] = key.split(":");
      expect(result[key].inModule).toBe(mod);
      expect(result[key].featureId).toBe(feat);
    }
  });

  // ── Addon rules ──

  it("addon: client-portal → hides client-invoice-portal in quotes-invoicing", () => {
    const result = getFeatureOverrides([], ["client-portal"]);
    expect(result["quotes-invoicing:client-invoice-portal"]).toBeDefined();
    expect(result["quotes-invoicing:client-invoice-portal"].managedBy).toBe("Client Portal");
  });

  it("addon: intake-forms → hides pre-booking-form in bookings-calendar", () => {
    const result = getFeatureOverrides([], ["intake-forms"]);
    expect(result["bookings-calendar:pre-booking-form"]).toBeDefined();
    expect(result["bookings-calendar:pre-booking-form"].managedBy).toBe("Forms");
  });

  it("addon rules fire independently of module rules", () => {
    // Addon-only: no modules needed
    const addonOnly = getFeatureOverrides([], ["client-portal", "intake-forms"]);
    expect(Object.keys(addonOnly)).toHaveLength(2);
    expect(addonOnly["quotes-invoicing:client-invoice-portal"]).toBeDefined();
    expect(addonOnly["bookings-calendar:pre-booking-form"]).toBeDefined();

    // With modules too — addon overrides still present alongside module overrides
    const combined = getFeatureOverrides(
      ["leads-pipeline", "client-database"],
      ["client-portal"]
    );
    expect(combined["quotes-invoicing:client-invoice-portal"]).toBeDefined();
    expect(combined["client-database:client-source-tracking"]).toBeDefined();
  });

  it("addon rules don't fire for unrecognized addon IDs", () => {
    const result = getFeatureOverrides([], ["unknown-addon"]);
    expect(result).toEqual({});
  });
});

describe("getRelatedFeatures", () => {
  it("returns empty array for an unknown module", () => {
    const result = getRelatedFeatures("nonexistent-module", ["client-database"]);
    expect(result).toEqual([]);
  });

  it("returns empty array when the source modules are not enabled", () => {
    // Communication's related features live in client-database, leads-pipeline, support, bookings-calendar
    // If none are enabled, nothing is returned
    const result = getRelatedFeatures("communication", []);
    expect(result).toEqual([]);
  });

  it("only returns features whose source module is enabled", () => {
    // Communication related features: client-database, leads-pipeline, support, bookings-calendar
    const result = getRelatedFeatures("communication", ["client-database"]);
    expect(result).toHaveLength(1);
    expect(result[0].featureId).toBe("follow-up-reminders");
    expect(result[0].livesIn).toBe("client-database");
  });

  it("returns all related features when all source modules are enabled", () => {
    const result = getRelatedFeatures("communication", [
      "client-database",
      "leads-pipeline",
      "support",
      "bookings-calendar",
    ]);
    expect(result).toHaveLength(4);
  });

  // ── Related features for each module in the map ──

  it("returns related features for client-database", () => {
    const result = getRelatedFeatures("client-database", ["leads-pipeline", "communication"]);
    expect(result.length).toBeGreaterThanOrEqual(2);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("lead-to-client");
    expect(featureIds).toContain("bulk-messaging");
  });

  it("returns related features for leads-pipeline", () => {
    const result = getRelatedFeatures("leads-pipeline", ["communication", "client-database"]);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("canned-responses");
    expect(featureIds).toContain("follow-up-reminders");
  });

  it("returns related features for bookings-calendar", () => {
    const result = getRelatedFeatures("bookings-calendar", ["quotes-invoicing", "support"]);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("partial-payments");
    expect(featureIds).toContain("satisfaction-ratings");
  });

  it("returns related features for quotes-invoicing", () => {
    const result = getRelatedFeatures("quotes-invoicing", ["jobs-projects", "payments"]);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("job-to-invoice");
    expect(featureIds).toContain("payment-method-tracking");
  });

  it("returns related features for jobs-projects", () => {
    const result = getRelatedFeatures("jobs-projects", ["documents"]);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("auto-attach-to-job");
    expect(featureIds).toContain("e-signatures");
  });

  it("returns related features for support", () => {
    const result = getRelatedFeatures("support", ["communication"]);
    const featureIds = result.map((r) => r.featureId);
    expect(featureIds).toContain("after-hours-reply");
    expect(featureIds).toContain("canned-responses");
  });

  it("returns related features for marketing", () => {
    const result = getRelatedFeatures("marketing", ["client-database"]);
    expect(result).toHaveLength(1);
    expect(result[0].featureId).toBe("client-tags");
  });

  it("returns related features for documents", () => {
    const result = getRelatedFeatures("documents", ["jobs-projects"]);
    expect(result).toHaveLength(1);
    expect(result[0].featureId).toBe("file-attachments");
  });

  it("returns related features for payments", () => {
    const result = getRelatedFeatures("payments", ["quotes-invoicing"]);
    expect(result).toHaveLength(1);
    expect(result[0].featureId).toBe("late-reminders");
  });
});
