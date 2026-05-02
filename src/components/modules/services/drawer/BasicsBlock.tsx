"use client";

import { FormField } from "@/components/ui/FormField";
import { LogoUpload } from "@/components/ui/LogoUpload";
import type { FormState } from "./types";

const inputClass =
  "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

/**
 * Top of Essentials — Name, Category, Description, Image. Pure inputs that
 * write straight to the form state. No cross-field logic.
 */
export function BasicsBlock({
  form,
  update,
  errors,
  categoryOptions,
}: {
  form: FormState;
  update: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  errors: Record<string, string>;
  categoryOptions: string[];
}) {
  return (
    <div className="space-y-1">
      <FormField label="Name" required error={errors.name}>
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Bridal Trial"
          className={inputClass}
        />
      </FormField>

      <FormField label="Category">
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className={inputClass}
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What's included in this service…"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </FormField>

      <LogoUpload
        label="Image (1:1)"
        hint="Square photo shown on the booking page. Falls back to a tinted letter card."
        value={form.imageUrl}
        onChange={(v) => update("imageUrl", v)}
      />
    </div>
  );
}
