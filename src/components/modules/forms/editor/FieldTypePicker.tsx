"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Type, Mail, Phone, Link as LinkIcon, Hash, AlignLeft, ChevronsUpDown,
  ListChecks, CircleDot, CheckSquare, Upload, Sparkles, Calendar,
  CalendarRange, Clock, PenLine, EyeOff, X,
} from "lucide-react";
import type { FormFieldConfig } from "@/types/models";

// Per-type metadata used by both the picker and the editor row chrome.
export const FIELD_TYPE_META: Record<
  FormFieldConfig["type"],
  { label: string; description: string; defaultLabel: string; icon: React.ComponentType<{ className?: string }> }
> = {
  text: { label: "Text", description: "Single line of text", defaultLabel: "Text", icon: Type },
  email: { label: "Email", description: "Validates an email address", defaultLabel: "Email", icon: Mail },
  phone: { label: "Phone", description: "Phone number with tel keypad", defaultLabel: "Phone", icon: Phone },
  url: { label: "Link", description: "Website or social URL", defaultLabel: "Link", icon: LinkIcon },
  number: { label: "Number", description: "Numeric input", defaultLabel: "Number", icon: Hash },
  textarea: { label: "Long Text", description: "Multi-line message or notes", defaultLabel: "Message", icon: AlignLeft },
  select: { label: "Dropdown", description: "Pick one from a list", defaultLabel: "Select an option", icon: ChevronsUpDown },
  multi_select: { label: "Multi-select", description: "Pick more than one from a list", defaultLabel: "Pick all that apply", icon: ListChecks },
  radio: { label: "Radio buttons", description: "Pick one — visible options", defaultLabel: "Choose one", icon: CircleDot },
  checkbox: { label: "Checkboxes", description: "Pick more than one — visible options", defaultLabel: "Pick all that apply", icon: CheckSquare },
  file: { label: "File / photo", description: "Upload an image, PDF, or any file", defaultLabel: "Reference photo", icon: Upload },
  service: { label: "Service", description: "Pick from your live services list", defaultLabel: "Service Interest", icon: Sparkles },
  date: { label: "Date", description: "Single calendar date", defaultLabel: "Date", icon: Calendar },
  date_range: { label: "Date Range", description: "Start and end date", defaultLabel: "Date Range", icon: CalendarRange },
  time: { label: "Time", description: "A specific time of day", defaultLabel: "Time", icon: Clock },
  signature: { label: "Signature", description: "Sign with finger or pointer; stored as image", defaultLabel: "Signature", icon: PenLine },
  hidden: { label: "Hidden", description: "Auto-captured from URL — UTM, source, ref", defaultLabel: "Source", icon: EyeOff },
};

// Stable ordering used by the type-changer dropdown in the field row.
export const FIELD_TYPE_ORDER: FormFieldConfig["type"][] = [
  "text",
  "email",
  "phone",
  "url",
  "number",
  "textarea",
  "select",
  "multi_select",
  "radio",
  "checkbox",
  "file",
  "service",
  "date",
  "date_range",
  "time",
  "signature",
  "hidden",
];

export type FieldTint = { bg: string; icon: string };

export const FIELD_TYPE_CATEGORIES: { label: string; types: FormFieldConfig["type"][]; tint: FieldTint }[] = [
  {
    label: "Contact",
    types: ["text", "email", "phone", "url"],
    tint: { bg: "bg-gradient-to-br from-sky-50 to-sky-100/60 border-sky-100", icon: "text-sky-700" },
  },
  {
    label: "Choice",
    types: ["select", "multi_select", "radio", "checkbox"],
    tint: { bg: "bg-gradient-to-br from-violet-50 to-violet-100/60 border-violet-100", icon: "text-violet-700" },
  },
  {
    label: "Content",
    types: ["textarea", "number", "file"],
    tint: { bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-100", icon: "text-emerald-700" },
  },
  {
    label: "Date & Time",
    types: ["date", "date_range", "time"],
    tint: { bg: "bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-100", icon: "text-amber-700" },
  },
  {
    label: "Advanced",
    types: ["service", "signature", "hidden"],
    tint: { bg: "bg-gradient-to-br from-slate-100 to-slate-200/60 border-slate-200", icon: "text-slate-600" },
  },
];

// Reverse-lookup from field type → tint, derived from FIELD_TYPE_CATEGORIES
// so the two can never drift apart.
export const FIELD_TYPE_TINT: Record<FormFieldConfig["type"], FieldTint> = (() => {
  const map = {} as Record<FormFieldConfig["type"], FieldTint>;
  for (const cat of FIELD_TYPE_CATEGORIES) {
    for (const t of cat.types) map[t] = cat.tint;
  }
  return map;
})();

export function FieldTypePickerInline({
  open,
  onPick,
  onClose,
}: {
  open: boolean;
  onPick: (type: FormFieldConfig["type"]) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mb-3 rounded-xl border border-border-light bg-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-foreground">Pick a field type</p>
              <button
                type="button"
                onClick={onClose}
                className="text-text-tertiary hover:text-foreground p-1 cursor-pointer"
                aria-label="Close field picker"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {FIELD_TYPE_CATEGORIES.map((category) => (
                <div key={category.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5 px-0.5">
                    {category.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {category.types.map((type) => {
                      const meta = FIELD_TYPE_META[type];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onPick(type)}
                          className="flex items-center gap-2.5 text-left p-2.5 rounded-lg border border-border-light bg-card-bg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${category.tint.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${category.tint.icon}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-foreground leading-tight">{meta.label}</p>
                            <p className="text-[10px] text-text-tertiary leading-snug truncate">{meta.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
