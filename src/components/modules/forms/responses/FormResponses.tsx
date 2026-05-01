"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Download } from "lucide-react";
import type { Form, FormResponse } from "@/types/models";
import { useFormResponsesStore } from "@/store/form-responses";
import { useAuth } from "@/hooks/useAuth";
import { withoutTestFormResponses } from "@/lib/forms/test-submission";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";
import { csvEscape, formatRelativeTime } from "../helpers";

// Per-form submissions table + slide-over detail for the responses tab.
// Filters out test submissions, exposes CSV export, and lets the operator
// promote a response into a Lead. Pure leaf — only consumes `form`.

export function FormResponses({ form }: { form: Form }) {
  const { formResponses, updateFormResponse } = useFormResponsesStore();
  const { workspaceId } = useAuth();
  const router = useRouter();
  const [promoting, setPromoting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const responses = useMemo(
    () =>
      withoutTestFormResponses(formResponses)
        .filter((r) => r.formId === form.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [formResponses, form.id],
  );

  const selected = useMemo(
    () => responses.find((r) => r.id === selectedId) ?? null,
    [responses, selectedId],
  );

  const fmtFullDate = (iso: string) =>
    new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const fieldLabel = (name: string) =>
    form.fields.find((f) => f.name === name)?.label ?? name;

  const allEntries = (r: FormResponse) => {
    const skip = new Set([
      "name",
      "full_name",
      "fullName",
      "client_name",
      "email",
      "phone",
      "mobile",
      "contact_phone",
      "__hp",
    ]);
    // Use form-field order so the slide-over reads in the order the
    // visitor saw the questions; tack on any orphan keys at the end.
    const known = form.fields
      .filter((f) => !skip.has(f.name))
      .map((f) => [f.name, r.values[f.name] ?? ""] as const)
      .filter(([, value]) => Boolean(value && String(value).trim()));
    const knownKeys = new Set(known.map(([k]) => k));
    const orphans = Object.entries(r.values).filter(
      ([k, v]) => !skip.has(k) && !knownKeys.has(k) && v && String(v).trim(),
    );
    return [...known, ...orphans];
  };

  // Per-form-field columns. First two field columns default-visible so the
  // table reads usefully on first render; remaining ones are toggleable
  // through the column picker.
  const fieldColumns = useMemo<Column<FormResponse>[]>(() => {
    const skip = new Set([
      "name",
      "full_name",
      "fullName",
      "client_name",
      "email",
      "phone",
      "mobile",
      "contact_phone",
      "__hp",
    ]);
    const visible = form.fields.filter(
      (f) => f.type !== "hidden" && !skip.has(f.name),
    );
    return visible.map((f, idx) => ({
      key: `field_${f.name}`,
      label: f.label || f.name,
      // Dynamic field columns can't sort: DataTable sorts by direct property
      // on the row, but submission values live under r.values[name] — there's
      // no FormResponse property called `field_email` etc. Showing a sort
      // arrow that does nothing is worse than no arrow at all.
      sortable: false,
      defaultVisible: idx < 2,
      render: (r: FormResponse) => {
        const value = r.values[f.name];
        if (!value) return <span className="text-text-tertiary">—</span>;
        return (
          <span className="text-[13px] text-foreground line-clamp-1">{value}</span>
        );
      },
    }));
  }, [form.fields]);

  const columns = useMemo<Column<FormResponse>[]>(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        removable: false,
        render: (r) => (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-medium text-foreground truncate">
              {r.contactName || "Anonymous"}
            </span>
            {r.inquiryId && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
                Lead
              </span>
            )}
          </div>
        ),
      },
      {
        key: "contact",
        label: "Contact",
        sortable: false,
        render: (r) => {
          const bits = [r.contactEmail, r.contactPhone].filter(Boolean);
          if (bits.length === 0) {
            return <span className="text-text-tertiary text-[12px]">—</span>;
          }
          return (
            <span className="text-[12px] text-text-secondary truncate">
              {bits.join(" · ")}
            </span>
          );
        },
      },
      ...fieldColumns,
      {
        key: "submittedAt",
        label: "Received",
        sortable: true,
        render: (r) => (
          <span className="text-[13px] text-text-secondary tabular-nums">
            {formatRelativeTime(r.submittedAt)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (r) => {
          const isLead = !!r.inquiryId;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isLead
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLead ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              {isLead ? "Lead" : "New"}
            </span>
          );
        },
      },
    ],
    [fieldColumns],
  );

  const promote = async (response: FormResponse) => {
    if (response.inquiryId) {
      router.push(`/dashboard/leads`);
      return;
    }
    setPromoting(response.id);
    try {
      const res = await fetch("/api/inquiries/promote-form-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formResponseId: response.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Failed to mark as lead");
        return;
      }
      updateFormResponse(
        response.id,
        { inquiryId: data.inquiryId },
        workspaceId || undefined,
      );
      toast("Marked as lead");
      router.push(`/dashboard/leads`);
    } finally {
      setPromoting(null);
    }
  };

  const exportCSV = () => {
    if (responses.length === 0) return;
    const fieldNames = form.fields.map((f) => f.name);
    const headers = ["Submitted", "Name", "Email", "Phone", ...form.fields.map((f) => f.label)];
    const rows = responses.map((r) => [
      new Date(r.submittedAt).toISOString(),
      r.contactName ?? "",
      r.contactEmail ?? "",
      r.contactPhone ?? "",
      ...fieldNames.map((name) => r.values[name] ?? ""),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName =
      form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
      "form";
    a.href = url;
    a.download = `${safeName}-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Responses exported");
  };

  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-[14px] text-text-tertiary">No responses yet.</p>
        <p className="text-[12px] text-text-tertiary mt-1">
          Submissions from this form will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-text-tertiary">
          {responses.length} response{responses.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-card-bg cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
      <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
        <DataTable<FormResponse>
          storageKey={`magic-crm-form-responses-${form.id}`}
          columns={columns}
          data={responses}
          keyExtractor={(r) => r.id}
          onRowClick={(r) => setSelectedId(r.id)}
          // Custom-column data isn't wired for FormResponse — no
          // getCustomData/onUpdateCustomData here means added columns would
          // be local-only shells the operator can't fill or persist.
          allowCustomColumns={false}
        />
      </div>

      {selected && (
        <SlideOver open onClose={() => setSelectedId(null)} title="">
          <ResponseDetail
            response={selected}
            form={form}
            entries={allEntries(selected)}
            fieldLabel={fieldLabel}
            fmtFullDate={fmtFullDate}
            promoting={promoting === selected.id}
            onPromote={() => promote(selected)}
          />
        </SlideOver>
      )}
    </div>
  );
}

function ResponseDetail({
  response,
  form,
  entries,
  fieldLabel,
  fmtFullDate,
  promoting,
  onPromote,
}: {
  response: FormResponse;
  form: Form;
  entries: ReadonlyArray<readonly [string, string]>;
  fieldLabel: (name: string) => string;
  fmtFullDate: (iso: string) => string;
  promoting: boolean;
  onPromote: () => void;
}) {
  return (
    <div className="-mt-2 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-foreground">
            {response.contactName || "Anonymous"}
          </h3>
          {response.inquiryId && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
              Lead
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-secondary mt-0.5">
          {form.name} · submitted {fmtFullDate(response.submittedAt)}
        </p>
      </div>

      {(response.contactEmail || response.contactPhone) && (
        <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
          <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
            Contact
          </h4>
          {response.contactEmail && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-text-tertiary w-12">Email</span>
              <a
                href={`mailto:${response.contactEmail}`}
                className="text-[13px] text-foreground hover:text-primary"
              >
                {response.contactEmail}
              </a>
            </div>
          )}
          {response.contactPhone && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-text-tertiary w-12">Phone</span>
              <a
                href={`tel:${response.contactPhone}`}
                className="text-[13px] text-foreground hover:text-primary"
              >
                {response.contactPhone}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-surface rounded-lg p-4 border border-border-light space-y-3">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
          Responses
        </h4>
        {entries.length === 0 ? (
          <p className="text-[13px] text-text-tertiary">No additional answers.</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <span className="text-[11px] text-text-tertiary uppercase tracking-wider">
                {fieldLabel(key)}
              </span>
              <p className="text-[13px] text-foreground whitespace-pre-wrap break-words">
                {value}
              </p>
            </div>
          ))
        )}
      </div>

      <div>
        <button
          onClick={onPromote}
          disabled={promoting}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-white text-[13px] font-semibold hover:opacity-95 cursor-pointer transition-opacity disabled:opacity-50"
        >
          {response.inquiryId
            ? "View lead →"
            : promoting
            ? "Marking…"
            : "Mark as lead"}
        </button>
      </div>
    </div>
  );
}
