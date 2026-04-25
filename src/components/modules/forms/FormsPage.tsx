"use client";

import { useEffect, useState, useMemo } from "react";
import { FileText, Plus, Globe, Code, Eye, Calendar, Inbox, ToggleLeft, ToggleRight, Pencil, Trash2, Copy, Check, GripVertical } from "lucide-react";
import { useFormsStore } from "@/store/forms";
import { useInquiriesStore } from "@/store/inquiries";
import { Form, FormFieldConfig } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { toast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";

type SlideMode = "preview" | "edit" | "responses" | "embed";

export function FormsPage() {
  const { forms, updateForm, deleteForm, addForm } = useFormsStore();
  const { inquiries } = useInquiriesStore();
  const { workspaceId } = useAuth();
  const bookingPageSlug = useSettingsStore((s) => s.settings?.bookingPageSlug);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slideMode, setSlideMode] = useState<SlideMode>("preview");

  const selected = selectedId ? forms.find((f) => f.id === selectedId) : null;
  const bookingForms = forms.filter((f) => f.type === "booking");
  const inquiryForms = forms.filter((f) => f.type === "inquiry");

  // Submissions per form, used to render the live count chip on each card.
  const submissionsByFormId = useMemo(() => {
    const map = new Map<string, number>();
    for (const inq of inquiries) {
      if (!inq.formId) continue;
      map.set(inq.formId, (map.get(inq.formId) ?? 0) + 1);
    }
    return map;
  }, [inquiries]);

  const openForm = (id: string, mode: SlideMode) => {
    setSelectedId(id);
    setSlideMode(mode);
  };

  const toggleEnabled = (form: Form, e: React.MouseEvent) => {
    e.stopPropagation();
    updateForm(form.id, { enabled: !form.enabled }, workspaceId || undefined);
  };

  return (
    <div>
      <PageHeader
        title="Forms"
        description="Booking and inquiry forms for your website."
        actions={
          <Button variant="primary" size="sm" onClick={() => {
            const f = addForm({
              workspaceId: workspaceId ?? "",
              type: "inquiry",
              name: "New Form",
              fields: [
                { name: "name", type: "text", label: "Full Name", required: true },
                { name: "email", type: "email", label: "Email", required: true },
                { name: "message", type: "textarea", label: "Message", required: true },
              ],
              branding: {},
              slug: "",
              enabled: false,
            }, workspaceId || undefined);
            if (f) openForm(f.id, "edit");
          }}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Form
          </Button>
        }
      />

      {forms.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground mb-1">No forms yet</h3>
          <p className="text-[13px] text-text-secondary mb-5">
            Create a form to collect inquiries from your website, social bio, or email signature.
          </p>
          <Button variant="primary" size="sm" onClick={() => {
            const f = addForm({
              workspaceId: workspaceId ?? "",
              type: "inquiry",
              name: "New Form",
              fields: [
                { name: "name", type: "text", label: "Full Name", required: true },
                { name: "email", type: "email", label: "Email", required: true },
                { name: "message", type: "textarea", label: "Message", required: true },
              ],
              branding: {},
              slug: "",
              enabled: false,
            }, workspaceId || undefined);
            if (f) openForm(f.id, "edit");
          }}>
            <Plus className="w-4 h-4 mr-1.5" /> Create your first form
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {bookingForms.length > 0 && (
            <FormSection
              label="Booking Forms"
              icon={<Calendar className="w-4 h-4 text-text-secondary" />}
              forms={bookingForms}
              submissionsByFormId={submissionsByFormId}
              onOpen={openForm}
              onToggle={toggleEnabled}
            />
          )}
          {inquiryForms.length > 0 && (
            <FormSection
              label="Inquiry Forms"
              icon={<Inbox className="w-4 h-4 text-text-secondary" />}
              forms={inquiryForms}
              submissionsByFormId={submissionsByFormId}
              onOpen={openForm}
              onToggle={toggleEnabled}
            />
          )}
        </div>
      )}

      {/* Form Slide-over */}
      {selected && (
        <SlideOver open onClose={() => setSelectedId(null)} title="">
          <div className="-mt-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
                <p className="text-[12px] text-text-secondary mt-0.5">{selected.type} form · {selected.fields.length} fields</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { deleteForm(selected.id, workspaceId || undefined); setSelectedId(null); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-0.5 border-b border-border-light mb-5 -mx-1">
              {(["preview", "edit", "responses", "embed"] as SlideMode[]).map((m) => {
                const labels: Record<SlideMode, string> = { preview: "Preview", edit: "Edit", responses: "Responses", embed: "Embed" };
                return (
                  <button key={m} onClick={() => setSlideMode(m)}
                    className={`px-3 py-2 text-[13px] font-medium transition-colors cursor-pointer relative ${
                      slideMode === m ? "text-foreground" : "text-text-tertiary hover:text-foreground"
                    }`}>
                    {labels[m]}
                    {slideMode === m && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-full" />}
                  </button>
                );
              })}
            </div>

            {/* Preview */}
            {slideMode === "preview" && (
              <FormPreview form={selected} />
            )}

            {/* Edit */}
            {slideMode === "edit" && (
              <FormEditor
                form={selected}
                allForms={forms}
                onUpdate={(data) => updateForm(selected.id, data, workspaceId || undefined)}
              />
            )}

            {/* Responses */}
            {slideMode === "responses" && (
              <FormResponses formId={selected.id} />
            )}

            {/* Embed */}
            {slideMode === "embed" && (
              <FormEmbed form={selected} bookingPageSlug={bookingPageSlug} />
            )}
          </div>
        </SlideOver>
      )}
    </div>
  );
}

// ── Form Section ──

function FormSection({ label, icon, forms, submissionsByFormId, onOpen, onToggle }: {
  label: string;
  icon: React.ReactNode;
  forms: Form[];
  submissionsByFormId: Map<string, number>;
  onOpen: (id: string, mode: SlideMode) => void;
  onToggle: (form: Form, e: React.MouseEvent) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          // Card itself isn't a <button> — that was nesting actual buttons
          // (toggle + preview/edit/embed chips) inside an interactive
          // element, which is invalid HTML and caused click bubbling
          // headaches. Card is a plain div; the title area is its own
          // clickable region.
          <div
            key={form.id}
            className="bg-card-bg border border-border-light rounded-xl overflow-hidden hover:shadow-md hover:border-foreground/10 transition-all"
          >
            <div className="h-1.5" style={{ backgroundColor: form.branding.primaryColor || "var(--primary)" }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3 gap-3">
                <button
                  onClick={() => onOpen(form.id, "preview")}
                  className="flex-1 text-left cursor-pointer min-w-0"
                >
                  <p className="text-[14px] font-semibold text-foreground truncate hover:underline decoration-foreground/30 underline-offset-2">
                    {form.name}
                  </p>
                  <p className="text-[12px] text-text-tertiary">
                    {form.fields.length} fields
                    {(submissionsByFormId.get(form.id) ?? 0) > 0 && (
                      <>
                        {" · "}
                        <span className="text-foreground font-medium">
                          {submissionsByFormId.get(form.id)} submission
                          {(submissionsByFormId.get(form.id) ?? 0) === 1 ? "" : "s"}
                        </span>
                      </>
                    )}
                  </p>
                </button>
                <button
                  onClick={(e) => onToggle(form, e)}
                  className="cursor-pointer flex-shrink-0"
                  aria-label={form.enabled ? "Disable form" : "Enable form"}
                >
                  {form.enabled
                    ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                    : <ToggleLeft className="w-6 h-6 text-text-tertiary" />}
                </button>
              </div>
              {form.slug && (
                <p className="text-[11px] text-text-tertiary font-mono flex items-center gap-1 mb-3 truncate">
                  <Globe className="w-3 h-3 flex-shrink-0" /> /{form.slug}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpen(form.id, "preview")}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-surface rounded-lg text-[11px] font-medium text-text-secondary hover:text-foreground hover:bg-card-bg cursor-pointer transition-colors"
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button
                  onClick={() => onOpen(form.id, "edit")}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-surface rounded-lg text-[11px] font-medium text-text-secondary hover:text-foreground hover:bg-card-bg cursor-pointer transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => onOpen(form.id, "embed")}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-surface rounded-lg text-[11px] font-medium text-text-secondary hover:text-foreground hover:bg-card-bg cursor-pointer transition-colors"
                >
                  <Code className="w-3 h-3" /> Embed
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form Preview ──

function FormPreview({ form }: { form: Form }) {
  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
        {/* Preview header */}
        <div className="p-5 text-center" style={{ backgroundColor: form.branding.primaryColor || "var(--primary)", opacity: 0.1 }}>
        </div>
        <div className="p-6 -mt-3">
          <h3 className="text-[18px] font-bold text-foreground text-center mb-1">{form.name}</h3>
          <p className="text-[12px] text-text-tertiary text-center mb-6">Preview of how your form looks to clients</p>

          <div className="space-y-4 max-w-md mx-auto">
            {form.fields.map((field, i) => (
              <div key={i}>
                <label className="text-[13px] font-medium text-foreground block mb-1.5">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <div className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[13px] text-text-tertiary h-20">
                    {field.label}...
                  </div>
                ) : field.type === "select" ? (
                  <select disabled className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[13px] text-text-tertiary">
                    <option>Select {field.label.toLowerCase()}</option>
                    {field.options?.map((opt, j) => <option key={j}>{opt}</option>)}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[13px] text-text-tertiary">
                    {field.type === "email" ? "email@example.com" : field.type === "phone" ? "0412 345 678" : field.label}
                  </div>
                )}
              </div>
            ))}
            <button
              disabled
              className="w-full py-3 rounded-xl text-[14px] font-semibold text-white"
              style={{ backgroundColor: form.branding.primaryColor || "var(--primary)" }}
            >
              {form.type === "booking" ? "Book Now" : "Submit Inquiry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form Editor ──

function FormEditor({
  form,
  allForms,
  onUpdate,
}: {
  form: Form;
  allForms: Form[];
  onUpdate: (data: Partial<Form>) => void;
}) {
  const [name, setName] = useState(form.name);
  const [slug, setSlug] = useState(form.slug || "");
  const [color, setColor] = useState(form.branding.primaryColor || "#8B5CF6");
  const [fields, setFields] = useState<FormFieldConfig[]>(form.fields);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Auto-suggest the slug from the name only while the user hasn't
  // touched the slug field directly. Once they edit it, they own it.
  // Existing forms with a saved slug are considered already-touched.
  const [slugTouched, setSlugTouched] = useState(!!form.slug);
  useEffect(() => {
    if (slugTouched) return;
    const suggestion = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    setSlug(suggestion);
  }, [name, slugTouched]);

  const trimmedSlug = slug.trim();
  const slugCollides = useMemo(() => {
    if (!trimmedSlug) return false;
    return allForms.some(
      (f) => f.id !== form.id && f.slug === trimmedSlug,
    );
  }, [allForms, form.id, trimmedSlug]);
  const slugMissing = !trimmedSlug;
  const slugInvalid = !!trimmedSlug && !/^[a-z0-9-]+$/.test(trimmedSlug);
  const slugError = slugMissing
    ? "Slug is required — this is the form's public URL."
    : slugCollides
    ? "Another form already uses this slug."
    : slugInvalid
    ? "Use lowercase letters, numbers, and dashes only."
    : "";
  const canSave = !slugError;

  const save = () => {
    if (!canSave) return;
    onUpdate({
      name,
      slug: trimmedSlug,
      fields,
      branding: { ...form.branding, primaryColor: color },
    });
    toast("Form saved");
  };

  const addField = () => {
    setFields((p) => [...p, { name: `field_${p.length}`, type: "text", label: "New Field", required: false }]);
  };

  const updateField = (idx: number, updates: Partial<FormFieldConfig>) => {
    setFields((p) => p.map((f, i) => i === idx ? { ...f, ...updates } : f));
  };

  const removeField = (idx: number) => {
    setFields((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {/* Name & Slug */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Form Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">URL Slug</label>
          <div className="flex items-center">
            <span className="text-[13px] text-text-tertiary mr-1">/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.replace(/\s/g, "-").toLowerCase());
              }}
              className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-[14px] text-foreground font-mono outline-none focus:ring-2 ${
                slugError
                  ? "border-red-300 focus:ring-red-200"
                  : "border-border-light focus:ring-primary/20"
              }`}
            />
          </div>
          {slugError ? (
            <p className="text-[11px] text-red-600 mt-1">{slugError}</p>
          ) : (
            <p className="text-[11px] text-text-tertiary mt-1">
              Public URL: <span className="font-mono">/inquiry/{trimmedSlug || "—"}</span>
            </p>
          )}
        </div>
      </div>

      {/* Brand color */}
      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Brand Color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border-light cursor-pointer" />
          <input value={color} onChange={(e) => setColor(e.target.value)}
            className="px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] font-mono text-foreground outline-none w-28" />
        </div>
      </div>

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Fields ({fields.length})</label>
          <button onClick={addField} className="text-[12px] text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={idx}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => { if (dragIdx !== null && dragIdx !== idx) { const next = [...fields]; const [moved] = next.splice(dragIdx, 1); next.splice(idx, 0, moved); setFields(next); } setDragIdx(null); setDragOverIdx(null); }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              className={`bg-surface rounded-lg border p-3 transition-all ${dragOverIdx === idx ? "border-primary/40 bg-primary/5" : "border-border-light"} ${dragIdx === idx ? "opacity-40" : ""}`}
            >
              <div className="flex items-start gap-2 mb-2">
                <GripVertical className="w-4 h-4 text-text-tertiary mt-2 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                    placeholder="Field label"
                    className="col-span-2 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
                  <select value={field.type} onChange={(e) => updateField(idx, { type: e.target.value as FormFieldConfig["type"] })}
                    className="px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none">
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="textarea">Text Area</option>
                    <option value="select">Dropdown</option>
                    <option value="date">Date</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between pl-6">
                <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })}
                    className="rounded" />
                  Required
                </label>
                <button onClick={() => removeField(idx)} className="text-text-tertiary hover:text-red-500 cursor-pointer p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {field.type === "select" && (
                <input value={field.options?.join(", ") || ""} onChange={(e) => updateField(idx, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  placeholder="Options (comma separated)"
                  className="w-full mt-2 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground outline-none" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button variant="primary" size="sm" className="w-full" onClick={save} disabled={!canSave}>
        <Check className="w-4 h-4 mr-1.5" /> Save Changes
      </Button>
    </div>
  );
}

// ── Form Embed ──

function FormEmbed({
  form,
  bookingPageSlug,
}: {
  form: Form;
  bookingPageSlug?: string;
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Standalone URL: a full-page experience for direct sharing.
  // Embed URL: stripped-down iframe-friendly route (X-Frame-Options bypassed).
  const { formUrl, embedUrl } = (() => {
    if (form.type === "booking" && bookingPageSlug) {
      return {
        formUrl: `${baseUrl}/book/${bookingPageSlug}`,
        embedUrl: `${baseUrl}/embed/book/${bookingPageSlug}`,
      };
    }
    if (form.type === "inquiry" && form.slug) {
      return {
        formUrl: `${baseUrl}/inquiry/${form.slug}`,
        embedUrl: `${baseUrl}/embed/inquiry/${form.slug}`,
      };
    }
    return { formUrl: "", embedUrl: "" };
  })();

  const embedCode = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border-radius: 12px; border: 1px solid #eee;"></iframe>`
    : "";

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast(`${label} copied!`);
  };

  if (!formUrl) {
    const isBooking = form.type === "booking";
    return (
      <div className="rounded-lg border border-border-light bg-surface p-4">
        <h4 className="text-[13px] font-semibold text-foreground">
          {isBooking ? "Booking page slug required" : "Inquiry form slug required"}
        </h4>
        <p className="mt-1 text-[12px] text-text-secondary">
          {isBooking
            ? "Set your booking page slug in Settings before sharing or embedding the public booking page."
            : "Set a slug on this form in the Edit tab before sharing or embedding it."}
        </p>
      </div>
    );
  }

  const needsEnable = form.type === "inquiry" && !form.enabled;

  return (
    <div className="space-y-5">
      {needsEnable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[12px] text-amber-900">
            This form is disabled. Toggle it on from the forms list before the public URL will load.
          </p>
        </div>
      )}

      {/* Standalone URL */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Standalone URL</h4>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[13px] font-mono text-foreground bg-card-bg rounded-lg px-3 py-2 border border-border-light truncate">{formUrl}</p>
          <button onClick={() => copy(formUrl, "URL")} className="p-2 text-text-secondary hover:text-foreground rounded-lg hover:bg-card-bg cursor-pointer">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-text-tertiary mt-2">
          {form.type === "booking"
            ? "Share this booking page directly with clients."
            : "Share this inquiry form directly with clients."}
        </p>
      </div>

      {/* Embed Code */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Embed Code</h4>
        <div className="relative">
          <pre className="text-[11px] font-mono text-foreground bg-card-bg rounded-lg px-3 py-3 border border-border-light overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
          <button onClick={() => copy(embedCode, "Embed code")}
            className="absolute top-2 right-2 p-1.5 text-text-tertiary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-text-tertiary mt-2">Paste this into your website HTML to embed the form.</p>
      </div>

      {/* Direct link button */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Share Link</h4>
        <div className="flex gap-2">
          <button onClick={() => copy(formUrl, "Link")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-foreground text-background rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90">
            <Copy className="w-4 h-4" /> Copy Link
          </button>
          <a href={formUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border-light rounded-lg text-[13px] font-medium text-foreground hover:bg-card-bg cursor-pointer">
            <Globe className="w-4 h-4" /> Open
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Form Responses ──

function FormResponses({ formId }: { formId: string }) {
  const { inquiries } = useInquiriesStore();
  const responses = useMemo(
    () => inquiries.filter((i) => i.formId === formId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [inquiries, formId]
  );

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <Inbox className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-[14px] text-text-tertiary">No responses yet.</p>
        <p className="text-[12px] text-text-tertiary mt-1">Submissions from this form will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-text-tertiary">{responses.length} response{responses.length !== 1 ? "s" : ""}</p>
      {responses.map((r) => (
        <div key={r.id} className="bg-surface rounded-lg border border-border-light p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-foreground">{r.name}</p>
            <span className="text-[11px] text-text-tertiary">{fmtDate(r.createdAt)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            {r.email && <div><span className="text-text-tertiary">Email: </span><span className="text-foreground">{r.email}</span></div>}
            {r.phone && <div><span className="text-text-tertiary">Phone: </span><span className="text-foreground">{r.phone}</span></div>}
            {r.serviceInterest && <div><span className="text-text-tertiary">Interest: </span><span className="text-foreground">{r.serviceInterest}</span></div>}
            {r.eventType && <div><span className="text-text-tertiary">Event: </span><span className="text-foreground">{r.eventType}</span></div>}
            {r.dateRange && <div><span className="text-text-tertiary">Date: </span><span className="text-foreground">{r.dateRange}</span></div>}
          </div>
          {r.message && (
            <p className="text-[12px] text-text-secondary bg-card-bg rounded-lg px-3 py-2 whitespace-pre-wrap">{r.message}</p>
          )}
          <StatusBadge status={r.status} />
        </div>
      ))}
    </div>
  );
}
