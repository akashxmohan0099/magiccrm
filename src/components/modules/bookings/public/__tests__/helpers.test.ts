import { describe, it, expect } from "vitest";
import { computeLine, displayCardPrice, isPromoActive, lineDeposit } from "../helpers";
import type { PublicService } from "../types";

/**
 * Parity checks: the public booking page's cart math must match what the
 * server's submit handler will charge. These tests guard the three places
 * the cart historically diverged from the server: dynamic pricing, percent
 * promos, and promo display when only `promoPercent` is set.
 */
const baseService = (overrides: Partial<PublicService> = {}): PublicService => ({
  id: "svc",
  name: "Cut & blow dry",
  description: "",
  imageUrl: "",
  duration: 60,
  price: 80,
  category: "Hair",
  priceType: "fixed",
  variants: [],
  priceTiers: [],
  addons: [],
  addonGroups: [],
  depositType: "none",
  depositAmount: 0,
  requiresCardOnFile: false,
  requiresPatchTest: false,
  intakeQuestions: [],
  allowGroupBooking: false,
  locationIds: [],
  featured: false,
  promoLabel: "",
  tags: [],
  isPackage: false,
  packageInclusions: [],
  ...overrides,
});

describe("computeLine — dynamic pricing", () => {
  const friday5pm = "2026-05-08T17:30:00";
  const tuesday10am = "2026-05-05T10:00:00";

  it("does not apply rules when startAt is null", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r",
          label: "Friday premium",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 20,
        },
      ],
    });
    expect(computeLine(svc, { addonIds: [], startAt: null }).price).toBe(80);
  });

  it("applies a matching percent rule when startAt is in the window", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r",
          label: "Friday premium",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 20,
        },
      ],
    });
    expect(computeLine(svc, { addonIds: [], startAt: friday5pm }).price).toBe(96);
  });

  it("ignores rules whose weekday doesn't match", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r",
          label: "Friday premium",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 20,
        },
      ],
    });
    expect(computeLine(svc, { addonIds: [], startAt: tuesday10am }).price).toBe(80);
  });

  it("addons add on top of the dynamic-adjusted base", () => {
    const svc = baseService({
      addons: [
        { id: "a", name: "Toner", price: 10, duration: 0, sortOrder: 0 },
      ],
      dynamicPriceRules: [
        {
          id: "r",
          label: "Friday premium",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 20,
        },
      ],
    });
    // 80 * 1.2 = 96 (dynamic), + 10 (addon, no modifier) = 106.
    expect(computeLine(svc, { addonIds: ["a"], startAt: friday5pm }).price).toBe(106);
  });

  it("first matching rule wins, never goes negative", () => {
    const svc = baseService({
      dynamicPriceRules: [
        {
          id: "r1",
          label: "Late discount",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "amount",
          modifierValue: -200, // larger than base
        },
        {
          id: "r2",
          label: "Surge",
          weekdays: [5],
          startTime: "17:00",
          endTime: "20:00",
          modifierType: "percent",
          modifierValue: 100,
        },
      ],
    });
    // First rule clamps to 0; second rule never evaluated.
    expect(computeLine(svc, { addonIds: [], startAt: friday5pm }).price).toBe(0);
  });
});

describe("isPromoActive — promoPercent support", () => {
  it("true when only promoPercent is set", () => {
    expect(isPromoActive(baseService({ promoPercent: 20 }))).toBe(true);
  });

  it("true when only promoPrice is set", () => {
    expect(isPromoActive(baseService({ promoPrice: 60 }))).toBe(true);
  });

  it("false when neither promoPrice nor promoPercent is set", () => {
    expect(isPromoActive(baseService())).toBe(false);
  });

  it("respects start/end window for percent promos too", () => {
    const svc = baseService({
      promoPercent: 20,
      promoStart: "2026-05-01",
      promoEnd: "2026-05-31",
    });
    expect(isPromoActive(svc, new Date("2026-05-15T10:00:00Z"))).toBe(true);
    expect(isPromoActive(svc, new Date("2026-06-01T10:00:00Z"))).toBe(false);
  });
});

describe("displayCardPrice — promoPercent support", () => {
  it("returns struckThrough + discounted price for promoPercent", () => {
    const svc = baseService({ promoPercent: 25 });
    const out = displayCardPrice(svc);
    expect(out.price).toBe(60);
    expect(out.struckThrough).toBe(80);
  });

  it("returns struckThrough + discounted price for promoPrice", () => {
    const svc = baseService({ promoPrice: 50 });
    const out = displayCardPrice(svc);
    expect(out.price).toBe(50);
    expect(out.struckThrough).toBe(80);
  });

  it("no struckThrough when no promo is set", () => {
    const out = displayCardPrice(baseService());
    expect(out.price).toBe(80);
    expect(out.struckThrough).toBeUndefined();
  });

  it("respects promo date window", () => {
    const svc = baseService({
      promoPercent: 20,
      promoStart: "2026-05-01",
      promoEnd: "2026-05-31",
    });
    expect(displayCardPrice(svc, new Date("2026-04-15")).struckThrough).toBeUndefined();
    expect(displayCardPrice(svc, new Date("2026-05-15")).struckThrough).toBe(80);
  });
});

describe("lineDeposit — sanity guards", () => {
  it("zero for none", () => {
    expect(lineDeposit(baseService(), 100)).toBe(0);
  });

  it("fixed amount returned regardless of price", () => {
    expect(lineDeposit(baseService({ depositType: "fixed", depositAmount: 25 }), 100)).toBe(25);
  });

  it("percentage scales with price", () => {
    expect(lineDeposit(baseService({ depositType: "percentage", depositAmount: 20 }), 100)).toBe(20);
  });
});
