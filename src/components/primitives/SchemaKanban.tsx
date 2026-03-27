"use client";

import { useMemo } from "react";
import { KanbanBoard, type KanbanColumn } from "@/components/ui/KanbanBoard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { FieldDefinition, ViewDefinition, StatusFlow } from "@/types/module-schema";

type RecordData = { id: string; [key: string]: unknown };

interface SchemaKanbanProps {
  fields: FieldDefinition[];
  view: ViewDefinition;
  records: RecordData[];
  statusFlow?: StatusFlow;
  onRecordClick?: (record: RecordData) => void;
  onMove: (recordId: string, newValue: string) => void;
}

/**
 * Schema-driven kanban board. Groups records by a select/status/stage field,
 * renders cards showing the configured cardFields.
 */
export function SchemaKanban({
  fields,
  view,
  records,
  statusFlow,
  onRecordClick,
  onMove,
}: SchemaKanbanProps) {
  const fieldMap = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);

  // The field that groups records into columns
  const groupField = fieldMap.get(view.groupByField || "");

  // Build kanban columns from the group field's options
  const columns: KanbanColumn<RecordData>[] = useMemo(() => {
    if (!groupField || !groupField.options) return [];

    // Use status flow states if available and this is a status/stage field
    const states = statusFlow?.field === groupField.id
      ? statusFlow.states
      : null;

    return groupField.options.map((opt) => {
      const state = states?.find((s) => s.value === opt.value);
      return {
        id: opt.value,
        label: state?.label || opt.label,
        color: state?.color || opt.color || "bg-gray-400",
        items: records.filter((r) => r[groupField.id] === opt.value),
      };
    });
  }, [groupField, records, statusFlow]);

  // Fields to display on each card
  const cardFieldDefs = useMemo(() => {
    const cardFieldIds = view.cardFields || view.visibleFields.slice(0, 3);
    return cardFieldIds
      .map((id) => fieldMap.get(id))
      .filter(Boolean) as FieldDefinition[];
  }, [view, fieldMap]);

  // Render a card for a record
  const renderCard = (record: RecordData) => {
    // Find the "name" or "title" field for the card header
    const titleField = fields.find((f) => f.id === "name" || f.id === "title");
    const titleValue = titleField ? (record[titleField.id] as string) : record.id.slice(0, 8);

    return (
      <div
        onClick={() => onRecordClick?.(record)}
        className="bg-white rounded-xl border border-border-light p-3 hover:shadow-md transition-shadow cursor-pointer"
      >
        <p className="text-[13px] font-semibold text-foreground mb-1.5 leading-snug">{titleValue}</p>
        <div className="space-y-1">
          {cardFieldDefs.map((field) => {
            // Skip the group field (already shown as column) and title field
            if (field.id === groupField?.id) return null;
            if (field.id === titleField?.id) return null;

            const val = record[field.id];
            if (val === undefined || val === null || val === "") return null;

            return (
              <div key={field.id} className="flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary">{field.label}</span>
                <CardFieldValue field={field} value={val} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!groupField) {
    return (
      <div className="text-center py-12 text-text-tertiary text-sm">
        No grouping field configured for this kanban view.
      </div>
    );
  }

  return (
    <KanbanBoard
      columns={columns}
      keyExtractor={(item) => item.id}
      renderCard={renderCard}
      onMove={onMove}
    />
  );
}

// ── Card Field Value Renderer ────────────────────────────────

function CardFieldValue({ field, value }: { field: FieldDefinition; value: unknown }) {
  switch (field.type) {
    case "status":
    case "stage":
      return <StatusBadge status={value as string} />;

    case "currency":
      return (
        <span className="text-[11px] font-medium text-foreground tabular-nums">
          ${(value as number).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
        </span>
      );

    case "date":
    case "datetime": {
      try {
        const d = new Date(value as string);
        return (
          <span className="text-[11px] text-text-secondary">
            {d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
          </span>
        );
      } catch {
        return <span className="text-[11px] text-text-secondary">{String(value)}</span>;
      }
    }

    case "relation": {
      // Show display name if available
      return <span className="text-[11px] text-text-secondary">{String(value)}</span>;
    }

    case "select": {
      const opt = field.options?.find((o) => o.value === value);
      return <span className="text-[11px] text-text-secondary">{opt?.label || String(value)}</span>;
    }

    default:
      return <span className="text-[11px] text-text-secondary truncate max-w-[120px]">{String(value)}</span>;
  }
}
