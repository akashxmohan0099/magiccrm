// ── useModuleSchema ──────────────────────────────────────────
//
// Hook for legacy components to consume assembled schema data.
// Returns personalized labels, empty states, status options,
// and custom fields — WITHOUT replacing the component's rendering.
//
// Usage in a legacy page:
//   const ms = useModuleSchema("bookings-calendar");
//   <h1>{ms.label}</h1>           // "Appointments" for hair salon
//   <Button>{ms.primaryAction}</Button>  // "New Appointment"
//   {records.length === 0 && <EmptyState title={ms.emptyTitle} />}

import { useMemo } from "react";
import { useAssembledSchemasStore } from "@/store/assembled-schemas";
import type { ModuleSchema, FieldDefinition, StatusFlow } from "@/types/module-schema";

export interface ModuleSchemaInfo {
  /** Whether an assembled schema exists for this module */
  hasSchema: boolean;
  /** The full schema (if available) */
  schema: ModuleSchema | null;

  // ── Labels (the main reason legacy components use this) ──
  /** Module display label (e.g., "Appointments" for a hair salon's bookings) */
  label: string | null;
  /** Module description */
  description: string | null;
  /** Primary action button text (e.g., "New Appointment") */
  primaryAction: string | null;
  /** Primary action icon name */
  primaryActionIcon: string | null;

  // ── Empty state ──
  emptyTitle: string | null;
  emptyDescription: string | null;
  emptySetupSteps: { label: string; description: string }[] | null;

  // ── Status / stage ──
  /** Status flow with personalized state labels */
  statusFlow: StatusFlow | null;
  /** Quick lookup: status value → personalized label */
  statusLabel: (value: string) => string;

  // ── Custom fields ──
  /** Extra persona-specific fields not in the legacy form (e.g., hairType, allergies) */
  customFields: FieldDefinition[];
  /** All fields from schema (useful for column overrides) */
  allFields: FieldDefinition[];

  // ── View info ──
  /** Ordered list of view labels */
  viewLabels: { id: string; label: string; type: string }[];
}

/** Base field IDs that exist in ALL legacy module forms. Anything extra is a "custom" persona field. */
const LEGACY_FIELD_IDS: Record<string, Set<string>> = {
  "client-database": new Set(["name", "email", "phone", "company", "address", "tags", "notes", "source", "status", "createdAt", "updatedAt"]),
  "leads-pipeline": new Set(["name", "email", "phone", "company", "source", "stage", "value", "notes", "clientId", "lastContactedAt", "nextFollowUpDate", "createdAt", "updatedAt"]),
  "bookings-calendar": new Set(["title", "clientId", "date", "startTime", "endTime", "status", "notes", "recurring", "serviceId", "serviceName", "price", "duration", "cancellationReason", "assignedToId", "assignedToName", "satisfactionRating", "satisfactionFeedback", "createdAt", "updatedAt"]),
  "quotes-invoicing": new Set(["number", "clientId", "jobId", "lineItems", "status", "dueDate", "notes", "paymentSchedule", "depositPercent", "depositPaid", "milestones", "paidAmount", "taxRate", "recurringSchedule", "lastRecurringDate", "createdAt", "updatedAt"]),
  "jobs-projects": new Set(["title", "description", "clientId", "stage", "tasks", "timeEntries", "files", "dueDate", "assignedToId", "assignedToName", "satisfactionRating", "satisfactionFeedback", "createdAt", "updatedAt"]),
  "products": new Set(["name", "description", "price", "category", "sku", "inStock", "quantity", "createdAt", "updatedAt"]),
  "communication": new Set(["contactName", "contactEmail", "contactPhone", "channel", "subject", "lastMessage", "status", "clientId", "leadId", "lastMessageAt", "createdAt", "updatedAt"]),
  "team": new Set(["name", "email", "phone", "role", "status", "createdAt", "updatedAt"]),
};

/**
 * Returns personalized schema info for a legacy module component.
 * Falls back gracefully — all fields return null/empty when no schema exists.
 */
export function useModuleSchema(moduleId: string): ModuleSchemaInfo {
  const schemas = useAssembledSchemasStore((s) => s.schemas);
  const assembled = useAssembledSchemasStore((s) => s.assembled);

  return useMemo(() => {
    const schema = assembled ? schemas[moduleId] ?? null : null;

    if (!schema) {
      return {
        hasSchema: false,
        schema: null,
        label: null,
        description: null,
        primaryAction: null,
        primaryActionIcon: null,
        emptyTitle: null,
        emptyDescription: null,
        emptySetupSteps: null,
        statusFlow: null,
        statusLabel: (v: string) => v,
        customFields: [],
        allFields: [],
        viewLabels: [],
      };
    }

    // Build status label lookup
    const statusMap = new Map<string, string>();
    if (schema.statusFlow) {
      for (const state of schema.statusFlow.states) {
        statusMap.set(state.value, state.label);
      }
    }

    // Identify custom fields (fields in schema but not in legacy form)
    const legacyIds = LEGACY_FIELD_IDS[moduleId] || new Set<string>();
    const customFields = schema.fields.filter(
      (f) => !legacyIds.has(f.id) && f.showInForm !== false,
    );

    return {
      hasSchema: true,
      schema,
      label: schema.label,
      description: schema.description,
      primaryAction: schema.primaryAction?.label ?? null,
      primaryActionIcon: schema.primaryAction?.icon ?? null,
      emptyTitle: schema.emptyState?.title ?? null,
      emptyDescription: schema.emptyState?.description ?? null,
      emptySetupSteps: schema.emptyState?.setupSteps ?? null,
      statusFlow: schema.statusFlow ?? null,
      statusLabel: (v: string) => statusMap.get(v) ?? v,
      customFields,
      allFields: schema.fields,
      viewLabels: schema.views.map((v) => ({ id: v.id, label: v.label, type: v.type })),
    };
  }, [assembled, schemas, moduleId]);
}
