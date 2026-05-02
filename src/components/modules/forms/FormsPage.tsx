"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText, Plus, Code, Eye, Inbox, ToggleLeft, ToggleRight, Pencil, Trash2, Copy, Check, GripVertical, ChevronDown, ChevronRight, Zap, X, ImagePlus, Type, Mail, Phone, Link as LinkIcon, Hash, AlignLeft, ChevronsUpDown, Calendar, CalendarRange, Clock, Maximize2, Minimize2, Sparkles, MessageSquare, Bell, ExternalLink, HelpCircle, CheckSquare, CircleDot, ListChecks, Upload, EyeOff, Filter, Sun, Moon, Monitor, ArrowRight, Send, Loader2, Smartphone, Tablet, PenLine } from "lucide-react";
import { FORM_STARTERS, STARTER_CATEGORY_STYLE, type FormStarter } from "@/lib/forms/starters";
import { useFormsStore } from "@/store/forms";
import { useFormResponsesStore } from "@/store/form-responses";
import { Form, FormFieldConfig, FormFieldCondition, FormTemplate, FormFontFamily, FormSuccessVariant, FormTheme } from "@/types/models";
import { withoutTestFormResponses } from "@/lib/forms/test-submission";
import { validateFormDraft } from "@/lib/forms/validate-form-draft";
import {
  useFormDraft,
  buildBrandingFromDraft,
} from "@/lib/forms/use-form-draft";
import {
  useMounted,
  slugify,
  formatRelativeTime,
  formatTimestamp,
  matchFontPair,
  fieldHasOptions,
  eligibleConditionFields,
  seedCondition,
} from "./helpers";
import { FormEmbed } from "./share/FormEmbed";
import { FormResponses } from "./responses/FormResponses";
import { EmailPreview, SmsPreview } from "./editor/AutoReplyPreviews";
import { SaveStatusIndicator } from "./editor/SaveStatusIndicator";
import { MergeTagBar } from "./editor/MergeTagBar";
import { ConditionToggle, ConditionEditor } from "./editor/ConditionalLogic";
import { WelcomeScreenEditor } from "./editor/WelcomeScreenEditor";
import { FormLogoUpload, CoverImageUpload } from "./editor/UploadFields";
import { TemplateThumb } from "./editor/TemplateThumb";
import { ThankYouSection } from "./editor/ThankYouSection";
import { RoutedThankYouSection } from "./editor/RoutedThankYouSection";
import { AutoReplySection } from "./editor/AutoReplySection";
import { StarterGallery } from "./list/StarterGallery";
import { FormAccordionSection } from "./list/FormAccordionSection";
import {
  FieldTypePickerInline,
  FIELD_TYPE_META,
  FIELD_TYPE_ORDER,
  FIELD_TYPE_TINT,
} from "./editor/FieldTypePicker";
import { FormPreviewRenderer } from "@/components/forms/FormRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ColorField } from "@/components/ui/ColorField";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";
import { useServicesStore } from "@/store/services";

// SSR-safe mount detection — same pattern SlideOver uses so the preview
// Tabs inside the slide-over are mutually exclusive (edit ↔ embed).
// Preview is separate — it opens as its own expandable panel next to the
// slide-over, independent of which tab is selected.
type SlideMode = "edit" | "after" | "reply" | "style" | "embed";

const TEMPLATE_OPTIONS: { id: FormTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Card with branded header — versatile default." },
  { id: "minimal", label: "Minimal", description: "Flat layout, no card. Clean and quiet." },
  { id: "editorial", label: "Editorial", description: "Big centered title, generous spacing." },
  { id: "slides", label: "Slides", description: "One question at a time, Typeform-style." },
];

// Per-family preview class — used by the pair preview cards below.
const FONT_PREVIEW_CLASS: Record<FormFontFamily, string> = {
  sans: "font-sans",
  serif: "font-serif",
  display:
    "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide",
  mono: "font-mono",
};

// Named font pairings — replaces the old generic Sans/Serif/Display/Mono
// picker. Each preset sets BOTH the heading font and the body font so the
// operator picks a feel, not a typography taxonomy.
const FONT_PAIR_PRESETS: {
  id: string;
  label: string;
  description: string;
  heading: FormFontFamily;
  body: FormFontFamily;
}[] = [
  {
    id: "soft-romantic",
    label: "Soft & Romantic",
    description: "Serif heading, sans body — bridal default.",
    heading: "serif",
    body: "sans",
  },
  {
    id: "modern-editorial",
    label: "Modern Editorial",
    description: "Display heading, serif body — magazine feel.",
    heading: "display",
    body: "serif",
  },
  {
    id: "luxe-minimal",
    label: "Luxe Minimal",
    description: "Display heading, sans body — clean and quiet.",
    heading: "display",
    body: "sans",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Sans throughout — versatile, neutral.",
    heading: "sans",
    body: "sans",
  },
];

// Per-form theme picker. Scoped to the rendered form only — does not change
// the operator's dashboard theme. "Auto" follows the visitor's system pref.
// Dark/Auto are gated as `comingSoon` until the public-form dark surfaces
// (logo backplate, gradient header, etc.) are properly tuned — the renderer
// honours the token swap but visual polish isn't there yet, so we don't
// ship the option until it looks right.
const THEME_OPTIONS: { id: FormTheme; label: string; icon: React.ComponentType<{ className?: string }>; swatchClass: string; comingSoon?: boolean }[] = [
  { id: "light", label: "Light", icon: Sun, swatchClass: "bg-white border-border-light text-foreground" },
  { id: "dark", label: "Dark", icon: Moon, swatchClass: "bg-[#141414] border-[#2A2A2A] text-white", comingSoon: true },
  { id: "auto", label: "Auto", icon: Monitor, swatchClass: "bg-gradient-to-br from-white to-[#141414] border-border-light text-foreground", comingSoon: true },
];




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
  const [previewOpen, setPreviewOpen] = useState(true);
  // Holds the editor's in-progress draft so the preview renders unsaved
  // edits live. Falls back to the saved form when no draft is in flight.
  const [draftForm, setDraftForm] = useState<Form | null>(null);
  const [previewView, setPreviewView] = useState<"welcome" | "form" | "success">("form");
  // Lets the operator preview each routed-thank-you variant without having
  // to fake submissions. "" = renderer falls through to value-based match
  // (which is empty in the editor — so the default thank-you renders).
  const [previewVariantId, setPreviewVariantId] = useState<string>("");
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  // Device-width preview in fullscreen. Constrains the inner wrapper so the
  // operator can sanity-check responsive layout without resizing the browser.
  // "Desktop" lets the form occupy whatever the fullscreen container gives it.
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const mounted = useMounted();
  const [pendingAutoFlowFormId, setPendingAutoFlowFormId] = useState<string | null>(null);
  const pendingAutoFlowForm = pendingAutoFlowFormId
    ? forms.find((f) => f.id === pendingAutoFlowFormId) ?? null
    : null;
  const [starterGalleryOpen, setStarterGalleryOpen] = useState(false);
  // Belt + braces: if the gallery opens an editor for a freshly created
  // form, close the gallery as soon as the editor latches onto the new id.
  // Defends against any race where the create handler's close call doesn't
  // beat the new editor mount.
  useEffect(() => {
    if (selectedId && starterGalleryOpen) setStarterGalleryOpen(false);
  }, [selectedId, starterGalleryOpen]);
  const [testSubmitPending, setTestSubmitPending] = useState(false);
  // Editor's autosave state, lifted up so the slide-over header can gate
  // the Send test button — testing a form whose latest edits haven't
  // persisted produces a "Form not found" race against the DB lookup.
  const [editorSaveStatus, setEditorSaveStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const [editorBlockingError, setEditorBlockingError] = useState<string | null>(null);
  // Form pending deletion — drives the confirm dialog. Cleared on confirm
  // or cancel. Form is only removed once the operator clicks through.
  const [pendingDeleteFormId, setPendingDeleteFormId] = useState<string | null>(null);
  const pendingDeleteForm = pendingDeleteFormId
    ? forms.find((f) => f.id === pendingDeleteFormId) ?? null
    : null;

  const sendTestSubmission = useCallback(async (formId: string) => {
    setTestSubmitPending(true);
    try {
      const res = await fetch(`/api/forms/${formId}/test-submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Test submission failed");
        return;
      }
      toast(
        data.autoPromoted
          ? "Test sent — auto-reply on its way, test lead added to Leads"
          : "Test sent — auto-reply on its way",
      );
    } catch (err) {
      console.error("[forms] test submit error:", err);
      toast("Test submission failed");
    } finally {
      setTestSubmitPending(false);
    }
  }, []);

  // Auto-suffix the starter's default name + slug if either is already in
  // use. Saves the operator from the slug-conflict toast on day one and
  // makes the list view honest ("Wedding inquiry" vs "Wedding inquiry 2"
  // rather than two identical rows).
  const dedupeNameAndSlug = useCallback(
    (baseName: string, baseSlug: string) => {
      const namesTaken = new Set(
        forms.map((f) => f.name.trim().toLowerCase()),
      );
      const slugsTaken = new Set(
        forms.map((f) => (f.slug ?? "").trim().toLowerCase()).filter(Boolean),
      );

      let name = baseName;
      if (namesTaken.has(name.trim().toLowerCase())) {
        let n = 2;
        while (namesTaken.has(`${baseName} ${n}`.toLowerCase())) n++;
        name = `${baseName} ${n}`;
      }

      let slug = baseSlug;
      if (slug && slugsTaken.has(slug.toLowerCase())) {
        let n = 2;
        while (slugsTaken.has(`${baseSlug}-${n}`.toLowerCase())) n++;
        slug = `${baseSlug}-${n}`;
      }

      return { name, slug };
    },
    [forms],
  );

  const createFromStarter = useCallback(
    (starter: FormStarter) => {
      // Close the gallery FIRST so the user sees an immediate response,
      // then create + open the editor on the next tick. Doing both
      // synchronously left the modal sitting on screen while React
      // committed the state change + the editor's slide-in animation.
      setStarterGalleryOpen(false);
      const { name, slug } = dedupeNameAndSlug(starter.formName, starter.slug);
      const f = addForm(
        {
          workspaceId: workspaceId ?? "",
          type: "inquiry",
          name,
          fields: starter.fields,
          branding: starter.branding,
          slug,
          enabled: false,
          autoPromoteToInquiry: starter.autoPromoteToInquiry,
        },
        workspaceId || undefined,
      );
      if (f) {
        setSelectedId(f.id);
        setSlideMode("edit");
        setPreviewOpen(true);
      }
    },
    [addForm, workspaceId, dedupeNameAndSlug],
  );

  const createBlankForm = useCallback(() => {
    setStarterGalleryOpen(false);
    const { name, slug } = dedupeNameAndSlug("New Form", "new-form");
    const f = addForm(
      {
        workspaceId: workspaceId ?? "",
        type: "inquiry",
        name,
        fields: [
          { name: "name", type: "text", label: "Full Name", required: true },
          { name: "email", type: "email", label: "Email", required: true },
          { name: "message", type: "textarea", label: "Message", required: true },
        ],
        branding: {},
        slug,
        enabled: false,
        autoPromoteToInquiry: false,
      },
      workspaceId || undefined,
    );
    if (f) {
      setSelectedId(f.id);
      setSlideMode("edit");
      setPreviewOpen(true);
    }
  }, [addForm, workspaceId, dedupeNameAndSlug]);

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
  const inquiryForms = forms.filter((f) => f.type === "inquiry");
  const mainInquiryForms = inquiryForms.filter((f) => f.autoPromoteToInquiry);
  const additionalInquiryForms = inquiryForms.filter((f) => !f.autoPromoteToInquiry);

  // Filter test submissions out of every list, count, and table on this page.
  // The /api/forms/[id]/test-submit endpoint tags rows with values.__test so
  // they round-trip through the same pipeline (auto-reply, automation rules)
  // without polluting Lead counts or the operator's view of real submissions.
  const realFormResponses = useMemo(
    () => withoutTestFormResponses(formResponses),
    [formResponses],
  );

  // Submissions per form, used to render the live count chip on each card.
  const submissionsByFormId = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of realFormResponses) {
      if (!r.formId) continue;
      map.set(r.formId, (map.get(r.formId) ?? 0) + 1);
    }
    return map;
  }, [realFormResponses]);

  // Most-recent submission per form. Drives the "last 2h ago" tail in the
  // collapsed row so a stale form is visible without expanding.
  const lastSubmittedAtByFormId = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of realFormResponses) {
      if (!r.formId) continue;
      const prev = map.get(r.formId);
      if (!prev || r.submittedAt > prev) map.set(r.formId, r.submittedAt);
    }
    return map;
  }, [realFormResponses]);

  const openForm = (id: string, mode: "preview" | SlideMode) => {
    setSelectedId(id);
    if (mode === "preview") {
      setPreviewOpen(true);
      return;
    }
    setSlideMode(mode);
    // Share tab focus: collapse the live preview so the URL / embed / QR
    // panel takes the spotlight. The QA report flagged that clicking Share
    // looked like it opened the preview — this is why. Other tabs benefit
    // from the side-by-side preview, so they keep it open by default.
    setPreviewOpen(mode !== "embed");
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
          <Button variant="primary" size="sm" onClick={() => setStarterGalleryOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Form
          </Button>
        }
      />

      {inquiryForms.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground mb-1">No forms yet</h3>
          <p className="text-[13px] text-text-secondary mb-5">
            Create a form to collect inquiries from your website, social bio, or email signature.
          </p>
          <Button variant="primary" size="sm" onClick={() => setStarterGalleryOpen(true)}>
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
              lastSubmittedAtByFormId={lastSubmittedAtByFormId}
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
              lastSubmittedAtByFormId={lastSubmittedAtByFormId}
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
              <p className="text-[11px] font-normal text-text-secondary mt-0.5 truncate">
                {selected.type} form · {selected.fields.length} {selected.fields.length === 1 ? "field" : "fields"}
                {(() => {
                  const required = selected.fields.filter((f) => f.required).length;
                  return required > 0 ? ` · ${required} required` : "";
                })()}
              </p>
            </div>
          }
          headerExtra={(() => {
            // Test-submit needs a clean DB state. We block when autosave
            // is mid-flight, errored, or held by a validation problem
            // (typically a slug conflict). The endpoint looks up the form
            // by id from the DB — testing before save lands produces a
            // confusing "Form not found".
            const saveBlocked =
              editorSaveStatus === "pending" ||
              editorSaveStatus === "saving" ||
              editorSaveStatus === "error" ||
              !!editorBlockingError;
            // We keep the button enabled when blocked so a click can surface
            // *why* via toast, instead of silently doing nothing. Only the
            // pending-network state truly disables click — re-firing while
            // a request is in flight would queue duplicates.
            const testTooltip = saveBlocked
              ? editorBlockingError
                ? `Save blocked — ${editorBlockingError}`
                : "Save in progress — try again in a moment."
              : "Fire a test submission through the live pipeline. Auto-reply lands in your inbox; the entry is tagged [TEST] in Leads.";
            const handleTestClick = () => {
              if (saveBlocked) {
                toast(
                  editorBlockingError
                    ? `Can't send a test yet — ${editorBlockingError}`
                    : "Hold on — this form is still saving. Try again in a moment.",
                  "warning",
                );
                return;
              }
              sendTestSubmission(selected.id);
            };
            return (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTestClick}
                  disabled={testSubmitPending}
                  title={testTooltip}
                >
                  {testSubmitPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="ml-1.5">
                    {testSubmitPending ? "Sending…" : "Send test"}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingDeleteFormId(selected.id)}
                  title="Delete this form"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })()}
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
                onSaveStatusChange={(status, blockingError) => {
                  setEditorSaveStatus(status);
                  setEditorBlockingError(blockingError);
                }}
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
                  {previewFullscreen && (
                    <div className="inline-flex bg-surface border border-border-light rounded-lg p-0.5">
                      {([
                        { id: "desktop" as const, icon: Monitor, label: "Desktop" },
                        { id: "tablet" as const, icon: Tablet, label: "Tablet" },
                        { id: "mobile" as const, icon: Smartphone, label: "Mobile" },
                      ]).map((d) => {
                        const active = previewDevice === d.id;
                        const Icon = d.icon;
                        return (
                          <button
                            key={d.id}
                            onClick={() => setPreviewDevice(d.id)}
                            title={d.label}
                            aria-label={d.label}
                            className={`px-2 py-1 rounded-md cursor-pointer transition-colors ${
                              active
                                ? "bg-card-bg text-foreground shadow-sm"
                                : "text-text-tertiary hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  )}
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
              {(() => {
                // Variant chip row — only renders on the Success view when
                // the form has routed thank-you variants configured. Picking
                // a chip pins that variant in the renderer; "Default" (empty
                // sentinel) falls through to the fallback message.
                const previewedForm = draftForm ?? selected;
                const variants = previewedForm.branding.successVariants ?? [];
                const showChips =
                  previewView === "success" &&
                  !!previewedForm.branding.successRouteFieldName &&
                  variants.length > 0;
                if (!showChips) return null;
                return (
                  <div className="px-6 py-2.5 border-b border-border-light flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10.5px] font-semibold text-text-tertiary uppercase tracking-wider mr-1">
                      Variant
                    </span>
                    {[
                      { id: "__default__", label: "Default" },
                      ...variants.map((v) => ({ id: v.id, label: v.label || "Untitled" })),
                    ].map((opt) => {
                      const active = (previewVariantId || "__default__") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPreviewVariantId(opt.id === "__default__" ? "" : opt.id)}
                          className={`px-2.5 py-1 rounded-full border text-[11.5px] font-medium cursor-pointer transition-colors ${
                            active
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-surface border-border-light text-text-secondary hover:border-text-tertiary hover:text-foreground"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {(() => {
                // In fullscreen the operator can pick a device width to
                // sanity-check responsive layout. The wrapper centres the
                // form and gives it a soft device-frame outline so the
                // intent is obvious. Desktop = no constraint, the form
                // takes whatever the viewport gives it.
                const constrainWidth =
                  previewFullscreen && previewDevice !== "desktop";
                const widthPx = previewDevice === "mobile" ? 390 : 768;
                return (
                  <div
                    className={`flex-1 overflow-y-auto ${
                      constrainWidth ? "py-6 bg-surface/40" : ""
                    }`}
                  >
                    <div
                      className={
                        constrainWidth
                          ? "mx-auto bg-card-bg shadow-lg shadow-black/5 border border-border-light rounded-2xl overflow-hidden"
                          : ""
                      }
                      style={
                        constrainWidth
                          ? { width: `${widthPx}px`, maxWidth: "calc(100vw - 32px)" }
                          : undefined
                      }
                    >
                      <FormPreviewRenderer
                        form={draftForm ?? selected}
                        view={previewView}
                        workspaceLogo={workspaceLogo}
                        services={renderableServices}
                        forceSuccessVariantId={previewView === "success" ? (previewVariantId || "__default__") : undefined}
                      />
                    </div>
                  </div>
                );
              })()}
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

      {/* Delete confirmation — destructive, no easy undo (submissions and
          inquiry references would orphan), so we always confirm first.
          Lists submission count so the operator knows what they're losing. */}
      {pendingDeleteForm && (
        <ConfirmDialog
          open
          onClose={() => setPendingDeleteFormId(null)}
          onConfirm={() => {
            const submissionCount = submissionsByFormId.get(pendingDeleteForm.id) ?? 0;
            deleteForm(pendingDeleteForm.id, workspaceId || undefined);
            setPendingDeleteFormId(null);
            // Close the slide-over if the deleted form was open in it.
            if (selectedId === pendingDeleteForm.id) {
              setSelectedId(null);
              setPreviewOpen(false);
              setDraftForm(null);
              setPreviewView("form");
              setPreviewFullscreen(false);
            }
            toast(
              submissionCount > 0
                ? `Form deleted. ${submissionCount} submission${submissionCount === 1 ? "" : "s"} archived.`
                : "Form deleted.",
            );
          }}
          title={`Delete "${pendingDeleteForm.name}"?`}
          message={(() => {
            const submissionCount = submissionsByFormId.get(pendingDeleteForm.id) ?? 0;
            const baseLine =
              "This form, its public URL, and any embed code will stop working immediately. This can't be undone.";
            if (submissionCount > 0) {
              return `${baseLine} ${submissionCount} submission${submissionCount === 1 ? "" : "s"} will be unlinked from this form but kept in your records (so existing leads aren't lost).`;
            }
            return baseLine;
          })()}
          confirmLabel="Delete form"
          variant="danger"
        />
      )}

      <StarterGallery
        open={starterGalleryOpen}
        onClose={() => setStarterGalleryOpen(false)}
        onPick={createFromStarter}
        onStartBlank={createBlankForm}
      />
    </div>
  );
}


// ── Form Editor ──

type FormSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function FormEditor({
  form,
  allForms,
  mode,
  workspaceLogo,
  onUpdate,
  onDraftChange,
  onSaveStatusChange,
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
  /** Bubbles save state up so the parent can gate header actions
   *  (e.g. "Send test") that depend on the latest persisted form. */
  onSaveStatusChange?: (status: FormSaveStatus, blockingError: string | null) => void;
}) {
  // All editable form state lives in one place. The hook also handles the
  // load-time uniquify of duplicate field names (legacy data) and exposes
  // `didUniquifyOnLoad` so the autosave code below can choose whether to
  // skip the first save. The destructure-with-aliases below keeps every
  // existing JSX expression in this file working without rewriting hundreds
  // of `value=`/`onChange=` props — a setter like `setColor(v)` becomes a
  // tiny shim that calls `updateBranding({ primaryColor: v })`.
  const { draft, updateDraft, updateBranding, fieldOps, didUniquifyOnLoad } =
    useFormDraft(form);
  const { name, slugTouched, fields, branding } = draft;
  const userSlug = draft.slug;
  const {
    primaryColor: color,
    accentColor,
    description,
    successMessage,
    template,
    fontFamily,
    headingFontFamily,
    theme,
    logo,
    coverImage,
    welcomeEnabled,
    welcomeTitle,
    welcomeSubtitle,
    welcomeCtaLabel,
    successRouteFieldName,
    successVariants,
    successCtaLabel,
    successCtaUrl,
    successRedirectUrl,
    successRedirectDelaySeconds,
    autoReplyEnabled,
    autoReplySubject,
    autoReplyBody,
    autoReplySmsEnabled,
    autoReplySmsBody,
    notifyOwnerEmail,
  } = branding;
  const setFields = fieldOps.setFields;
  const setName = useCallback((v: string) => updateDraft({ name: v }), [updateDraft]);
  const setUserSlug = useCallback(
    (v: string) => updateDraft({ slug: v }),
    [updateDraft],
  );
  const setSlugTouched = useCallback(
    (v: boolean) => updateDraft({ slugTouched: v }),
    [updateDraft],
  );
  const setColor = useCallback(
    (v: string) => updateBranding({ primaryColor: v }),
    [updateBranding],
  );
  const setAccentColor = useCallback(
    (v: string) => updateBranding({ accentColor: v }),
    [updateBranding],
  );
  const setDescription = useCallback(
    (v: string) => updateBranding({ description: v }),
    [updateBranding],
  );
  const setSuccessMessage = useCallback(
    (v: string) => updateBranding({ successMessage: v }),
    [updateBranding],
  );
  const setTemplate = useCallback(
    (v: FormTemplate) => updateBranding({ template: v }),
    [updateBranding],
  );
  const setFontFamily = useCallback(
    (v: FormFontFamily) => updateBranding({ fontFamily: v }),
    [updateBranding],
  );
  const setHeadingFontFamily = useCallback(
    (v: FormFontFamily) => updateBranding({ headingFontFamily: v }),
    [updateBranding],
  );
  const setTheme = useCallback(
    (v: FormTheme) => updateBranding({ theme: v }),
    [updateBranding],
  );
  const setLogo = useCallback(
    (v: string | undefined) => updateBranding({ logo: v }),
    [updateBranding],
  );
  const setCoverImage = useCallback(
    (v: string | undefined) => updateBranding({ coverImage: v }),
    [updateBranding],
  );
  const setWelcomeEnabled = useCallback(
    (v: boolean) => updateBranding({ welcomeEnabled: v }),
    [updateBranding],
  );
  const setWelcomeTitle = useCallback(
    (v: string) => updateBranding({ welcomeTitle: v }),
    [updateBranding],
  );
  const setWelcomeSubtitle = useCallback(
    (v: string) => updateBranding({ welcomeSubtitle: v }),
    [updateBranding],
  );
  const setWelcomeCtaLabel = useCallback(
    (v: string) => updateBranding({ welcomeCtaLabel: v }),
    [updateBranding],
  );
  const setSuccessRouteFieldName = useCallback(
    (v: string | undefined) => updateBranding({ successRouteFieldName: v }),
    [updateBranding],
  );
  const setSuccessVariants = useCallback(
    (v: FormSuccessVariant[]) => updateBranding({ successVariants: v }),
    [updateBranding],
  );
  const setSuccessCtaLabel = useCallback(
    (v: string) => updateBranding({ successCtaLabel: v }),
    [updateBranding],
  );
  const setSuccessCtaUrl = useCallback(
    (v: string) => updateBranding({ successCtaUrl: v }),
    [updateBranding],
  );
  const setSuccessRedirectUrl = useCallback(
    (v: string) => updateBranding({ successRedirectUrl: v }),
    [updateBranding],
  );
  const setSuccessRedirectDelaySeconds = useCallback(
    (v: number) => updateBranding({ successRedirectDelaySeconds: v }),
    [updateBranding],
  );
  const setAutoReplyEnabled = useCallback(
    (v: boolean) => updateBranding({ autoReplyEnabled: v }),
    [updateBranding],
  );
  const setAutoReplySubject = useCallback(
    (v: string) => updateBranding({ autoReplySubject: v }),
    [updateBranding],
  );
  const setAutoReplyBody = useCallback(
    (v: string) => updateBranding({ autoReplyBody: v }),
    [updateBranding],
  );
  const setAutoReplySmsEnabled = useCallback(
    (v: boolean) => updateBranding({ autoReplySmsEnabled: v }),
    [updateBranding],
  );
  const setAutoReplySmsBody = useCallback(
    (v: string) => updateBranding({ autoReplySmsBody: v }),
    [updateBranding],
  );
  const setNotifyOwnerEmail = useCallback(
    (v: boolean) => updateBranding({ notifyOwnerEmail: v }),
    [updateBranding],
  );

  // ── UI state (not part of the persisted draft) ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // Per-field-name disclosure state for the validation block. Defaults are
  // computed at render time: open if a value already exists, closed if not,
  // unless the operator has explicitly toggled.
  const [validationOpen, setValidationOpen] = useState<Record<string, boolean>>({});
  const slug = slugTouched ? userSlug : slugify(name);

  const trimmedSlug = slug.trim();

  // All editor-side validation (name uniqueness, slug shape + collision,
  // option-field placeholder detection, field-name duplicates) lives in
  // a single helper so each rule is unit-testable in isolation. The save
  // pill, the input-level error messages, and the per-field error pins
  // all read from the same returned shape.
  const draftValidation = useMemo(
    () =>
      validateFormDraft({
        name,
        slug: trimmedSlug,
        fields,
        allForms,
        formId: form.id,
      }),
    [name, trimmedSlug, fields, allForms, form.id],
  );
  const {
    nameError,
    slugError,
    fieldOptionErrors,
    fieldNameDuplicates,
    optionsError,
    fieldNameError,
    canSave,
  } = draftValidation;

  // Emit the in-progress draft on every state change so the live preview can
  // render unsaved edits. The Save button is still the canonical commit;
  // this is purely view-side.
  //
  // We intentionally omit `form` and `onDraftChange` from the dep array:
  // `form` only changes on save, and the parent remounts FormEditor via
  // `key={selected.id}` when switching forms. Including `form` would refire
  // the effect after every save with no semantic change.
  // Build the persisted FormBranding shape from the draft. The pure
  // helper does the empty-string-to-undefined coercion that determines
  // whether per-field defaults take effect on the public form. Memoised
  // on `branding` + the form's base branding so the live-preview effect
  // below has a stable identity to depend on.
  const buildBranding = useCallback(
    () => buildBrandingFromDraft(branding, form.branding),
    [branding, form.branding],
  );

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

  const [saveStatus, setSaveStatus] = useState<FormSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Bubble save state to the parent so the slide-over header can gate
  // actions (Send test) that need a clean DB state. Slug errors are part
  // of the gate — autosave is held until they clear, so the form on disk
  // is stale until then.
  useEffect(() => {
    if (!onSaveStatusChange) return;
    onSaveStatusChange(saveStatus, slugError || nameError || saveError);
  }, [saveStatus, slugError, nameError, saveError, onSaveStatusChange]);
  // Skip the first autosave run because mount-time state matches the DB.
  // EXCEPT when we mutated state during init (e.g. uniquifying duplicate
  // field names from a legacy form): then the in-memory state and DB
  // diverge, and skipping would leave the bad row in place forever.
  const skipFirstSaveRef = useRef(!didUniquifyOnLoad);
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
      // Supabase errors are PostgrestError, not Error instances. Pull message off
      // whichever shape we get so the operator sees the real cause (RLS denial,
      // payload-too-large, etc.) instead of a generic "Save failed".
      const rawMsg =
        (err as { message?: string } | null)?.message ||
        (err as { details?: string } | null)?.details ||
        (typeof err === "string" ? err : null) ||
        "Save failed";
      // Friendlier copy for the most common setup snag — a missing migration
      // or stale PostgREST schema cache. The raw Postgres text mentions
      // "schema cache" which means nothing to most operators.
      const code = (err as { code?: string } | null)?.code;
      const isSchemaCache =
        code === "PGRST205" ||
        rawMsg.toLowerCase().includes("could not find the table") ||
        rawMsg.toLowerCase().includes("schema cache");
      const msg = isSchemaCache
        ? "Database schema is out of date — run the latest Supabase migration, then reload."
        : rawMsg;
      console.error("[forms] save error:", err);
      setSaveError(msg);
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
  const [fieldPickerBottomOpen, setFieldPickerBottomOpen] = useState(false);

  // Collapsible field cards. Keyed by field.name (best stable handle we
  // have without adding ids to FormFieldConfig). Long forms (>=6 fields)
  // start fully collapsed so the editor is scannable; shorter forms
  // expand-by-default so the user lands on familiar territory. Newly
  // added fields auto-expand because addField doesn't push their name
  // into this set.
  const [collapsedFieldNames, setCollapsedFieldNames] = useState<Set<string>>(() => {
    if (form.fields.length >= 6) {
      return new Set(form.fields.map((f) => f.name));
    }
    return new Set();
  });

  const toggleFieldCollapsed = (name: string) => {
    setCollapsedFieldNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const collapseAllFields = () => {
    setCollapsedFieldNames(new Set(fields.map((f) => f.name)));
  };
  const expandAllFields = () => {
    setCollapsedFieldNames(new Set());
  };
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
      // Unique name keyed off existing field names. Index alone collides if
      // the operator deletes a middle field then re-adds — both end up as
      // e.g. "text_2", and the second silently overwrites the first's
      // submission values. Suffix-on-collision matches what we do for slugs.
      const taken = new Set(prev.map((f) => f.name));
      let candidate = `${type}_${nextIdx + 1}`;
      let suffix = nextIdx + 1;
      while (taken.has(candidate)) {
        suffix += 1;
        candidate = `${type}_${suffix}`;
      }
      const base: FormFieldConfig = {
        name: candidate,
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

  // Insert a copy of `fields[idx]` directly after the source. Field name
  // must be unique because submission values are keyed by name; suffix
  // "-copy", then "-copy-2", "-copy-3" if the user duplicates repeatedly.
  const duplicateField = (idx: number) => {
    setFields((p) => {
      const src = p[idx];
      const taken = new Set(p.map((f) => f.name));
      let candidate = `${src.name}-copy`;
      let n = 2;
      while (taken.has(candidate)) {
        candidate = `${src.name}-copy-${n}`;
        n++;
      }
      const dup: FormFieldConfig = {
        ...src,
        name: candidate,
        label: `${src.label} (copy)`,
      };
      return [...p.slice(0, idx + 1), dup, ...p.slice(idx + 1)];
    });
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
          autoReplySmsEnabled={autoReplySmsEnabled}
          setAutoReplySmsEnabled={setAutoReplySmsEnabled}
          autoReplySmsBody={autoReplySmsBody}
          setAutoReplySmsBody={setAutoReplySmsBody}
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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2.5 bg-surface border rounded-lg text-[14px] text-foreground outline-none focus:ring-2 ${
              nameError
                ? "border-red-300 focus:ring-red-200"
                : "border-border-light focus:ring-primary/20"
            }`}
          />
          {nameError && (
            <p className="text-[11px] text-red-600 mt-1">{nameError}</p>
          )}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">URL Slug</label>
          <div className="flex items-center">
            <span className="text-[13px] text-text-tertiary mr-1">/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                // Live cleanup but DON'T trim trailing/leading hyphens during
                // typing — otherwise a typed space (which collapses to `-`)
                // would be stripped before the next char arrives, so
                // "hello world" would land as "helloworld" instead of
                // "hello-world". Final trim happens on blur.
                const live = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/-{2,}/g, "-")
                  .slice(0, 60);
                setUserSlug(live);
              }}
              onBlur={(e) => {
                // Final clean-up on blur trims the trailing/leading hyphens
                // that we kept during typing for ergonomics.
                const cleaned = slugify(e.target.value);
                if (cleaned !== e.target.value) setUserSlug(cleaned);
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

      {/* Auto-promote toggle — duplicates the row toggle on the list view so
          operators can flip it without leaving the editor. Same underlying
          state; saves immediately via onUpdate. */}
      <div className="border-t border-border-light pt-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoPromoteToInquiry}
            onChange={(e) => onUpdate({ autoPromoteToInquiry: e.target.checked })}
            className="mt-0.5 rounded"
          />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-foreground">
              Auto-promote responses to a Lead
            </p>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              When ON, every submission also creates an Inquiry in your Leads
              list. When OFF, responses sit in the form&apos;s response tab
              until you promote them manually.
            </p>
          </div>
        </label>
      </div>

      </>)}

      {mode === "style" && (<>
      {/* Layout — surfaces first because it shapes everything else.
          Operators usually pick a layout before fiddling with colours. */}
      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Layout</label>
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

      {/* Logo — per-form override that falls back to the workspace logo */}
      <FormLogoUpload
        logo={logo}
        workspaceLogo={workspaceLogo}
        onChange={setLogo}
      />

      {/* Cover image — full-width hero photo above the form title */}
      <CoverImageUpload value={coverImage} onChange={setCoverImage} />

      {/* Colours — brand + accent. Brand drives primary actions; accent
          is the secondary surface, falls back to brand on the public form
          when blank. Same component the Services Style panel uses. */}
      <ColorField
        label="Brand color"
        hint="Submit button, header strip, focus ring."
        value={color}
        onChange={setColor}
      />
      <ColorField
        label="Accent color"
        hint="Radio dots, chip highlights."
        value={accentColor}
        onChange={setAccentColor}
        allowEmpty
        onReset={() => setAccentColor("")}
      />

      <div>
        <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Font Pairing</label>
        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIR_PRESETS.map((preset) => {
            const active = matchFontPair(headingFontFamily, fontFamily) === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setHeadingFontFamily(preset.heading);
                  setFontFamily(preset.body);
                }}
                className={`text-left rounded-lg border py-3 px-3.5 cursor-pointer transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border-light hover:border-text-tertiary bg-surface"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className={`text-[18px] font-semibold text-foreground ${FONT_PREVIEW_CLASS[preset.heading]}`}>Aa</span>
                  <span className={`text-[12.5px] text-text-secondary ${FONT_PREVIEW_CLASS[preset.body]}`}>the quick brown fox</span>
                </div>
                <p className="text-[12px] font-semibold text-foreground">{preset.label}</p>
                <p className="text-[10.5px] text-text-tertiary leading-snug">{preset.description}</p>
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
            const disabled = !!opt.comingSoon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => { if (!disabled) setTheme(opt.id); }}
                disabled={disabled}
                title={disabled ? "Coming soon — public-form dark surfaces still need polish." : undefined}
                className={`relative rounded-lg border py-2.5 px-3 transition-all flex flex-col items-center gap-1 ${
                  disabled
                    ? "border-border-light bg-surface/40 opacity-60 cursor-not-allowed"
                    : active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 cursor-pointer"
                    : "border-border-light hover:border-text-tertiary bg-surface cursor-pointer"
                }`}
              >
                <div className={`w-8 h-8 rounded-md border flex items-center justify-center ${opt.swatchClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] font-semibold text-foreground">{opt.label}</p>
                {disabled && (
                  <span className="absolute top-1 right-1 text-[8.5px] uppercase tracking-wider px-1 py-px rounded bg-surface border border-border-light text-text-tertiary font-semibold">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-text-tertiary mt-1.5">
          This form renders in light mode. Dark and Auto are coming soon.
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
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Fields ({fields.length})</label>
            {fields.length > 1 && (() => {
              // "Expand all" when at least one field is collapsed; otherwise
              // "Collapse all". Single click flips the bulk state of every
              // field, useful on long templates like the 16-field Wedding.
              const anyCollapsed = fields.some((f) => collapsedFieldNames.has(f.name));
              return (
                <button
                  type="button"
                  onClick={anyCollapsed ? expandAllFields : collapseAllFields}
                  className="text-[11px] text-text-tertiary hover:text-foreground cursor-pointer transition-colors"
                >
                  {anyCollapsed ? "Expand all" : "Collapse all"}
                </button>
              );
            })()}
          </div>
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
              {(() => {
                const tint = FIELD_TYPE_TINT[field.type];
                const Icon = FIELD_TYPE_META[field.type].icon;
                const collapsed = collapsedFieldNames.has(field.name);
                if (collapsed) {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFieldCollapsed(field.name)}
                        className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5 flex-shrink-0"
                        aria-label="Expand field"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${tint.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${tint.icon}`} />
                      </div>
                      <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab active:cursor-grabbing flex-shrink-0" />
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-foreground truncate">
                          {field.label || FIELD_TYPE_META[field.type].defaultLabel}
                        </span>
                        {field.required && (
                          <span className="text-[11px] text-text-tertiary flex-shrink-0">*</span>
                        )}
                        {field.showWhen && (
                          <span title="Conditional" className="text-primary flex-shrink-0">
                            <Filter className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-[11px] text-text-tertiary flex-shrink-0 ml-1">
                          · {FIELD_TYPE_META[field.type].label}
                        </span>
                      </div>
                      <button
                        onClick={() => duplicateField(idx)}
                        title="Duplicate field"
                        aria-label="Duplicate field"
                        className="text-text-tertiary hover:text-foreground cursor-pointer p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeField(idx)}
                        className="text-text-tertiary hover:text-red-500 cursor-pointer p-1"
                        aria-label="Remove field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="flex items-start gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => toggleFieldCollapsed(field.name)}
                      className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5 mt-1.5 flex-shrink-0"
                      aria-label="Collapse field"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${tint.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${tint.icon}`} />
                    </div>
                    <GripVertical className="w-4 h-4 text-text-tertiary mt-2 cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <input
                        data-field-label
                        value={field.label}
                        // Update the visible label only. The internal `name`
                        // is the storage key for submission values, conditional
                        // logic, and routed thank-you rules — rewriting it on
                        // every keystroke silently broke all three. Name is
                        // assigned once at creation and stays stable; the
                        // operator can rename a field's label freely.
                        onChange={(e) => updateField(idx, { label: e.target.value })}
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
                );
              })()}
              {fieldNameDuplicates[field.name] && (
                <p className="text-[11px] text-red-600 mt-1.5 ml-7">
                  {fieldNameDuplicates[field.name]} Delete one of the duplicate fields to continue.
                </p>
              )}
              {!collapsedFieldNames.has(field.name) && (<>
              <div className="flex items-center justify-between pl-6">
                {field.type === "hidden" ? (
                  <span className="text-[11px] text-text-tertiary inline-flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Hidden — auto-captured from URL
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateField(idx, { required: !field.required })}
                    aria-pressed={field.required}
                    className={`px-2.5 py-1 rounded-full border text-[11.5px] font-medium cursor-pointer transition-colors ${
                      field.required
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface border-border-light text-text-secondary hover:border-text-tertiary hover:text-foreground"
                    }`}
                  >
                    Required{field.required ? " ✓" : ""}
                  </button>
                )}
                <div className="flex items-center gap-0.5">
                  <ConditionToggle
                    fields={fields}
                    idx={idx}
                    onSeed={() => updateField(idx, { showWhen: seedCondition(fields, idx) })}
                    onClear={() => updateField(idx, { showWhen: undefined })}
                  />
                  <button
                    onClick={() => duplicateField(idx)}
                    title="Duplicate field"
                    aria-label="Duplicate field"
                    className="text-text-tertiary hover:text-foreground cursor-pointer p-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeField(idx)} className="text-text-tertiary hover:text-red-500 cursor-pointer p-1" aria-label="Remove field">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {fieldHasOptions(field.type) && (
                <div className="mt-2 space-y-1.5">
                  {(field.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 flex items-center justify-center text-text-tertiary flex-shrink-0">
                        {field.type === "radio" ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-text-tertiary" />
                        ) : field.type === "checkbox" || field.type === "multi_select" ? (
                          <span className="w-3.5 h-3.5 rounded-sm border-2 border-text-tertiary" />
                        ) : (
                          <span className="text-[12px]">{i + 1}.</span>
                        )}
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...(field.options ?? [])];
                          next[i] = e.target.value;
                          updateField(idx, { options: next });
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground outline-none"
                      />
                      <button
                        onClick={() => {
                          const next = (field.options ?? []).filter((_, j) => j !== i);
                          updateField(idx, { options: next });
                        }}
                        className="text-text-tertiary hover:text-red-500 cursor-pointer p-1 flex-shrink-0"
                        aria-label="Remove option"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const current = field.options ?? [];
                      updateField(idx, { options: [...current, `Option ${current.length + 1}`] });
                    }}
                    className="text-[12px] text-primary hover:underline cursor-pointer inline-flex items-center gap-1 ml-7 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add option
                  </button>
                  {fieldOptionErrors[field.name] && (
                    <p className="text-[11px] text-red-600 mt-1.5 ml-7">
                      {fieldOptionErrors[field.name]}
                    </p>
                  )}
                  {(field.type === "multi_select" || field.type === "checkbox") && (
                    <div className="flex items-center gap-1.5 ml-7 mt-2">
                      <span className="text-[11px] text-text-tertiary">Max selections</span>
                      <input
                        type="number"
                        min={1}
                        value={field.maxSelections ?? ""}
                        onChange={(e) => updateField(idx, { maxSelections: e.target.value === "" ? undefined : Math.max(1, Number(e.target.value)) })}
                        placeholder="No limit"
                        className="w-20 px-2 py-1.5 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                      />
                    </div>
                  )}
                </div>
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
              {field.type !== "hidden" && (() => {
                const showPlaceholder =
                  field.type !== "radio" &&
                  field.type !== "checkbox" &&
                  field.type !== "multi_select" &&
                  field.type !== "file";
                return (
                  <div className={`grid ${showPlaceholder ? "grid-cols-2" : "grid-cols-1"} gap-2 pl-6 mt-2`}>
                    {showPlaceholder && (
                      <input
                        value={field.placeholder ?? ""}
                        onChange={(e) => updateField(idx, { placeholder: e.target.value || undefined })}
                        placeholder="Placeholder (optional)"
                        className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                      />
                    )}
                    <input
                      value={field.helpText ?? ""}
                      onChange={(e) => updateField(idx, { helpText: e.target.value || undefined })}
                      placeholder="Help text (optional)"
                      className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                    />
                  </div>
                );
              })()}
              {(() => {
                // Validation row, hidden behind a per-field disclosure so the
                // 95% of operators who never set min/max/char-limits aren't
                // staring at extra inputs they don't need. Auto-opens when
                // the field already has a value set so existing rules stay
                // visible. Only renders for field types where validation
                // actually applies.
                const hasValidation =
                  field.type === "number" ||
                  field.type === "textarea" ||
                  (field.type === "file" && field.multipleFiles);
                if (!hasValidation) return null;
                const hasValue =
                  field.min !== undefined ||
                  field.max !== undefined ||
                  field.maxLength !== undefined ||
                  field.maxFiles !== undefined;
                const explicit = validationOpen[field.name];
                const open = explicit ?? hasValue;
                return (
                  <div className="pl-6 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setValidationOpen((prev) => ({ ...prev, [field.name]: !open }))
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors"
                    >
                      {open ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Validation
                      {hasValue && !open && <span className="text-primary ml-1">·</span>}
                    </button>
                    {open && (
                      <div className="mt-1.5">
                        {field.type === "number" && (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={field.min ?? ""}
                              onChange={(e) => updateField(idx, { min: e.target.value === "" ? undefined : Number(e.target.value) })}
                              placeholder="Min value (optional)"
                              className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                            />
                            <input
                              type="number"
                              value={field.max ?? ""}
                              onChange={(e) => updateField(idx, { max: e.target.value === "" ? undefined : Number(e.target.value) })}
                              placeholder="Max value (optional)"
                              className="px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                            />
                          </div>
                        )}
                        {field.type === "textarea" && (
                          <input
                            type="number"
                            min={1}
                            value={field.maxLength ?? ""}
                            onChange={(e) => updateField(idx, { maxLength: e.target.value === "" ? undefined : Math.max(1, Number(e.target.value)) })}
                            placeholder="Character limit (optional)"
                            className="w-1/2 px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                          />
                        )}
                        {field.type === "file" && field.multipleFiles && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={field.maxFiles ?? ""}
                              onChange={(e) => updateField(idx, { maxFiles: e.target.value === "" ? undefined : Math.max(1, Math.min(20, Number(e.target.value))) })}
                              placeholder="Max files"
                              className="w-20 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary outline-none"
                            />
                            <span className="text-[11px] text-text-tertiary">files max (default unlimited)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              <ConditionEditor
                fields={fields}
                idx={idx}
                onChange={(showWhen) => updateField(idx, { showWhen })}
              />
              </>)}
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setFieldPickerBottomOpen((v) => !v)}
              className="w-full px-3 py-2.5 rounded-lg border border-dashed border-border-light text-[12.5px] text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              {fieldPickerBottomOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {fieldPickerBottomOpen ? "Cancel" : "Add field"}
            </button>
            <FieldTypePickerInline
              open={fieldPickerBottomOpen}
              onPick={(type) => {
                addField(type);
                setFieldPickerBottomOpen(false);
              }}
              onClose={() => setFieldPickerBottomOpen(false)}
            />
          </div>
        )}
      </div>

      </>)}

      {mode === "edit" && (
        <div className="mt-6 pt-4 border-t border-border-light text-[11.5px] text-text-tertiary flex flex-wrap gap-x-3 gap-y-1">
          <span>Created {formatTimestamp(form.createdAt)}</span>
          {form.updatedAt && form.updatedAt !== form.createdAt && (
            <span>· Last edited {formatRelativeTime(form.updatedAt)}</span>
          )}
        </div>
      )}

      {/* Autosave status — replaces the explicit Save button. Edits commit
          on a short debounce; this pill is the visible signal that work isn't
          being lost. Errors (e.g. invalid slug or a failed network call)
          hold the save until fixed; a manual retry restarts the commit. */}
      <SaveStatusIndicator
        status={saveStatus}
        canSave={canSave}
        slugError={slugError}
        nameError={nameError}
        optionsError={optionsError}
        fieldNameError={fieldNameError}
        saveError={saveError}
        onRetry={() => void commit()}
      />
    </div>
  );
}


// FormEmbed + FormQrCode live in ./share/FormEmbed.tsx now.
