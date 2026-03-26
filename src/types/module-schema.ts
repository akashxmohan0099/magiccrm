// ── Module Schema Types ─────────────────────────────────────
//
// A ModuleSchema describes everything needed to render a complete
// module from feature primitives. Modules are NOT hardcoded pages.
// They are compositions of 10 feature primitives (table, form,
// calendar, kanban, etc.) configured by these schemas.
//
// Kimi tunes the presentation layer (labels, descriptions, placeholders).
// The functional layer (field types, views, actions) is deterministic
// and pre-tested.

// ── Field Types ──────────────────────────────────────────────

export type FieldType =
  // Text
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  // Numbers
  | "number"
  | "currency"
  | "percentage"
  // Date/Time
  | "date"
  | "datetime"
  | "time"
  // Boolean
  | "boolean"
  // Selection
  | "select"
  | "multiselect"
  | "status"       // select with color-coded badges
  | "stage"        // select used for pipeline/kanban grouping
  // Relationships
  | "relation"     // links to another module's records
  // Media
  | "file"
  | "image"
  // Other
  | "rating"
  | "computed"     // derived from other fields (totals, scores)
  // Nested
  | "lineItems"    // nested row editor (invoice lines)
  | "subRecords";  // nested collection (tasks in a job)

// ── Field Conditions ─────────────────────────────────────────

/** Conditional logic — determines when a field is visible or an action fires */
export interface FieldCondition {
  /** Which field to evaluate */
  field: string;
  /** Comparison operator */
  operator: "eq" | "neq" | "in" | "notIn" | "truthy" | "falsy";
  /** Value to compare against (not needed for truthy/falsy) */
  value?: unknown;
}

// ── Field Definition ─────────────────────────────────────────

/** Auto-fill rule: when a relation is selected, populate other fields from the related record */
export interface AutoFillRule {
  /** Field ID on the related record to read from */
  sourceField: string;
  /** Field ID on this record to write to */
  targetField: string;
}

/** A single field definition — the atom of the schema system */
export interface FieldDefinition {
  id: string;
  label: string;                       // AI-tunable display label
  type: FieldType;
  required?: boolean;
  placeholder?: string;                // AI-tunable
  defaultValue?: unknown;

  // ── Type-specific config ──
  /** Options for select/multiselect/status/stage fields */
  options?: { value: string; label: string; color?: string }[];
  /** Target module ID for relation fields */
  relationTo?: string;
  /** Allow creating a new related record inline (e.g., "+ New Client" in a dropdown) */
  allowInlineCreate?: boolean;
  /** Auto-fill other fields when this relation is selected */
  autoFillFrom?: AutoFillRule[];
  /** Expression for computed fields (e.g., "SUM(lineItems.quantity * lineItems.unitPrice)") */
  computeExpression?: string;
  /** Field definitions for nested lineItems or subRecords */
  subFields?: FieldDefinition[];

  // ── Display config ──
  /** Form section group (e.g., "Contact Info", "Billing Details") */
  group?: string;
  /** Visible in table view by default */
  showInTable?: boolean;
  /** Visible in create/edit form */
  showInForm?: boolean;
  /** Visible in detail panel */
  showInDetail?: boolean;
  /** Visible on kanban cards */
  showInCard?: boolean;
  sortable?: boolean;
  searchable?: boolean;

  // ── Conditional visibility ──
  /** Show this field only when condition is met (e.g., payment mode = "deposit") */
  visibleWhen?: FieldCondition;

  // ── Validation ──
  min?: number;
  max?: number;
  /** Regex pattern for text validation */
  pattern?: string;
}

// ── View Definition ──────────────────────────────────────────

export type ViewType =
  | "table"
  | "kanban"
  | "calendar"
  | "detail"
  | "chart";

export interface ViewDefinition {
  id: string;
  type: ViewType;
  label: string;                       // AI-tunable ("List", "Pipeline", "Calendar")
  isDefault?: boolean;

  /** Which fields this view displays */
  visibleFields: string[];

  // ── View-specific config ──
  /** Kanban: which field groups the columns */
  groupByField?: string;
  /** Calendar: which field is the start date */
  dateField?: string;
  /** Calendar: which field is the end date */
  endDateField?: string;
  /** Default sort */
  sortDefault?: { field: string; direction: "asc" | "desc" };

  // ── Visual config ──
  /** Kanban: which fields to show on cards */
  cardFields?: string[];
  /** Which field drives row/card color coding */
  colorField?: string;
}

// ── Status/Stage Flow ────────────────────────────────────────

export interface StatusState {
  value: string;
  label: string;                       // AI-tunable
  color: string;                       // Tailwind color class
  isClosed?: boolean;                  // Terminal state (won, lost, completed, cancelled)
}

export interface StatusFlow {
  /** Which field holds the status/stage value */
  field: string;
  /** All possible states */
  states: StatusState[];
  /** Optional: allowed state transitions (if omitted, any transition is allowed) */
  transitions?: {
    from: string;
    to: string[];
  }[];
}

// ── Action Definitions ───────────────────────────────────────

/** Field mapping for conversion actions */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: "copy" | "clone-line-items" | "generate-id";
}

/** Record update applied to source after conversion */
export interface SourceUpdate {
  field: string;
  /** Use "$targetId" to reference the ID of the created target record */
  value: unknown;
}

/** Conversion action — Lead→Client, Quote→Invoice, etc. */
export interface ConvertAction {
  id: string;
  type: "convert";
  label: string;                       // AI-tunable
  icon?: string;
  showOn: "row" | "detail" | "toolbar";

  targetModule: string;
  fieldMapping: FieldMapping[];
  sourceUpdates: SourceUpdate[];
  targetDefaults: { field: string; value: unknown }[];
}

/** Cascade delete — when a record is deleted, clean up related records */
export interface CascadeDeleteAction {
  id: string;
  type: "cascade-delete";
  targetModules: {
    moduleId: string;
    /** Field in the target module that references this module's records */
    foreignKey: string;
  }[];
}

/** Notification action — triggers notification to another module */
export interface NotifyAction {
  id: string;
  type: "notify";
  label: string;
  trigger: "on-status-change" | "on-delete" | "manual";
  triggerCondition?: FieldCondition;
  targetModule: string;
  dataMapping: { sourceField: string; targetField: string }[];
}

/** Navigation action — simple link to another page */
export interface NavigateAction {
  id: string;
  type: "navigate";
  label: string;                       // AI-tunable
  icon?: string;
  showOn: "row" | "detail" | "toolbar";
  href: string;
}

export type ActionDefinition =
  | ConvertAction
  | CascadeDeleteAction
  | NotifyAction
  | NavigateAction;

// ── Module Schema ────────────────────────────────────────────

export interface ModuleSchema {
  /** Unique module identifier */
  id: string;
  /** Display name — AI-tunable */
  label: string;
  /** Module description — AI-tunable */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** URL route slug */
  slug: string;

  // ── Data definition ──
  fields: FieldDefinition[];
  statusFlow?: StatusFlow;

  // ── Relations ──
  relations?: {
    /** Field ID in this module (must be a "relation" field) */
    field: string;
    /** Target module ID */
    targetModule: string;
    /** Field in target for reverse lookups */
    targetField?: string;
    /** What field to display from the target (e.g., "name") */
    displayField?: string;
  }[];

  // ── UI composition ──
  views: ViewDefinition[];
  /** ID of the default view */
  primaryView: string;

  // ── Actions ──
  actions?: ActionDefinition[];
  /** Main "Add" button config */
  primaryAction?: {
    label: string;                     // AI-tunable
    icon?: string;
  };

  // ── Empty state ──
  emptyState?: {
    title: string;                     // AI-tunable
    description: string;               // AI-tunable
    setupSteps?: { label: string; description: string }[];
  };

  // ── Capabilities ──
  capabilities: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canBulkEdit: boolean;
    canImport: boolean;
    canExport: boolean;
    hasDetailPanel: boolean;
  };
}

// ── Schema Variant ───────────────────────────────────────────

/** A persona variant is a partial override of a base schema */
export interface SchemaVariant {
  /** Base schema ID to extend */
  baseSchemaId: string;
  /** Variant identifier (e.g., "hair-salon:book-pay") */
  variantId: string;
  /** Persona this variant is for */
  personaId: string;
  /** Industry this variant belongs to */
  industryId: string;

  /** Partial overrides — deep-merged with base schema */
  overrides: {
    label?: string;
    description?: string;
    icon?: string;
    slug?: string;

    /** Fields to add, remove, or modify */
    fieldOverrides?: {
      /** Add new fields */
      add?: FieldDefinition[];
      /** Remove fields by ID */
      remove?: string[];
      /** Modify existing fields (matched by ID, shallow-merged) */
      modify?: Partial<FieldDefinition & { id: string }>[];
    };

    /** Override status flow */
    statusFlow?: StatusFlow;

    /** Override views */
    viewOverrides?: {
      add?: ViewDefinition[];
      remove?: string[];
      modify?: Partial<ViewDefinition & { id: string }>[];
    };
    primaryView?: string;

    /** Override actions */
    actionOverrides?: {
      add?: ActionDefinition[];
      remove?: string[];
    };

    primaryAction?: { label: string; icon?: string };
    emptyState?: ModuleSchema["emptyState"];
  };
}

// ── AI Tuning Result ─────────────────────────────────────────

/** What Kimi returns — ONLY presentation text, never structural changes */
export interface SchemaTuningResult {
  moduleId: string;
  labelOverrides: {
    moduleLabel?: string;
    moduleDescription?: string;
    fieldLabels?: Record<string, string>;         // field ID → new label
    fieldPlaceholders?: Record<string, string>;   // field ID → new placeholder
    viewLabels?: Record<string, string>;          // view ID → new label
    actionLabels?: Record<string, string>;        // action ID → new label
    statusLabels?: Record<string, string>;        // status value → new label
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    primaryActionLabel?: string;
  };
}

// ── Validation Result ────────────────────────────────────────

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  level: 1 | 2 | 3 | 4;
}
