"use client";

import { useMemo } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { FieldDefinition, ViewDefinition, StatusFlow } from "@/types/module-schema";

type Record = { id: string; [key: string]: unknown };

interface SchemaTableProps {
  fields: FieldDefinition[];
  view: ViewDefinition;
  records: Record[];
  statusFlow?: StatusFlow;
  onRowClick?: (record: Record) => void;
  storageKey?: string;
}

/** Maps a FieldDefinition to a DataTable Column, including the render function */
function fieldToColumn(
  field: FieldDefinition,
  statusFlow?: StatusFlow,
): Column<Record> {
  const col: Column<Record> = {
    key: field.id,
    label: field.label,
    sortable: field.sortable,
    minWidth: field.type === "email" ? 180 : field.type === "phone" ? 140 : undefined,
  };

  // Custom renderers by field type
  switch (field.type) {
    case "status":
    case "stage": {
      col.render = (item) => {
        const val = item[field.id] as string;
        if (!val) return null;
        // Use StatusBadge — it handles color mapping for common statuses
        return <StatusBadge status={val} />;
      };
      break;
    }

    case "select": {
      col.render = (item) => {
        const val = item[field.id] as string;
        if (!val) return null;
        const opt = field.options?.find((o) => o.value === val);
        return (
          <span className="text-[13px] text-text-secondary">
            {opt?.label || val}
          </span>
        );
      };
      break;
    }

    case "multiselect": {
      col.render = (item) => {
        const vals = item[field.id] as string[];
        if (!vals || vals.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {vals.slice(0, 3).map((v) => {
              const opt = field.options?.find((o) => o.value === v);
              return (
                <span key={v} className="px-2 py-0.5 rounded-full bg-surface text-[11px] text-text-secondary">
                  {opt?.label || v}
                </span>
              );
            })}
            {vals.length > 3 && (
              <span className="text-[11px] text-text-tertiary">+{vals.length - 3}</span>
            )}
          </div>
        );
      };
      break;
    }

    case "boolean": {
      col.render = (item) => {
        const val = item[field.id];
        return (
          <span className={`text-[13px] ${val ? "text-emerald-600" : "text-text-tertiary"}`}>
            {val ? "Yes" : "No"}
          </span>
        );
      };
      break;
    }

    case "currency": {
      col.render = (item) => {
        const val = item[field.id] as number;
        if (val == null) return null;
        return (
          <span className="text-[13px] font-medium text-foreground tabular-nums">
            ${val.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      };
      break;
    }

    case "date":
    case "datetime": {
      col.render = (item) => {
        const val = item[field.id] as string;
        if (!val) return null;
        try {
          const d = new Date(val);
          return (
            <span className="text-[13px] text-text-secondary">
              {d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          );
        } catch {
          return <span className="text-[13px] text-text-tertiary">{val}</span>;
        }
      };
      break;
    }

    case "rating": {
      col.render = (item) => {
        const val = item[field.id] as number;
        if (val == null) return null;
        return <span className="text-[13px]">{"★".repeat(val)}{"☆".repeat(5 - val)}</span>;
      };
      break;
    }

    case "relation": {
      // For table display, show the denormalized name if available
      col.render = (item) => {
        // Convention: relation fields store ID, display name stored as `{fieldId}Name`
        const displayName = item[`${field.id}Name`] as string;
        const id = item[field.id] as string;
        return (
          <span className="text-[13px] text-text-secondary">
            {displayName || id || "—"}
          </span>
        );
      };
      break;
    }

    default: {
      // text, textarea, email, phone, url, number, percentage — use default rendering
      col.render = (item) => {
        const val = item[field.id];
        if (val == null || val === "") return <span className="text-text-tertiary">—</span>;
        return <span className="text-[13px] text-text-secondary">{String(val)}</span>;
      };
    }
  }

  return col;
}

/**
 * Schema-driven table. Wraps the existing DataTable component,
 * automatically building columns from FieldDefinition[].
 */
export function SchemaTable({
  fields,
  view,
  records,
  statusFlow,
  onRowClick,
  storageKey,
}: SchemaTableProps) {
  // Build columns from view's visible fields
  const columns = useMemo(() => {
    const fieldMap = new Map(fields.map((f) => [f.id, f]));
    return view.visibleFields
      .map((fieldId) => fieldMap.get(fieldId))
      .filter(Boolean)
      .map((field) => fieldToColumn(field!, statusFlow));
  }, [fields, view.visibleFields, statusFlow]);

  // Sort data if view has a default sort
  const sortedRecords = useMemo(() => {
    if (!view.sortDefault) return records;
    const { field: sortField, direction } = view.sortDefault;
    return [...records].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return direction === "desc" ? -cmp : cmp;
    });
  }, [records, view.sortDefault]);

  return (
    <DataTable
      columns={columns}
      data={sortedRecords}
      onRowClick={onRowClick}
      keyExtractor={(item) => item.id}
      storageKey={storageKey}
    />
  );
}
