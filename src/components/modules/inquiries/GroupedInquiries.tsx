"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, MessageCircle, ChevronDown, ChevronRight, Pencil, ExternalLink } from "lucide-react";
import { Inquiry, Form } from "@/types/models";
import { DataTable, Column } from "@/components/ui/DataTable";

// Map a form-field name to an Inquiry value. Prefers the structured
// submissionValues blob (full record), falls back to the legacy
// structured columns so older inquiries still render in the inbox.
export function inquiryFieldValue(
  inquiry: Inquiry,
  fieldName: string,
): string {
  const fromBlob = inquiry.submissionValues?.[fieldName];
  if (fromBlob != null && fromBlob !== "") return fromBlob;

  switch (fieldName) {
    case "name":
    case "full_name":
    case "fullName":
    case "client_name":
      return inquiry.name || "";
    case "email":
      return inquiry.email || "";
    case "phone":
    case "mobile":
    case "contact_phone":
      return inquiry.phone || "";
    case "message":
    case "your_message":
    case "details":
      return inquiry.message || "";
    case "service_interest":
    case "service_you_re_interested_in":
      return inquiry.serviceInterest || "";
    case "event_type":
      return inquiry.eventType || "";
    case "date_range":
    case "wedding_date___date_range":
      return inquiry.dateRange || "";
    default:
      return "";
  }
}

// Truncate a long value for table display while keeping the full text
// available via title attribute on hover.
function CellValue({ value }: { value: string }) {
  if (!value) return <span className="text-text-tertiary">—</span>;
  return (
    <span
      className="text-[13px] text-text-secondary truncate block max-w-[240px]"
      title={value}
    >
      {value}
    </span>
  );
}

// Build columns for a form-backed section. Always shows Name first,
// then renders each field from the form's fields[] config (so a 6-field
// form gets 6 columns instead of being squashed into a generic shape).
// Skips the `name` field since it's already covered by the Name column,
// caps default-visible fields at 4 to keep tables breathable, and lets
// the user toggle the rest via the column picker.
function buildFormColumns(
  form: Form,
  defaultTrailingColumns: Column<Inquiry>[],
): Column<Inquiry>[] {
  const cols: Column<Inquiry>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      removable: false,
      render: (i) => (
        <span className="text-[13px] font-medium text-foreground">{i.name}</span>
      ),
    },
  ];

  let visibleAdded = 1; // Name counts as 1
  const visibleCap = 4;

  for (const field of form.fields) {
    if (isNameField(field.name)) continue;
    const isDefaultVisible = visibleAdded < visibleCap;
    if (isDefaultVisible) visibleAdded += 1;

    cols.push({
      key: `field:${field.name}`,
      label: field.label,
      sortable: false,
      removable: true,
      defaultVisible: isDefaultVisible,
      render: (i) => <CellValue value={inquiryFieldValue(i, field.name)} />,
    });
  }

  cols.push(...defaultTrailingColumns);
  return cols;
}

function isNameField(name: string) {
  return name === "name" || name === "full_name" || name === "fullName" || name === "client_name";
}

export function GroupedInquiries({
  inquiries,
  forms,
  defaultColumns,
  trailingColumns,
  onRowClick,
}: {
  inquiries: Inquiry[];
  forms: Form[];
  /** Columns used for non-form sections (Conversations, Unlinked). */
  defaultColumns: Column<Inquiry>[];
  /** Columns appended to every form-derived column set (Source/Received/Status). */
  trailingColumns: Column<Inquiry>[];
  onRowClick: (i: Inquiry) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const openEditForm = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/forms?form=${formId}&tab=edit`);
  };

  const openPublicForm = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    window.open(`/inquiry/${slug}`, "_blank", "noopener,noreferrer");
  };

  const fromComms = inquiries.filter((i) => i.source === "comms");

  const formInquiries = new Map<string, Inquiry[]>();
  for (const i of inquiries) {
    if (i.source !== "form") continue;
    const key = i.formId || "__no_form__";
    if (!formInquiries.has(key)) formInquiries.set(key, []);
    formInquiries.get(key)!.push(i);
  }

  const inquiryForms = forms.filter((f) => f.type !== "booking");

  type Section = {
    key: string;
    label: string;
    icon: typeof MessageCircle;
    items: Inquiry[];
    columns: Column<Inquiry>[];
    /** Form backing this section, if any — drives the per-section actions. */
    form?: Form;
  };

  const sections: Section[] = [];

  sections.push({
    key: "comms",
    label: "From Conversations",
    icon: MessageCircle,
    items: fromComms,
    columns: defaultColumns,
  });

  for (const form of inquiryForms) {
    sections.push({
      key: form.id,
      label: form.name,
      icon: Inbox,
      items: formInquiries.get(form.id) || [],
      columns: buildFormColumns(form, trailingColumns),
      form,
    });
  }

  const knownFormIds = new Set(inquiryForms.map((f) => f.id));
  const unlinked = inquiries.filter(
    (i) => i.source === "form" && i.formId && !knownFormIds.has(i.formId),
  );
  if (unlinked.length > 0) {
    sections.push({
      key: "__unlinked__",
      label: "Other Forms",
      icon: Inbox,
      items: unlinked,
      columns: defaultColumns,
    });
  }
  const noForm = formInquiries.get("__no_form__");
  if (noForm && noForm.length > 0) {
    sections.push({
      key: "__no_form__",
      label: "Unlinked Submissions",
      icon: Inbox,
      items: noForm,
      columns: defaultColumns,
    });
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isCollapsed = collapsed.has(section.key);
        const Icon = section.icon;
        return (
          <div
            key={section.key}
            className="bg-card-bg border border-border-light rounded-xl overflow-hidden"
          >
            {/* Header is a real div so the action buttons on the right
                aren't nested inside another <button> (invalid HTML +
                accidental click bubbling). The toggle is its own button. */}
            <div className="flex items-center justify-between px-5 py-4 hover:bg-surface/50 transition-colors">
              <button
                onClick={() => toggle(section.key)}
                className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 text-left"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                )}
                <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span className="text-[13px] font-semibold text-foreground truncate">
                  {section.label}
                </span>
                <span className="text-[12px] text-text-tertiary flex-shrink-0">
                  ({section.items.length})
                </span>
              </button>
              {section.form && (
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <button
                    onClick={(e) => openEditForm(e, section.form!.id)}
                    title="Edit form"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit form</span>
                  </button>
                  {section.form.slug && section.form.enabled && (
                    <button
                      onClick={(e) => openPublicForm(e, section.form!.slug!)}
                      title="Open public form"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="border-t border-border-light">
                <DataTable<Inquiry>
                  storageKey={`magic-crm-inquiries-${section.key}`}
                  columns={section.columns}
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

