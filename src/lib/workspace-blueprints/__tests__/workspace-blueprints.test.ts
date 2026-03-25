import { describe, it, expect } from "vitest";

// ── Registry
import {
  getBlueprintById,
  resolveBlueprint,
  getAllBlueprintIds,
  ALL_BLUEPRINTS,
} from "@/lib/workspace-blueprints/registry";

// ── Validator
import {
  validateResolvedWorkspace,
  validatePatch,
} from "@/lib/workspace-blueprints/validator";

// ── Resolver
import {
  applyPatches,
  safeBuildDraft,
  safeApplyValidatedPatches,
  resolveWorkspace,
  buildBaseResolvedWorkspace,
} from "@/lib/workspace-blueprints/resolver";

// ── User Override
import {
  mergeUserOverride,
  rebaseUserOverride,
} from "@/lib/workspace-blueprints/user-override";

// ── Blueprints
import { nailTechBlueprint } from "@/lib/workspace-blueprints/blueprints/nail-tech";
import { photographerBlueprint } from "@/lib/workspace-blueprints/blueprints/photographer";
import { tutorBlueprint } from "@/lib/workspace-blueprints/blueprints/tutor";

// ── Types
import type {
  WorkspaceFunctionalConfig,
  WorkspacePresentationConfig,
  PresentationPatch,
  UserPresentationOverride,
  DashboardWidgetInstance,
  WorkspaceBlueprint,
} from "@/types/workspace-blueprint";

// ── Helpers ──────────────────────────────────────────────────

/** Build a minimal valid functional config for testing. */
function makeFunctional(
  overrides: Partial<WorkspaceFunctionalConfig> = {},
): WorkspaceFunctionalConfig {
  return {
    workflowPattern: "booking-first",
    enabledModules: ["bookings-calendar"],
    enabledAddons: [],
    moduleBehaviors: [],
    ...overrides,
  };
}

/** Build a minimal valid presentation config for testing. */
function makePresentation(
  overrides: Partial<WorkspacePresentationConfig> = {},
): WorkspacePresentationConfig {
  return {
    homePage: "bookings",
    sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    primaryAction: { label: "Book", href: "/dashboard/bookings", icon: "Calendar" },
    dashboardWidgets: [
      { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 1, config: {} },
    ],
    modulePresentation: {
      clients: { defaultColumns: ["name", "email"] },
    },
    ...overrides,
  };
}

/** Build a minimal valid UserPresentationOverride. */
function makeOverride(
  overrides: Partial<UserPresentationOverride> = {},
): UserPresentationOverride {
  return {
    userId: "user-1",
    workspaceId: "ws-1",
    basedOnWorkspaceVersion: 1,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Registry Tests
// ─────────────────────────────────────────────────────────────

describe("Registry", () => {
  it("ALL_BLUEPRINTS contains all registered blueprints", () => {
    expect(ALL_BLUEPRINTS.length).toBeGreaterThanOrEqual(36);
  });

  it("every blueprint has a valid 'industry:persona' or 'industry:default' ID format", () => {
    for (const bp of ALL_BLUEPRINTS) {
      expect(bp.id).toMatch(/^[a-z-]+:[a-z-]+$/);
      const [industry, persona] = bp.id.split(":");
      expect(bp.industryId).toBe(industry);
      if (persona === "default") {
        // Default blueprints may have personaId undefined or "default"
        expect(bp.personaId === undefined || bp.personaId === "default").toBe(true);
      } else {
        expect(bp.personaId).toBe(persona);
      }
    }
  });

  it("getBlueprintById finds each registered blueprint", () => {
    for (const bp of ALL_BLUEPRINTS) {
      expect(getBlueprintById(bp.id)).toBe(bp);
    }
  });

  it("getBlueprintById returns undefined for unknown ID", () => {
    expect(getBlueprintById("nonexistent:persona")).toBeUndefined();
  });

  it("resolveBlueprint finds exact industry+persona match", () => {
    expect(resolveBlueprint("beauty-wellness", "nail-tech")).toBe(nailTechBlueprint);
    expect(resolveBlueprint("creative-services", "photographer")).toBe(photographerBlueprint);
    expect(resolveBlueprint("education-coaching", "tutor")).toBe(tutorBlueprint);
  });

  it("resolveBlueprint returns undefined for unknown industry", () => {
    expect(resolveBlueprint("unknown-industry")).toBeUndefined();
  });

  it("resolveBlueprint falls back to industry default for unknown persona", () => {
    const result = resolveBlueprint("beauty-wellness", "unknown-persona");
    expect(result).toBeDefined();
    expect(result!.id).toBe("beauty-wellness:default");
  });

  it("resolveBlueprint returns undefined for unknown industry with no default", () => {
    expect(resolveBlueprint("unknown-industry", "unknown-persona")).toBeUndefined();
  });

  it("getAllBlueprintIds returns all registered IDs", () => {
    const ids = getAllBlueprintIds();
    expect(ids).toContain("beauty-wellness:nail-tech");
    expect(ids).toContain("creative-services:photographer");
    expect(ids).toContain("education-coaching:tutor");
    expect(ids.length).toBeGreaterThanOrEqual(36);
  });

  it("every blueprint has required top-level fields", () => {
    for (const bp of ALL_BLUEPRINTS) {
      expect(bp.label).toBeTruthy();
      expect(bp.description).toBeTruthy();
      expect(bp.industryId).toBeTruthy();
      expect(bp.functional).toBeDefined();
      expect(bp.presentation).toBeDefined();
      expect(bp.adjustableBlocks).toBeDefined();
      expect(Array.isArray(bp.adjustableBlocks)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 2. Validator Tests
// ─────────────────────────────────────────────────────────────

describe("Validator — validateResolvedWorkspace", () => {
  it("valid workspace passes validation", () => {
    const functional = makeFunctional();
    const presentation = makePresentation();
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("invalid workflowPattern fails", () => {
    const functional = makeFunctional({ workflowPattern: "invalid" as any });
    const presentation = makePresentation();
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("workflowPattern"))).toBe(true);
  });

  it("missing homePage fails", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({ homePage: "" });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("homePage"))).toBe(true);
  });

  it("empty sidebarOrder fails", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({ sidebarOrder: [] });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("sidebarOrder"))).toBe(true);
  });

  it("sidebar references to disabled modules fail", () => {
    const functional = makeFunctional({ enabledModules: [] }); // bookings-calendar removed
    const presentation = makePresentation({ sidebarOrder: ["bookings", "clients"] });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("bookings") && e.includes("not enabled"))).toBe(true);
  });

  it("unknown widget manifests fail", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "totally-unknown-widget", x: 0, y: 0, w: 2, h: 1, config: {} },
      ],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Unknown widget manifest"))).toBe(true);
  });

  it("duplicate sidebar entries fail", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      sidebarOrder: ["bookings", "clients", "bookings"],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Duplicate sidebar"))).toBe(true);
  });

  it("overlapping dashboard widgets fail", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 2, config: {} },
        { instanceId: "w2", manifestId: "upcoming-bookings", x: 1, y: 1, w: 2, h: 2, config: {} },
      ],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("overlap"))).toBe(true);
  });

  it("non-overlapping dashboard widgets pass", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 1, config: {} },
        { instanceId: "w2", manifestId: "upcoming-bookings", x: 2, y: 0, w: 2, h: 1, config: {} },
      ],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(true);
  });

  it("unknown module IDs in enabledModules fail", () => {
    const functional = makeFunctional({ enabledModules: ["does-not-exist"] });
    const presentation = makePresentation({
      homePage: "clients",
      sidebarOrder: ["clients"],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Unknown module ID"))).toBe(true);
  });

  it("missing primaryAction label fails", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      primaryAction: { label: "", href: "/dashboard", icon: "X" },
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("primaryAction"))).toBe(true);
  });

  it("widget with invalid width fails", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 5, h: 1, config: {} },
      ],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("invalid width"))).toBe(true);
  });

  it("widget with invalid height fails", () => {
    const functional = makeFunctional();
    const presentation = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 4, config: {} },
      ],
    });
    const result = validateResolvedWorkspace(functional, presentation);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("invalid height"))).toBe(true);
  });
});

describe("Validator — validatePatch", () => {
  const functional = makeFunctional({ enabledModules: ["bookings-calendar", "products"] });

  it("set-homepage: valid enabled module returns null", () => {
    const error = validatePatch({ op: "set-homepage", pageId: "bookings" }, functional);
    expect(error).toBeNull();
  });

  it("set-homepage: disabled module returns error", () => {
    const error = validatePatch({ op: "set-homepage", pageId: "jobs" }, functional);
    expect(error).not.toBeNull();
    expect(error).toContain("not an enabled module");
  });

  it("reorder-sidebar: valid slugs returns null", () => {
    const error = validatePatch(
      { op: "reorder-sidebar", itemIds: ["bookings", "clients", "products"] },
      functional,
    );
    expect(error).toBeNull();
  });

  it("reorder-sidebar: duplicate entry returns error", () => {
    const error = validatePatch(
      { op: "reorder-sidebar", itemIds: ["bookings", "bookings"] },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("duplicate");
  });

  it("reorder-sidebar: disabled module returns error", () => {
    const error = validatePatch(
      { op: "reorder-sidebar", itemIds: ["bookings", "jobs"] },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("not an enabled module");
  });

  it("rename-module-section: valid label returns null", () => {
    const error = validatePatch(
      { op: "rename-module-section", moduleId: "clients", label: "Customers" },
      functional,
    );
    expect(error).toBeNull();
  });

  it("rename-module-section: empty label returns error", () => {
    const error = validatePatch(
      { op: "rename-module-section", moduleId: "clients", label: "" },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("1-40 chars");
  });

  it("rename-module-section: label over 40 chars returns error", () => {
    const error = validatePatch(
      { op: "rename-module-section", moduleId: "clients", label: "A".repeat(41) },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("1-40 chars");
  });

  it("set-module-default-columns: valid columns returns null", () => {
    const error = validatePatch(
      { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email"] },
      functional,
    );
    expect(error).toBeNull();
  });

  it("set-module-default-columns: empty columns returns error", () => {
    const error = validatePatch(
      { op: "set-module-default-columns", moduleId: "clients", columnIds: [] },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("at least 1 column");
  });

  it("set-column-label: valid label returns null", () => {
    const error = validatePatch(
      { op: "set-column-label", moduleId: "clients", columnId: "name", label: "Full Name" },
      functional,
    );
    expect(error).toBeNull();
  });

  it("set-column-label: empty label returns error", () => {
    const error = validatePatch(
      { op: "set-column-label", moduleId: "clients", columnId: "name", label: "" },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("1-40 chars");
  });

  it("replace-dashboard-widgets: valid widgets returns null", () => {
    const error = validatePatch(
      {
        op: "replace-dashboard-widgets",
        widgets: [
          { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 1 },
        ],
      },
      functional,
    );
    expect(error).toBeNull();
  });

  it("replace-dashboard-widgets: more than 6 widgets returns error", () => {
    const widgets: DashboardWidgetInstance[] = Array.from({ length: 7 }, (_, i) => ({
      instanceId: `w${i}`,
      manifestId: "setup-checklist",
      x: 0,
      y: i,
      w: 1,
      h: 1,
    }));
    const error = validatePatch(
      { op: "replace-dashboard-widgets", widgets },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("max 6 widgets");
  });

  it("replace-dashboard-widgets: unknown manifest returns error", () => {
    const error = validatePatch(
      {
        op: "replace-dashboard-widgets",
        widgets: [
          { instanceId: "w1", manifestId: "nonexistent-widget", x: 0, y: 0, w: 2, h: 1 },
        ],
      },
      functional,
    );
    expect(error).not.toBeNull();
    expect(error).toContain("unknown manifest");
  });
});

// ─────────────────────────────────────────────────────────────
// 3. Resolver Tests
// ─────────────────────────────────────────────────────────────

describe("Resolver — applyPatches", () => {
  it("set-homepage sets the homePage", () => {
    const base = makePresentation({ homePage: "bookings" });
    const result = applyPatches(base, [{ op: "set-homepage", pageId: "leads" }]);
    expect(result.homePage).toBe("leads");
  });

  it("reorder-sidebar replaces sidebarOrder", () => {
    const base = makePresentation({ sidebarOrder: ["a", "b", "c"] });
    const result = applyPatches(base, [
      { op: "reorder-sidebar", itemIds: ["c", "b", "a"] },
    ]);
    expect(result.sidebarOrder).toEqual(["c", "b", "a"]);
  });

  it("set-module-default-columns sets columns on existing module", () => {
    const base = makePresentation({
      modulePresentation: { clients: { defaultColumns: ["name", "email"] } },
    });
    const result = applyPatches(base, [
      { op: "set-module-default-columns", moduleId: "clients", columnIds: ["phone", "status"] },
    ]);
    expect(result.modulePresentation.clients.defaultColumns).toEqual(["phone", "status"]);
  });

  it("set-module-default-columns creates module presentation if missing", () => {
    const base = makePresentation({ modulePresentation: {} });
    const result = applyPatches(base, [
      { op: "set-module-default-columns", moduleId: "leads", columnIds: ["name", "value"] },
    ]);
    expect(result.modulePresentation.leads).toBeDefined();
    expect(result.modulePresentation.leads.defaultColumns).toEqual(["name", "value"]);
  });

  it("set-column-label sets a label on a module column", () => {
    const base = makePresentation({
      modulePresentation: { clients: { defaultColumns: ["name"] } },
    });
    const result = applyPatches(base, [
      { op: "set-column-label", moduleId: "clients", columnId: "name", label: "Full Name" },
    ]);
    expect(result.modulePresentation.clients.columnLabels?.name).toBe("Full Name");
  });

  it("replace-dashboard-widgets replaces all widgets", () => {
    const newWidgets: DashboardWidgetInstance[] = [
      { instanceId: "w-new", manifestId: "revenue-summary", x: 0, y: 0, w: 2, h: 1 },
    ];
    const base = makePresentation();
    const result = applyPatches(base, [
      { op: "replace-dashboard-widgets", widgets: newWidgets },
    ]);
    expect(result.dashboardWidgets).toEqual(newWidgets);
  });

  it("multiple patches applied sequentially", () => {
    const base = makePresentation();
    const result = applyPatches(base, [
      { op: "set-homepage", pageId: "leads" },
      { op: "reorder-sidebar", itemIds: ["leads", "clients"] },
    ]);
    expect(result.homePage).toBe("leads");
    expect(result.sidebarOrder).toEqual(["leads", "clients"]);
  });

  it("applyPatches does not mutate the original presentation", () => {
    const base = makePresentation({ homePage: "bookings" });
    const baseCopy = structuredClone(base);
    applyPatches(base, [{ op: "set-homepage", pageId: "leads" }]);
    expect(base).toEqual(baseCopy);
  });
});

describe("Resolver — safeBuildDraft", () => {
  it("applies adjustable block selections from adjustments", () => {
    // nail-tech: sell-products=no removes products module
    const draft = safeBuildDraft(nailTechBlueprint, { "sell-products": "no" });
    expect(draft.functional.enabledModules).not.toContain("products");
  });

  it("uses block defaults for missing selections", () => {
    // nail-tech defaults: sell-products=yes, accept-inquiries=direct
    const draft = safeBuildDraft(nailTechBlueprint, {});
    expect(draft.functional.enabledModules).toContain("products");
    expect(draft.functional.workflowPattern).toBe("booking-first");
  });

  it("applies functional workflowPattern change from adjustments", () => {
    // nail-tech: accept-inquiries=inquire-first changes pattern
    const draft = safeBuildDraft(nailTechBlueprint, { "accept-inquiries": "inquire-first" });
    expect(draft.functional.workflowPattern).toBe("inquiry-first");
    expect(draft.presentation.homePage).toBe("leads");
  });

  it("applies presentation patches from adjustable block selection", () => {
    // photographer: booking-style=yes changes homepage and sidebar
    const draft = safeBuildDraft(photographerBlueprint, { "booking-style": "yes" });
    expect(draft.presentation.homePage).toBe("bookings");
    expect(draft.presentation.sidebarOrder[0]).toBe("bookings");
  });

  it("applies addModules from functionalDelta", () => {
    // Create a mock blueprint with addModules
    const mockBlueprint: WorkspaceBlueprint = {
      id: "test:mock",
      label: "Mock",
      description: "A mock blueprint for testing",
      industryId: "test",
      personaId: "mock",
      functional: makeFunctional({ enabledModules: ["bookings-calendar"] }),
      presentation: makePresentation(),
      adjustableBlocks: [
        {
          id: "add-module",
          question: "Add marketing?",
          options: [
            {
              value: "yes",
              label: "Yes",
              description: "Add marketing",
              functionalDelta: { addModules: ["marketing"] },
              presentationPatches: [],
            },
            {
              value: "no",
              label: "No",
              description: "Skip",
              presentationPatches: [],
            },
          ],
          default: "no",
        },
      ],
    };
    const draft = safeBuildDraft(mockBlueprint, { "add-module": "yes" });
    expect(draft.functional.enabledModules).toContain("marketing");
  });

  it("does not add duplicate modules when addModules repeats", () => {
    const mockBlueprint: WorkspaceBlueprint = {
      id: "test:mock2",
      label: "Mock",
      description: "A mock blueprint",
      industryId: "test",
      personaId: "mock2",
      functional: makeFunctional({ enabledModules: ["bookings-calendar", "marketing"] }),
      presentation: makePresentation(),
      adjustableBlocks: [
        {
          id: "add-dup",
          question: "Add marketing again?",
          options: [
            {
              value: "yes",
              label: "Yes",
              description: "Try adding marketing again",
              functionalDelta: { addModules: ["marketing"] },
              presentationPatches: [],
            },
          ],
          default: "yes",
        },
      ],
    };
    const draft = safeBuildDraft(mockBlueprint, {});
    const marketingCount = draft.functional.enabledModules.filter(m => m === "marketing").length;
    expect(marketingCount).toBe(1);
  });

  it("skips unknown option values gracefully", () => {
    const draft = safeBuildDraft(nailTechBlueprint, { "sell-products": "maybe" });
    // "maybe" is not a valid option; block should be skipped
    // The draft should still be valid using the blueprint's base
    expect(draft.functional).toBeDefined();
    expect(draft.presentation).toBeDefined();
  });
});

describe("Resolver — safeApplyValidatedPatches", () => {
  it("keeps valid patches", () => {
    const draft = {
      functional: makeFunctional(),
      presentation: makePresentation(),
    };
    const patches: PresentationPatch[] = [
      { op: "set-homepage", pageId: "clients" },
    ];
    const result = safeApplyValidatedPatches(draft, patches);
    expect(result.presentation.homePage).toBe("clients");
  });

  it("drops invalid patches silently", () => {
    const draft = {
      functional: makeFunctional({ enabledModules: [] }), // bookings not enabled as optional
      presentation: makePresentation(),
    };
    const patches: PresentationPatch[] = [
      // jobs is not enabled, so set-homepage to "jobs" should be invalid
      { op: "set-homepage", pageId: "jobs" },
    ];
    const result = safeApplyValidatedPatches(draft, patches);
    // homepage should remain the original since the patch was dropped
    expect(result.presentation.homePage).toBe("bookings");
  });

  it("NEVER modifies functional config (critical invariant)", () => {
    const draft = {
      functional: makeFunctional({ enabledModules: ["bookings-calendar", "products"] }),
      presentation: makePresentation(),
    };
    const functionalBefore = structuredClone(draft.functional);
    const patches: PresentationPatch[] = [
      { op: "set-homepage", pageId: "products" },
      { op: "reorder-sidebar", itemIds: ["products", "bookings", "clients"] },
    ];
    const result = safeApplyValidatedPatches(draft, patches);
    expect(result.functional).toEqual(functionalBefore);
  });

  it("mix of valid and invalid patches: only valid ones applied", () => {
    const draft = {
      functional: makeFunctional({ enabledModules: ["bookings-calendar"] }),
      presentation: makePresentation(),
    };
    const patches: PresentationPatch[] = [
      { op: "set-homepage", pageId: "clients" }, // valid (always-on)
      { op: "set-homepage", pageId: "jobs" },    // invalid (not enabled)
    ];
    const result = safeApplyValidatedPatches(draft, patches);
    // clients is applied, then jobs is dropped, so homepage stays "clients"
    expect(result.presentation.homePage).toBe("clients");
  });
});

describe("Resolver — resolveWorkspace", () => {
  it("produces a valid ResolvedWorkspace", () => {
    const resolved = resolveWorkspace(nailTechBlueprint, {});
    expect(resolved.version).toBe(1);
    expect(resolved.blueprintId).toBe("beauty-wellness:nail-tech");
    expect(resolved.resolvedAt).toBeTruthy();
    expect(resolved.functional).toBeDefined();
    expect(resolved.presentation).toBeDefined();
  });

  it("stores applied adjustments", () => {
    const adjustments = { "sell-products": "no" };
    const resolved = resolveWorkspace(nailTechBlueprint, adjustments);
    expect(resolved.appliedAdjustments).toEqual(adjustments);
  });

  it("stores applied AI patches", () => {
    const aiPatches: PresentationPatch[] = [
      { op: "set-column-label", moduleId: "clients", columnId: "name", label: "Customer" },
    ];
    const resolved = resolveWorkspace(nailTechBlueprint, {}, aiPatches);
    expect(resolved.appliedPatches).toEqual(aiPatches);
  });

  it("throws on invalid result", () => {
    // Create a blueprint that would produce invalid output
    const brokenBlueprint: WorkspaceBlueprint = {
      id: "test:broken",
      label: "Broken",
      description: "Intentionally broken for testing",
      industryId: "test",
      personaId: "broken",
      functional: {
        workflowPattern: "booking-first",
        enabledModules: [],
        enabledAddons: [],
        moduleBehaviors: [],
      },
      presentation: {
        homePage: "nonexistent-slug",
        sidebarOrder: ["nonexistent-slug"],
        primaryAction: { label: "Do", href: "/do", icon: "X" },
        dashboardWidgets: [],
        modulePresentation: {},
      },
      adjustableBlocks: [],
    };
    expect(() => resolveWorkspace(brokenBlueprint, {})).toThrow("Invalid resolved workspace");
  });
});

describe("Resolver — buildBaseResolvedWorkspace", () => {
  it("returns base config unchanged from blueprint", () => {
    const base = buildBaseResolvedWorkspace(nailTechBlueprint);
    expect(base.functional).toEqual(nailTechBlueprint.functional);
    expect(base.presentation).toEqual(nailTechBlueprint.presentation);
    expect(base.blueprintId).toBe(nailTechBlueprint.id);
    expect(base.appliedAdjustments).toEqual({});
    expect(base.appliedPatches).toEqual([]);
    expect(base.version).toBe(1);
  });

  it("does not share object references with the blueprint", () => {
    const base = buildBaseResolvedWorkspace(photographerBlueprint);
    base.functional.enabledModules.push("marketing");
    expect(photographerBlueprint.functional.enabledModules).not.toContain("marketing");
  });
});

// ─────────────────────────────────────────────────────────────
// 4. Blueprint Integrity Tests
// ─────────────────────────────────────────────────────────────

describe("Blueprint integrity", () => {
  const allBlueprints = [nailTechBlueprint, photographerBlueprint, tutorBlueprint];

  for (const bp of allBlueprints) {
    describe(`${bp.label} (${bp.id})`, () => {
      it("resolves without error using default adjustments", () => {
        expect(() => resolveWorkspace(bp, {})).not.toThrow();
      });

      it("buildBaseResolvedWorkspace produces valid output", () => {
        const base = buildBaseResolvedWorkspace(bp);
        const validation = validateResolvedWorkspace(base.functional, base.presentation);
        expect(validation.valid).toBe(true);
      });

      it("each adjustable block option produces a valid config", () => {
        for (const block of bp.adjustableBlocks) {
          for (const option of block.options) {
            const adjustments: Record<string, string> = { [block.id]: option.value };
            expect(() => resolveWorkspace(bp, adjustments)).not.toThrow();
          }
        }
      });

      it("all module IDs in enabledModules are known", () => {
        const resolved = buildBaseResolvedWorkspace(bp);
        const validation = validateResolvedWorkspace(resolved.functional, resolved.presentation);
        const unknownModuleErrors = validation.errors.filter(e => e.includes("Unknown module ID"));
        expect(unknownModuleErrors).toHaveLength(0);
      });

      it("all sidebar entries reference enabled modules", () => {
        const resolved = buildBaseResolvedWorkspace(bp);
        const validation = validateResolvedWorkspace(resolved.functional, resolved.presentation);
        const sidebarErrors = validation.errors.filter(e => e.includes("Sidebar module"));
        expect(sidebarErrors).toHaveLength(0);
      });

      it("all dashboard widget manifests are registered", () => {
        const resolved = buildBaseResolvedWorkspace(bp);
        const validation = validateResolvedWorkspace(resolved.functional, resolved.presentation);
        const widgetErrors = validation.errors.filter(e => e.includes("Unknown widget manifest"));
        expect(widgetErrors).toHaveLength(0);
      });
    });
  }

  it("pairwise: every block option x every other block option in same blueprint is valid (photographer, tutor)", () => {
    // Photographer and tutor have no conflicting block combinations
    for (const bp of [photographerBlueprint, tutorBlueprint]) {
      const blocks = bp.adjustableBlocks;
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const blockA = blocks[i];
          const blockB = blocks[j];
          for (const optA of blockA.options) {
            for (const optB of blockB.options) {
              const adjustments: Record<string, string> = {
                [blockA.id]: optA.value,
                [blockB.id]: optB.value,
              };
              expect(() => resolveWorkspace(bp, adjustments)).not.toThrow();
            }
          }
        }
      }
    }
  });

  it("pairwise: all nail-tech block combinations are valid", () => {
    const allCombinations = [
      { "sell-products": "yes", "accept-inquiries": "direct" },
      { "sell-products": "yes", "accept-inquiries": "inquire-first" },
      { "sell-products": "no", "accept-inquiries": "direct" },
      { "sell-products": "no", "accept-inquiries": "inquire-first" },
    ];
    for (const adjustments of allCombinations) {
      expect(() => resolveWorkspace(nailTechBlueprint, adjustments)).not.toThrow();
    }
  });
});

// ─────────────────────────────────────────────────────────────
// 5. User Override Tests
// ─────────────────────────────────────────────────────────────

describe("User Override — mergeUserOverride", () => {
  it("null override returns base unchanged", () => {
    const base = makePresentation();
    const result = mergeUserOverride(base, null);
    expect(result).toEqual(base);
  });

  it("sidebar reorder works", () => {
    const base = makePresentation({
      sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    });
    const override = makeOverride({
      sidebarOrder: ["clients", "bookings", "leads", "invoicing", "communication"],
    });
    const result = mergeUserOverride(base, override);
    expect(result.sidebarOrder).toEqual(["clients", "bookings", "leads", "invoicing", "communication"]);
  });

  it("hidden sidebar items are removed", () => {
    const base = makePresentation({
      sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    });
    const override = makeOverride({
      hiddenSidebarItemIds: ["leads", "communication"],
    });
    const result = mergeUserOverride(base, override);
    expect(result.sidebarOrder).not.toContain("leads");
    expect(result.sidebarOrder).not.toContain("communication");
    expect(result.sidebarOrder).toContain("bookings");
    expect(result.sidebarOrder).toContain("clients");
  });

  it("sidebar reorder + hidden items work together", () => {
    const base = makePresentation({
      sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    });
    const override = makeOverride({
      sidebarOrder: ["leads", "bookings", "clients", "invoicing", "communication"],
      hiddenSidebarItemIds: ["leads"],
    });
    const result = mergeUserOverride(base, override);
    expect(result.sidebarOrder[0]).toBe("bookings");
    expect(result.sidebarOrder).not.toContain("leads");
  });

  it("column overrides: hidden columns are removed", () => {
    const base = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name", "email", "phone", "status"] },
      },
    });
    const override = makeOverride({
      moduleColumnOverrides: {
        clients: { hiddenColumnIds: ["phone", "status"] },
      },
    });
    const result = mergeUserOverride(base, override);
    expect(result.modulePresentation.clients.defaultColumns).toEqual(["name", "email"]);
  });

  it("column overrides: pinned columns move to front", () => {
    const base = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name", "email", "phone", "status"] },
      },
    });
    const override = makeOverride({
      moduleColumnOverrides: {
        clients: { pinnedColumnIds: ["status", "phone"] },
      },
    });
    const result = mergeUserOverride(base, override);
    expect(result.modulePresentation.clients.defaultColumns).toEqual([
      "status", "phone", "name", "email",
    ]);
  });

  it("column overrides: hidden + pinned work together", () => {
    const base = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name", "email", "phone", "status", "tags"] },
      },
    });
    const override = makeOverride({
      moduleColumnOverrides: {
        clients: {
          hiddenColumnIds: ["tags"],
          pinnedColumnIds: ["status"],
        },
      },
    });
    const result = mergeUserOverride(base, override);
    // tags hidden, status pinned first
    expect(result.modulePresentation.clients.defaultColumns).toEqual([
      "status", "name", "email", "phone",
    ]);
  });

  it("dashboard override replaces widgets", () => {
    const base = makePresentation({
      dashboardWidgets: [
        { instanceId: "w1", manifestId: "setup-checklist", x: 0, y: 0, w: 2, h: 1, config: {} },
      ],
    });
    const customWidgets: DashboardWidgetInstance[] = [
      { instanceId: "w-custom", manifestId: "revenue-summary", x: 0, y: 0, w: 4, h: 2 },
    ];
    const override = makeOverride({
      dashboardOverrides: { widgets: customWidgets },
    });
    const result = mergeUserOverride(base, override);
    expect(result.dashboardWidgets).toEqual(customWidgets);
  });

  it("invalid sidebar slugs in override are dropped", () => {
    const base = makePresentation({
      sidebarOrder: ["bookings", "clients"],
    });
    const override = makeOverride({
      sidebarOrder: ["nonexistent", "bookings", "clients", "also-nonexistent"],
    });
    const result = mergeUserOverride(base, override);
    // Only slugs present in the base sidebar should survive
    expect(result.sidebarOrder).toEqual(["bookings", "clients"]);
    expect(result.sidebarOrder).not.toContain("nonexistent");
    expect(result.sidebarOrder).not.toContain("also-nonexistent");
  });

  it("column override for unknown module is ignored", () => {
    const base = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name", "email"] },
      },
    });
    const override = makeOverride({
      moduleColumnOverrides: {
        "nonexistent-module": { hiddenColumnIds: ["name"] },
      },
    });
    const result = mergeUserOverride(base, override);
    // clients should be unchanged since the override targeted a different module
    expect(result.modulePresentation.clients.defaultColumns).toEqual(["name", "email"]);
  });

  it("does not mutate the base presentation", () => {
    const base = makePresentation({
      sidebarOrder: ["bookings", "clients", "invoicing", "leads", "communication"],
    });
    const baseCopy = structuredClone(base);
    const override = makeOverride({
      hiddenSidebarItemIds: ["leads"],
    });
    mergeUserOverride(base, override);
    expect(base).toEqual(baseCopy);
  });
});

describe("User Override — rebaseUserOverride", () => {
  it("drops stale sidebar slugs", () => {
    const override = makeOverride({
      sidebarOrder: ["bookings", "clients", "stale-slug"],
    });
    const newPresentation = makePresentation({
      sidebarOrder: ["bookings", "clients", "invoicing"],
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.sidebarOrder).toEqual(["bookings", "clients"]);
    expect(result.sidebarOrder).not.toContain("stale-slug");
  });

  it("drops stale hidden sidebar items", () => {
    const override = makeOverride({
      hiddenSidebarItemIds: ["bookings", "stale-hidden"],
    });
    const newPresentation = makePresentation({
      sidebarOrder: ["bookings", "clients"],
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.hiddenSidebarItemIds).toEqual(["bookings"]);
  });

  it("removes empty sidebarOrder after rebase", () => {
    const override = makeOverride({
      sidebarOrder: ["stale-1", "stale-2"],
    });
    const newPresentation = makePresentation({
      sidebarOrder: ["bookings", "clients"],
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.sidebarOrder).toBeUndefined();
  });

  it("removes empty hiddenSidebarItemIds after rebase", () => {
    const override = makeOverride({
      hiddenSidebarItemIds: ["stale-only"],
    });
    const newPresentation = makePresentation({
      sidebarOrder: ["bookings", "clients"],
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.hiddenSidebarItemIds).toBeUndefined();
  });

  it("drops stale module column overrides", () => {
    const override = makeOverride({
      moduleColumnOverrides: {
        clients: { hiddenColumnIds: ["name"] },
        "stale-module": { hiddenColumnIds: ["foo"] },
      },
    });
    const newPresentation = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name", "email"] },
      },
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.moduleColumnOverrides).toBeDefined();
    expect(result.moduleColumnOverrides!.clients).toBeDefined();
    expect(result.moduleColumnOverrides!["stale-module"]).toBeUndefined();
  });

  it("removes moduleColumnOverrides entirely when all stale", () => {
    const override = makeOverride({
      moduleColumnOverrides: {
        "stale-module": { hiddenColumnIds: ["foo"] },
      },
    });
    const newPresentation = makePresentation({
      modulePresentation: {
        clients: { defaultColumns: ["name"] },
      },
    });
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.moduleColumnOverrides).toBeUndefined();
  });

  it("updates version number", () => {
    const override = makeOverride({ basedOnWorkspaceVersion: 1 });
    const newPresentation = makePresentation();
    const result = rebaseUserOverride(override, newPresentation, 5);
    expect(result.basedOnWorkspaceVersion).toBe(5);
  });

  it("updates the updatedAt timestamp", () => {
    const oldDate = "2024-01-01T00:00:00.000Z";
    const override = makeOverride({ updatedAt: oldDate });
    const newPresentation = makePresentation();
    const result = rebaseUserOverride(override, newPresentation, 2);
    expect(result.updatedAt).not.toBe(oldDate);
  });

  it("does not mutate the original override", () => {
    const override = makeOverride({
      sidebarOrder: ["bookings", "stale"],
      basedOnWorkspaceVersion: 1,
    });
    const overrideCopy = structuredClone(override);
    const newPresentation = makePresentation({ sidebarOrder: ["bookings", "clients"] });
    rebaseUserOverride(override, newPresentation, 2);
    expect(override).toEqual(overrideCopy);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. AI Invariant Test
// ─────────────────────────────────────────────────────────────

describe("AI invariant — functional config is never modified by patches", () => {
  it("applying AI patches does not change the functional config", () => {
    for (const bp of [nailTechBlueprint, photographerBlueprint, tutorBlueprint]) {
      const draft = safeBuildDraft(bp, {});
      const functionalBefore = structuredClone(draft.functional);

      const patches: PresentationPatch[] = [
        { op: "set-homepage", pageId: "clients" },
        { op: "set-column-label", moduleId: "clients", columnId: "name", label: "Customer" },
        { op: "set-module-default-columns", moduleId: "clients", columnIds: ["name", "email", "phone"] },
      ];

      const result = safeApplyValidatedPatches(draft, patches);
      expect(result.functional).toEqual(functionalBefore);
    }
  });

  it("resolveWorkspace with AI patches preserves functional identity", () => {
    const aiPatches: PresentationPatch[] = [
      { op: "set-column-label", moduleId: "clients", columnId: "name", label: "Customer Name" },
      { op: "rename-module-section", moduleId: "clients", label: "Customers" },
    ];

    const withPatches = resolveWorkspace(nailTechBlueprint, {}, aiPatches);
    const withoutPatches = resolveWorkspace(nailTechBlueprint, {});

    expect(withPatches.functional).toEqual(withoutPatches.functional);
  });

  it("even invalid patches never corrupt functional config", () => {
    const draft = {
      functional: makeFunctional({ enabledModules: ["bookings-calendar"] }),
      presentation: makePresentation(),
    };
    const functionalBefore = structuredClone(draft.functional);

    // All invalid patches
    const badPatches: PresentationPatch[] = [
      { op: "set-homepage", pageId: "jobs" }, // not enabled
      { op: "reorder-sidebar", itemIds: ["jobs", "marketing"] }, // not enabled
      { op: "replace-dashboard-widgets", widgets: Array.from({ length: 7 }, (_, i) => ({
        instanceId: `w${i}`,
        manifestId: "setup-checklist",
        x: 0, y: i, w: 1, h: 1,
      })) }, // too many
    ];

    const result = safeApplyValidatedPatches(draft, badPatches);
    expect(result.functional).toEqual(functionalBefore);
  });
});
