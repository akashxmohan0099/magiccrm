import { describe, it, expect } from "vitest";
import { STARTER_MENUS } from "../starter-menus";

/**
 * STARTER_MENUS is data, not logic — but it's data the onboarding flow
 * depends on. Validate the shape so a typo in pricing or a missing
 * category doesn't break onboarding silently.
 */
describe("STARTER_MENUS", () => {
  it("has at least one persona", () => {
    expect(STARTER_MENUS.length).toBeGreaterThan(0);
  });

  it("each menu has a unique id", () => {
    const ids = STARTER_MENUS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each menu has a non-empty services list", () => {
    for (const menu of STARTER_MENUS) {
      expect(menu.services.length).toBeGreaterThan(0);
    }
  });

  it("every service has a non-negative price (free consults allowed) and positive duration", () => {
    // Some starters intentionally include $0 services (consultations, patch
    // tests, "no charge" intros). Duration must still be > 0 so the slot
    // generator has something to reserve.
    for (const menu of STARTER_MENUS) {
      for (const s of menu.services) {
        expect(s.price).toBeGreaterThanOrEqual(0);
        expect(s.duration).toBeGreaterThan(0);
        expect(s.name.trim().length).toBeGreaterThan(0);
        expect(s.category.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("each menu has a hex color", () => {
    for (const menu of STARTER_MENUS) {
      expect(menu.hex).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }
  });
});
