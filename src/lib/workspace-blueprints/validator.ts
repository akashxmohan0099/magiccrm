import type {
  WorkspaceFunctionalConfig,
  WorkspacePresentationConfig,
  PresentationPatch,
  ValidationResult,
} from "@/types/workspace-blueprint";
import { getCombinationById, combinationsConflict } from "@/lib/module-combinations";

// ── Known registries (extend as modules/widgets are added) ──

/** Always-on modules that don't need to be in enabledModules */
const ALWAYS_ON_MODULES = new Set([
  "client-database",
  "leads-pipeline",
  "communication",
  "quotes-invoicing",
]);

/** All known module IDs (always-on + optional) */
const KNOWN_MODULES = new Set([
  ...ALWAYS_ON_MODULES,
  "bookings-calendar",
  "jobs-projects",
  "marketing",
  "team",
  "support",
  "documents",
  "products",
  "memberships",
  "loyalty",
  "soap-notes",
  "intake-forms",
  "gift-cards",
  "vendor-management",
  "before-after",
  "win-back",
  "client-portal",
  "automations",
  "reporting",
]);

/** Module slug → module ID mapping */
const SLUG_TO_MODULE: Record<string, string> = {
  clients: "client-database",
  leads: "leads-pipeline",
  communication: "communication",
  invoicing: "quotes-invoicing",
  bookings: "bookings-calendar",
  jobs: "jobs-projects",
  marketing: "marketing",
  team: "team",
  support: "support",
  documents: "documents",
  products: "products",
  memberships: "memberships",
  loyalty: "loyalty",
  "soap-notes": "soap-notes",
  "intake-forms": "intake-forms",
  "gift-cards": "gift-cards",
  "vendor-management": "vendor-management",
  "before-after": "before-after",
  "win-back": "win-back",
  "client-portal": "client-portal",
  automations: "automations",
  reporting: "reporting",
};

/** Combined module slugs — valid in sidebar after a combination is applied */
const KNOWN_COMBINATION_SLUGS = new Set(["book-pay", "schedule-jobs"]);

/** Known dashboard widget manifest IDs */
const KNOWN_WIDGET_MANIFESTS = new Set([
  "setup-checklist",
  "upcoming-bookings",
  "rebookings-due",
  "open-inquiries",
  "proposals-pending",
  "active-jobs",
  "revenue-summary",
  "recent-activity",
  "overdue-invoices",
  "new-leads",
  "sessions-this-week",
  "attendance-rate",
]);

// ── Helpers ─────────────────────────────────────────────────

function resolveSlugToModuleId(slug: string): string | undefined {
  return SLUG_TO_MODULE[slug];
}

function isModuleEnabled(
  slug: string,
  functional: WorkspaceFunctionalConfig,
): boolean {
  // Combined module slugs are valid if they appear in sidebar
  if (KNOWN_COMBINATION_SLUGS.has(slug)) return true;

  const moduleId = resolveSlugToModuleId(slug);
  if (!moduleId) return false;
  if (ALWAYS_ON_MODULES.has(moduleId)) return true;
  return (
    functional.enabledModules.includes(moduleId) ||
    functional.enabledAddons.includes(moduleId)
  );
}

// ── Validator ───────────────────────────────────────────────

export function validateResolvedWorkspace(
  functional: WorkspaceFunctionalConfig,
  presentation: WorkspacePresentationConfig,
): ValidationResult {
  const errors: string[] = [];

  // ── Level 1: Schema validation ──

  const validPatterns = ["booking-first", "inquiry-first", "recurring"];
  if (!validPatterns.includes(functional.workflowPattern)) {
    errors.push(`Invalid workflowPattern: "${functional.workflowPattern}"`);
  }

  if (!presentation.homePage) {
    errors.push("homePage is required");
  }

  if (!presentation.sidebarOrder || presentation.sidebarOrder.length === 0) {
    errors.push("sidebarOrder must have at least one entry");
  }

  if (!presentation.primaryAction?.label || !presentation.primaryAction?.href) {
    errors.push("primaryAction requires label and href");
  }

  const validSizes = new Set(["sm", "md", "lg"]);
  for (const widget of presentation.dashboardWidgets) {
    if (!widget.instanceId) errors.push("Widget missing instanceId");
    if (!widget.manifestId) errors.push("Widget missing manifestId");
    if (widget.w < 1 || widget.w > 4) errors.push(`Widget "${widget.instanceId}" has invalid width: ${widget.w}`);
    if (widget.h < 1 || widget.h > 3) errors.push(`Widget "${widget.instanceId}" has invalid height: ${widget.h}`);
  }

  // ── Level 2: Reference validation ──

  // Homepage must be an enabled module
  if (!isModuleEnabled(presentation.homePage, functional)) {
    errors.push(`homePage "${presentation.homePage}" is not an enabled module`);
  }

  // Sidebar items must be enabled modules
  const seenSlugs = new Set<string>();
  for (const slug of presentation.sidebarOrder) {
    if (seenSlugs.has(slug)) {
      errors.push(`Duplicate sidebar entry: "${slug}"`);
    }
    seenSlugs.add(slug);
    if (!isModuleEnabled(slug, functional)) {
      errors.push(`Sidebar module "${slug}" is not enabled`);
    }
  }

  // Dashboard widget manifests must be registered
  for (const widget of presentation.dashboardWidgets) {
    if (!KNOWN_WIDGET_MANIFESTS.has(widget.manifestId)) {
      errors.push(`Unknown widget manifest: "${widget.manifestId}"`);
    }
  }

  // Module IDs in enabledModules/enabledAddons must be known
  for (const modId of [...functional.enabledModules, ...functional.enabledAddons]) {
    if (!KNOWN_MODULES.has(modId)) {
      errors.push(`Unknown module ID: "${modId}"`);
    }
  }

  // Module behaviors must reference enabled modules
  for (const mb of functional.moduleBehaviors) {
    if (!KNOWN_MODULES.has(mb.moduleId)) {
      errors.push(`ModuleBehavior references unknown module: "${mb.moduleId}"`);
    }
  }

  // ── Level 3: Compatibility ──

  // Dashboard widgets must not overlap
  for (let i = 0; i < presentation.dashboardWidgets.length; i++) {
    const a = presentation.dashboardWidgets[i];
    for (let j = i + 1; j < presentation.dashboardWidgets.length; j++) {
      const b = presentation.dashboardWidgets[j];
      if (
        a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y
      ) {
        errors.push(`Dashboard widgets "${a.instanceId}" and "${b.instanceId}" overlap`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Patch validation ────────────────────────────────────────

export function validatePatch(
  patch: PresentationPatch,
  functional: WorkspaceFunctionalConfig,
): string | null {
  switch (patch.op) {
    case "set-homepage":
      if (!isModuleEnabled(patch.pageId, functional)) {
        return `set-homepage: "${patch.pageId}" is not an enabled module`;
      }
      return null;

    case "reorder-sidebar": {
      const seen = new Set<string>();
      for (const id of patch.itemIds) {
        if (seen.has(id)) return `reorder-sidebar: duplicate entry "${id}"`;
        seen.add(id);
        if (!isModuleEnabled(id, functional)) {
          return `reorder-sidebar: "${id}" is not an enabled module`;
        }
      }
      return null;
    }

    case "rename-module-section":
      if (!patch.label || patch.label.length > 40) {
        return `rename-module-section: label must be 1-40 chars`;
      }
      return null;

    case "set-module-default-columns":
      if (!patch.columnIds || patch.columnIds.length === 0) {
        return `set-module-default-columns: must have at least 1 column`;
      }
      return null;

    case "set-column-label":
      if (!patch.label || patch.label.length > 40) {
        return `set-column-label: label must be 1-40 chars`;
      }
      return null;

    case "replace-dashboard-widgets":
      if (patch.widgets.length > 6) {
        return `replace-dashboard-widgets: max 6 widgets`;
      }
      for (const w of patch.widgets) {
        if (!KNOWN_WIDGET_MANIFESTS.has(w.manifestId)) {
          return `replace-dashboard-widgets: unknown manifest "${w.manifestId}"`;
        }
      }
      return null;

    case "apply-module-combination": {
      const combo = getCombinationById(patch.combinationId);
      if (!combo) {
        return `apply-module-combination: unknown combinationId "${patch.combinationId}"`;
      }
      // All required modules must be enabled
      for (const reqModuleId of combo.applicableTo.requiresModules) {
        const isAlwaysOn = ALWAYS_ON_MODULES.has(reqModuleId);
        const isEnabled =
          functional.enabledModules.includes(reqModuleId) ||
          functional.enabledAddons.includes(reqModuleId);
        if (!isAlwaysOn && !isEnabled) {
          return `apply-module-combination: required module "${reqModuleId}" is not enabled`;
        }
      }
      if (patch.label && patch.label.length > 40) {
        return `apply-module-combination: label must be 1-40 chars`;
      }
      if (patch.description && patch.description.length > 120) {
        return `apply-module-combination: description must be 1-120 chars`;
      }
      return null;
    }

    case "set-module-meta": {
      if (!patch.label || patch.label.length > 40) {
        return `set-module-meta: label must be 1-40 chars`;
      }
      if (!patch.description || patch.description.length > 120) {
        return `set-module-meta: description must be 1-120 chars`;
      }
      return null;
    }

    default:
      return `Unknown patch op`;
  }
}
