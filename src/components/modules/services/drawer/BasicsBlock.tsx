"use client";

import { LogoUpload } from "@/components/ui/LogoUpload";
import type { FormState } from "./types";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

/**
 * Top of Essentials — Name, Category, Description, Image. Pure inputs that
 * write straight to the form state. No cross-field logic. Uses the same
 * dense small-input pattern as every other drawer section so the form
 * reads as one consistent surface.
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
    <div className="space-y-3">
      <div>
        <label className="text-[11px] text-text-tertiary block mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          autoFocus
          type="text"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Bridal Trial"
          className={smallInputClass}
        />
        {errors.name && (
          <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="text-[11px] text-text-tertiary block mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className={smallInputClass}
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[11px] text-text-tertiary block mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="What's included in this service…"
          rows={2}
          className={`${smallInputClass} resize-none`}
        />
      </div>

      <LogoUpload
        compact
        label="Image"
        value={form.imageUrl}
        onChange={(v) => update("imageUrl", v)}
      />
    </div>
  );
}
