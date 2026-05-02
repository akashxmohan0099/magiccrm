"use client";

import { useState } from "react";
import { Filter, ChevronRight, X, Trash2, Plus } from "lucide-react";
import type { FormFieldConfig, FormSuccessVariant } from "@/types/models";
import { fieldHasOptions } from "../helpers";

// Routed thank-you screens — pick a different message/CTA/redirect based
// on the visitor's answer to a chosen field. Useful for inquiries where
// "Wedding" needs different next steps than "Trial". Falls back to the
// default thank-you screen when no variant matches.
export function RoutedThankYouSection({
  fields,
  routeFieldName,
  variants,
  onChangeRouteFieldName,
  onChangeVariants,
}: {
  fields: FormFieldConfig[];
  routeFieldName?: string;
  variants: FormSuccessVariant[];
  onChangeRouteFieldName: (next: string | undefined) => void;
  onChangeVariants: (next: FormSuccessVariant[]) => void;
}) {
  const eligible = fields.filter(
    (f) =>
      f.type === "select" ||
      f.type === "radio" ||
      f.type === "service" ||
      f.type === "multi_select" ||
      f.type === "checkbox",
  );
  const routeField = fields.find((f) => f.name === routeFieldName);

  const updateVariant = (id: string, patch: Partial<FormSuccessVariant>) => {
    onChangeVariants(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };
  const removeVariant = (id: string) => {
    onChangeVariants(variants.filter((v) => v.id !== id));
  };
  const addVariant = () => {
    const id = `var_${Date.now().toString(36)}_${variants.length}`;
    onChangeVariants([
      ...variants,
      { id, label: `Variant ${variants.length + 1}`, matchValues: [] },
    ]);
  };

  // Active = the operator picked a route field. Most forms never need this
  // (one thank-you screen is fine), so the whole block is hidden behind a
  // disclosure. Auto-opens when configured so existing variants stay visible.
  const active = !!routeFieldName;
  const [userExpanded, setUserExpanded] = useState(false);
  const expanded = active || userExpanded;

  // Collapsed state — single line, click to expand. Skipped when there are
  // no eligible fields since we'd just be teasing a feature they can't use.
  if (!expanded && eligible.length > 0) {
    return (
      <div className="border-t border-border-light pt-5">
        <button
          type="button"
          onClick={() => setUserExpanded(true)}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-foreground cursor-pointer transition-colors"
        >
          <Filter className="w-4 h-4 text-violet-700" />
          <span>Show a different thank-you per answer</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    );
  }

  // No eligible fields — the feature is unavailable. Keep the existing
  // hint, but render it as a thin one-liner instead of a heading block.
  if (eligible.length === 0) {
    return (
      <div className="border-t border-border-light pt-5">
        <p className="text-[12.5px] text-text-tertiary inline-flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-violet-700/70" />
          Add a Dropdown, Radio, Multi-select, or Service field to route the thank-you
          screen by answer.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border-light pt-5 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-[18px] h-[18px] text-violet-700 flex-shrink-0" />
            <p className="text-[17px] font-semibold text-foreground">Routed thank-you screens</p>
          </div>
          {!active && (
            <button
              type="button"
              onClick={() => setUserExpanded(false)}
              className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5"
              aria-label="Collapse"
              title="Hide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
          Show a different message based on the visitor&apos;s answer to one field.
          Falls back to the default thank-you screen above when nothing matches.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <label className="block">
          <span className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
            Route on field
          </span>
          <select
            value={routeFieldName ?? ""}
            onChange={(e) => onChangeRouteFieldName(e.target.value || undefined)}
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none"
          >
            <option value="">Disabled — use default screen</option>
            {eligible.map((f) => (
              <option key={f.name} value={f.name}>{f.label || f.name}</option>
            ))}
          </select>
        </label>
      </div>

      {routeFieldName && (
        <div className="space-y-2">
          {variants.map((v) => {
            const opts = routeField && fieldHasOptions(routeField.type) ? routeField.options ?? [] : [];
            return (
              <div key={v.id} className="rounded-lg border border-border-light bg-card-bg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={v.label}
                    onChange={(e) => updateVariant(v.id, { label: e.target.value })}
                    placeholder="Variant label (e.g. Wedding)"
                    className="flex-1 px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(v.id)}
                    className="text-text-tertiary hover:text-red-500 cursor-pointer p-1"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1">When answer is…</p>
                  {opts.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {opts.map((opt) => {
                        const on = v.matchValues.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              updateVariant(v.id, {
                                matchValues: on
                                  ? v.matchValues.filter((m) => m !== opt)
                                  : [...v.matchValues, opt],
                              })
                            }
                            className={`px-2 py-1 rounded-md text-[11.5px] cursor-pointer border transition-colors ${
                              on
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-surface border-border-light text-text-secondary hover:border-text-tertiary"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      value={v.matchValues.join(", ")}
                      onChange={(e) => updateVariant(v.id, { matchValues: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      placeholder="Comma-separated values"
                      className="w-full px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                    />
                  )}
                </div>
                <textarea
                  value={v.message ?? ""}
                  onChange={(e) => updateVariant(v.id, { message: e.target.value || undefined })}
                  rows={2}
                  placeholder="Message override (optional)"
                  className="w-full px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={v.ctaLabel ?? ""}
                    onChange={(e) => updateVariant(v.id, { ctaLabel: e.target.value || undefined })}
                    placeholder="CTA label (optional)"
                    className="px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                  <input
                    value={v.ctaUrl ?? ""}
                    onChange={(e) => updateVariant(v.id, { ctaUrl: e.target.value || undefined })}
                    placeholder="CTA URL (optional)"
                    className="px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none font-mono"
                  />
                </div>
                <input
                  value={v.redirectUrl ?? ""}
                  onChange={(e) => updateVariant(v.id, { redirectUrl: e.target.value || undefined })}
                  placeholder="Redirect URL (optional)"
                  className="w-full px-2.5 py-1.5 bg-surface border border-border-light rounded-md text-[12px] text-foreground placeholder:text-text-tertiary outline-none font-mono"
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={addVariant}
            className="text-[12px] text-primary font-medium hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add variant
          </button>
        </div>
      )}
    </div>
  );
}
