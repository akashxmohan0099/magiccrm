"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FileText, Plus, Inbox, Trash2, X, Monitor, Send, Loader2,
  Smartphone, Tablet, Eye, Maximize2, Minimize2,
} from "lucide-react";
import type { FormStarter } from "@/lib/forms/starters";
import { useFormsStore } from "@/store/forms";
import { useFormResponsesStore } from "@/store/form-responses";
import type { Form } from "@/types/models";
import { withoutTestFormResponses } from "@/lib/forms/test-submission";
import { useMounted } from "./helpers";
import { FormEmbed } from "./share/FormEmbed";
import { StarterGallery } from "./list/StarterGallery";
import { FormAccordionSection } from "./list/FormAccordionSection";
import { FormEditor } from "./editor/FormEditor";
import { FormPreviewRenderer } from "@/components/forms/FormRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";
import { useServicesStore } from "@/store/services";

// SSR-safe mount detection — same pattern SlideOver uses so the preview
// Tabs inside the slide-over are mutually exclusive (edit ↔ embed).
// Preview is separate — it opens as its own expandable panel next to the
// slide-over, independent of which tab is selected.
type SlideMode = "edit" | "after" | "reply" | "style" | "embed";





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




// FormEmbed + FormQrCode live in ./share/FormEmbed.tsx now.
