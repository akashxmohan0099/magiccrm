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
import { FormPreviewRenderer } from "@/components/forms/FormRenderer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ColorField } from "@/components/ui/ColorField";
import { toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/store/settings";
import {
  buildInquiryAutoReplyEmail,
  buildInquiryAutoReplySms,
} from "@/lib/integrations/email";
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

// ── Starter gallery — modal shown when creating a new form. Lists all
// FORM_STARTERS so the operator picks an opinionated preset instead of
// landing on a generic blank form.

function StarterGallery({
  open,
  onClose,
  onPick,
  onStartBlank,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (starter: FormStarter) => void;
  onStartBlank: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-overlay z-[110]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[120] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="starter-gallery-title" className="bg-card-bg rounded-2xl shadow-xl shadow-black/8 w-full max-w-3xl my-auto">
              <div className="flex items-start justify-between px-7 pt-6 pb-4 border-b border-border-light">
                <div>
                  <h2 id="starter-gallery-title" className="text-[19px] font-semibold text-foreground tracking-tight">Create a form</h2>
                  <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
                    Pick a starting point — edit anything after.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-surface text-text-secondary cursor-pointer flex-shrink-0 -mt-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="px-7 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FORM_STARTERS.map((s) => {
                    const Icon = s.icon;
                    const style = STARTER_CATEGORY_STYLE[s.category];
                    return (
                      <button
                        key={s.id}
                        onClick={() => onPick(s)}
                        className={`group relative text-left rounded-2xl border border-border-light bg-card-bg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${style.hoverBorder}`}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-24 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                          style={{ background: `linear-gradient(to bottom, ${style.hex}, transparent)` }}
                        />
                        <div className="relative p-5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: style.hex + "18" }}
                          >
                            <Icon className="w-5 h-5" style={{ color: style.hex }} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[15px] font-semibold text-foreground">{s.name}</p>
                            <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
                          </div>
                          <p className="text-[12.5px] text-text-secondary leading-snug mt-1.5">{s.description}</p>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={onStartBlank}
                    className="group relative text-left rounded-2xl border border-border-light bg-card-bg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-slate-200"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-24 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                      style={{ background: "linear-gradient(to bottom, #64748B, transparent)" }}
                    />
                    <div className="relative p-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: "#64748B18" }}
                      >
                        <Plus className="w-5 h-5" style={{ color: "#64748B" }} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[15px] font-semibold text-foreground">Start from scratch</p>
                        <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-foreground group-hover:translate-x-0.5 transition flex-shrink-0" />
                      </div>
                      <p className="text-[12.5px] text-text-secondary leading-snug mt-1.5">Blank form — build it field by field.</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Form Accordion Section ──

function FormAccordionSection({ label, sublabel, icon, forms, submissionsByFormId, lastSubmittedAtByFormId, onOpen, onToggle, onToggleAutoFlow }: {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  forms: Form[];
  submissionsByFormId: Map<string, number>;
  lastSubmittedAtByFormId: Map<string, string>;
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
                      {count > 0 ? (
                        <>
                          <span className="text-foreground font-medium">
                            {count} response{count === 1 ? "" : "s"}
                          </span>
                          {lastSubmittedAtByFormId.get(form.id) && (
                            <> · last {formatRelativeTime(lastSubmittedAtByFormId.get(form.id)!)}</>
                          )}
                        </>
                      ) : (
                        // Empty-state subline. Shows form-creation date so a row
                        // with no submissions still carries a real signal —
                        // useful when the operator is auditing stale forms.
                        // The "(disabled)" tail flags forms that aren't live
                        // yet, which is the most common reason for 0 responses.
                        <>
                          Created {formatRelativeTime(form.createdAt)}
                          {!form.enabled && <> · disabled</>}
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

// Footer status pill for the editor — quiet by default, surfaces save state
// or a blocking validation error so the user always knows where they stand.
function SaveStatusIndicator({
  status,
  canSave,
  slugError,
  nameError,
  optionsError,
  fieldNameError,
  saveError,
  onRetry,
}: {
  status: "idle" | "pending" | "saving" | "saved" | "error";
  canSave: boolean;
  slugError: string;
  nameError: string;
  optionsError: string;
  fieldNameError: string;
  saveError: string | null;
  onRetry: () => void;
}) {
  if (!canSave) {
    const blocker = nameError || slugError || optionsError || fieldNameError || "fix the errors above";
    return (
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-red-600 py-2">
        <X className="w-3.5 h-3.5" />
        <span>Can&apos;t autosave — {blocker}</span>
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
        <div className="flex items-center gap-2">
          <MessageSquare className="w-[18px] h-[18px] text-emerald-700 flex-shrink-0" />
          <p className="text-[17px] font-semibold text-foreground">Thank-you screen</p>
        </div>
        <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
          What the visitor sees the moment they submit.
        </p>
      </div>

      <div className="space-y-4">
        {/* Success message */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Message <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={props.successMessage}
            onChange={(e) => props.setSuccessMessage(e.target.value)}
            rows={2}
            placeholder="Defaults to “Your inquiry has been received. We'll be in touch shortly.”"
            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Call-to-action button <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={props.successCtaLabel}
              onChange={(e) => props.setSuccessCtaLabel(e.target.value)}
              placeholder="Button label e.g. Visit our Instagram"
              className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              value={props.successCtaUrl}
              onChange={(e) => props.setSuccessCtaUrl(e.target.value)}
              placeholder="https://"
              className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
          </div>
        </div>

        {/* Auto-redirect */}
        <div className="space-y-1.5">
          <label className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block">
            Auto-redirect <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={props.successRedirectUrl}
              onChange={(e) => props.setSuccessRedirectUrl(e.target.value)}
              placeholder="https://yoursite.com/thanks"
              className="col-span-2 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/20 font-mono"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={60}
                value={props.successRedirectDelaySeconds}
                onChange={(e) => {
                  // Clamp at input time so the operator sees the limit
                  // applied, not just at save. Matches the buildBrandingFromDraft
                  // clamp to keep the source of truth consistent.
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(60, raw)) : 0;
                  props.setSuccessRedirectDelaySeconds(clamped);
                }}
                disabled={!props.successRedirectUrl.trim()}
                className="w-16 px-2 py-2 bg-card-bg border border-border-light rounded-lg text-[13.5px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <span className="text-[12.5px] text-text-tertiary">sec (max 60)</span>
            </div>
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

  // Active = the operator picked a route field. Most forms never need this
  // (one thank-you screen is fine), so the whole block is hidden behind a
  // disclosure. Auto-opens when configured so existing variants stay visible.
  const active = !!routeFieldName;
  const [userExpanded, setUserExpanded] = useState(false);
  const expanded = active || userExpanded;

  // Collapsed state — single line, click to expand. Skipped when there are
  // no eligible fields since we'd just be teasing a feature they can't use.
  if (!expanded && eligible.length > 0) {
    return (
      <div className="border-t border-border-light pt-5">
        <button
          type="button"
          onClick={() => setUserExpanded(true)}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-foreground cursor-pointer transition-colors"
        >
          <Filter className="w-4 h-4 text-violet-700" />
          <span>Show a different thank-you per answer</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>
    );
  }

  // No eligible fields — the feature is unavailable. Keep the existing
  // hint, but render it as a thin one-liner instead of a heading block.
  if (eligible.length === 0) {
    return (
      <div className="border-t border-border-light pt-5">
        <p className="text-[12.5px] text-text-tertiary inline-flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-violet-700/70" />
          Add a Dropdown, Radio, Multi-select, or Service field to route the thank-you
          screen by answer.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border-light pt-5 space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-[18px] h-[18px] text-violet-700 flex-shrink-0" />
            <p className="text-[17px] font-semibold text-foreground">Routed thank-you screens</p>
          </div>
          {!active && (
            <button
              type="button"
              onClick={() => setUserExpanded(false)}
              className="text-text-tertiary hover:text-foreground cursor-pointer p-0.5"
              aria-label="Collapse"
              title="Hide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-text-secondary mt-1 leading-snug">
          Show a different message based on the visitor&apos;s answer to one field.
          Falls back to the default thank-you screen above when nothing matches.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <label className="block">
          <span className="text-[11.5px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">
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
  autoReplySmsEnabled: boolean;
  setAutoReplySmsEnabled: (v: boolean) => void;
  autoReplySmsBody: string;
  setAutoReplySmsBody: (v: string) => void;
  notifyOwnerEmail: boolean;
  setNotifyOwnerEmail: (v: boolean) => void;
  formFields: FormFieldConfig[];
}) {
  const hasPhoneField = props.formFields.some((f) => f.type === "phone");
  const hasEmailField = props.formFields.some((f) => f.type === "email");
  const emailBodyRef = useRef<HTMLTextAreaElement | null>(null);
  const smsBodyRef = useRef<HTMLTextAreaElement | null>(null);
  // Resolve a real businessName for the preview interpolation. Falls back
  // to the placeholder string the auto-reply uses when no business name is
  // configured — matches the runtime fallback in send-inquiry-confirmation.
  const businessName = useSettingsStore((s) => s.settings?.businessName?.trim() || "Our team");
  const contactEmail = useSettingsStore((s) => s.settings?.contactEmail ?? "");
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const { workspaceId } = useAuth();
  const [editingNotifyEmail, setEditingNotifyEmail] = useState(false);
  const [notifyEmailDraft, setNotifyEmailDraft] = useState(contactEmail);

  // Snapshot the current contactEmail into the draft whenever the user enters
  // edit mode. The earlier implementation mirrored contactEmail into the
  // draft via useEffect, which the lint rule flags as setState-in-effect
  // (causes cascading renders). Now the sync only happens on the click path
  // that actually needs it; non-edit renders read contactEmail directly.
  const startEditingNotifyEmail = () => {
    setNotifyEmailDraft(contactEmail);
    setEditingNotifyEmail(true);
  };

  const saveNotifyEmail = () => {
    const next = notifyEmailDraft.trim();
    if (!next || next === contactEmail) {
      setEditingNotifyEmail(false);
      return;
    }
    updateSettings({ contactEmail: next }, workspaceId || undefined);
    setEditingNotifyEmail(false);
  };

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
            <EmailPreview
              subject={props.autoReplySubject}
              body={props.autoReplyBody}
              businessName={businessName}
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
            <SmsPreview body={props.autoReplySmsBody} businessName={businessName} />
          </div>
        )}
      </div>

      {/* Owner notification */}
      <div className="border-t border-border-light pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Bell className="w-3.5 h-3.5 text-text-secondary mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-foreground">Email me when I get an inquiry</span>
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-secondary leading-snug">
                <span className="flex-shrink-0">Sent to</span>
                {editingNotifyEmail ? (
                  <input
                    type="email"
                    autoFocus
                    value={notifyEmailDraft}
                    onChange={(e) => setNotifyEmailDraft(e.target.value)}
                    onBlur={saveNotifyEmail}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNotifyEmail();
                      } else if (e.key === "Escape") {
                        setEditingNotifyEmail(false);
                      }
                    }}
                    placeholder="you@example.com"
                    className="flex-1 min-w-0 px-2 py-1 bg-surface border border-border-light rounded-md text-[12.5px] text-foreground placeholder:text-text-tertiary outline-none focus:border-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startEditingNotifyEmail}
                    className={`group inline-flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer min-w-0 ${
                      contactEmail ? "text-foreground" : "text-amber-700 underline"
                    }`}
                  >
                    <span className="truncate">
                      {contactEmail || "Set an address →"}
                    </span>
                    <Pencil className="w-3 h-3 text-text-tertiary group-hover:text-primary flex-shrink-0" />
                  </button>
                )}
              </div>
              {props.notifyOwnerEmail && !contactEmail && !editingNotifyEmail ? (
                <p className="text-[11.5px] text-amber-700 mt-1.5">
                  Notifications are on, but no recipient is set — emails won&apos;t
                  send until you add an address.
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => props.setNotifyOwnerEmail(!props.notifyOwnerEmail)}
            className="cursor-pointer flex-shrink-0"
            aria-label={props.notifyOwnerEmail ? "Disable owner email" : "Enable owner email"}
          >
            {props.notifyOwnerEmail ? (
              <ToggleRight className="w-7 h-7 text-primary" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-text-tertiary" />
            )}
          </button>
        </div>
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

// Email preview — renders the same HTML the bride will receive, using the
// shared `buildInquiryAutoReplyEmail` helper. Live-updates as the operator
// types so they can see merge-tags resolve and tone land before sending a
// real test. Uses sample placeholder values for {{name}} / {{businessName}}
// so the preview reads like a real email rather than literal merge tags.
function EmailPreview({
  subject,
  body,
  businessName,
}: {
  subject: string;
  body: string;
  businessName: string;
}) {
  const built = buildInquiryAutoReplyEmail(
    {
      clientName: "Sarah",
      businessName,
      serviceInterest: undefined,
      eventType: undefined,
    },
    { subject: subject || undefined, body: body || undefined },
  );
  return (
    <div className="rounded-lg border border-border-light bg-card-bg overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-border-light flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Preview
        </span>
        <span className="text-[10.5px] text-text-tertiary">
          To: Sarah · From: {businessName}
        </span>
      </div>
      <div className="px-3 py-2 border-b border-border-light">
        <p className="text-[12px] font-semibold text-foreground truncate">
          {built.subject}
        </p>
      </div>
      <div
        className="px-1 py-1 max-h-72 overflow-y-auto bg-[#f9f9f9]"
        dangerouslySetInnerHTML={{ __html: built.html }}
      />
    </div>
  );
}

// SMS preview — phone-bubble styling. Resolves merge tags so the operator
// sees the final text length (carriers split at 160 chars; the input cap
// is 320). Uses the same sample identity as EmailPreview for consistency.
function SmsPreview({
  body,
  businessName,
}: {
  body: string;
  businessName: string;
}) {
  const text = buildInquiryAutoReplySms(
    { clientName: "Sarah", businessName },
    { body: body || undefined },
  );
  return (
    <div className="rounded-lg border border-border-light bg-card-bg overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-border-light flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
          Preview
        </span>
        <span className="text-[10.5px] text-text-tertiary">
          To: Sarah · {text.length} chars
        </span>
      </div>
      <div className="p-3 bg-surface/40">
        <div className="max-w-[80%] bg-emerald-500 text-white rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] leading-snug shadow-sm whitespace-pre-wrap">
          {text}
        </div>
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
      title={on ? "Logic on — click to remove" : "Show this field only when another answer matches"}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
        on
          ? "text-primary bg-primary/10 hover:bg-primary/15"
          : "text-text-tertiary hover:text-foreground hover:bg-card-bg"
      }`}
    >
      <Filter className="w-3 h-3" />
      <span>{on ? "Logic on" : "Add logic"}</span>
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
      {rule.values.length === 0 && (
        <p className="text-[10.5px] text-text-tertiary leading-snug">
          e.g. Show <span className="font-mono">Trial date</span> only when <span className="font-mono">Services</span> <span className="italic">includes</span> <span className="font-mono">Trial</span>.
        </p>
      )}
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
  signature: { label: "Signature", description: "Sign with finger or pointer; stored as image", defaultLabel: "Signature", icon: PenLine },
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
  "signature",
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
    types: ["service", "signature", "hidden"],
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

// FormEmbed + FormQrCode live in ./share/FormEmbed.tsx now.
