"use client";

import { useMemo } from "react";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Star } from "lucide-react";
import type { FieldDefinition, StatusFlow } from "@/types/module-schema";

type RecordData = { id: string; [key: string]: unknown };

interface SchemaDetailProps {
  fields: FieldDefinition[];
  record: RecordData;
  statusFlow?: StatusFlow;
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Called when user wants to edit this record */
  onEdit?: () => void;
  /** Called when user wants to delete this record */
  onDelete?: () => void;
  /** Action buttons to render in the header */
  actions?: { label: string; icon?: React.ReactNode; onClick: () => void; variant?: "primary" | "danger" }[];
}

/** Render a single field value in the detail panel */
function FieldValue({
  field,
  value,
  statusFlow,
}: {
  field: FieldDefinition;
  value: unknown;
  statusFlow?: StatusFlow;
}) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-text-tertiary text-[13px]">—</span>;
  }

  switch (field.type) {
    case "status":
    case "stage":
      return <StatusBadge status={value as string} />;

    case "select": {
      const opt = field.options?.find((o) => o.value === value);
      return <span className="text-[13px] text-foreground">{opt?.label || String(value)}</span>;
    }

    case "multiselect": {
      const vals = value as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {vals.map((v) => {
            const opt = field.options?.find((o) => o.value === v);
            return (
              <span key={v} className="px-2 py-0.5 rounded-full bg-surface text-xs text-text-secondary border border-border-light">
                {opt?.label || v}
              </span>
            );
          })}
        </div>
      );
    }

    case "boolean":
      return (
        <span className={`text-[13px] ${value ? "text-emerald-600" : "text-text-tertiary"}`}>
          {value ? "Yes" : "No"}
        </span>
      );

    case "currency":
      return (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          ${(value as number).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
        </span>
      );

    case "percentage":
      return <span className="text-[13px] text-foreground">{String(value)}%</span>;

    case "date":
    case "datetime": {
      try {
        const d = new Date(value as string);
        return (
          <span className="text-[13px] text-foreground">
            {d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        );
      } catch {
        return <span className="text-[13px] text-foreground">{String(value)}</span>;
      }
    }

    case "rating": {
      const rating = value as number;
      return (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`w-4 h-4 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />
          ))}
        </div>
      );
    }

    case "relation": {
      return <span className="text-[13px] text-primary">{String(value)}</span>;
    }

    case "textarea":
      return <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">{String(value)}</p>;

    case "email":
      return <a href={`mailto:${value}`} className="text-[13px] text-primary hover:underline">{String(value)}</a>;

    case "phone":
      return <a href={`tel:${value}`} className="text-[13px] text-primary hover:underline">{String(value)}</a>;

    case "url":
      return <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline">{String(value)}</a>;

    case "subRecords": {
      const items = value as RecordData[];
      if (!items.length) return <span className="text-text-tertiary text-[13px]">None</span>;
      return (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border-light">
              {field.subFields?.map((sf) => (
                <span key={sf.id} className="text-xs text-text-secondary">
                  {sf.type === "boolean" ? (item[sf.id] ? "✓" : "○") : String(item[sf.id] || "")}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "file":
    case "image": {
      const files = value as { name: string }[];
      if (!Array.isArray(files) || files.length === 0) return <span className="text-text-tertiary text-[13px]">No files</span>;
      return (
        <div className="space-y-1">
          {files.map((f, i) => (
            <span key={i} className="text-[13px] text-text-secondary block">{f.name}</span>
          ))}
        </div>
      );
    }

    case "lineItems": {
      const items = value as RecordData[];
      if (!items.length) return <span className="text-text-tertiary text-[13px]">None</span>;
      return (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-surface border border-border-light">
              <span className="text-[13px] text-foreground">{String(item.description || item.title || `Item ${i + 1}`)}</span>
              <span className="text-[13px] font-medium text-foreground tabular-nums">
                {item.quantity && item.unitPrice
                  ? `${item.quantity} × $${Number(item.unitPrice).toFixed(2)}`
                  : ""}
              </span>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <span className="text-[13px] text-foreground">{String(value)}</span>;
  }
}

/**
 * Schema-driven detail panel. Renders a record's fields in a
 * slide-over panel, grouped by field.group.
 */
export function SchemaDetail({
  fields,
  record,
  statusFlow,
  open,
  onClose,
  title,
  onEdit,
  onDelete,
  actions,
}: SchemaDetailProps) {
  // Group fields for display
  const groups = useMemo(() => {
    const detailFields = fields.filter((f) => f.showInDetail !== false);
    const grouped: { name: string; fields: FieldDefinition[] }[] = [];
    const map = new Map<string, FieldDefinition[]>();

    for (const field of detailFields) {
      const groupName = field.group || "";
      if (!map.has(groupName)) {
        map.set(groupName, []);
        grouped.push({ name: groupName, fields: map.get(groupName)! });
      }
      map.get(groupName)!.push(field);
    }
    return grouped;
  }, [fields]);

  // Get the display title from the record
  const displayTitle = title || (record.name as string) || (record.title as string) || `Record ${record.id?.slice(0, 8)}`;

  return (
    <SlideOver open={open} onClose={onClose} title={displayTitle} wide>
      <div className="space-y-6">
        {/* Action buttons */}
        {(onEdit || onDelete || actions) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-[13px] font-medium text-foreground bg-surface rounded-xl border border-border-light hover:bg-background transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            {actions?.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`px-4 py-2 text-[13px] font-medium rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  action.variant === "danger"
                    ? "text-red-600 border-red-200 hover:bg-red-50"
                    : action.variant === "primary"
                    ? "text-white bg-foreground border-foreground hover:opacity-90"
                    : "text-foreground bg-surface border-border-light hover:bg-background"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-[13px] font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer ml-auto"
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Field groups */}
        {groups.map((group) => (
          <div key={group.name}>
            {group.name && (
              <h4 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3 pb-2 border-b border-border-light">
                {group.name}
              </h4>
            )}
            <div className="space-y-3">
              {group.fields.map((field) => {
                // Skip empty timestamp fields
                if ((field.id === "createdAt" || field.id === "updatedAt") && !record[field.id]) return null;

                return (
                  <div key={field.id}>
                    <dt className="text-[11px] font-medium text-text-tertiary mb-1">{field.label}</dt>
                    <dd>
                      <FieldValue field={field} value={record[field.id]} statusFlow={statusFlow} />
                    </dd>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </SlideOver>
  );
}
