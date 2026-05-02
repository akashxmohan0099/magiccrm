"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Zap, Eye, Pencil, Code, ToggleRight, ToggleLeft } from "lucide-react";
import type { Form } from "@/types/models";
import { formatRelativeTime } from "../helpers";
import { FormResponses } from "../responses/FormResponses";
import type { SlideMode } from "../editor/types";

export function FormAccordionSection({ label, sublabel, icon, forms, submissionsByFormId, lastSubmittedAtByFormId, onOpen, onToggle, onToggleAutoFlow }: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  forms: Form[];
  submissionsByFormId: Map<string, number>;
  lastSubmittedAtByFormId: Map<string, string>;
  onOpen: (id: string, mode: "preview" | SlideMode) => void;
  onToggle: (form: Form, e: React.MouseEvent) => void;
  onToggleAutoFlow: (form: Form) => void;
}) {
  // Default-expand forms that have responses; collapse empty ones.
  // Computed once on mount per form id; user toggles override.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const f of forms) {
      if ((submissionsByFormId.get(f.id) ?? 0) === 0) s.add(f.id);
    }
    return s;
  });

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</h3>
        </div>
        {sublabel && (
          <span className="text-[12px] text-text-tertiary normal-case font-normal tracking-normal">
            · {sublabel}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {forms.map((form) => {
          const count = submissionsByFormId.get(form.id) ?? 0;
          const isCollapsed = collapsed.has(form.id);
          return (
            <div
              key={form.id}
              className="bg-card-bg border border-border-light rounded-xl overflow-hidden"
            >
              <div className="h-1" style={{ backgroundColor: form.branding.primaryColor || "var(--primary)" }} />
              {/* Header — click anywhere on the title area to toggle.
                  Action buttons on the right stop propagation so they don't
                  also collapse/expand the row. */}
              <div className="flex items-center px-5 py-4 gap-3">
                <button
                  onClick={() => toggleCollapsed(form.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground truncate">
                      {form.name}
                    </p>
                    <p className="text-[12px] text-text-tertiary truncate">
                      {count > 0 ? (
                        <>
                          <span className="text-foreground font-medium">
                            {count} response{count === 1 ? "" : "s"}
                          </span>
                          {lastSubmittedAtByFormId.get(form.id) && (
                            <> · last {formatRelativeTime(lastSubmittedAtByFormId.get(form.id)!)}</>
                          )}
                        </>
                      ) : (
                        // Empty-state subline. Shows form-creation date so a row
                        // with no submissions still carries a real signal —
                        // useful when the operator is auditing stale forms.
                        // The "(disabled)" tail flags forms that aren't live
                        // yet, which is the most common reason for 0 responses.
                        <>
                          Created {formatRelativeTime(form.createdAt)}
                          {!form.enabled && <> · disabled</>}
                        </>
                      )}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAutoFlow(form);
                    }}
                    title={
                      form.autoPromoteToInquiry
                        ? "Auto-flow to Leads is ON — click to turn off"
                        : "Auto-flow to Leads is OFF — click to turn on"
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
                      form.autoPromoteToInquiry
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "text-text-secondary hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      Auto-flow to Leads: {form.autoPromoteToInquiry ? "ON" : "OFF"}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(form.id, "preview"); }}
                    title="Preview"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(form.id, "edit"); }}
                    title="Edit form"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(form.id, "embed"); }}
                    title="Share"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={(e) => onToggle(form, e)}
                    className="cursor-pointer p-1"
                    aria-label={form.enabled ? "Disable form" : "Enable form"}
                  >
                    {form.enabled
                      ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                      : <ToggleLeft className="w-6 h-6 text-text-tertiary" />}
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="border-t border-border-light p-5 bg-surface/30">
                  <FormResponses form={form} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
