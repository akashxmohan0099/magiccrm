"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { MERGE_FIELDS, MergeFieldDef } from "@/lib/merge-fields";

interface MergeFieldPickerProps {
  onSelect: (fieldKey: string) => void;
}

const CATEGORY_LABELS: Record<MergeFieldDef["category"], string> = {
  client: "Client",
  business: "Business",
  document: "Document",
  date: "Date",
};

const CATEGORY_ORDER: MergeFieldDef["category"][] = [
  "client",
  "business",
  "document",
  "date",
];

export function MergeFieldPicker({ onSelect }: MergeFieldPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Group fields by category
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    fields: MERGE_FIELDS.filter((f) => f.category === category),
  })).filter((g) => g.fields.length > 0);

  function handleSelect(fieldKey: string) {
    setOpen(false);
    onSelect(fieldKey);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text-secondary bg-surface border border-border-warm rounded-lg hover:text-foreground hover:bg-card-bg transition-all duration-150 select-none cursor-pointer"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Insert Field
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 w-56 max-h-72 overflow-y-auto rounded-xl border border-border-warm bg-card-bg shadow-lg"
          role="listbox"
        >
          {grouped.map((group) => (
            <div key={group.category}>
              <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary select-none">
                {group.label}
              </div>
              {group.fields.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelect(field.key)}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-foreground hover:bg-surface transition-colors duration-100 cursor-pointer"
                >
                  {field.label}
                  <span className="ml-1.5 text-[11px] text-text-tertiary">
                    {`{${field.key}}`}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
