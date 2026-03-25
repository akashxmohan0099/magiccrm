import type {
  WorkspaceBlueprint,
  ResolvedWorkspace,
  WorkspaceFunctionalConfig,
  WorkspacePresentationConfig,
  PresentationPatch,
  DashboardWidgetInstance,
} from "@/types/workspace-blueprint";
import { validateResolvedWorkspace, validatePatch } from "./validator";

// ── Patch application ───────────────────────────────────────

export function applyPatches(
  presentation: WorkspacePresentationConfig,
  patches: PresentationPatch[],
): WorkspacePresentationConfig {
  let result = structuredClone(presentation);

  for (const patch of patches) {
    switch (patch.op) {
      case "set-homepage":
        result.homePage = patch.pageId;
        break;

      case "reorder-sidebar":
        result.sidebarOrder = patch.itemIds;
        break;

      case "rename-module-section":
        // Store as a column label on the module presentation
        if (!result.modulePresentation[patch.moduleId]) {
          result.modulePresentation[patch.moduleId] = { defaultColumns: [] };
        }
        break;

      case "set-module-default-columns":
        if (!result.modulePresentation[patch.moduleId]) {
          result.modulePresentation[patch.moduleId] = { defaultColumns: [] };
        }
        result.modulePresentation[patch.moduleId].defaultColumns = patch.columnIds;
        break;

      case "set-column-label":
        if (!result.modulePresentation[patch.moduleId]) {
          result.modulePresentation[patch.moduleId] = { defaultColumns: [] };
        }
        if (!result.modulePresentation[patch.moduleId].columnLabels) {
          result.modulePresentation[patch.moduleId].columnLabels = {};
        }
        result.modulePresentation[patch.moduleId].columnLabels![patch.columnId] = patch.label;
        break;

      case "replace-dashboard-widgets":
        result.dashboardWidgets = patch.widgets;
        break;
    }
  }

  return result;
}

// ── Safe helpers (each returns value or fallback) ───────────

export function safeBuildDraft(
  blueprint: WorkspaceBlueprint,
  adjustments: Record<string, string>,
): { functional: WorkspaceFunctionalConfig; presentation: WorkspacePresentationConfig } {
  let functional = structuredClone(blueprint.functional);
  let presentation = structuredClone(blueprint.presentation);

  for (const block of blueprint.adjustableBlocks) {
    const selectedValue = adjustments[block.id] ?? block.default;
    const option = block.options.find(o => o.value === selectedValue);
    if (!option) continue;

    // Apply functional delta (bounded)
    if (option.functionalDelta) {
      if (option.functionalDelta.workflowPattern) {
        functional.workflowPattern = option.functionalDelta.workflowPattern;
      }
      if (option.functionalDelta.addModules) {
        for (const m of option.functionalDelta.addModules) {
          if (!functional.enabledModules.includes(m)) {
            functional.enabledModules.push(m);
          }
        }
      }
      if (option.functionalDelta.removeModules) {
        functional.enabledModules = functional.enabledModules.filter(
          m => !option.functionalDelta!.removeModules!.includes(m)
        );
      }
    }

    // Apply presentation patches
    presentation = applyPatches(presentation, option.presentationPatches);
  }

  return { functional, presentation };
}

export function safeApplyValidatedPatches(
  draft: { functional: WorkspaceFunctionalConfig; presentation: WorkspacePresentationConfig },
  patches: PresentationPatch[],
): { functional: WorkspaceFunctionalConfig; presentation: WorkspacePresentationConfig } {
  const validPatches: PresentationPatch[] = [];

  for (const patch of patches) {
    const error = validatePatch(patch, draft.functional);
    if (error === null) {
      validPatches.push(patch);
    }
    // Invalid patches are silently dropped — no patch is safer than a bad patch
  }

  return {
    functional: draft.functional, // NEVER modified by patches
    presentation: applyPatches(draft.presentation, validPatches),
  };
}

// ── Resolver pipeline ───────────────────────────────────────

export function resolveWorkspace(
  blueprint: WorkspaceBlueprint,
  adjustments: Record<string, string>,
  aiPatches?: PresentationPatch[],
): ResolvedWorkspace {
  // 1. Build draft from blueprint + adjustments
  const draft = safeBuildDraft(blueprint, adjustments);

  // 2. Apply AI patches (presentation only, validated)
  const { functional, presentation } = aiPatches
    ? safeApplyValidatedPatches(draft, aiPatches)
    : draft;

  // 3. Validate the result
  const validation = validateResolvedWorkspace(functional, presentation);
  if (!validation.valid) {
    throw new Error(`Invalid resolved workspace: ${validation.errors.join(", ")}`);
  }

  // 4. Return versioned snapshot
  return {
    version: 1,
    resolvedAt: new Date().toISOString(),
    blueprintId: blueprint.id,
    appliedAdjustments: adjustments,
    appliedPatches: aiPatches ?? [],
    functional,
    presentation,
  };
}

// ── Build from base blueprint (fallback) ────────────────────

export function buildBaseResolvedWorkspace(
  blueprint: WorkspaceBlueprint,
): ResolvedWorkspace {
  return {
    version: 1,
    resolvedAt: new Date().toISOString(),
    blueprintId: blueprint.id,
    appliedAdjustments: {},
    appliedPatches: [],
    functional: structuredClone(blueprint.functional),
    presentation: structuredClone(blueprint.presentation),
  };
}
