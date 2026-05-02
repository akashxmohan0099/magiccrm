"use client";

import { useState } from "react";
import { X, HelpCircle } from "lucide-react";

// Merge tags available in auto-reply email/SMS bodies. `source` distinguishes
// values pulled from the inquiry (the visitor's input) from workspace settings
// (configured once in Settings → Business). The Info popover renders this so
// non-technical users know where each value comes from.
type MergeTagSource = "inquiry" | "workspace";

export const MERGE_TAGS: Array<{
  label: string;
  token: string;
  source: MergeTagSource;
  description: string;
}> = [
  {
    label: "Name",
    token: "{{name}}",
    source: "inquiry",
    description: "The visitor's name from the form's Full Name field.",
  },
  {
    label: "Business",
    token: "{{businessName}}",
    source: "workspace",
    description:
      "Your business name from Settings → Business. Edit it there to change it everywhere.",
  },
  {
    label: "Service",
    token: "{{serviceInterest}}",
    source: "inquiry",
    description: "The service the visitor picked, if your form has a Service field.",
  },
];

// Inline tag picker — chips insert the token at the textarea caret. The Info
// affordance opens a popover that explains where each value comes from, so
// non-technical users aren't left guessing what `{{businessName}}` resolves to.
export function MergeTagBar({ onInsert }: { onInsert: (token: string) => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-text-tertiary">Insert tag from form:</span>
        {MERGE_TAGS.map((tag) => (
          <button
            key={tag.token}
            type="button"
            onClick={() => onInsert(tag.token)}
            className="text-[10px] px-1.5 py-0.5 rounded border border-border-light bg-card-bg text-text-secondary hover:text-foreground hover:border-text-tertiary cursor-pointer transition-colors"
          >
            {tag.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          aria-expanded={helpOpen}
          aria-label="What are tags?"
          className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5 rounded"
          title="What are these tags?"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {helpOpen && (
        <div
          className="absolute z-20 mt-1.5 right-0 w-[280px] rounded-lg border border-border-light bg-card-bg shadow-lg p-3 space-y-2"
          role="dialog"
        >
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-foreground">How tags work</p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5 -mt-0.5 -mr-1"
              aria-label="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-text-secondary leading-snug">
            Tags get replaced with real values when the auto-reply is sent.
          </p>
          <ul className="space-y-1.5 pt-0.5">
            {MERGE_TAGS.map((tag) => (
              <li key={tag.token} className="text-[11px] leading-snug">
                <code className="font-mono text-[10.5px] px-1 py-0.5 rounded bg-surface text-foreground">
                  {tag.token}
                </code>
                <span className="text-text-secondary">
                  {" "}— {tag.description}{" "}
                </span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded ${
                    tag.source === "workspace"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {tag.source === "workspace" ? "From Settings" : "From form"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
