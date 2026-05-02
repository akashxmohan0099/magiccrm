import { describe, it, expect } from "vitest";
import { mapPublicServiceFromDB } from "../services";

const fullRow: Record<string, unknown> = {
  id: "svc-1",
  name: "Lash extensions",
  description: "A relaxing 90-minute service.",
  image_url: "https://cdn.example.com/svc-1.jpg",
  duration: 90,
  price: 180,
  category: "Lashes",
  price_type: "tiered",
  variants: [{ id: "v1", name: "Classic" }],
  price_tiers: [{ id: "t1", name: "Senior" }],
  addons: [{ id: "a1", name: "Eye mask" }],
  addon_groups: [{ id: "g1", name: "Lash style", minSelect: 1 }],
  deposit_type: "fixed",
  deposit_amount: 50,
  requires_card_on_file: true,
  requires_patch_test: true,
  patch_test_validity_days: 30,
  patch_test_min_lead_hours: 48,
  intake_questions: [{ id: "q1", label: "Allergies?" }],
  allow_group_booking: true,
  max_group_size: 4,
  rebook_after_days: 21,
  location_ids: ["loc-1", "loc-2"],
  available_weekdays: [1, 2, 3, 4, 5],
  featured: true,
  promo_label: "Spring special",
  promo_price: 149,
  promo_start: "2026-09-01",
  promo_end: "2026-09-30",
  tags: ["popular", "new"],
  // Server-only fields the mapper must DROP:
  cancellation_fee: 25,
  cancellation_window_hours: 24,
  deposit_no_show_fee: 50,
  deposit_auto_cancel_hours: 12,
  deposit_applies_to: "new",
  dynamic_price_rules: [{ id: "r1" }],
  is_package: true,
  package_items: [{ serviceId: "svc-2" }],
  category_id: "cat-internal-uuid",
  workspace_id: "ws-1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
  buffer_before: 5,
  buffer_after: 10,
  buffer_minutes: 5,
};

describe("mapPublicServiceFromDB", () => {
  it("surfaces all customer-visible fields", () => {
    const out = mapPublicServiceFromDB(fullRow);
    expect(out).toMatchObject({
      id: "svc-1",
      name: "Lash extensions",
      description: "A relaxing 90-minute service.",
      imageUrl: "https://cdn.example.com/svc-1.jpg",
      duration: 90,
      price: 180,
      category: "Lashes",
      priceType: "tiered",
      depositType: "fixed",
      depositAmount: 50,
      requiresCardOnFile: true,
      requiresPatchTest: true,
      patchTestValidityDays: 30,
      patchTestMinLeadHours: 48,
      allowGroupBooking: true,
      maxGroupSize: 4,
      rebookAfterDays: 21,
      locationIds: ["loc-1", "loc-2"],
      availableWeekdays: [1, 2, 3, 4, 5],
      featured: true,
      promoLabel: "Spring special",
      promoPrice: 149,
      promoStart: "2026-09-01",
      promoEnd: "2026-09-30",
      tags: ["popular", "new"],
    });
    expect(out.variants).toEqual([{ id: "v1", name: "Classic" }]);
    expect(out.priceTiers).toEqual([{ id: "t1", name: "Senior" }]);
    expect(out.addons).toEqual([{ id: "a1", name: "Eye mask" }]);
    expect(out.addonGroups).toEqual([{ id: "g1", name: "Lash style", minSelect: 1 }]);
    expect(out.intakeQuestions).toEqual([{ id: "q1", label: "Allergies?" }]);
  });

  it("drops server-only fields", () => {
    const out = mapPublicServiceFromDB(fullRow) as Record<string, unknown>;

    // Internal scheduling + workspace metadata that the public has no
    // business seeing.
    expect(out).not.toHaveProperty("dynamicPriceRules");
    // packageItems is the snake_case row column; the public shape exposes
    // resolved `packageInclusions` (populated by the route, not the mapper).
    expect(out).not.toHaveProperty("packageItems");
    expect(out).not.toHaveProperty("categoryId");
    expect(out).not.toHaveProperty("workspaceId");
    expect(out).not.toHaveProperty("createdAt");
    expect(out).not.toHaveProperty("updatedAt");
    expect(out).not.toHaveProperty("bufferBefore");
    expect(out).not.toHaveProperty("bufferAfter");
    expect(out).not.toHaveProperty("bufferMinutes");

    // Note: deposit / cancellation fee fields ARE included on PublicService
    // by design — the customer needs to see no-show fees, auto-cancel
    // windows, and cancellation penalties BEFORE they agree to book. See
    // the comments on the interface in lib/db/services.ts.
  });

  it("normalizes nullable / missing fields to safe defaults", () => {
    const minimalRow = {
      id: "svc-2",
      name: "Mini service",
      duration: 30,
      price: 50,
    };
    const out = mapPublicServiceFromDB(minimalRow);
    expect(out).toMatchObject({
      description: "",
      imageUrl: "",
      category: "",
      priceType: "fixed",
      variants: [],
      priceTiers: [],
      addons: [],
      addonGroups: [],
      depositType: "none",
      depositAmount: 0,
      requiresCardOnFile: false,
      requiresPatchTest: false,
      allowGroupBooking: false,
      featured: false,
      promoLabel: "",
      locationIds: [],
      tags: [],
    });
    expect(out.maxGroupSize).toBeUndefined();
    expect(out.rebookAfterDays).toBeUndefined();
    expect(out.availableWeekdays).toBeUndefined();
    expect(out.promoPrice).toBeUndefined();
    expect(out.promoStart).toBeUndefined();
    expect(out.promoEnd).toBeUndefined();
    expect(out.patchTestValidityDays).toBeUndefined();
    expect(out.patchTestMinLeadHours).toBeUndefined();
  });

  it("treats explicit null on numeric fields as undefined, not 0", () => {
    const out = mapPublicServiceFromDB({
      id: "svc-3",
      name: "Test",
      duration: 60,
      price: 100,
      max_group_size: null,
      rebook_after_days: null,
      promo_price: null,
      patch_test_validity_days: null,
      patch_test_min_lead_hours: null,
    });
    expect(out.maxGroupSize).toBeUndefined();
    expect(out.rebookAfterDays).toBeUndefined();
    expect(out.promoPrice).toBeUndefined();
    expect(out.patchTestValidityDays).toBeUndefined();
    expect(out.patchTestMinLeadHours).toBeUndefined();
  });
});
