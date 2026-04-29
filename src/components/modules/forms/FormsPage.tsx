"use client";

import { useState, useMemo, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus, Globe, Code, Eye, Inbox, ToggleLeft, ToggleRight, Pencil, Trash2, Copy, Check, GripVertical, Download, ChevronDown, ChevronRight, Zap, X, ImagePlus, Type, Mail, Phone, Link as LinkIcon, Hash, AlignLeft, ChevronsUpDown, Calendar, CalendarRange, Clock, Maximize2, Minimize2, Sparkles, MessageSquare, Bell, ExternalLink, HelpCircle, CheckSquare, CircleDot, ListChecks, Upload, EyeOff, Filter, Sun, Moon, Monitor } from "lucide-react";
import { useFormsStore } from "@/store/forms";
import { useFormResponsesStore } from "@/store/form-responses";
import { Form, FormFieldConfig, FormFieldCondition, FormResponse, FormTemplate, FormFontFamily, FormSuccessVariant, FormTheme } from "@/types/models";
import { FormPreviewRenderer } from "@/components/forms/FormRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { InlineDropdown } from "@/components/ui/InlineDropdown";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";
import { useServicesStore } from "@/store/services";

// SSR-safe mount detection — same pattern SlideOver uses so the preview
// portal doesn't try to render against document.body before hydration.
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Tabs inside the slide-over are mutually exclusive (edit ↔ embed).
// Preview is separate — it opens as its own expandable panel next to the
// slide-over, independent of which tab is selected.
type SlideMode = "edit" | "after" | "reply" | "style" | "embed";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const TEMPLATE_OPTIONS: { id: FormTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Card with branded header — versatile default." },
  { id: "minimal", label: "Minimal", description: "Flat layout, no card. Clean and quiet." },
  { id: "editorial", label: "Editorial", description: "Big centered title, generous spacing." },
  { id: "slides", label: "Slides", description: "One question at a time, Typeform-style." },
];

const FONT_OPTIONS: { id: FormFontFamily; label: string; previewClass: string }[] = [
  { id: "sans", label: "Sans", previewClass: "font-sans" },
  { id: "serif", label: "Serif", previewClass: "font-serif" },
  { id: "display", label: "Display", previewClass: "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide" },
  { id: "mono", label: "Mono", previewClass: "font-mono" },
];

// Per-form theme picker. Scoped to the rendered form only — does not change
// the operator's dashboard theme. "Auto" follows the visitor's system pref.
const THEME_OPTIONS: { id: FormTheme; label: string; icon: React.ComponentType<{ className?: string }>; swatchClass: string }[] = [
  { id: "light", label: "Light", icon: Sun, swatchClass: "bg-white border-border-light text-foreground" },
  { id: "dark", label: "Dark", icon: Moon, swatchClass: "bg-[#141414] border-[#2A2A2A] text-white" },
  { id: "auto", label: "Auto", icon: Monitor, swatchClass: "bg-gradient-to-br from-white to-[#141414] border-border-light text-foreground" },
];

// Tiny visual hint of each template — three short bars laid out the way
// the template tends to feel. Kept abstract so it stays accurate even as
// the renderer evolves.
function FormLogoUpload({
  logo,
  workspaceLogo,
  onChange,
}: {
  logo?: string;
  workspaceLogo?: string;
  onChange: (next: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const effective = logo || workspaceLogo;
  const usingFallback = !logo && !!workspaceLogo;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Logo</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
        >
          {effective ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={effective} alt="Form logo" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-text-tertiary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground">
            {logo
              ? "Custom logo for this form"
              : usingFallback
              ? "Using workspace logo"
              : "No logo set"}
          </p>
          <p className="text-[13px] text-text-secondary mt-1 leading-snug">
            {logo
              ? "Overrides your workspace logo on this form."
              : workspaceLogo
              ? "Set in Settings → Brand Identity. Upload one here to override just this form."
              : "Upload a logo here, or set one in Settings to apply across every form."}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[12px] text-primary font-medium hover:underline cursor-pointer"
            >
              {logo ? "Change" : "Upload"}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
              >
                Use workspace logo
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Cover image — wide hero photo rendered above the form title across all
// templates. Beauty is a visual sell, so this is one of the highest-value
// branding knobs we expose.
function CoverImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Cover image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) onChange(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Cover image</label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-full aspect-[3/1] rounded-2xl border-2 border-dashed border-border-light bg-surface hover:border-text-tertiary cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Form cover" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <ImagePlus className="w-5 h-5 text-text-tertiary mx-auto mb-1" />
            <p className="text-[12px] text-text-tertiary">Add a hero image</p>
          </div>
        )}
      </button>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[11px] text-text-secondary leading-snug">
          Wide photo shown above the form title. Best at 1500×500.
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Each thumb is a faithful miniature of the corresponding template — same
// layout structure, same brand-color usage, just scaled down. Built with
// real label text and inputs so you can see what the template produces
// without flipping to the live preview.
function TemplateThumb({
  id,
  color,
  fontFamily,
  formName,
  logo,
}: {
  id: FormTemplate;
  color: string;
  fontFamily: FormFontFamily;
  formName: string;
  logo?: string;
}) {
  const fontClass =
    fontFamily === "serif"
      ? "font-serif"
      : fontFamily === "mono"
      ? "font-mono"
      : fontFamily === "display"
      ? "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide"
      : "font-sans";

  // Truncate so wider names don't blow out the thumb width
  const title = formName.length > 22 ? formName.slice(0, 21) + "…" : formName;

  if (id === "slides") {
    return (
      <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 pt-2.5 pb-3 overflow-hidden flex flex-col ${fontClass}`}>
        {/* progress bar */}
        <div className="h-[3px] rounded-full overflow-hidden bg-surface">
          <div className="h-full w-1/3" style={{ backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[7px] text-text-tertiary">1 of 5</p>
          <p className="text-[7px] text-text-tertiary">← Back</p>
        </div>
        <div className="flex-1 flex flex-col justify-center mt-1.5">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="w-3.5 h-3.5 rounded-md object-cover mb-1" />
          )}
          <p className="text-[6.5px] font-semibold uppercase tracking-wider text-text-tertiary mb-0.5">Question 1</p>
          <p className="text-[8px] font-semibold text-foreground mb-1 leading-tight">What&apos;s your name?</p>
          <div className="h-[14px] rounded bg-surface border border-border-light px-1.5 flex items-center">
            <span className="text-[6px] text-text-tertiary">Type your answer…</span>
          </div>
        </div>
        <div
          className="self-start mt-1.5 px-2 py-[3px] rounded text-[7px] font-semibold text-white inline-flex items-center gap-1"
          style={{ backgroundColor: color }}
        >
          Next →
        </div>
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 py-3 overflow-hidden ${fontClass}`}>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-4 h-4 rounded-md object-cover mb-1" />
        )}
        <p className="text-[9px] font-semibold text-foreground tracking-tight leading-tight">{title}</p>
        <p className="text-[6.5px] text-text-tertiary mt-0.5">Fill in the form below.</p>
        <div className="space-y-1.5 mt-2">
          <div>
            <p className="text-[6px] font-semibold text-foreground mb-0.5">NAME</p>
            <div className="h-[10px] rounded bg-surface border border-border-light" />
          </div>
          <div>
            <p className="text-[6px] font-semibold text-foreground mb-0.5">EMAIL</p>
            <div className="h-[10px] rounded bg-surface border border-border-light" />
          </div>
          <div
            className="mt-1.5 h-[12px] rounded text-[6.5px] font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            Submit
          </div>
        </div>
      </div>
    );
  }

  if (id === "editorial") {
    return (
      <div
        className={`rounded-lg bg-card-bg border border-border-light h-[120px] px-3 py-3 overflow-hidden flex flex-col items-center text-center ${fontClass}`}
        style={{
          background: `linear-gradient(180deg, ${color}10 0%, transparent 50%), var(--card-bg)`,
        }}
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-5 h-5 rounded-md object-cover mb-1" />
        )}
        <p className="text-[12px] font-bold text-foreground tracking-tight leading-tight">{title}</p>
        <div className="w-3 h-px bg-foreground/30 my-1.5" />
        <p className="text-[6.5px] text-text-tertiary leading-snug max-w-[80%]">A few questions to start the conversation.</p>
        <div className="w-full mt-2 space-y-1.5">
          <div className="h-[12px] rounded-md bg-surface border border-border-light" />
          <div
            className="h-[14px] rounded-md text-[7px] font-semibold text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            Submit
          </div>
        </div>
      </div>
    );
  }

  // Classic — branded card with gradient header
  return (
    <div className={`rounded-lg bg-card-bg border border-border-light h-[120px] overflow-hidden flex flex-col ${fontClass}`}>
      <div
        className="px-2.5 pt-2 pb-1.5"
        style={{
          background: `linear-gradient(180deg, ${color}26 0%, transparent 100%)`,
        }}
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="w-4 h-4 rounded-md object-cover mb-0.5" />
        )}
        <p className="text-[9px] font-bold text-foreground tracking-tight leading-tight">{title}</p>
        <p className="text-[6px] text-text-tertiary mt-0.5">We&apos;ll be in touch shortly.</p>
      </div>
      <div className="px-2.5 pb-2 pt-1.5 space-y-1 flex-1 flex flex-col justify-end">
        <div>
          <p className="text-[6px] font-semibold text-foreground mb-0.5">NAME</p>
          <div className="h-[9px] rounded bg-surface border border-border-light" />
        </div>
        <div>
          <p className="text-[6px] font-semibold text-foreground mb-0.5">EMAIL</p>
          <div className="h-[9px] rounded bg-surface border border-border-light" />
        </div>
        <div
          className="h-[12px] rounded-md text-[6.5px] font-semibold text-white flex items-center justify-center mt-0.5"
          style={{ backgroundColor: color }}
        >
          Submit Inquiry
        </div>
      </div>
    </div>
  );
}

export function FormsPage() {
  const { forms, updateForm, deleteForm, addForm } = useFormsStore();
  const { formResponses } = useFormResponsesStore();
  const { workspaceId } = useAuth();
  const bookingPageSlug = useSettingsStore((s) => s.settings?.bookingPageSlug);
  const workspaceLogo = useSettingsStore((s) => s.settings?.branding?.logo);
  const services = useServicesStore((s) => s.services);
  const renderableServices = useMemo(
    () =>
      services
        .filter((s) => s.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ id: s.id, name: s.name })),
    [services],
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slideMode, setSlideMode] = useState<SlideMode>("edit");
  const [previewOpen, setPreviewOpen] = useState(false);
  // Holds the editor's in-progress draft so the preview renders unsaved
  // edits live. Falls back to the saved form when no draft is in flight.
  const [draftForm, setDraftForm] = useState<Form | null>(null);
  const [previewView, setPreviewView] = useState<"welcome" | "form" | "success">("form");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const mounted = useMounted();
  const [pendingAutoFlowFormId, setPendingAutoFlowFormId] = useState<string | null>(null);
  const pendingAutoFlowForm = pendingAutoFlowFormId
    ? forms.find((f) => f.id === pendingAutoFlowFormId) ?? null
    : null;

  // Stable so it can sit in the useEffect dep array below without
  // re-firing on every render.
  const clearQueryParams = useCallback(
    (keys: string[]) => {
      const next = new URLSearchParams(searchParams.toString());
      keys.forEach((key) => next.delete(key));
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Deep-link: /dashboard/forms?form=<id>&tab=<edit|preview|embed> opens the
  // slide-over directly. Deferred via setTimeout so the setState runs async
  // (satisfies React 19 purity — no synchronous setState inside the effect body).
  useEffect(() => {
    const formId = searchParams.get("form");
    const tab = searchParams.get("tab");
    if (!formId || !forms.some((f) => f.id === formId)) return;

    const t = window.setTimeout(() => {
      setSelectedId(formId);
      if (tab === "preview") {
        setPreviewOpen(true);
      } else if (
        tab === "edit" ||
        tab === "after" ||
        tab === "reply" ||
        tab === "style" ||
        tab === "embed"
      ) {
        setSlideMode(tab);
      }
    }, 0);
    clearQueryParams(["form", "tab"]);
    return () => window.clearTimeout(t);
  }, [forms, searchParams, clearQueryParams]);

  const selected = selectedId ? forms.find((f) => f.id === selectedId) : null;
  // Booking forms intentionally hidden from this page — booking flows are
  // managed via the Bookings/Services surface, not here.
  // Inquiry forms split into two buckets:
  //   Main = auto-flow to Leads is on (canonical lead-capture forms)
  //   Additional = custom forms whose submissions stay on this page
  const mainInquiryForms = forms.filter((f) => f.type === "inquiry" && f.autoPromoteToInquiry);
  const additionalInquiryForms = forms.filter((f) => f.type === "inquiry" && !f.autoPromoteToInquiry);

  // Submissions per form, used to render the live count chip on each card.
  const submissionsByFormId = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of formResponses) {
      if (!r.formId) continue;
      map.set(r.formId, (map.get(r.formId) ?? 0) + 1);
    }
    return map;
  }, [formResponses]);

  const openForm = (id: string, mode: "preview" | SlideMode) => {
    setSelectedId(id);
    if (mode === "preview") {
      setPreviewOpen(true);
    } else {
      setSlideMode(mode);
      setPreviewOpen(false);
    }
  };

  const toggleEnabled = (form: Form, e: React.MouseEvent) => {
    e.stopPropagation();
    updateForm(form.id, { enabled: !form.enabled }, workspaceId || undefined);
  };

  return (
    <div>
      <PageHeader
        title="Forms and Inquiries"
        description="Forms for your website. Submissions appear inline — Main forms flow into Leads automatically."
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
              autoPromoteToInquiry: false,
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
              autoPromoteToInquiry: false,
            }, workspaceId || undefined);
            if (f) openForm(f.id, "edit");
          }}>
            <Plus className="w-4 h-4 mr-1.5" /> Create your first form
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {mainInquiryForms.length > 0 && (
            <FormAccordionSection
              label="Main forms"
              sublabel="Submissions auto-flow into Leads."
              icon={<Inbox className="w-4 h-4 text-text-secondary" />}
              forms={mainInquiryForms}
              submissionsByFormId={submissionsByFormId}
              onOpen={openForm}
              onToggle={toggleEnabled}
              onToggleAutoFlow={(form) => setPendingAutoFlowFormId(form.id)}
            />
          )}
          {additionalInquiryForms.length > 0 && (
            <FormAccordionSection
              label="Additional forms"
              sublabel="Custom forms — submissions stay here unless you mark them as a lead."
              icon={<FileText className="w-4 h-4 text-text-secondary" />}
              forms={additionalInquiryForms}
              submissionsByFormId={submissionsByFormId}
              onOpen={openForm}
              onToggle={toggleEnabled}
              onToggleAutoFlow={(form) => setPendingAutoFlowFormId(form.id)}
            />
          )}
        </div>
      )}

      {/* Form Slide-over — Edit / After / Style / Share. Preview is a separate
          panel that opens to the left of this one without changing this content. */}
      {selected && (
        <SlideOver
          open
          onClose={() => { setSelectedId(null); setPreviewOpen(false); setDraftForm(null); setPreviewView("form"); setPreviewFullscreen(false); }}
          title={
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground tracking-tight truncate">{selected.name}</h3>
              <p className="text-[11px] font-normal text-text-secondary mt-0.5 truncate">{selected.type} form · {selected.fields.length} fields</p>
            </div>
          }
          headerExtra={
            <Button variant="ghost" size="sm" onClick={() => { deleteForm(selected.id, workspaceId || undefined); setSelectedId(null); setPreviewOpen(false); setDraftForm(null); setPreviewView("form"); setPreviewFullscreen(false); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          }
        >
          <div className="-mt-2">
            <div className="flex items-center justify-between gap-2 border-b border-border-light mb-5 -mx-1">
              <div className="flex gap-0.5">
                {(["edit", "after", "reply", "style", "embed"] as SlideMode[]).map((m) => {
                  const labels: Record<SlideMode, string> = {
                    edit: "Form",
                    after: "After submission",
                    reply: "Auto-reply",
                    style: "Style",
                    embed: "Share",
                  };
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
              <button
                onClick={() => setPreviewOpen((o) => !o)}
                title={previewOpen ? "Hide live preview" : "Show live preview"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 mb-1 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${
                  previewOpen
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:text-foreground hover:bg-surface"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {previewOpen ? "Hide preview" : "Show preview"}
              </button>
            </div>

            {(slideMode === "edit" || slideMode === "style" || slideMode === "after" || slideMode === "reply") && (
              <FormEditor
                key={selected.id}
                form={selected}
                allForms={forms}
                mode={slideMode}
                workspaceLogo={workspaceLogo}
                onUpdate={(data) => updateForm(selected.id, data, workspaceId || undefined)}
                onDraftChange={setDraftForm}
              />
            )}
            {slideMode === "embed" && (
              <FormEmbed form={selected} bookingPageSlug={bookingPageSlug} />
            )}
          </div>
        </SlideOver>
      )}

      {/* Live preview panel — sits to the LEFT of the slide-over (the slide-over
          is anchored right with max-w-2xl = 672px, so this panel's right edge
          aligns at right: 672px). Independent of which tab is active in the
          slide-over; updates live as fields change. */}
      {selected && mounted && createPortal(
        <AnimatePresence>
          {previewOpen && (
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.8 }}
              className={`fixed top-0 h-full bg-card-bg border-l border-border-light flex flex-col shadow-2xl shadow-black/8 ${
                previewFullscreen ? "left-0 right-0 z-[70]" : "w-full max-w-xl z-[61]"
              }`}
              style={previewFullscreen ? undefined : { right: "min(672px, 100vw)" }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Live preview</h3>
                  <p className="text-[12.5px] text-text-secondary mt-0.5 leading-snug">
                    {previewView === "welcome"
                      ? "Welcome screen before the questions"
                      : previewView === "form"
                      ? "Form as visitors see it"
                      : "Thank-you screen after submit"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-surface border border-border-light rounded-lg p-0.5">
                    {(["welcome", "form", "success"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setPreviewView(v)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md cursor-pointer transition-colors capitalize ${
                          previewView === v
                            ? "bg-card-bg text-foreground shadow-sm"
                            : "text-text-tertiary hover:text-foreground"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPreviewFullscreen((v) => !v)}
                    className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                    aria-label={previewFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    title={previewFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
                  >
                    {previewFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => { setPreviewFullscreen(false); setPreviewOpen(false); }}
                    className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer"
                    aria-label="Close preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FormPreviewRenderer form={draftForm ?? selected} view={previewView} workspaceLogo={workspaceLogo} services={renderableServices} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      {/* Auto-flow toggle confirmation — moving a form between Main and
          Additional changes how every future submission is routed, so we
          ask before flipping it. */}
      {pendingAutoFlowForm && (
        <ConfirmDialog
          open
          onClose={() => setPendingAutoFlowFormId(null)}
          onConfirm={() => {
            updateForm(
              pendingAutoFlowForm.id,
              { autoPromoteToInquiry: !pendingAutoFlowForm.autoPromoteToInquiry },
              workspaceId || undefined,
            );
            toast(
              pendingAutoFlowForm.autoPromoteToInquiry
                ? "Moved to Additional forms — submissions won't auto-flow to Leads"
                : "Moved to Main forms — submissions will auto-flow to Leads",
            );
          }}
          title={
            pendingAutoFlowForm.autoPromoteToInquiry
              ? `Turn off auto-flow for "${pendingAutoFlowForm.name}"?`
              : `Turn on auto-flow for "${pendingAutoFlowForm.name}"?`
          }
          message={
            pendingAutoFlowForm.autoPromoteToInquiry
              ? `New submissions to this form will stop appearing on Leads automatically. They'll stay on this page until you mark each one as a lead by hand. Existing leads aren't affected.`
              : `Every new submission to this form will appear on Leads automatically. The form will move to your Main forms section. Existing submissions aren't affected.`
          }
          confirmLabel={pendingAutoFlowForm.autoPromoteToInquiry ? "Turn off" : "Turn on"}
          variant="primary"
        />
      )}
    </div>
  );
}

// ── Form Accordion Section ──

function FormAccordionSection({ label, sublabel, icon, forms, submissionsByFormId, onOpen, onToggle, onToggleAutoFlow }: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  forms: Form[];
  submissionsByFormId: Map<string, number>;
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
                      {form.fields.length} fields
                      {count > 0 && (
                        <>
                          {" · "}
                          <span className="text-foreground font-medium">
                            {count} response{count === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                      {form.slug && (
                        <>
                          {" · "}
                          <span className="font-mono inline-flex items-center gap-1">
                            <Globe className="w-3 h-3" />/{form.slug}
                          </span>
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

// ── Form Editor ──

function FormEditor({
  form,
  allForms,
  mode,
  workspaceLogo,
  onUpdate,
  onDraftChange,
}: {
  form: Form;
  allForms: Form[];
  /** Which tab is active — edit covers content/structure, style covers visuals,
   *  after covers the thank-you screen (CTA + redirect), reply covers
   *  auto-replies and owner notifications. */
  mode: "edit" | "style" | "after" | "reply";
  /** Workspace logo from Settings — shown as the fallback when this form
   *  has no logo override. */
  workspaceLogo?: string;
  onUpdate: (data: Partial<Form>) => void;
  /** Fires on every draft change so the live preview can render unsaved edits. */
  onDraftChange?: (draft: Form) => void;
}) {
  const [name, setName] = useState(form.name);
  const [color, setColor] = useState(form.branding.primaryColor || "#8B5CF6");
  const [description, setDescription] = useState(form.branding.description ?? "");
  const [successMessage, setSuccessMessage] = useState(form.branding.successMessage ?? "");
  const [template, setTemplate] = useState<FormTemplate>(form.branding.template ?? "classic");
  const [fontFamily, setFontFamily] = useState<FormFontFamily>(form.branding.fontFamily ?? "sans");
  const [theme, setTheme] = useState<FormTheme>(form.branding.theme ?? "light");
  const [logo, setLogo] = useState<string | undefined>(form.branding.logo);
  const [coverImage, setCoverImage] = useState<string | undefined>(form.branding.coverImage);
  const [welcomeEnabled, setWelcomeEnabled] = useState<boolean>(form.branding.welcomeEnabled ?? false);
  const [welcomeTitle, setWelcomeTitle] = useState(form.branding.welcomeTitle ?? "");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(form.branding.welcomeSubtitle ?? "");
  const [welcomeCtaLabel, setWelcomeCtaLabel] = useState(form.branding.welcomeCtaLabel ?? "");
  const [successRouteFieldName, setSuccessRouteFieldName] = useState<string | undefined>(form.branding.successRouteFieldName);
  const [successVariants, setSuccessVariants] = useState<FormSuccessVariant[]>(form.branding.successVariants ?? []);
  const [fields, setFields] = useState<FormFieldConfig[]>(form.fields);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── After-submission settings (success CTA, email/SMS auto-reply, owner notify) ──
  const [successCtaLabel, setSuccessCtaLabel] = useState(form.branding.successCtaLabel ?? "");
  const [successCtaUrl, setSuccessCtaUrl] = useState(form.branding.successCtaUrl ?? "");
  const [successRedirectUrl, setSuccessRedirectUrl] = useState(form.branding.successRedirectUrl ?? "");
  const [successRedirectDelaySeconds, setSuccessRedirectDelaySeconds] = useState<number>(
    form.branding.successRedirectDelaySeconds ?? 5,
  );
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(
    form.branding.autoReplyEnabled ?? true,
  );
  const [autoReplySubject, setAutoReplySubject] = useState(form.branding.autoReplySubject ?? "");
  const [autoReplyBody, setAutoReplyBody] = useState(form.branding.autoReplyBody ?? "");
  const [autoReplyDelayMinutes, setAutoReplyDelayMinutes] = useState<number>(
    form.branding.autoReplyDelayMinutes ?? 0,
  );
  const [autoReplySmsEnabled, setAutoReplySmsEnabled] = useState<boolean>(
    form.branding.autoReplySmsEnabled ?? false,
  );
  const [autoReplySmsBody, setAutoReplySmsBody] = useState(form.branding.autoReplySmsBody ?? "");
  const [autoReplySmsDelayMinutes, setAutoReplySmsDelayMinutes] = useState<number>(
    form.branding.autoReplySmsDelayMinutes ?? 0,
  );
  const [notifyOwnerEmail, setNotifyOwnerEmail] = useState<boolean>(
    form.branding.notifyOwnerEmail ?? true,
  );

  // Slug: track what the user explicitly typed separately from the
  // suggestion derived from the name. Until the user edits the field,
  // the displayed slug is derived during render — no useEffect needed.
  const [userSlug, setUserSlug] = useState(form.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!form.slug);
  const slug = slugTouched ? userSlug : slugify(name);

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

  // Emit the in-progress draft on every state change so the live preview can
  // render unsaved edits. The Save button is still the canonical commit;
  // this is purely view-side.
  //
  // We intentionally omit `form` and `onDraftChange` from the dep array:
  // `form` only changes on save, and the parent remounts FormEditor via
  // `key={selected.id}` when switching forms. Including `form` would refire
  // the effect after every save with no semantic change.
  // Build the branding object from current draft state. Centralised so the
  // live preview, save, and confirmation tab all see the same shape.
  const buildBranding = useCallback(() => ({
    ...form.branding,
    primaryColor: color,
    description: description.trim() || undefined,
    successMessage: successMessage.trim() || undefined,
    template,
    fontFamily,
    theme,
    logo,
    coverImage,
    welcomeEnabled,
    welcomeTitle: welcomeTitle.trim() || undefined,
    welcomeSubtitle: welcomeSubtitle.trim() || undefined,
    welcomeCtaLabel: welcomeCtaLabel.trim() || undefined,
    successCtaLabel: successCtaLabel.trim() || undefined,
    successCtaUrl: successCtaUrl.trim() || undefined,
    successRedirectUrl: successRedirectUrl.trim() || undefined,
    successRedirectDelaySeconds:
      successRedirectUrl.trim() && Number.isFinite(successRedirectDelaySeconds)
        ? Math.max(0, Math.min(60, successRedirectDelaySeconds))
        : undefined,
    successRouteFieldName: successRouteFieldName || undefined,
    successVariants: successVariants.length > 0 ? successVariants : undefined,
    autoReplyEnabled,
    autoReplySubject: autoReplySubject.trim() || undefined,
    autoReplyBody: autoReplyBody.trim() || undefined,
    autoReplyDelayMinutes: clampDelay(autoReplyDelayMinutes),
    autoReplySmsEnabled,
    autoReplySmsBody: autoReplySmsBody.trim() || undefined,
    autoReplySmsDelayMinutes: clampDelay(autoReplySmsDelayMinutes),
    notifyOwnerEmail,
  }), [
    form.branding, color, description, successMessage, template, fontFamily, theme, logo, coverImage,
    welcomeEnabled, welcomeTitle, welcomeSubtitle, welcomeCtaLabel,
    successCtaLabel, successCtaUrl, successRedirectUrl, successRedirectDelaySeconds,
    successRouteFieldName, successVariants,
    autoReplyEnabled, autoReplySubject, autoReplyBody, autoReplyDelayMinutes,
    autoReplySmsEnabled, autoReplySmsBody, autoReplySmsDelayMinutes, notifyOwnerEmail,
  ]);

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange({
      ...form,
      name,
      slug: trimmedSlug || form.slug,
      fields,
      branding: buildBranding(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, trimmedSlug, fields, buildBranding]);

  // ── Autosave ──
  // Debounced commit. Every keystroke pushes the draft into the live preview
  // (above), but persistence waits until the user has paused — saves us from
  // hammering the store/network and avoids partial-word slugs going to disk.
  //
  // Three guarantees this code provides:
  //   1. Unmount-flush — the slide-over can close mid-debounce; we still save.
  //   2. beforeunload guard — closing the tab while a save is pending warns
  //      the user instead of silently dropping edits.
  //   3. Real save status — we await the network round-trip, so "Saved" only
  //      shows after the DB write actually lands. Failures surface as "error".
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const skipFirstSaveRef = useRef(true);
  // Stash the latest snapshot so the unmount-flush has the freshest values
  // without closing over stale state. Updated on every render.
  const latestDraftRef = useRef({
    name,
    slug: trimmedSlug,
    fields,
    branding: buildBranding(),
    canSave,
  });
  useEffect(() => {
    latestDraftRef.current = {
      name,
      slug: trimmedSlug,
      fields,
      branding: buildBranding(),
      canSave,
    };
  });
  // True from the moment a change is dirty until the matching save finishes.
  // Drives the unmount-flush and the beforeunload prompt.
  const dirtyRef = useRef(false);

  const commit = useCallback(async () => {
    const snap = latestDraftRef.current;
    if (!snap.canSave) return;
    setSaveStatus("saving");
    try {
      await onUpdateRef.current({
        name: snap.name,
        slug: snap.slug,
        fields: snap.fields,
        branding: snap.branding,
      });
      dirtyRef.current = false;
      setSaveError(null);
      setSaveStatus("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    // Initial mount populates state from `form`; that's not a user edit.
    if (skipFirstSaveRef.current) {
      skipFirstSaveRef.current = false;
      return;
    }
    dirtyRef.current = true;
    // Slug invalid / colliding — surface the error inline; don't autosave.
    if (!canSave) return;
    setSaveStatus("pending");
    const timer = setTimeout(() => {
      void commit();
    }, 800);
    return () => clearTimeout(timer);
  }, [name, trimmedSlug, fields, buildBranding, canSave, commit]);

  // Unmount flush — if there's a pending change we haven't persisted, fire
  // it now. The optimistic local update inside the store is synchronous; the
  // DB write continues in flight after the component is gone.
  useEffect(() => {
    return () => {
      if (dirtyRef.current && latestDraftRef.current.canSave) {
        void commit();
      }
    };
  }, [commit]);

  // beforeunload — warn before the user navigates away with unsaved edits.
  // Browsers ignore custom strings now, but setting `returnValue` triggers
  // the generic prompt. Cleared as soon as the save completes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // "Saved" pill fades back to a neutral idle state after a moment so it
  // doesn't sit there permanently and lose meaning.
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 1500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  // Tracks the index of the most recently added field so the post-render
  // effect can scroll + focus it. A ref (not state) so we don't re-render
  // just to clear the signal — and so the lint rule against setState-in-effect
  // stays satisfied.
  const pendingFocusIdxRef = useRef<number | null>(null);
  const fieldRowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const addField = (type: FormFieldConfig["type"]) => {
    const meta = FIELD_TYPE_META[type];
    setFields((prev) => {
      const nextIdx = prev.length;
      pendingFocusIdxRef.current = nextIdx;
      const base: FormFieldConfig = {
        name: `${type}_${nextIdx}`,
        type,
        label: meta.defaultLabel,
        required: false,
      };
      if (fieldHasOptions(type)) {
        base.options = ["Option 1", "Option 2"];
      }
      if (type === "file") {
        base.acceptedFileTypes = "image/*";
        base.maxFileSizeMb = 5;
        base.multipleFiles = false;
      }
      if (type === "hidden") {
        base.paramKeys = "utm_source,source,ref";
      }
      return [...prev, base];
    });
    setFieldPickerOpen(false);
  };

  // After a new field is appended, scroll its row into view and focus the
  // label input so the user lands directly on it instead of staying at the
  // top of the editor.
  useEffect(() => {
    const idx = pendingFocusIdxRef.current;
    if (idx === null) return;
    pendingFocusIdxRef.current = null;
    const row = fieldRowRefs.current[idx];
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    const labelInput = row.querySelector<HTMLInputElement>("input[data-field-label]");
    if (labelInput) {
      labelInput.focus();
      labelInput.select();
    }
  }, [fields]);

  const updateField = (idx: number, updates: Partial<FormFieldConfig>) => {
    setFields((p) => p.map((f, i) => i === idx ? { ...f, ...updates } : f));
  };

  const removeField = (idx: number) => {
    setFields((p) => p.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {mode === "after" && (
        <>
          <ThankYouSection
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
            successCtaLabel={successCtaLabel}
            setSuccessCtaLabel={setSuccessCtaLabel}
            successCtaUrl={successCtaUrl}
            setSuccessCtaUrl={setSuccessCtaUrl}
            successRedirectUrl={successRedirectUrl}
            setSuccessRedirectUrl={setSuccessRedirectUrl}
            successRedirectDelaySeconds={successRedirectDelaySeconds}
            setSuccessRedirectDelaySeconds={setSuccessRedirectDelaySeconds}
          />
          <RoutedThankYouSection
            fields={fields}
            routeFieldName={successRouteFieldName}
            variants={successVariants}
            onChangeRouteFieldName={setSuccessRouteFieldName}
            onChangeVariants={setSuccessVariants}
          />
        </>
      )}

      {mode === "reply" && (
        <AutoReplySection
          autoReplyEnabled={autoReplyEnabled}
          setAutoReplyEnabled={setAutoReplyEnabled}
          autoReplySubject={autoReplySubject}
          setAutoReplySubject={setAutoReplySubject}
          autoReplyBody={autoReplyBody}
          setAutoReplyBody={setAutoReplyBody}
          autoReplyDelayMinutes={autoReplyDelayMinutes}
          setAutoReplyDelayMinutes={setAutoReplyDelayMinutes}
          autoReplySmsEnabled={autoReplySmsEnabled}
          setAutoReplySmsEnabled={setAutoReplySmsEnabled}
          autoReplySmsBody={autoReplySmsBody}
          setAutoReplySmsBody={setAutoReplySmsBody}
          autoReplySmsDelayMinutes={autoReplySmsDelayMinutes}
          setAutoReplySmsDelayMinutes={setAutoReplySmsDelayMinutes}
          notifyOwnerEmail={notifyOwnerEmail}
          setNotifyOwnerEmail={setNotifyOwnerEmail}
          formFields={fields}
        />
      )}

      {mode === "edit" && (<>
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
                setUserSlug(e.target.value.replace(/\s/g, "-").toLowerCase());
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

      </>)}

      {mode === "style" && (<>
      {/* Logo — per-form override that falls back to the workspace logo */}
      <FormLogoUpload
        logo={logo}
        workspaceLogo={workspaceLogo}
        onChange={setLogo}
      />

      {/* Cover image — full-width hero photo above the form title */}
      <CoverImageUpload value={coverImage} onChange={setCoverImage} />

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

      {/* Template + font — visual presets, not a full builder */}
      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Template</label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_OPTIONS.map((opt) => {
            const active = template === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTemplate(opt.id)}
                className={`relative text-left rounded-xl border p-3 cursor-pointer transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border-light hover:border-text-tertiary bg-surface"
                }`}
              >
                <TemplateThumb id={opt.id} color={color} fontFamily={fontFamily} formName={name} logo={logo || workspaceLogo} />
                <p className="text-[13px] font-semibold text-foreground mt-2">{opt.label}</p>
                <p className="text-[11px] text-text-tertiary leading-snug">{opt.description}</p>
                {active && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Font</label>
        <div className="grid grid-cols-4 gap-2">
          {FONT_OPTIONS.map((opt) => {
            const active = fontFamily === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFontFamily(opt.id)}
                className={`rounded-lg border py-2.5 px-3 cursor-pointer transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border-light hover:border-text-tertiary bg-surface"
                }`}
              >
                <p className={`text-[15px] font-semibold text-foreground ${opt.previewClass}`}>Aa</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">{opt.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme — light / dark / auto. Scoped to the form only; the operator's
          dashboard theme is unaffected. */}
      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const active = theme === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`rounded-lg border py-2.5 px-3 cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border-light hover:border-text-tertiary bg-surface"
                }`}
              >
                <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${opt.swatchClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] font-semibold text-foreground">{opt.label}</p>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-text-tertiary mt-1.5">
          {theme === "auto"
            ? "Matches the visitor's system setting."
            : theme === "dark"
            ? "Form always renders in dark mode."
            : "Form always renders in light mode."}
        </p>
      </div>

      </>)}

      {mode === "edit" && (<>
      {/* Description — shown under the form title on the public form. The
          thank-you Success Message lives on the After-submission tab now,
          since it's part of the post-submit screen, not the form itself. */}
      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
          Description <span className="text-text-tertiary font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Shown under the form title. Describe what this form is for."
          className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Welcome / cover screen */}
      <WelcomeScreenEditor
        enabled={welcomeEnabled}
        title={welcomeTitle}
        subtitle={welcomeSubtitle}
        ctaLabel={welcomeCtaLabel}
        onChangeEnabled={setWelcomeEnabled}
        onChangeTitle={setWelcomeTitle}
        onChangeSubtitle={setWelcomeSubtitle}
        onChangeCtaLabel={setWelcomeCtaLabel}
      />

      {/* Fields */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Fields ({fields.length})</label>
          <button
            onClick={() => setFieldPickerOpen((v) => !v)}
            className="text-[12px] text-primary font-medium hover:underline cursor-pointer flex items-center gap-1"
          >
            {fieldPickerOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {fieldPickerOpen ? "Cancel" : "Add Field"}
          </button>
        </div>

        <FieldTypePickerInline
          open={fieldPickerOpen}
          onPick={addField}
          onClose={() => setFieldPickerOpen(false)}
        />

        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div key={idx}
              ref={(el) => { fieldRowRefs.current[idx] = el; }}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => { if (dragIdx !== null && dragIdx !== idx) { const next = [...fields]; const [moved] = next.splice(dragIdx, 1); next.splice(idx, 0, moved); setFields(next); } setDragIdx(null); setDragOverIdx(null); }}
              onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
              className={`bg-surface rounded-lg border p-3 transition-all ${dragOverIdx === idx ? "border-primary/40 bg-primary/5" : "border-border-light"} ${dragIdx === idx ? "opacity-40" : ""}`}
            >
              <div className="flex items-start gap-2 mb-2">
                {(() => {
                  const tint = FIELD_TYPE_TINT[field.type];
                  const Icon = FIELD_TYPE_META[field.type].icon;
                  return (
                    <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${tint.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${tint.icon}`} />
                    </div>
                  );
                })()}
                <GripVertical className="w-4 h-4 text-text-tertiary mt-2 cursor-grab active:cursor-grabbing flex-shrink-0" />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <input
                    data-field-label
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value, name: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                    placeholder="Field label"
                    className="col-span-2 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none"
                  />
                  <select value={field.type} onChange={(e) => updateField(idx, { type: e.target.value as FormFieldConfig["type"] })}
                    className="px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none">
                    {FIELD_TYPE_ORDER.map((t) => (
                      <option key={t} value={t}>{FIELD_TYPE_META[t].label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between pl-6">
                {field.type === "hidden" ? (
                  <span className="text-[11px] text-text-tertiary inline-flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Hidden — auto-captured from URL
                  </span>
                ) : (
                  <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })}
                      className="rounded" />
                    Required
                  </label>
                )}
                <div className="flex items-center gap-0.5">
                  <ConditionToggle
                    fields={fields}
                    idx={idx}
                    onSeed={() => updateField(idx, { showWhen: seedCondition(fields, idx) })}
                    onClear={() => updateField(idx, { showWhen: undefined })}
                  />
                  <button onClick={() => removeField(idx)} className="text-text-tertiary hover:text-red-500 cursor-pointer p-1" aria-label="Remove field">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {fieldHasOptions(field.type) && (
                <input value={field.options?.join(", ") || ""} onChange={(e) => updateField(idx, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })}
                  placeholder="Options (comma separated)"
                  className="w-full mt-2 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground outline-none" />
              )}
              {field.type === "file" && (
                <div className="grid grid-cols-3 gap-2 pl-6 mt-2 items-center">
                  <input
                    value={field.acceptedFileTypes ?? ""}
                    onChange={(e) => updateField(idx, { acceptedFileTypes: e.target.value || undefined })}
                    placeholder="Accept e.g. image/*"
                    className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={field.maxFileSizeMb ?? 5}
                      onChange={(e) => updateField(idx, { maxFileSizeMb: Math.max(1, Math.min(20, Number(e.target.value) || 5)) })}
                      className="w-14 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground outline-none"
                    />
                    <span className="text-[11px] text-text-tertiary">MB max</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[12px] text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={!!field.multipleFiles} onChange={(e) => updateField(idx, { multipleFiles: e.target.checked })} />
                    Allow multiple
                  </label>
                </div>
              )}
              {field.type === "hidden" && (
                <div className="grid grid-cols-2 gap-2 pl-6 mt-2">
                  <input
                    value={field.paramKeys ?? ""}
                    onChange={(e) => updateField(idx, { paramKeys: e.target.value || undefined })}
                    placeholder="URL keys e.g. utm_source,source"
                    className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none font-mono"
                  />
                  <input
                    value={field.defaultValue ?? ""}
                    onChange={(e) => updateField(idx, { defaultValue: e.target.value || undefined })}
                    placeholder="Default value (if no match)"
                    className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                </div>
              )}
              {field.type !== "hidden" && (
                <div className="grid grid-cols-2 gap-2 pl-6 mt-2">
                  <input
                    value={field.placeholder ?? ""}
                    onChange={(e) => updateField(idx, { placeholder: e.target.value || undefined })}
                    placeholder="Placeholder (optional)"
                    className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                  <input
                    value={field.helpText ?? ""}
                    onChange={(e) => updateField(idx, { helpText: e.target.value || undefined })}
                    placeholder="Help text (optional)"
                    className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                  />
                </div>
              )}
              <ConditionEditor
                fields={fields}
                idx={idx}
                onChange={(showWhen) => updateField(idx, { showWhen })}
              />
            </div>
          ))}
        </div>
      </div>

      </>)}

      {/* Autosave status — replaces the explicit Save button. Edits commit
          on a short debounce; this pill is the visible signal that work isn't
          being lost. Errors (e.g. invalid slug or a failed network call)
          hold the save until fixed; a manual retry restarts the commit. */}
      <SaveStatusIndicator
        status={saveStatus}
        canSave={canSave}
        slugError={slugError}
        saveError={saveError}
        onRetry={() => void commit()}
      />
    </div>
  );
}

// Footer status pill for the editor — quiet by default, surfaces save state
// or a blocking validation error so the user always knows where they stand.
function SaveStatusIndicator({
  status,
  canSave,
  slugError,
  saveError,
  onRetry,
}: {
  status: "idle" | "pending" | "saving" | "saved" | "error";
  canSave: boolean;
  slugError: string;
  saveError: string | null;
  onRetry: () => void;
}) {
  if (!canSave) {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-red-600 py-2">
        <X className="w-3.5 h-3.5" />
        <span>Can&apos;t autosave — {slugError || "fix the errors above"}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center justify-center gap-2 text-[12.5px] text-red-600 py-2">
        <X className="w-3.5 h-3.5" />
        <span>Save failed{saveError ? ` — ${saveError}` : ""}.</span>
        <button
          type="button"
          onClick={onRetry}
          className="underline font-medium hover:text-red-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }
  // "Pending" (debounce timer waiting) and "saving" (network in flight) read
  // the same to the user — both mean "not yet safely persisted".
  if (status === "pending" || status === "saving") {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-text-tertiary py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-pulse" />
        <span>{status === "saving" ? "Saving…" : "Saving…"}</span>
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-emerald-600 py-2">
        <Check className="w-3.5 h-3.5" />
        <span>Saved</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-text-tertiary py-2">
      <Check className="w-3.5 h-3.5" />
      <span>All changes saved</span>
    </div>
  );
}

// ── Post-submission editor sections ──
//
// Two tabs split this work: After-submission (thank-you screen — CTA + redirect)
// and Auto-reply (email + SMS to the visitor, plus owner notify). All optional,
// all stored on form.branding (no migration).

// Auto-reply delay clamps to a 7-day window. Beyond that and the user almost
// certainly meant something else; tighter caps would shoot themselves in the
// foot for legitimate "follow up the next morning" workflows.
const MAX_AUTOREPLY_DELAY_MINUTES = 60 * 24 * 7;
function clampDelay(v: number): number | undefined {
  if (!Number.isFinite(v) || v <= 0) return undefined;
  return Math.min(Math.max(0, Math.round(v)), MAX_AUTOREPLY_DELAY_MINUTES);
}

// Merge tags available in auto-reply email/SMS bodies. `source` distinguishes
// values pulled from the inquiry (the visitor's input) from workspace settings
// (configured once in Settings → Business). The Info popover renders this so
// non-technical users know where each value comes from.
type MergeTagSource = "inquiry" | "workspace";
const MERGE_TAGS: Array<{
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
function MergeTagBar({ onInsert }: { onInsert: (token: string) => void }) {
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

// Curated delay presets — covers the realistic range without exposing a free
// number input. "Send immediately" maps to undefined on save (clampDelay).
const DELAY_PRESETS: Array<{ label: string; minutes: number }> = [
  { label: "Send immediately", minutes: 0 },
  { label: "5 minutes after submit", minutes: 5 },
  { label: "15 minutes after submit", minutes: 15 },
  { label: "30 minutes after submit", minutes: 30 },
  { label: "1 hour after submit", minutes: 60 },
  { label: "2 hours after submit", minutes: 120 },
  { label: "4 hours after submit", minutes: 240 },
  { label: "1 day after submit", minutes: 60 * 24 },
];

function DelayPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const matched = DELAY_PRESETS.find((p) => p.minutes === value) ?? DELAY_PRESETS[0];
  return (
    <InlineDropdown
      value={String(matched.minutes)}
      options={DELAY_PRESETS.map((p) => ({
        value: String(p.minutes),
        label: p.label,
      }))}
      onChange={(next) => onChange(Number(next))}
      ariaLabel="Send delay"
      triggerClassName="w-full justify-between px-2.5 py-1.5 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground hover:border-text-tertiary transition-colors"
    >
      <span className="flex items-center gap-2 min-w-0">
        <Clock className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
        <span className="truncate">{matched.label}</span>
      </span>
    </InlineDropdown>
  );
}

// Thank-you screen — what the visitor sees the moment they submit.
function ThankYouSection(props: {
  successMessage: string;
  setSuccessMessage: (v: string) => void;
  successCtaLabel: string;
  setSuccessCtaLabel: (v: string) => void;
  successCtaUrl: string;
  setSuccessCtaUrl: (v: string) => void;
  successRedirectUrl: string;
  setSuccessRedirectUrl: (v: string) => void;
  successRedirectDelaySeconds: number;
  setSuccessRedirectDelaySeconds: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Thank-you screen</p>
        <p className="text-[13px] text-text-secondary mt-1 leading-snug">
          What the visitor sees the moment they submit.
        </p>
      </div>

      {/* Success message — the headline shown on the thank-you screen. */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
          Message <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={props.successMessage}
          onChange={(e) => props.setSuccessMessage(e.target.value)}
          rows={2}
          placeholder="Defaults to “Your inquiry has been received. We'll be in touch shortly.”"
          className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Thank-you CTA */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
          Call-to-action button <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={props.successCtaLabel}
            onChange={(e) => props.setSuccessCtaLabel(e.target.value)}
            placeholder="Button label e.g. Visit our Instagram"
            className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            value={props.successCtaUrl}
            onChange={(e) => props.setSuccessCtaUrl(e.target.value)}
            placeholder="https://"
            className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
          />
        </div>
      </div>

      {/* Auto-redirect */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block">
          Auto-redirect <span className="font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={props.successRedirectUrl}
            onChange={(e) => props.setSuccessRedirectUrl(e.target.value)}
            placeholder="https://yoursite.com/thanks"
            className="col-span-2 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={60}
              value={props.successRedirectDelaySeconds}
              onChange={(e) => props.setSuccessRedirectDelaySeconds(Number(e.target.value) || 0)}
              disabled={!props.successRedirectUrl.trim()}
              className="w-16 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <span className="text-[12px] text-text-tertiary">sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Routed thank-you screens — pick a different message/CTA/redirect based
// on the visitor's answer to a chosen field. Useful for inquiries where
// "Wedding" needs different next steps than "Trial". Falls back to the
// default thank-you screen when no variant matches.
function RoutedThankYouSection({
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

  if (eligible.length === 0) {
    return (
      <div className="border-t border-border-light pt-5">
        <p className="text-[14px] font-semibold text-foreground">Routed thank-you screens</p>
        <p className="text-[12px] text-text-secondary mt-1 leading-snug">
          Add a Dropdown, Radio, Multi-select, or Service field to route the thank-you
          screen based on the visitor&apos;s answer.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border-light pt-5 space-y-3">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Routed thank-you screens</p>
        <p className="text-[13px] text-text-secondary mt-1 leading-snug">
          Show a different message based on the visitor&apos;s answer to one field.
          Falls back to the default thank-you screen above when nothing matches.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <label className="block">
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
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

// Auto-reply — email + SMS sent to the visitor, plus the owner heads-up.
function AutoReplySection(props: {
  autoReplyEnabled: boolean;
  setAutoReplyEnabled: (v: boolean) => void;
  autoReplySubject: string;
  setAutoReplySubject: (v: string) => void;
  autoReplyBody: string;
  setAutoReplyBody: (v: string) => void;
  autoReplyDelayMinutes: number;
  setAutoReplyDelayMinutes: (v: number) => void;
  autoReplySmsEnabled: boolean;
  setAutoReplySmsEnabled: (v: boolean) => void;
  autoReplySmsBody: string;
  setAutoReplySmsBody: (v: string) => void;
  autoReplySmsDelayMinutes: number;
  setAutoReplySmsDelayMinutes: (v: number) => void;
  notifyOwnerEmail: boolean;
  setNotifyOwnerEmail: (v: boolean) => void;
  formFields: FormFieldConfig[];
}) {
  const hasPhoneField = props.formFields.some((f) => f.type === "phone");
  const hasEmailField = props.formFields.some((f) => f.type === "email");
  const emailBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const smsBodyRef = useRef<HTMLTextAreaElement | null>(null);

  const insertToken = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    current: string,
    setter: (v: string) => void,
    token: string,
  ) => {
    const el = ref.current;
    if (!el) {
      setter(current + token);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setter(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[14px] font-semibold text-foreground">Auto-reply</p>
        <p className="text-[13px] text-text-secondary mt-1 leading-snug">
          Confirm the inquiry to the visitor and ping yourself.
        </p>
      </div>

      {/* Email auto-reply */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => props.setAutoReplyEnabled(!props.autoReplyEnabled)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[13px] font-semibold text-foreground">Email auto-reply</span>
            {!hasEmailField && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                No email field
              </span>
            )}
          </div>
          {props.autoReplyEnabled ? (
            <ToggleRight className="w-7 h-7 text-primary" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-text-tertiary" />
          )}
        </button>

        {props.autoReplyEnabled && (
          <div className="space-y-2 pl-5">
            <input
              value={props.autoReplySubject}
              onChange={(e) => props.setAutoReplySubject(e.target.value)}
              placeholder="Subject — defaults to “We received your inquiry — {{businessName}}”"
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              ref={emailBodyRef}
              value={props.autoReplyBody}
              onChange={(e) => props.setAutoReplyBody(e.target.value)}
              rows={5}
              placeholder={"Hi {{name}},\n\nThanks for reaching out to {{businessName}} — we've received your inquiry and will be in touch shortly."}
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
            />
            <MergeTagBar
              onInsert={(token) =>
                insertToken(emailBodyRef, props.autoReplyBody, props.setAutoReplyBody, token)
              }
            />
            <DelayPicker
              value={props.autoReplyDelayMinutes}
              onChange={props.setAutoReplyDelayMinutes}
            />
          </div>
        )}
      </div>

      {/* SMS auto-reply */}
      <div className="border-t border-border-light pt-4 space-y-3">
        <button
          type="button"
          onClick={() => props.setAutoReplySmsEnabled(!props.autoReplySmsEnabled)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[13px] font-semibold text-foreground">SMS auto-reply</span>
            {!hasPhoneField && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                No phone field
              </span>
            )}
          </div>
          {props.autoReplySmsEnabled ? (
            <ToggleRight className="w-7 h-7 text-primary" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-text-tertiary" />
          )}
        </button>

        {props.autoReplySmsEnabled && (
          <div className="space-y-2 pl-5">
            <textarea
              ref={smsBodyRef}
              value={props.autoReplySmsBody}
              onChange={(e) => props.setAutoReplySmsBody(e.target.value)}
              rows={3}
              maxLength={320}
              placeholder={"Hi {{name}}, thanks for your inquiry with {{businessName}}. We'll be in touch shortly!"}
              className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
            />
            <div className="flex items-center justify-between gap-2">
              <MergeTagBar
                onInsert={(token) =>
                  insertToken(smsBodyRef, props.autoReplySmsBody, props.setAutoReplySmsBody, token)
                }
              />
              <span className="text-[10px] text-text-tertiary flex-shrink-0">
                {props.autoReplySmsBody.length}/320
              </span>
            </div>
            <DelayPicker
              value={props.autoReplySmsDelayMinutes}
              onChange={props.setAutoReplySmsDelayMinutes}
            />
          </div>
        )}
      </div>

      {/* Owner notification */}
      <div className="border-t border-border-light pt-4">
        <button
          type="button"
          onClick={() => props.setNotifyOwnerEmail(!props.notifyOwnerEmail)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-text-secondary" />
            <div>
              <span className="text-[13px] font-semibold text-foreground">Email me when I get an inquiry</span>
              <p className="text-[12.5px] text-text-secondary mt-0.5 leading-snug">Sent to your contact email in Settings.</p>
            </div>
          </div>
          {props.notifyOwnerEmail ? (
            <ToggleRight className="w-7 h-7 text-primary" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-text-tertiary" />
          )}
        </button>
      </div>

      {/* Sender disclosure */}
      <div className="border-t border-border-light pt-3 flex items-start gap-2 text-[12.5px] text-text-secondary leading-snug">
        <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Auto-replies are sent from{" "}
          <span className="font-mono">bookings@magiccrm.app</span> on your behalf,
          with replies routed to your contact email. Custom domain — coming soon.
        </span>
      </div>
    </div>
  );
}

// ── Field Type Picker ──

// Welcome screen — optional intro card shown before the visitor sees fields.
// Useful for setting expectations on long inquiry forms or warming up a brand
// before pricing questions.
function WelcomeScreenEditor({
  enabled,
  title,
  subtitle,
  ctaLabel,
  onChangeEnabled,
  onChangeTitle,
  onChangeSubtitle,
  onChangeCtaLabel,
}: {
  enabled: boolean;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onChangeEnabled: (v: boolean) => void;
  onChangeTitle: (v: string) => void;
  onChangeSubtitle: (v: string) => void;
  onChangeCtaLabel: (v: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface p-3 space-y-3">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChangeEnabled(e.target.checked)}
          className="mt-0.5 rounded"
        />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">Welcome screen</p>
          <p className="text-[12px] text-text-secondary leading-snug mt-0.5">
            Show an intro card with a Get-started button before the questions.
          </p>
        </div>
      </label>
      {enabled && (
        <div className="space-y-2 pl-7">
          <input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Welcome title — e.g. Let's plan your wedding day"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none"
          />
          <textarea
            value={subtitle}
            onChange={(e) => onChangeSubtitle(e.target.value)}
            rows={2}
            placeholder="Subtitle — set expectations or share pricing notes"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none resize-none"
          />
          <input
            value={ctaLabel}
            onChange={(e) => onChangeCtaLabel(e.target.value)}
            placeholder="Button label (defaults to “Get started”)"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none"
          />
        </div>
      )}
    </div>
  );
}

// Returns the list of fields a given field can gate itself on. Rules can
// only reference fields that come *earlier* in the form — gating on
// something the visitor hasn't seen yet would be confusing.
function eligibleConditionFields(fields: FormFieldConfig[], idx: number): FormFieldConfig[] {
  return fields
    .slice(0, idx)
    .filter((f) => f.type !== "hidden" && f.type !== "file" && f.type !== "date_range");
}

// Default rule seeded when the user first turns conditional logic on for a
// field. Picks the most recent eligible field — almost always what they meant.
function seedCondition(fields: FormFieldConfig[], idx: number): FormFieldCondition | undefined {
  const eligible = eligibleConditionFields(fields, idx);
  if (eligible.length === 0) return undefined;
  const ref = eligible[eligible.length - 1];
  return { fieldName: ref.name, operator: "equals", values: [] };
}

// Small icon toggle that switches a field's conditional logic on or off.
// Hidden when there's nothing earlier in the form to gate on, since the
// rule would have no valid reference.
function ConditionToggle({
  fields,
  idx,
  onSeed,
  onClear,
}: {
  fields: FormFieldConfig[];
  idx: number;
  onSeed: () => void;
  onClear: () => void;
}) {
  const field = fields[idx];
  if (field.type === "hidden") return null;
  const eligible = eligibleConditionFields(fields, idx);
  if (eligible.length === 0) return null;

  const on = !!field.showWhen;

  return (
    <button
      type="button"
      onClick={() => (on ? onClear() : onSeed())}
      title={on ? "Conditional — click to remove" : "Make this a conditional field"}
      aria-pressed={on}
      className={`p-1 rounded transition-colors cursor-pointer ${
        on
          ? "text-primary bg-primary/10 hover:bg-primary/15"
          : "text-text-tertiary hover:text-foreground hover:bg-card-bg"
      }`}
    >
      <Filter className="w-3.5 h-3.5" />
    </button>
  );
}

// Inline rule editor — only renders when the field already has a `showWhen`
// rule (toggled on via the per-field Filter icon). Picks earlier fields as
// reference candidates only.
function ConditionEditor({
  fields,
  idx,
  onChange,
}: {
  fields: FormFieldConfig[];
  idx: number;
  onChange: (showWhen: FormFieldCondition | undefined) => void;
}) {
  const field = fields[idx];
  const rule = field.showWhen;
  if (!rule) return null;

  const eligibleFields = eligibleConditionFields(fields, idx);
  if (eligibleFields.length === 0) return null;

  const refField = fields.find((f) => f.name === rule.fieldName) ?? eligibleFields[0];
  const refOptions = refField && fieldHasOptions(refField.type) ? refField.options ?? [] : [];

  const updateRule = (patch: Partial<FormFieldCondition>) => {
    onChange({
      fieldName: rule.fieldName,
      operator: rule.operator,
      values: rule.values,
      ...patch,
    });
  };

  return (
    <div className="ml-6 mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-primary inline-flex items-center gap-1">
          <Filter className="w-3 h-3" /> Show only when
        </p>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5"
          aria-label="Remove condition"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start">
        <select
          value={rule.fieldName}
          onChange={(e) => updateRule({ fieldName: e.target.value, values: [] })}
          className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
        >
          {eligibleFields.map((f) => (
            <option key={f.name} value={f.name}>{f.label || f.name}</option>
          ))}
        </select>
        <select
          value={rule.operator}
          onChange={(e) => updateRule({ operator: e.target.value as FormFieldCondition["operator"] })}
          className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
        >
          <option value="equals">is</option>
          <option value="not_equals">is not</option>
          <option value="includes">includes</option>
        </select>
        {refOptions.length > 0 ? (
          <select
            value={rule.values[0] ?? ""}
            onChange={(e) => updateRule({ values: e.target.value ? [e.target.value] : [] })}
            className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground outline-none"
          >
            <option value="">Pick a value…</option>
            {refOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            value={rule.values.join(", ")}
            onChange={(e) => updateRule({ values: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })}
            placeholder="Value(s), comma separated"
            className="px-2 py-1.5 bg-card-bg border border-border-light rounded-md text-[11.5px] text-foreground placeholder:text-text-tertiary outline-none"
          />
        )}
      </div>
    </div>
  );
}

const FIELD_TYPE_META: Record<
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
  hidden: { label: "Hidden", description: "Auto-captured from URL — UTM, source, ref", defaultLabel: "Source", icon: EyeOff },
};

const FIELD_TYPE_ORDER: FormFieldConfig["type"][] = [
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
  "hidden",
];

type FieldTint = { bg: string; icon: string };

const FIELD_TYPE_CATEGORIES: { label: string; types: FormFieldConfig["type"][]; tint: FieldTint }[] = [
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
    types: ["service", "hidden"],
    tint: { bg: "bg-gradient-to-br from-slate-100 to-slate-200/60 border-slate-200", icon: "text-slate-600" },
  },
];

const FIELD_TYPE_TINT: Record<FormFieldConfig["type"], FieldTint> = (() => {
  const map = {} as Record<FormFieldConfig["type"], FieldTint>;
  for (const cat of FIELD_TYPE_CATEGORIES) {
    for (const t of cat.types) map[t] = cat.tint;
  }
  return map;
})();

// Field types that present a list of selectable options to the visitor.
function fieldHasOptions(type: FormFieldConfig["type"]): boolean {
  return type === "select" || type === "multi_select" || type === "radio" || type === "checkbox";
}

function FieldTypePickerInline({
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

      {/* Public URL */}
      <div className="bg-surface rounded-lg p-4 border border-border-light">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Public URL</h4>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[13px] font-mono text-foreground bg-card-bg rounded-lg px-3 py-2 border border-border-light truncate">{formUrl}</p>
          <button onClick={() => copy(formUrl, "Link")}
            className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <a href={formUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] font-medium text-foreground hover:bg-surface cursor-pointer">
            <Globe className="w-3.5 h-3.5" /> Open
          </a>
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

      {/* QR code — for in-store kiosks, table cards, printed flyers, business cards. */}
      <FormQrCode formUrl={formUrl} formName={form.name} />
    </div>
  );
}

// QR code generator + download. Generated client-side via the `qrcode`
// package — no third-party API call, so the URL never leaves the browser.
function FormQrCode({ formUrl, formName }: { formUrl: string; formName: string }) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QR) => {
      QR.toDataURL(formUrl, {
        margin: 1,
        width: 320,
        color: { dark: "#0f0f0f", light: "#ffffff" },
      })
        .then((url) => {
          if (!cancelled) setDataUrl(url);
        })
        .catch(() => {
          if (!cancelled) setDataUrl("");
        });
    });
    return () => {
      cancelled = true;
    };
  }, [formUrl]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${formName.toLowerCase().replace(/\s+/g, "-") || "form"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">QR Code</h4>
      <div className="flex items-center gap-4">
        <div className="w-32 h-32 rounded-lg bg-card-bg border border-border-light flex items-center justify-center overflow-hidden flex-shrink-0">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code for form URL" className="w-full h-full" />
          ) : (
            <span className="text-[11px] text-text-tertiary">Generating…</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] text-text-secondary leading-snug">
            Print on table cards, business cards, or in-store signage. Scans straight to the form.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={download}
              disabled={!dataUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background rounded-lg text-[12.5px] font-medium cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" /> Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form Responses ──

function csvEscape(value: string) {
  if (value === "") return "";
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function FormResponses({ form }: { form: Form }) {
  const { formResponses, updateFormResponse } = useFormResponsesStore();
  const { workspaceId } = useAuth();
  const router = useRouter();
  const [promoting, setPromoting] = useState<string | null>(null);

  const responses = useMemo(
    () =>
      formResponses
        .filter((r) => r.formId === form.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [formResponses, form.id],
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const fieldLabel = (name: string) =>
    form.fields.find((f) => f.name === name)?.label ?? name;

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
      {responses.map((r) => {
        const supplementalEntries = Object.entries(r.values).filter(
          ([key, value]) =>
            value &&
            !["name", "full_name", "fullName", "client_name", "email", "phone", "mobile", "contact_phone"].includes(
              key,
            ),
        );
        return (
          <div
            key={r.id}
            className="bg-surface rounded-lg border border-border-light p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-foreground">
                {r.contactName || "Anonymous"}
              </p>
              <span className="text-[11px] text-text-tertiary">{fmtDate(r.submittedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {r.contactEmail && (
                <div>
                  <span className="text-text-tertiary">Email: </span>
                  <span className="text-foreground">{r.contactEmail}</span>
                </div>
              )}
              {r.contactPhone && (
                <div>
                  <span className="text-text-tertiary">Phone: </span>
                  <span className="text-foreground">{r.contactPhone}</span>
                </div>
              )}
            </div>
            {supplementalEntries.length > 0 && (
              <div className="grid grid-cols-1 gap-1 text-[12px] bg-card-bg rounded-lg px-3 py-2">
                {supplementalEntries.map(([key, value]) => (
                  <div key={key}>
                    <span className="text-text-tertiary">{fieldLabel(key)}: </span>
                    <span className="text-foreground whitespace-pre-wrap">{value}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={() => promote(r)}
                disabled={promoting === r.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-card-bg cursor-pointer transition-colors disabled:opacity-50"
              >
                {r.inquiryId ? "View lead →" : promoting === r.id ? "Marking…" : "Mark as lead"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
