import { describe, it, expect } from "vitest";
import { ADDON_MODULES, getAddon, shouldActivatePortal } from "../addon-modules";

describe("addon-modules", () => {
  it("has correct count of addon modules", () => {
    expect(ADDON_MODULES.length).toBeGreaterThanOrEqual(9);
  });

  it("Business Insights module is named correctly (not AI Insights)", () => {
    const insights = getAddon("ai-insights");
    expect(insights).toBeDefined();
    expect(insights!.name).toBe("Business Insights");
    expect(insights!.name).not.toContain("AI");
  });

  it("every module has required fields", () => {
    for (const mod of ADDON_MODULES) {
      expect(mod.id).toBeTruthy();
      expect(mod.name).toBeTruthy();
      expect(mod.description).toBeTruthy();
      expect(mod.icon).toBeTruthy();
      expect(mod.route).toBeTruthy();
    }
  });

  it("portal-activating modules are marked", () => {
    const portalModules = ADDON_MODULES.filter((m) => m.activatesPortal);
    expect(portalModules.length).toBeGreaterThanOrEqual(1);
    // proposals, memberships, documents should activate portal
    expect(getAddon("proposals")?.activatesPortal).toBe(true);
    expect(getAddon("memberships")?.activatesPortal).toBe(true);
    expect(getAddon("documents")?.activatesPortal).toBe(true);
  });

  it("shouldActivatePortal returns true when portal module is enabled", () => {
    expect(shouldActivatePortal(["proposals"])).toBe(true);
    expect(shouldActivatePortal(["analytics", "marketing"])).toBe(false);
  });

  it("getAddon returns undefined for invalid ID", () => {
    expect(getAddon("nonexistent")).toBeUndefined();
  });
});
