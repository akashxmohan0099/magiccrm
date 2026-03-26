"use client";

import { useState, useMemo, useCallback } from "react";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { DateField } from "@/components/ui/DateField";
import { TextArea } from "@/components/ui/TextArea";
import { Button } from "@/components/ui/Button";
import { SchemaRichText } from "@/components/primitives/SchemaRichText";
import { SchemaFileGallery, type FileItem } from "@/components/primitives/SchemaFileGallery";
import { Plus, Trash2, Star } from "lucide-react";
import type { FieldDefinition, FieldCondition } from "@/types/module-schema";

type RecordData = { [key: string]: unknown };

interface SchemaFormProps {
  fields: FieldDefinition[];
  /** Initial values (for editing) */
  initialValues?: RecordData;
  /** Called when form is submitted */
  onSubmit: (data: RecordData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  /** Optional: resolve relation options from external stores */
  resolveRelationOptions?: (moduleId: string) => { value: string; label: string }[];
}

// ── Condition Evaluator ──────────────────────────────────────

function evaluateCondition(condition: FieldCondition, formData: RecordData): boolean {
  const fieldValue = formData[condition.field];

  switch (condition.operator) {
    case "eq": return fieldValue === condition.value;
    case "neq": return fieldValue !== condition.value;
    case "in": return Array.isArray(condition.value) && (condition.value as unknown[]).includes(fieldValue);
    case "notIn": return Array.isArray(condition.value) && !(condition.value as unknown[]).includes(fieldValue);
    case "truthy": return !!fieldValue;
    case "falsy": return !fieldValue;
    default: return true;
  }
}

// ── Sub-Record Editor ────────────────────────────────────────

function SubRecordEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: RecordData[];
  onChange: (items: RecordData[]) => void;
}) {
  const subFields = field.subFields || [];

  const addItem = () => {
    const newItem: RecordData = { _id: crypto.randomUUID() };
    for (const sf of subFields) {
      if (sf.defaultValue !== undefined) newItem[sf.id] = sf.defaultValue;
    }
    onChange([...value, newItem]);
  };

  const updateItem = (index: number, fieldId: string, val: unknown) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [fieldId]: val };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={(item._id as string) || i} className="flex items-start gap-2 p-3 rounded-xl bg-surface border border-border-light">
          <div className="flex-1 grid grid-cols-2 gap-2">
            {subFields.map((sf) => (
              <div key={sf.id} className={sf.type === "textarea" ? "col-span-2" : ""}>
                <label className="text-[11px] font-medium text-text-tertiary mb-0.5 block">{sf.label}</label>
                <FieldInput
                  field={sf}
                  value={item[sf.id]}
                  onChange={(val) => updateItem(i, sf.id, val)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-1.5 text-text-tertiary hover:text-red-500 transition-colors mt-4 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Add {field.label.replace(/s$/, "").toLowerCase()}
      </button>
    </div>
  );
}

// ── Line Item Editor ─────────────────────────────────────────

function LineItemEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: RecordData[];
  onChange: (items: RecordData[]) => void;
}) {
  const subFields = field.subFields || [];

  const addItem = () => {
    const newItem: RecordData = { _id: crypto.randomUUID() };
    for (const sf of subFields) {
      if (sf.defaultValue !== undefined) newItem[sf.id] = sf.defaultValue;
      else if (sf.type === "number" || sf.type === "currency") newItem[sf.id] = 0;
    }
    onChange([...value, newItem]);
  };

  const updateItem = (index: number, fieldId: string, val: unknown) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [fieldId]: val };
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        {subFields.map((sf) => (
          <div key={sf.id} className={`text-[11px] font-semibold text-text-tertiary uppercase tracking-wider ${sf.type === "text" || sf.type === "textarea" ? "flex-1" : "w-24"}`}>
            {sf.label}
          </div>
        ))}
        <div className="w-8" />
      </div>

      {/* Items */}
      {value.map((item, i) => (
        <div key={(item._id as string) || i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border-light">
          {subFields.map((sf) => (
            <div key={sf.id} className={sf.type === "text" || sf.type === "textarea" ? "flex-1" : "w-24"}>
              <FieldInput field={sf} value={item[sf.id]} onChange={(val) => updateItem(i, sf.id, val)} compact />
            </div>
          ))}
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-[12px] text-text-tertiary hover:text-foreground transition-colors px-3 py-2 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> Add line item
      </button>
    </div>
  );
}

// ── Single Field Input ───────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  compact,
  relationOptions,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (val: unknown) => void;
  compact?: boolean;
  relationOptions?: { value: string; label: string }[];
}) {
  const baseClass = compact
    ? "w-full px-2 py-1 text-[12px] rounded-lg border border-border-light bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
    : "w-full px-3 py-2.5 text-[14px] rounded-xl border border-border-light bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
    case "url":
      return (
        <input
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
          required={field.required}
          min={field.min}
          max={field.max}
          pattern={field.pattern}
        />
      );

    case "textarea":
      return (
        <TextArea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={compact ? 2 : 4}
        />
      );

    case "number":
    case "currency":
    case "percentage":
      return (
        <input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={field.placeholder}
          className={baseClass}
          min={field.min}
          max={field.max}
          step={field.type === "currency" ? "0.01" : field.type === "percentage" ? "1" : undefined}
        />
      );

    case "date":
    case "datetime":
      return (
        <DateField
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          allowPast
        />
      );

    case "time":
      return (
        <input
          type="time"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20"
          />
          {!compact && <span className="text-[13px] text-text-secondary">{field.label}</span>}
        </label>
      );

    case "select":
    case "status":
    case "stage":
      return (
        <SelectField
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          options={field.options?.map((o) => ({ value: o.value, label: o.label })) || []}
        />
      );

    case "multiselect": {
      const selected = (value as string[]) || [];
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(
                    isSelected
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value]
                  );
                }}
                className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-surface text-text-tertiary border border-border-light hover:border-primary/20"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    }

    case "relation":
      return (
        <SelectField
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          options={[
            { value: "", label: `Select ${field.label}...` },
            ...(relationOptions || []),
            ...(field.allowInlineCreate ? [{ value: "__new__", label: `+ New ${field.label}` }] : []),
          ]}
        />
      );

    case "rating": {
      const rating = (value as number) || 0;
      return (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star === rating ? 0 : star)}
              className="cursor-pointer"
            >
              <Star
                className={`w-5 h-5 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`}
              />
            </button>
          ))}
        </div>
      );
    }

    case "computed":
      // Computed fields are read-only in forms
      return (
        <div className="px-3 py-2.5 text-[14px] text-text-tertiary bg-surface rounded-xl">
          {value != null ? String(value) : "—"}
        </div>
      );

    case "file":
    case "image":
      return (
        <SchemaFileGallery
          files={(value as FileItem[]) || []}
          onChange={(files) => onChange(files)}
          accept={field.type === "image" ? "image/*" : undefined}
          mode={field.type === "image" ? "grid" : "list"}
          maxFiles={field.type === "image" ? 20 : 10}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      );
  }
}

// ── Schema Form ──────────────────────────────────────────────

export function SchemaForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  resolveRelationOptions,
}: SchemaFormProps) {
  const [formData, setFormData] = useState<RecordData>(() => {
    const initial: RecordData = {};
    for (const field of fields) {
      if (initialValues?.[field.id] !== undefined) {
        initial[field.id] = initialValues[field.id];
      } else if (field.defaultValue !== undefined) {
        initial[field.id] = field.defaultValue;
      }
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    setErrors((prev) => {
      if (prev[fieldId]) {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      }
      return prev;
    });
  }, []);

  // Handle auto-fill when a relation field changes
  const handleFieldChange = useCallback((field: FieldDefinition, value: unknown) => {
    setField(field.id, value);

    // Auto-fill: when a relation is selected, populate other fields
    if (field.autoFillFrom && field.type === "relation" && resolveRelationOptions) {
      // autoFillFrom is handled by the parent via resolveRelationOptions
      // For now, we just set the value. Full auto-fill requires the parent
      // to provide a record lookup function (Phase 5 enhancement).
    }
  }, [setField, resolveRelationOptions]);

  // Group fields by their group property
  const groupedFields = useMemo(() => {
    const formFields = fields.filter((f) => f.showInForm !== false);
    const groups: { name: string; fields: FieldDefinition[] }[] = [];
    const groupMap = new Map<string, FieldDefinition[]>();

    for (const field of formFields) {
      const groupName = field.group || "";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
        groups.push({ name: groupName, fields: groupMap.get(groupName)! });
      }
      groupMap.get(groupName)!.push(field);
    }

    return groups;
  }, [fields]);

  // Validate
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      // Skip hidden fields
      if (field.visibleWhen && !evaluateCondition(field.visibleWhen, formData)) continue;
      if (field.showInForm === false) continue;

      const val = formData[field.id];

      if (field.required && (val === undefined || val === null || val === "")) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (field.min != null && typeof val === "number" && val < field.min) {
        newErrors[field.id] = `${field.label} must be at least ${field.min}`;
      }

      if (field.max != null && typeof val === "number" && val > field.max) {
        newErrors[field.id] = `${field.label} must be at most ${field.max}`;
      }

      if (field.pattern && typeof val === "string" && val) {
        try {
          if (!new RegExp(field.pattern).test(val)) {
            newErrors[field.id] = `${field.label} format is invalid`;
          }
        } catch { /* skip bad regex */ }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {groupedFields.map((group) => (
        <div key={group.name}>
          {group.name && (
            <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              {group.name}
            </h4>
          )}
          <div className="space-y-1">
            {group.fields.map((field) => {
              // Conditional visibility
              if (field.visibleWhen && !evaluateCondition(field.visibleWhen, formData)) {
                return null;
              }

              // Skip computed fields in create mode (no initial values)
              if (field.type === "computed" && !initialValues) return null;

              // Skip timestamp fields in forms
              if (field.id === "createdAt" || field.id === "updatedAt") return null;

              // Nested types get special rendering
              if (field.type === "subRecords") {
                return (
                  <FormField key={field.id} label={field.label} error={errors[field.id]}>
                    <SubRecordEditor
                      field={field}
                      value={(formData[field.id] as RecordData[]) || []}
                      onChange={(items) => setField(field.id, items)}
                    />
                  </FormField>
                );
              }

              if (field.type === "lineItems") {
                return (
                  <FormField key={field.id} label={field.label} error={errors[field.id]}>
                    <LineItemEditor
                      field={field}
                      value={(formData[field.id] as RecordData[]) || []}
                      onChange={(items) => setField(field.id, items)}
                    />
                  </FormField>
                );
              }

              // Boolean fields render their own label
              if (field.type === "boolean") {
                return (
                  <div key={field.id} className="py-1">
                    <FieldInput
                      field={field}
                      value={formData[field.id]}
                      onChange={(val) => handleFieldChange(field, val)}
                    />
                    {errors[field.id] && (
                      <p className="text-[11px] text-red-500 mt-1">{errors[field.id]}</p>
                    )}
                  </div>
                );
              }

              // Standard field
              const relationOptions = field.type === "relation" && field.relationTo && resolveRelationOptions
                ? resolveRelationOptions(field.relationTo)
                : undefined;

              return (
                <FormField
                  key={field.id}
                  label={field.label}
                  required={field.required}
                  error={errors[field.id]}
                  hint={field.type === "computed" ? "Calculated automatically" : undefined}
                >
                  <FieldInput
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field, val)}
                    relationOptions={relationOptions}
                  />
                </FormField>
              );
            })}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
