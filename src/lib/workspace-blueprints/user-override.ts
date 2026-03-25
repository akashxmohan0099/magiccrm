import type {
  WorkspacePresentationConfig,
  UserPresentationOverride,
} from "@/types/workspace-blueprint";

// ── Merge user override onto resolved presentation ──────────

export function mergeUserOverride(
  base: WorkspacePresentationConfig,
  override: UserPresentationOverride | null,
): WorkspacePresentationConfig {
  if (!override) return base;

  const result = structuredClone(base);

  // Sidebar order override
  if (override.sidebarOrder) {
    // Only keep slugs that exist in the base sidebar
    const baseSet = new Set(base.sidebarOrder);
    result.sidebarOrder = override.sidebarOrder.filter(s => baseSet.has(s));
  }

  // Hidden sidebar items
  if (override.hiddenSidebarItemIds) {
    const hidden = new Set(override.hiddenSidebarItemIds);
    result.sidebarOrder = result.sidebarOrder.filter(s => !hidden.has(s));
  }

  // Module column overrides
  if (override.moduleColumnOverrides) {
    for (const [moduleId, colOverride] of Object.entries(override.moduleColumnOverrides)) {
      const mp = result.modulePresentation[moduleId];
      if (!mp) continue;

      if (colOverride.hiddenColumnIds) {
        const hidden = new Set(colOverride.hiddenColumnIds);
        mp.defaultColumns = mp.defaultColumns.filter(c => !hidden.has(c));
      }

      if (colOverride.pinnedColumnIds) {
        // Pinned columns go first, then remaining in original order
        const pinned = colOverride.pinnedColumnIds.filter(c => mp.defaultColumns.includes(c));
        const rest = mp.defaultColumns.filter(c => !pinned.includes(c));
        mp.defaultColumns = [...pinned, ...rest];
      }
    }
  }

  // Dashboard widget overrides
  if (override.dashboardOverrides?.widgets) {
    result.dashboardWidgets = override.dashboardOverrides.widgets;
  }

  return result;
}

// ── Rebase override on workspace version upgrade ────────────

export function rebaseUserOverride(
  override: UserPresentationOverride,
  newPresentation: WorkspacePresentationConfig,
  newVersion: number,
): UserPresentationOverride {
  const result = structuredClone(override);
  const validSlugs = new Set(newPresentation.sidebarOrder);

  // Drop stale sidebar references
  if (result.sidebarOrder) {
    result.sidebarOrder = result.sidebarOrder.filter(s => validSlugs.has(s));
    if (result.sidebarOrder.length === 0) delete result.sidebarOrder;
  }

  if (result.hiddenSidebarItemIds) {
    result.hiddenSidebarItemIds = result.hiddenSidebarItemIds.filter(s => validSlugs.has(s));
    if (result.hiddenSidebarItemIds.length === 0) delete result.hiddenSidebarItemIds;
  }

  // Drop stale module column overrides
  if (result.moduleColumnOverrides) {
    for (const moduleId of Object.keys(result.moduleColumnOverrides)) {
      if (!newPresentation.modulePresentation[moduleId]) {
        delete result.moduleColumnOverrides[moduleId];
      }
    }
    if (Object.keys(result.moduleColumnOverrides).length === 0) {
      delete result.moduleColumnOverrides;
    }
  }

  result.basedOnWorkspaceVersion = newVersion;
  result.updatedAt = new Date().toISOString();

  return result;
}
