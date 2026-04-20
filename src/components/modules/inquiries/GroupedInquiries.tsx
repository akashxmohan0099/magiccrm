"use client";

import { useState } from "react";
import { Inbox, MessageCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Inquiry } from "@/types/models";
import { DataTable, Column } from "@/components/ui/DataTable";

export function GroupedInquiries({
  inquiries, forms, formMap, columns, onRowClick,
}: {
  inquiries: Inquiry[];
  forms: { id: string; name: string; type?: string }[];
  formMap: Map<string, { id: string; name: string }>;
  columns: Column<Inquiry>[];
  onRowClick: (i: Inquiry) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Group: conversations first, then every inquiry form (even empty ones)
  const fromComms = inquiries.filter((i) => i.source === "comms");

  // Build a map of formId → inquiries
  const formInquiries = new Map<string, Inquiry[]>();
  for (const i of inquiries) {
    if (i.source !== "form") continue;
    const key = i.formId || "__no_form__";
    if (!formInquiries.has(key)) formInquiries.set(key, []);
    formInquiries.get(key)!.push(i);
  }

  // Get all inquiry forms (not booking forms)
  const inquiryForms = forms.filter((f: { id: string; name: string; type?: string }) => (f as { type?: string }).type !== "booking");

  const sections: { key: string; label: string; icon: typeof MessageCircle; items: Inquiry[] }[] = [];

  // Always show conversations section
  sections.push({ key: "comms", label: "From Conversations", icon: MessageCircle, items: fromComms });

  // Always show a section for each inquiry form, even if 0 responses
  for (const form of inquiryForms) {
    sections.push({
      key: form.id,
      label: form.name,
      icon: Inbox,
      items: formInquiries.get(form.id) || [],
    });
  }

  // Catch any form submissions not linked to a known form
  const knownFormIds = new Set(inquiryForms.map((f) => f.id));
  const unlinked = inquiries.filter((i) => i.source === "form" && i.formId && !knownFormIds.has(i.formId));
  if (unlinked.length > 0) {
    sections.push({ key: "__unlinked__", label: "Other Forms", icon: Inbox, items: unlinked });
  }
  // Catch form submissions with no formId
  const noForm = formInquiries.get("__no_form__");
  if (noForm && noForm.length > 0) {
    sections.push({ key: "__no_form__", label: "Unlinked Submissions", icon: Inbox, items: noForm });
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isCollapsed = collapsed.has(section.key);
        const Icon = section.icon;
        return (
          <div key={section.key} className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(section.key)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
                <Icon className="w-4 h-4 text-text-secondary" />
                <span className="text-[13px] font-semibold text-foreground">{section.label}</span>
                <span className="text-[12px] text-text-tertiary">({section.items.length})</span>
              </div>
            </button>
            {!isCollapsed && (
              <div className="border-t border-border-light">
                <DataTable<Inquiry>
                  storageKey={`magic-crm-inquiries-${section.key}`}
                  columns={columns}
                  data={section.items}
                  keyExtractor={(i) => i.id}
                  onRowClick={onRowClick}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
