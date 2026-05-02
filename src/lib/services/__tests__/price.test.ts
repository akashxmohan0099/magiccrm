import { describe, it, expect } from "vitest";
import {
  resolvePrice,
  minPrice,
  resolveDuration,
  maxDuration,
  resolveBuffer,
  isFromPriced,
  isPromoActive,
  displayPrice,
} from "../price";
import type { Service } from "@/types/models";

/**
 * resolvePrice / resolveDuration are the single source of truth for what
 * a customer pays and how long the chair is occupied. Cart, menu, booking
 * confirmation, and the slot generator all depend on these. A regression
 * here misprices every booking — highest-value test target outside of RLS.
 */
const baseService = (overrides: Partial<Service> = {}): Service => ({
  id: "svc-1",
  workspaceId: "ws-1",
  name: "Cut & blow dry",
  description: "",
  duration: 60,
  price: 80,
  category: "Hair",
  enabled: true,
  sortOrder: 0,
  bufferMinutes: 0,
  requiresConfirmation: false,
  depositType: "none",
  depositAmount: 0,
  locationType: "studio",
  createdAt: "x",
  updatedAt: "x",
  ...overrides,
});

describe("resolvePrice", () => {
  it("falls back to service.price with no overrides", () => {
    expect(resolvePrice(baseService())).toBe(80);
  });

  it("memberPriceOverride wins over everything", () => {
    const svc = baseService({
      priceType: "tiered",
      priceTiers: [{ id: "t1", name: "Sr", price: 120, memberIds: ["m1"], sortOrder: 0 }],
    });
    expect(
      resolvePrice(svc, { memberId: "m1", memberPriceOverride: 200 }),
    ).toBe(200);
  });

  it("variant price wins over service.price when variantId matches", () => {
    const svc = baseService({
      priceType: "variants",
      variants: [
        { id: "v-short", name: "Short", price: 80, duration: 60, sortOrder: 0 },
        { id: "v-long", name: "Long", price: 130, duration: 90, sortOrder: 1 },
      ],
    });
    expect(resolvePrice(svc, { variantId: "v-long" })).toBe(130);
  });

  it("tier price wins when memberId is in a tier", () => {
    const svc = baseService({
      priceType: "tiered",
      priceTiers: [
        { id: "t-jr", name: "Jr", price: 60, memberIds: ["jr-1"], sortOrder: 0 },
        { id: "t-sr", name: "Sr", price: 120, memberIds: ["sr-1"], sortOrder: 1 },
      ],
    });
    expect(resolvePrice(svc, { memberId: "jr-1" })).toBe(60);
    expect(resolvePrice(svc, { memberId: "sr-1" })).toBe(120);
  });

  it("falls back to service.price when memberId isn't in any tier", () => {
    const svc = baseService({
      priceType: "tiered",
      priceTiers: [{ id: "t-sr", name: "Sr", price: 120, memberIds: ["sr-1"], sortOrder: 0 }],
    });
    expect(resolvePrice(svc, { memberId: "stranger" })).toBe(80);
  });

  it("applies a percent dynamic-pricing rule when startAt matches the window", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r1",
          label: "Off-peak Tuesday",
          weekdays: [2], // Tuesday
          startTime: "09:00",
          endTime: "12:00",
          modifierType: "percent",
          modifierValue: -20, // 20% off
        },
      ],
    });
    // Tuesday 2026-05-05 at 10:00 local
    const tuesday10am = new Date(2026, 4, 5, 10, 0);
    expect(resolvePrice(svc, { startAt: tuesday10am })).toBe(64); // 80 - 20% = 64
  });

  it("never goes negative even with absurd discounts", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r1",
          label: "Crazy",
          weekdays: [],
          startTime: "00:00",
          endTime: "23:59",
          modifierType: "percent",
          modifierValue: -200,
        },
      ],
    });
    expect(resolvePrice(svc, { startAt: new Date(2026, 4, 5, 10, 0) })).toBe(0);
  });
});

describe("minPrice", () => {
  it("returns service.price when no variants/tiers/overrides", () => {
    expect(minPrice(baseService())).toBe(80);
  });

  it("picks the cheapest variant when priceType=variants", () => {
    const svc = baseService({
      priceType: "variants",
      variants: [
        { id: "a", name: "A", price: 100, duration: 60, sortOrder: 0 },
        { id: "b", name: "B", price: 50, duration: 60, sortOrder: 1 },
      ],
    });
    expect(minPrice(svc)).toBe(50);
  });

  it("considers per-staff overrides", () => {
    expect(minPrice(baseService(), { memberOverrides: [40, 200, 80] })).toBe(40);
  });
});

describe("resolveDuration", () => {
  it("falls back to service.duration", () => {
    expect(resolveDuration(baseService())).toBe(60);
  });

  it("memberDurationOverride wins (when > 0)", () => {
    expect(
      resolveDuration(baseService(), { memberDurationOverride: 90 }),
    ).toBe(90);
  });

  it("ignores memberDurationOverride when 0", () => {
    // 0 means "no override" — the operator clearing the field shouldn't
    // collapse the booking to a zero-minute slot.
    expect(resolveDuration(baseService(), { memberDurationOverride: 0 })).toBe(60);
  });

  it("variant duration when variantId matches", () => {
    const svc = baseService({
      priceType: "variants",
      variants: [{ id: "v1", name: "Long", price: 100, duration: 120, sortOrder: 0 }],
    });
    expect(resolveDuration(svc, { variantId: "v1" })).toBe(120);
  });

  it("sums split durations when set", () => {
    const svc = baseService({
      duration: 0,
      durationActiveBefore: 30,
      durationProcessing: 60,
      durationActiveAfter: 30,
    });
    expect(resolveDuration(svc)).toBe(120);
  });
});

describe("maxDuration", () => {
  it("returns the longest possible duration across variants/tiers", () => {
    const svc = baseService({
      priceType: "variants",
      variants: [
        { id: "v1", name: "S", price: 80, duration: 60, sortOrder: 0 },
        { id: "v2", name: "L", price: 130, duration: 120, sortOrder: 1 },
      ],
    });
    expect(maxDuration(svc)).toBe(120);
  });
});

describe("resolveBuffer", () => {
  it("prefers explicit before/after over legacy bufferMinutes", () => {
    const svc = baseService({ bufferBefore: 5, bufferAfter: 15, bufferMinutes: 60 });
    expect(resolveBuffer(svc)).toEqual({ before: 5, after: 15 });
  });

  it("falls back to bufferMinutes as 'after' (cleanup window)", () => {
    const svc = baseService({ bufferMinutes: 10 });
    expect(resolveBuffer(svc)).toEqual({ before: 0, after: 10 });
  });
});

describe("isFromPriced", () => {
  it("true for from / variants-with-data / tiered-with-data", () => {
    expect(isFromPriced(baseService({ priceType: "from" }))).toBe(true);
    expect(
      isFromPriced(baseService({
        priceType: "variants",
        variants: [{ id: "v", name: "x", price: 1, duration: 1, sortOrder: 0 }],
      })),
    ).toBe(true);
  });

  it("false for fixed and empty variants/tiers", () => {
    expect(isFromPriced(baseService({ priceType: "fixed" }))).toBe(false);
    expect(isFromPriced(baseService({ priceType: "variants", variants: [] }))).toBe(false);
  });
});

describe("isPromoActive", () => {
  it("true with no date range (always-on)", () => {
    expect(isPromoActive(baseService())).toBe(true);
  });

  it("true within range, false outside", () => {
    const svc = baseService({ promoStart: "2026-05-01", promoEnd: "2026-05-31" });
    expect(isPromoActive(svc, new Date("2026-05-15T10:00:00Z"))).toBe(true);
    expect(isPromoActive(svc, new Date("2026-06-01T10:00:00Z"))).toBe(false);
    expect(isPromoActive(svc, new Date("2026-04-30T10:00:00Z"))).toBe(false);
  });
});

describe("displayPrice", () => {
  it("returns promo price + struck-through when promo is active and lower", () => {
    const svc = baseService({ promoPrice: 60 });
    expect(displayPrice(svc)).toEqual({ price: 60, struckThrough: 80 });
  });

  it("returns base price when promo is higher than base", () => {
    const svc = baseService({ promoPrice: 100 });
    expect(displayPrice(svc).price).toBe(80);
    expect(displayPrice(svc).struckThrough).toBeUndefined();
  });
});
