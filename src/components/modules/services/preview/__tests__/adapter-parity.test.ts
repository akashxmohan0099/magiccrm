import { describe, it, expect } from "vitest";
import {
  serviceToPublic,
  workingHoursToAvailability,
  buildMemberServiceMap,
  memberToPublic,
  locationToPublic,
} from "../adapter";
import { mapPublicServiceFromDB } from "@/lib/db/services";
import {
  computeLine,
  displayCardPrice,
  isPromoActive,
  lineDeposit,
} from "@/components/modules/bookings/public/helpers";
import type {
  Location,
  Service,
  ServiceCategory,
  TeamMember,
  WorkingHours,
} from "@/types/models";

/**
 * The dashboard preview mounts the SAME <PublicBookingFlow> the live
 * `/book/[slug]` page mounts. The only translation step is `serviceToPublic`,
 * which converts a frontend Service into the PublicService shape the public
 * API's mapper produces. If those two paths diverge — even one field — the
 * preview lies and the operator can't trust it.
 *
 * These tests pin the parity end-to-end: run the same logical service
 * through both paths, then assert the cart math, deposit math, promo
 * logic, and dynamic pricing produce the same answers.
 */

const baseService = (overrides: Partial<Service> = {}): Service => ({
  id: "svc",
  workspaceId: "ws",
  name: "Cut & blow dry",
  description: "Classic cut",
  duration: 60,
  price: 80,
  category: "Hair",
  enabled: true,
  sortOrder: 0,
  bufferMinutes: 0,
  requiresConfirmation: false,
  depositType: "none",
  depositAmount: 0,
  ...overrides,
});

/** Run the same service through both paths and check the resulting public
 *  shapes produce identical outputs from the helpers used by the flow. */
function bothPaths(svc: Service, dbRow: Record<string, unknown>) {
  const fromAdapter = serviceToPublic(svc, { categories: [], allServices: [svc] });
  const fromMapper = mapPublicServiceFromDB(dbRow);
  return { fromAdapter, fromMapper };
}

describe("adapter parity — pricing", () => {
  it("computeLine on a fixed-price service: adapter matches mapper", () => {
    const svc = baseService();
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      category: "Hair",
      price_type: "fixed",
    });
    const a = computeLine(fromAdapter, { addonIds: [] });
    const m = computeLine(fromMapper, { addonIds: [] });
    expect(a.price).toBe(m.price);
    expect(a.duration).toBe(m.duration);
  });

  it("computeLine on variants: same picked variant gives same price+duration", () => {
    const svc = baseService({
      priceType: "variants",
      variants: [
        { id: "v1", name: "Short", price: 60, duration: 45, sortOrder: 0 },
        { id: "v2", name: "Long", price: 110, duration: 90, sortOrder: 1 },
      ],
    });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "variants",
      variants: svc.variants,
    });
    const a = computeLine(fromAdapter, { variantId: "v2", addonIds: [] });
    const m = computeLine(fromMapper, { variantId: "v2", addonIds: [] });
    expect(a.price).toBe(m.price);
    expect(a.duration).toBe(m.duration);
  });

  it("computeLine on tiered: same picked tier gives same price+duration", () => {
    const svc = baseService({
      priceType: "tiered",
      priceTiers: [
        { id: "t1", name: "Junior", price: 60, memberIds: ["m1"], sortOrder: 0 },
        { id: "t2", name: "Senior", price: 120, duration: 50, memberIds: ["m2"], sortOrder: 1 },
      ],
    });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "tiered",
      price_tiers: svc.priceTiers,
    });
    const a = computeLine(fromAdapter, { tierId: "t2", addonIds: [] });
    const m = computeLine(fromMapper, { tierId: "t2", addonIds: [] });
    expect(a.price).toBe(m.price);
    expect(a.duration).toBe(m.duration);
  });

  it("computeLine with addons: addon prices stack identically", () => {
    const svc = baseService({
      addons: [
        { id: "a1", name: "Toner", price: 15, duration: 15, sortOrder: 0 },
        { id: "a2", name: "Mask", price: 10, duration: 0, sortOrder: 1 },
      ],
    });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "fixed",
      addons: svc.addons,
    });
    const a = computeLine(fromAdapter, { addonIds: ["a1", "a2"] });
    const m = computeLine(fromMapper, { addonIds: ["a1", "a2"] });
    expect(a.price).toBe(m.price);
    expect(a.duration).toBe(m.duration);
    expect(a.price).toBe(80 + 15 + 10);
    expect(a.duration).toBe(60 + 15);
  });

  it("computeLine applies dynamic pricing identically through both paths", () => {
    const friday5pm = "2026-05-08T17:30:00";
    const rules = [
      {
        id: "r",
        label: "Friday premium",
        weekdays: [5],
        startTime: "17:00",
        endTime: "20:00",
        modifierType: "percent" as const,
        modifierValue: 20,
      },
    ];
    const svc = baseService({ dynamicPriceRules: rules });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "fixed",
      dynamic_price_rules: rules,
    });
    const a = computeLine(fromAdapter, { addonIds: [], startAt: friday5pm });
    const m = computeLine(fromMapper, { addonIds: [], startAt: friday5pm });
    expect(a.price).toBe(m.price);
    expect(a.price).toBe(96);
  });
});

describe("adapter parity — promo + deposit", () => {
  it("isPromoActive: percent-only promo recognized in both paths", () => {
    const svc = baseService({ promoPercent: 25 });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "fixed",
      promo_percent: 25,
    });
    expect(isPromoActive(fromAdapter)).toBe(true);
    expect(isPromoActive(fromMapper)).toBe(true);
  });

  it("displayCardPrice: percent promo strikes-through identically", () => {
    const svc = baseService({ promoPercent: 25 });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "fixed",
      promo_percent: 25,
    });
    const a = displayCardPrice(fromAdapter);
    const m = displayCardPrice(fromMapper);
    expect(a.price).toBe(m.price);
    expect(a.struckThrough).toBe(m.struckThrough);
    expect(a.price).toBe(60);
    expect(a.struckThrough).toBe(80);
  });

  it("lineDeposit: percentage deposit math matches", () => {
    const svc = baseService({ depositType: "percentage", depositAmount: 30 });
    const { fromAdapter, fromMapper } = bothPaths(svc, {
      id: "svc",
      name: "Cut & blow dry",
      duration: 60,
      price: 80,
      price_type: "fixed",
      deposit_type: "percentage",
      deposit_amount: 30,
    });
    const a = lineDeposit(fromAdapter, 100);
    const m = lineDeposit(fromMapper, 100);
    expect(a).toBe(m);
    expect(a).toBe(30);
  });
});

describe("adapter parity — group + patch + location bookkeeping", () => {
  it("group booking flag and cap survive adapter round-trip", () => {
    const svc = baseService({ allowGroupBooking: true, maxGroupSize: 3 });
    const out = serviceToPublic(svc, { categories: [], allServices: [svc] });
    expect(out.allowGroupBooking).toBe(true);
    expect(out.maxGroupSize).toBe(3);
  });

  it("patch test fields survive adapter round-trip", () => {
    const svc = baseService({
      requiresPatchTest: true,
      patchTestValidityDays: 30,
      patchTestMinLeadHours: 48,
      patchTestCategory: "color",
    });
    const out = serviceToPublic(svc, { categories: [], allServices: [svc] });
    expect(out.requiresPatchTest).toBe(true);
    expect(out.patchTestValidityDays).toBe(30);
    expect(out.patchTestMinLeadHours).toBe(48);
    expect(out.patchTestCategory).toBe("color");
  });

  it("location ids survive adapter round-trip; empty defaults to []", () => {
    const restricted = serviceToPublic(
      baseService({ locationIds: ["loc-1"] }),
      { categories: [], allServices: [] },
    );
    expect(restricted.locationIds).toEqual(["loc-1"]);

    const allLocations = serviceToPublic(baseService(), {
      categories: [],
      allServices: [],
    });
    expect(allLocations.locationIds).toEqual([]);
  });

  it("category resolves through ServiceCategory rows; falls back to legacy free-text", () => {
    const cat: ServiceCategory = {
      id: "cat-1",
      workspaceId: "ws",
      name: "Hair Services",
      sortOrder: 0,
      createdAt: "x",
      updatedAt: "x",
    };
    const fromCategoryId = serviceToPublic(
      baseService({ categoryId: "cat-1", category: undefined }),
      { categories: [cat], allServices: [] },
    );
    expect(fromCategoryId.category).toBe("Hair Services");

    const fromLegacy = serviceToPublic(
      baseService({ category: "Lashes" }),
      { categories: [], allServices: [] },
    );
    expect(fromLegacy.category).toBe("Lashes");
  });

  it("isPackage resolves package inclusions with child service names", () => {
    const child = baseService({ id: "child", name: "Toner add-on" });
    const pkg = baseService({
      id: "pkg",
      isPackage: true,
      packageItems: [
        { id: "pi1", serviceId: "child", quantity: 2 },
      ],
    });
    const out = serviceToPublic(pkg, { categories: [], allServices: [pkg, child] });
    expect(out.isPackage).toBe(true);
    expect(out.packageInclusions).toEqual([
      {
        serviceId: "child",
        serviceName: "Toner add-on",
        variantId: undefined,
        variantName: undefined,
        quantity: 2,
      },
    ]);
  });
});

describe("adapter — availability + member service map", () => {
  it("workingHoursToAvailability emits 7 entries; missing days are disabled", () => {
    const wh: Record<string, WorkingHours> = {
      mon: { start: "09:00", end: "17:00" },
      wed: { start: "10:00", end: "18:00" },
    };
    const out = workingHoursToAvailability(wh);
    expect(out).toHaveLength(7);
    expect(out.find((s) => s.day === 1)).toMatchObject({
      day: 1,
      startTime: "09:00",
      endTime: "17:00",
      enabled: true,
    });
    expect(out.find((s) => s.day === 3)).toMatchObject({
      day: 3,
      startTime: "10:00",
      endTime: "18:00",
      enabled: true,
    });
    expect(out.find((s) => s.day === 0)?.enabled).toBe(false);
    expect(out.find((s) => s.day === 2)?.enabled).toBe(false);
  });

  it("buildMemberServiceMap mirrors the public API map shape", () => {
    const services = [baseService({ id: "s1" }), baseService({ id: "s2" })];
    const out = buildMemberServiceMap(services, (id) =>
      id === "s1" ? ["m1", "m2"] : id === "s2" ? [] : [],
    );
    expect(out).toEqual({ s1: ["m1", "m2"] });
    // s2 has empty assignments (Anyone) — must be ABSENT, mirroring the
    // public mapper which only writes entries for services with explicit
    // member rows.
    expect(out).not.toHaveProperty("s2");
  });
});

describe("adapter — member + location passthrough", () => {
  it("memberToPublic exposes only public fields", () => {
    const m: TeamMember = {
      id: "m1",
      authUserId: "auth-1",
      workspaceId: "ws",
      name: "Sara",
      email: "sara@example.com",
      role: "staff",
      avatarUrl: "https://x/a.png",
      bio: "Senior stylist",
      socialLinks: { instagram: "@sara" },
      status: "active",
      workingHours: {},
      daysOff: [],
      leavePeriods: [],
      createdAt: "x",
      updatedAt: "x",
    };
    expect(memberToPublic(m)).toEqual({
      id: "m1",
      name: "Sara",
      avatarUrl: "https://x/a.png",
      bio: "Senior stylist",
      socialLinks: { instagram: "@sara" },
      role: "staff",
    });
  });

  it("locationToPublic carries kind + address through", () => {
    const loc: Location = {
      id: "loc-1",
      workspaceId: "ws",
      name: "Main studio",
      address: "1 King St",
      kind: "studio",
      enabled: true,
      sortOrder: 0,
      createdAt: "x",
      updatedAt: "x",
    };
    expect(locationToPublic(loc)).toEqual({
      id: "loc-1",
      name: "Main studio",
      address: "1 King St",
      kind: "studio",
      sortOrder: 0,
    });
  });
});
