"use client";

import { useModuleSchema } from "@/hooks/useModuleSchema";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { TextArea } from "@/components/ui/TextArea";

interface SchemaCustomFieldsProps {
  moduleId: string;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
}

/**
 * Renders persona-specific custom fields from the assembled schema.
 * Drop this into any legacy form to surface fields like hairType,
 * propertyType, fitnessGoal, etc.
 */
export function SchemaCustomFields({ moduleId, values, onChange }: SchemaCustomFieldsProps) {
  const ms = useModuleSchema(moduleId);
  if (!ms.hasSchema || ms.customFields.length === 0) return null;

  return (
    <div className="border-t border-border-light pt-5 mt-5">
      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Additional Details
      </p>
      {ms.customFields.map((field) => {
        // Render appropriate input based on field type
        switch (field.type) {
          case "select":
            return (
              <FormField key={field.id} label={field.label} required={field.required}>
                <SelectField
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  options={field.options?.map(o => ({ value: o.value, label: o.label })) || []}
                />
              </FormField>
            );
          case "textarea":
            return (
              <FormField key={field.id} label={field.label} required={field.required}>
                <TextArea
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                />
              </FormField>
            );
          default:
            return (
              <FormField key={field.id} label={field.label} required={field.required}>
                <input
                  type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                  value={(values[field.id] as string) || ""}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border-light bg-card-bg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </FormField>
            );
        }
      })}
    </div>
  );
}
