"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Sparkles, Database, Trash2, Plus } from "lucide-react";
import { useBuilderStore } from "@/store/builder";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/ui/PageTransition";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { CustomCollection, CustomField } from "@/types/custom-feature";

export default function CustomFeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const feature = useBuilderStore((s) =>
    s.customFeatures.find((f) => f.slug === slug && f.status === "ready")
  );

  if (!feature) {
    notFound();
  }

  return (
    <PageTransition>
      <PageHeader
        title={feature.name}
        description={feature.description}
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-text-secondary text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            AI-built feature
          </span>
        }
      />

      {feature.collections.length === 0 ? (
        <EmptyState
          icon={<Database className="w-6 h-6" />}
          title="No collections yet"
          description="This custom feature has no data collections configured."
        />
      ) : (
        <div className="space-y-8">
          {feature.collections.map((collection) => (
            <CollectionSection
              key={collection.id}
              featureId={feature.id}
              collection={collection}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}

/* ── Collection section — renders one collection as a card with a data table ── */

function CollectionSection({
  featureId,
  collection,
}: {
  featureId: string;
  collection: CustomCollection;
}) {
  const { addRecord, deleteRecord } = useBuilderStore();
  const [adding, setAdding] = useState(false);

  const columns: Column<Record<string, unknown>>[] = collection.fields.map(
    (field) => ({
      key: field.id,
      label: field.name,
      sortable: field.type === "text" || field.type === "number" || field.type === "date",
      render: (row: Record<string, unknown>) => formatCellValue(row[field.id], field),
    })
  );

  // Add a delete action column
  columns.push({
    key: "_actions",
    label: "",
    render: (row: Record<string, unknown>) => {
      const idx = collection.records.indexOf(row);
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteRecord(featureId, collection.id, idx);
          }}
          className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete record"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      );
    },
  });

  function handleAddRecord(data: Record<string, unknown>) {
    addRecord(featureId, collection.id, data);
    setAdding(false);
  }

  return (
    <div className="bg-card-bg border border-border-light rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-surface rounded-xl flex items-center justify-center">
            <Database className="w-4 h-4 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              {collection.name}
            </h3>
            <p className="text-[12px] text-text-tertiary">
              {collection.records.length}{" "}
              {collection.records.length === 1 ? "record" : "records"}
            </p>
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setAdding(!adding)}>
          <Plus className="w-3.5 h-3.5" />
          Add Record
        </Button>
      </div>

      {adding && (
        <QuickAddForm
          fields={collection.fields}
          onSubmit={handleAddRecord}
          onCancel={() => setAdding(false)}
        />
      )}

      {collection.records.length === 0 ? (
        <div className="px-5 py-10 text-center text-text-tertiary text-sm">
          No records yet. Click &quot;Add Record&quot; to create one.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={collection.records}
          keyExtractor={(row) =>
            (row._id as string) ?? String(collection.records.indexOf(row))
          }
        />
      )}
    </div>
  );
}

/* ── Quick add form — inline form for adding a record ── */

function QuickAddForm({
  fields,
  onSubmit,
  onCancel,
}: {
  fields: CustomField[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    for (const field of fields) {
      defaults[field.id] = field.defaultValue ?? (field.type === "boolean" ? false : "");
    }
    return defaults;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-5 py-4 bg-surface/50 border-b border-border-light"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              {field.name}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {renderFieldInput(field, values[field.id], (val) =>
              setValues((prev) => ({ ...prev, [field.id]: val }))
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ── Helpers ── */

function renderFieldInput(
  field: CustomField,
  value: unknown,
  onChange: (val: unknown) => void
) {
  const inputClass =
    "w-full px-3 py-2 text-sm bg-card-bg border border-border-light rounded-xl text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  switch (field.type) {
    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-border-light"
          />
          <span className="text-sm text-foreground">Yes</span>
        </label>
      );
    case "number":
      return (
        <input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(Number(e.target.value))}
          required={field.required}
          className={inputClass}
          placeholder={`Enter ${field.name.toLowerCase()}...`}
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClass}
        />
      );
    case "select":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClass}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className={inputClass}
          placeholder={`Enter ${field.name.toLowerCase()}...`}
        />
      );
  }
}

function formatCellValue(value: unknown, field: CustomField): React.ReactNode {
  if (value == null || value === "") {
    return <span className="text-text-tertiary">--</span>;
  }
  switch (field.type) {
    case "boolean":
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            value
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      );
    case "date":
      try {
        return new Date(String(value)).toLocaleDateString();
      } catch {
        return String(value);
      }
    default:
      return String(value);
  }
}
