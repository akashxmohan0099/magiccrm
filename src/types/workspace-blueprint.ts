// ── Workspace Blueprint Types ───────────────────────────────
//
// Three planes:
//   1. Functional  — platform-owned, never AI-edited
//   2. Presentation — platform-owned default, AI-editable via typed patches
//   3. User Override — user-owned delta, rebased on workspace version
//
// Invariant: AI cannot touch functional behavior.
// No patch is always safer than a speculative patch.

// ── Workflow Pattern ────────────────────────────────────────

export type WorkflowPattern = "booking-first" | "inquiry-first" | "recurring";

// ── Plane 1: Functional (deterministic, human-authored) ─────

export interface ModuleBehavior {
  moduleId: string;
  /** Sub-feature overrides: featureId → enabled */
  featureOverrides?: Record<string, boolean>;
}

export interface WorkspaceFunctionalConfig {
  workflowPattern: WorkflowPattern;
  enabledModules: string[];
  enabledAddons: string[];
  moduleBehaviors: ModuleBehavior[];
}

// ── Plane 2: Presentation (AI-editable via PresentationPatch) ──

export interface DashboardWidgetInstance {
  instanceId: string;
  manifestId: string;
  title?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export interface ModulePresentation {
  defaultColumns: string[];
  columnLabels?: Record<string, string>;
}

export interface ActiveCombination {
  combinationId: string;
  label: string;
  description: string;
  slug: string;
  tabs: { id: string; label: string; moduleId: string }[];
  crossReferences: { fromTab: string; dataSource: string; display: "badge" | "inline-row"; label: string }[];
  mergedModuleIds: string[];
}

export interface WorkspacePresentationConfig {
  homePage: string;
  sidebarOrder: string[];
  primaryAction: { label: string; href: string; icon: string };
  dashboardWidgets: DashboardWidgetInstance[];
  modulePresentation: Record<string, ModulePresentation>;
  /** Active module combinations (populated by apply-module-combination patches) */
  activeCombinations?: ActiveCombination[];
  /** Personalized module metadata overrides — AI-generated names and descriptions */
  moduleMetaOverrides?: Record<string, { label: string; description: string }>;
}

// ── Patch Ops (8 total — v2 surface) ────────────────────────

export type PresentationPatch =
  | { op: "set-homepage"; pageId: string }
  | { op: "reorder-sidebar"; itemIds: string[] }
  | { op: "rename-module-section"; moduleId: string; label: string }
  | { op: "set-module-default-columns"; moduleId: string; columnIds: string[] }
  | { op: "set-column-label"; moduleId: string; columnId: string; label: string }
  | { op: "replace-dashboard-widgets"; widgets: DashboardWidgetInstance[] }
  | { op: "apply-module-combination"; combinationId: string; label?: string; description?: string }
  | { op: "set-module-meta"; moduleId: string; label: string; description: string };

// ── Adjustable Blocks (onboarding swap points) ──────────────

export interface AdjustableBlockOption {
  value: string;
  label: string;
  description: string;
  /** Functional changes: bounded — only pattern + module add/remove */
  functionalDelta?: {
    workflowPattern?: WorkflowPattern;
    addModules?: string[];
    removeModules?: string[];
  };
  /** Presentation changes: typed patch ops only */
  presentationPatches: PresentationPatch[];
}

export interface AdjustableBlock {
  id: string;
  question: string;
  options: AdjustableBlockOption[];
  default: string;
}

// ── Blueprint (human-authored, per persona) ─────────────────

export interface WorkspaceBlueprint {
  id: string;
  label: string;
  description: string;
  industryId: string;
  personaId?: string;
  functional: WorkspaceFunctionalConfig;
  presentation: WorkspacePresentationConfig;
  adjustableBlocks: AdjustableBlock[];
}

// ── Resolved Workspace (versioned, persisted) ───────────────

export interface ResolvedWorkspace {
  version: number;
  resolvedAt: string;
  blueprintId: string;
  appliedAdjustments: Record<string, string>;
  appliedPatches: PresentationPatch[];
  functional: WorkspaceFunctionalConfig;
  presentation: WorkspacePresentationConfig;
}

// ── Plane 3: User Override (user-owned delta) ───────────────

export interface UserPresentationOverride {
  userId: string;
  workspaceId: string;
  basedOnWorkspaceVersion: number;
  sidebarOrder?: string[];
  hiddenSidebarItemIds?: string[];
  moduleColumnOverrides?: Record<string, {
    hiddenColumnIds?: string[];
    pinnedColumnIds?: string[];
    defaultSort?: { columnId: string; direction: "asc" | "desc" };
  }>;
  dashboardOverrides?: { widgets?: DashboardWidgetInstance[] };
  updatedAt: string;
}

// ── API Contracts ───────────────────────────────────────────

export interface ProvisionWorkspaceArgs {
  workspaceId: string;
  blueprintId: string;
  adjustments: Record<string, string>;
}

export interface ProvisionWorkspaceResult {
  workspace: ResolvedWorkspace;
  status: "created" | "fallback-to-previous" | "fallback-to-base";
  validationErrors?: string[];
}

export interface GetResolvedWorkspaceArgs {
  workspaceId: string;
  userId: string;
}

export interface GetResolvedWorkspaceResult {
  workspace: ResolvedWorkspace;
  userOverride: UserPresentationOverride | null;
  effectivePresentation: WorkspacePresentationConfig;
}

export interface SaveUserOverrideArgs {
  userId: string;
  workspaceId: string;
  override: Omit<UserPresentationOverride, "userId" | "workspaceId" | "updatedAt">;
}

export interface SaveUserOverrideResult {
  success: boolean;
  rebasedOverride?: UserPresentationOverride;
}

// ── Validation ──────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
