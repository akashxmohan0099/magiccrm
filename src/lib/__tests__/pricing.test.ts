import { describe, it, expect } from "vitest";
import { PRICING_TIERS, getTier, getStripePriceId } from "../pricing";

describe("pricing", () => {
  it("defines exactly 3 tiers", () => {
    expect(PRICING_TIERS).toHaveLength(3);
  });

  it("has starter at $29, growth at $59, scale at $99", () => {
    expect(getTier("starter")?.price).toBe(29);
    expect(getTier("growth")?.price).toBe(59);
    expect(getTier("scale")?.price).toBe(99);
  });

  it("yearly prices are lower than monthly", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.priceYearly).toBeLessThan(tier.price);
    }
  });

  it("only growth is highlighted", () => {
    expect(getTier("starter")?.highlighted).toBeFalsy();
    expect(getTier("growth")?.highlighted).toBe(true);
    expect(getTier("scale")?.highlighted).toBeFalsy();
  });

  it("getTier returns undefined for invalid ID", () => {
    expect(getTier("nonexistent")).toBeUndefined();
  });

  it("getStripePriceId returns null when env vars are empty", () => {
    // In test env, NEXT_PUBLIC_STRIPE_PRICE_* are not set
    expect(getStripePriceId("starter", "monthly")).toBeNull();
    expect(getStripePriceId("growth", "yearly")).toBeNull();
  });

  it("getStripePriceId returns null for invalid tier", () => {
    expect(getStripePriceId("fake", "monthly")).toBeNull();
  });

  it("every tier has required fields", () => {
    for (const tier of PRICING_TIERS) {
      expect(tier.id).toBeTruthy();
      expect(tier.name).toBeTruthy();
      expect(tier.description).toBeTruthy();
      expect(tier.cta).toBeTruthy();
      expect(tier.features.length).toBeGreaterThan(0);
      expect(tier.price).toBeGreaterThan(0);
      expect(tier.priceYearly).toBeGreaterThan(0);
    }
  });
});
