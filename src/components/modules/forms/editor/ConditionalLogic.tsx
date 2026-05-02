"use client";

import { Filter, X } from "lucide-react";
import type { FormFieldConfig, FormFieldCondition } from "@/types/models";
import { eligibleConditionFields, fieldHasOptions } from "../helpers";

// Small icon toggle that switches a field's conditional logic on or off.
// Hidden when there's nothing earlier in the form to gate on, since the
// rule would have no valid reference.
export function ConditionToggle({
  fields,
  idx,
  onSeed,
  onClear,
}: {
  fields: FormFieldConfig[];
  idx: number;
  onSeed: () => void;
  onClear: () => void;
}) {
  const field = fields[idx];
  if (field.type === "hidden") return null;
  const eligible = eligibleConditionFields(fields, idx);
  if (eligible.length === 0) return null;

  const on = !!field.showWhen;

  return (
    <button
      type="button"
      onClick={() => (on ? onClear() : onSeed())}
      title={on ? "Logic on — click to remove" : "Show this field only when another answer matches"}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
        on
          ? "text-primary bg-primary/10 hover:bg-primary/15"
          : "text-text-tertiary hover:text-foreground hover:bg-card-bg"
      }`}
    >
      <Filter className="w-3 h-3" />
      <span>{on ? "Logic on" : "Add logic"}</span>
    </button>
  );
}

// Inline rule editor — only renders when the field already has a `showWhen`
// rule (toggled on via the per-field Filter icon). Picks earlier fields as
// reference candidates only.
export function ConditionEditor({
  fields,
  idx,
  onChange,
}: {
  fields: FormFieldConfig[];
  idx: number;
  onChange: (showWhen: FormFieldCondition | undefined) => void;
}) {
  const field = fields[idx];
  const rule = field.showWhen;
  if (!rule) return null;

  const eligibleFields = eligibleConditionFields(fields, idx);
  if (eligibleFields.length === 0) return null;

  const refField = fields.find((f) => f.name === rule.fieldName) ?? eligibleFields[0];
  const refOptions = refField && fieldHasOptions(refField.type) ? refField.options ?? [] : [];

  const updateRule = (patch: Partial<FormFieldCondition>) => {
    onChange({
      fieldName: rule.fieldName,
      operator: rule.operator,
      values: rule.values,
      ...patch,
    });
  };

  return (
    <div className="ml-6 mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
          <Filter className="w-3 h-3" /> Show only when
        </p>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5"
          aria-label="Remove condition"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start">
        <select
          value={rule.fieldName}
          onChange={(e) => updateRule({ fieldName: e.target.value, values: [] })}
          className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
        >
          {eligibleFields.map((f) => (
            <option key={f.name} value={f.name}>{f.label || f.name}</option>
          ))}
        </select>
        <select
          value={rule.operator}
          onChange={(e) => updateRule({ operator: e.target.value as FormFieldCondition["operator"] })}
          className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
        >
          <option value="equals">is</option>
          <option value="not_equals">is not</option>
          <option value="includes">includes</option>
        </select>
        {refOptions.length > 0 ? (
          <select
            value={rule.values[0] ?? ""}
            onChange={(e) => updateRule({ values: e.target.value ? [e.target.value] : [] })}
            className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
          >
            <option value="">Pick a value…</option>
            {refOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            value={rule.values.join(", ")}
            onChange={(e) => updateRule({ values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
            placeholder="Value(s), comma separated"
            className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground placeholder:text-text-tertiary outline-none"
          />
        )}
      </div>
      {rule.values.length === 0 && (
        <p className="text-[10.5px] text-text-tertiary leading-snug">
          e.g. Show <span className="font-mono">Trial date</span> only when <span className="font-mono">Services</span> <span className="italic">includes</span> <span className="font-mono">Trial</span>.
        </p>
      )}
    </div>
  );
}
