import { describe, it, expect } from "vitest";
import { checkPatchTest } from "../patch-test";
import type { Client, Service } from "@/types/models";

/**
 * Patch-test gate is the legal-safety guardrail for color/lash work. A
 * regression here either lets through bookings that should be blocked
 * (liability) or blocks legitimate ones (lost revenue + bad UX). Worth
 * exercising every branch.
 */
const svc = (overrides: Partial<Service> = {}): Pick<Service,
  "requiresPatchTest" | "patchTestValidityDays" | "patchTestMinLeadHours" | "patchTestCategory"
> => ({
  requiresPatchTest: true,
  patchTestValidityDays: 180,
  patchTestMinLeadHours: 48,
  patchTestCategory: "color",
  ...overrides,
});

const cli = (patchTests: NonNullable<Client["patchTests"]> = []):
  Pick<Client, "patchTests"> => ({ patchTests });

describe("checkPatchTest", () => {
  it("returns required:false when service doesn't require one", () => {
    const r = checkPatchTest(svc({ requiresPatchTest: false }), cli(), new Date());
    expect(r).toEqual({ required: false, passes: true });
  });

  it("fails when client has no tests", () => {
    const r = checkPatchTest(svc(), null, new Date());
    expect(r.required).toBe(true);
    expect(r.passes).toBe(false);
    expect(r.reason).toMatch(/No color patch test/);
  });

  it("fails when client has tests but none match the category", () => {
    const r = checkPatchTest(
      svc({ patchTestCategory: "color" }),
      cli([{ category: "lash-glue", testedAt: "2026-01-01T00:00:00Z" }]),
      new Date("2026-06-01T10:00:00Z"),
    );
    expect(r.passes).toBe(false);
    expect(r.reason).toMatch(/color patch test/);
  });

  it("passes when a fresh in-category test exists with enough lead time", () => {
    const r = checkPatchTest(
      svc(),
      cli([{ category: "color", testedAt: "2026-05-01T00:00:00Z" }]),
      new Date("2026-05-15T10:00:00Z"), // 14 days later, well past 48h
    );
    expect(r.passes).toBe(true);
    expect(r.mostRecentDate).toBe("2026-05-01T00:00:00Z");
  });

  it("fails when the test is too recent (lead time not met)", () => {
    const r = checkPatchTest(
      svc({ patchTestMinLeadHours: 48 }),
      cli([{ category: "color", testedAt: "2026-05-15T08:00:00Z" }]),
      new Date("2026-05-15T18:00:00Z"), // only 10h ahead
    );
    expect(r.passes).toBe(false);
    expect(r.reason).toMatch(/at least 48h/);
  });

  it("fails when the test is past its validity window", () => {
    const r = checkPatchTest(
      svc({ patchTestValidityDays: 30 }),
      cli([{ category: "color", testedAt: "2026-01-01T00:00:00Z" }]),
      new Date("2026-06-01T10:00:00Z"), // 5 months later
    );
    expect(r.passes).toBe(false);
    expect(r.reason).toMatch(/expired/);
  });

  it("picks the most recent test when client has multiple", () => {
    const r = checkPatchTest(
      svc(),
      cli([
        { category: "color", testedAt: "2025-12-01T00:00:00Z" }, // older
        { category: "color", testedAt: "2026-04-01T00:00:00Z" }, // newer
      ]),
      new Date("2026-05-01T10:00:00Z"),
    );
    expect(r.passes).toBe(true);
    expect(r.mostRecentDate).toBe("2026-04-01T00:00:00Z");
  });

  it("treats missing category as 'any test counts'", () => {
    const r = checkPatchTest(
      svc({ patchTestCategory: undefined }),
      cli([{ category: "lash", testedAt: "2026-01-01T00:00:00Z" }]),
      new Date("2026-04-01T10:00:00Z"),
    );
    expect(r.passes).toBe(true);
  });
});
