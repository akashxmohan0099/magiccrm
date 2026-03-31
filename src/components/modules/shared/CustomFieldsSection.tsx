"use client";

import type { CustomFieldDefinition } from "@/types/industry-config";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";

interface CustomFieldsSectionProps {
  fields: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

const inputClass =
  "w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand";

export function CustomFieldsSection({ fields, values, onChange }: CustomFieldsSectionProps) {
  const setValue = (id: string, value: unknown) => {
    onChange({ ...values, [id]: value });
  };

  // Group fields by `group` property
  const groups: { label: string | null; fields: CustomFieldDefinition[] }[] = [];
  let currentGroup: string | null = null;
  let currentFields: CustomFieldDefinition[] = [];

  for (const field of fields) {
    const group = field.group ?? null;
    if (group !== currentGroup) {
      if (currentFields.length > 0) {
        groups.push({ label: currentGroup, fields: currentFields });
      }
      currentGroup = group;
      currentFields = [field];
    } else {
      currentFields.push(field);
    }
  }
  if (currentFields.length > 0) {
    groups.push({ label: currentGroup, fields: currentFields });
  }

  return (
    <div className="space-y-1">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <div className="pt-3 pb-1">
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                {group.label}
              </h4>
            </div>
          )}
          {group.fields.map((field) => (
            <FormField key={field.id} label={field.label}>
              {field.type === "text" && (
                <input
                  type="text"
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
              {field.type === "textarea" && (
                <TextArea
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={2}
                />
              )}
              {field.type === "number" && (
                <input
                  type="number"
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
              {field.type === "date" && (
                <input
                  type="date"
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  className={inputClass}
                />
              )}
              {field.type === "select" && (
                <SelectField
                  value={(values[field.id] as string) ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                  options={[
                    { value: "", label: "Select..." },
                    ...(field.options ?? []).map((opt) => ({
                      value: opt,
                      label: opt,
                    })),
                  ]}
                />
              )}
              {field.type === "toggle" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!values[field.id]}
                    onChange={(e) => setValue(field.id, e.target.checked)}
                    className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-text-secondary">Yes</span>
                </label>
              )}
            </FormField>
          ))}
        </div>
      ))}
    </div>
  );
}
