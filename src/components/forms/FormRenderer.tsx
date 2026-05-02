"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, ArrowRight, ArrowLeft } from "lucide-react";
import { isFieldVisible } from "@/lib/form-logic";
import type {
  FormRendererProps,
  RenderableForm,
  RenderableService,
} from "./renderer-types";
export type { RenderableForm, RenderableService, FormRendererProps } from "./renderer-types";
import {
  effectiveLogo,
  fontClassFor,
  headingFontClassFor,
  accentColorFor,
  templateFor,
  themeFor,
} from "./renderer-helpers";
import { ThemeScope } from "./ThemeScope";
import { FieldRow } from "./FieldRow";
import {
  WelcomeView,
  LogoBadge,
  SuccessView,
  Honeypot,
  SubmitButton,
  CoverImage,
  FormHeader,
  ErrorBanner,
  useSubmitHandler,
  PoweredBy,
} from "./FormChrome";

export function FormRenderer(props: FormRendererProps) {
  const { form, forceView } = props;
  const template = templateFor(form.branding);
  const theme = themeFor(form.branding);

  const view = forceView ?? (props.submitted ? "success" : "form");

  // Welcome screen gates the form on the very first render. Operators opt
  // in via Form tab. Skipped automatically in editor preview so the editor
  // stays useful — they switch into preview to inspect the form, not the
  // intro card. The editor can still pin to forceView === "welcome" to
  // inspect the intro card directly.
  const welcomeEnabled = !!form.branding.welcomeEnabled && !!form.branding.welcomeTitle?.trim();
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const showWelcome =
    welcomeEnabled &&
    !welcomeDismissed &&
    view === "form" &&
    !props.preview;

  let inner: React.ReactNode;
  if (view === "success") {
    inner = <SuccessView {...props} />;
  } else if (view === "welcome") {
    inner = <WelcomeView {...props} onStart={() => {}} />;
  } else if (showWelcome) {
    inner = <WelcomeView {...props} onStart={() => setWelcomeDismissed(true)} />;
  } else if (template === "slides") {
    inner = <SlidesTemplate {...props} />;
  } else if (template === "minimal") {
    inner = <MinimalTemplate {...props} />;
  } else if (template === "editorial") {
    inner = <EditorialTemplate {...props} />;
  } else {
    inner = <ClassicTemplate {...props} />;
  }

  return <ThemeScope theme={theme}>{inner}</ThemeScope>;
}

// ── Welcome screen ────────────────────────────────────
//
// Intro shown before any fields. Operators use it to set context, share
// pricing notes, or warm up a long form. Click-through dismisses it for
// the rest of the session — no persistence needed for inquiry forms.
function ClassicTemplate(props: FormRendererProps) {
  const { form, values, onChange, error, submitting, compact, brandColorOverride, showPoweredBy, submitLabel, preview, workspaceLogo, services } = props;
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const accentColor = accentColorFor(form.branding, brandColor);
  const fontClass = fontClassFor(form.branding);
  const headingFontClass = headingFontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);
  const handleSubmit = useSubmitHandler(props);

  const containerClass = compact
    ? `px-3 py-4 sm:px-4 ${fontClass}`
    : `min-h-full flex items-center justify-center p-4 sm:p-6 ${fontClass}`;
  const containerStyle = compact
    ? undefined
    : ({
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
      } as React.CSSProperties);
  const cardWidth = compact ? "max-w-lg mx-auto" : "w-full max-w-lg";
  const headerPad = compact ? "px-5 pt-5 pb-4" : "px-8 pt-8 pb-6";
  const bodyPad = compact ? "px-5 pb-5" : "px-8 pb-8";
  const inputSize = compact ? "sm" : "md";

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={cardWidth}>
        <div className="bg-card-bg border border-border-light rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.08)]">
          {form.branding.coverImage && (
            <CoverImage src={form.branding.coverImage} rounded="" />
          )}
          <div
            className={headerPad}
            style={{
              background: `linear-gradient(180deg, ${brandColor}14 0%, transparent 100%)`,
            }}
          >
            {logo && (
              <div className="mb-3">
                <LogoBadge src={logo} size={compact ? 36 : 48} />
              </div>
            )}
            <FormHeader form={form} variant="card" headingFontClass={headingFontClass} />
          </div>
          <div className={bodyPad}>
            <ErrorBanner error={error} size={compact ? "sm" : "md"} />
            <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
              {form.fields
                .filter((f) => isFieldVisible(f, values, form.fields))
                .map((field) => (
                <FieldRow
                  key={field.name}
                  field={field}
                  value={values[field.name] || ""}
                  brandColor={brandColor}
                  accentColor={accentColor}
                  onChange={(v) => onChange(field.name, v)}
                  size={inputSize}
                  preview={preview}
                  services={services}
                  error={props.fieldErrors?.[field.name]}
                />
              ))}
              <Honeypot values={values} onChange={onChange} />
              <SubmitButton
                brandColor={brandColor}
                submitting={submitting}
                label={submitLabel ?? "Submit Inquiry"}
                size={compact ? "sm" : "md"}
              />
            </form>
          </div>
        </div>
        {showPoweredBy && <PoweredBy />}
      </div>
    </div>
  );
}

// ── Minimal template ──────────────────────────────────

function MinimalTemplate(props: FormRendererProps) {
  const { form, values, onChange, error, submitting, compact, brandColorOverride, showPoweredBy, submitLabel, preview, workspaceLogo, services } = props;
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const accentColor = accentColorFor(form.branding, brandColor);
  const fontClass = fontClassFor(form.branding);
  const headingFontClass = headingFontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);
  const handleSubmit = useSubmitHandler(props);

  const containerClass = compact
    ? `px-4 py-6 ${fontClass}`
    : `min-h-full flex items-start justify-center px-4 py-12 sm:py-20 ${fontClass}`;

  return (
    <div className={containerClass}>
      <div className="w-full max-w-md">
        {form.branding.coverImage && (
          <div className="mb-4">
            <CoverImage src={form.branding.coverImage} />
          </div>
        )}
        {logo && (
          <div className="mb-4">
            <LogoBadge src={logo} size={compact ? 32 : 44} />
          </div>
        )}
        <FormHeader form={form} variant="minimal" headingFontClass={headingFontClass} />
        <ErrorBanner error={error} size={compact ? "sm" : "md"} />
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields
            .filter((f) => isFieldVisible(f, values, form.fields))
            .map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              value={values[field.name] || ""}
              brandColor={brandColor}
              accentColor={accentColor}
              onChange={(v) => onChange(field.name, v)}
              size={compact ? "sm" : "md"}
              preview={preview}
              services={services}
              error={props.fieldErrors?.[field.name]}
            />
          ))}
          <Honeypot values={values} onChange={onChange} />
          <SubmitButton
            brandColor={brandColor}
            submitting={submitting}
            label={submitLabel ?? "Submit Inquiry"}
            size={compact ? "sm" : "md"}
          />
        </form>
        {showPoweredBy && <PoweredBy />}
      </div>
    </div>
  );
}

// ── Editorial template ────────────────────────────────

function EditorialTemplate(props: FormRendererProps) {
  const { form, values, onChange, error, submitting, compact, brandColorOverride, showPoweredBy, submitLabel, preview, workspaceLogo, services } = props;
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const accentColor = accentColorFor(form.branding, brandColor);
  const fontClass = fontClassFor(form.branding);
  const headingFontClass = headingFontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);
  const handleSubmit = useSubmitHandler(props);

  const containerClass = compact
    ? `px-4 py-8 ${fontClass}`
    : `min-h-full flex items-center justify-center px-4 py-12 sm:py-16 ${fontClass}`;
  const containerStyle = compact
    ? undefined
    : ({
        background: `linear-gradient(180deg, ${brandColor}10 0%, transparent 30%), var(--background)`,
      } as React.CSSProperties);

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="w-full max-w-xl">
        {form.branding.coverImage && (
          <div className="mb-6">
            <CoverImage src={form.branding.coverImage} />
          </div>
        )}
        {logo && (
          <div className="flex justify-center mb-5">
            <LogoBadge src={logo} size={compact ? 40 : 56} />
          </div>
        )}
        <FormHeader form={form} variant="editorial" headingFontClass={headingFontClass} />
        <ErrorBanner error={error} size={compact ? "sm" : "md"} />
        <form onSubmit={handleSubmit} className="space-y-5">
          {form.fields
            .filter((f) => isFieldVisible(f, values, form.fields))
            .map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              value={values[field.name] || ""}
              brandColor={brandColor}
              accentColor={accentColor}
              onChange={(v) => onChange(field.name, v)}
              size={compact ? "md" : "lg"}
              preview={preview}
              services={services}
              error={props.fieldErrors?.[field.name]}
            />
          ))}
          <Honeypot values={values} onChange={onChange} />
          <div className="pt-2">
            <SubmitButton
              brandColor={brandColor}
              submitting={submitting}
              label={submitLabel ?? "Submit Inquiry"}
              size={compact ? "md" : "lg"}
            />
          </div>
        </form>
        {showPoweredBy && <PoweredBy />}
      </div>
    </div>
  );
}

// ── Slides (Typeform-style) template ──────────────────

function SlidesTemplate(props: FormRendererProps) {
  const { form, values, onChange, error, submitting, compact, brandColorOverride, showPoweredBy, submitLabel, preview, workspaceLogo, services } = props;
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const accentColor = accentColorFor(form.branding, brandColor);
  const fontClass = fontClassFor(form.branding);
  const headingFontClass = headingFontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);

  // Slides only ever shows visible, user-facing fields. Hidden fields are
  // auto-populated; conditional fields hide unless the rule is satisfied.
  const fields = form.fields.filter(
    (f) => f.type !== "hidden" && isFieldVisible(f, values, form.fields),
  );
  const total = fields.length;
  const [rawStep, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [stepError, setStepError] = useState("");

  // Clamp during render — the editor preview can change field count
  // mid-flight, and we don't want a stale step pointing past the end.
  const step = Math.min(rawStep, Math.max(0, total - 1));

  const description =
    form.branding.description?.trim() || "Fill in the form and we'll be in touch.";

  const current = fields[step];
  const isLast = step === total - 1;

  const validateCurrent = useCallback(() => {
    if (!current) return true;
    if (current.required && !(values[current.name]?.trim())) {
      setStepError(`${current.label} is required`);
      return false;
    }
    setStepError("");
    return true;
  }, [current, values]);

  const goNext = useCallback(() => {
    if (!validateCurrent()) return;
    if (isLast) {
      if (preview) return;
      void props.onSubmit();
      return;
    }
    setDir(1);
    setStep((s) => Math.min(total - 1, s + 1));
  }, [validateCurrent, isLast, preview, props, total]);

  const goBack = useCallback(() => {
    setStepError("");
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // Typeform-style: Enter advances on every input. Shift+Enter inside a
  // textarea is the only way to insert a newline.
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.target instanceof HTMLTextAreaElement && e.shiftKey) return;
      e.preventDefault();
      goNext();
    },
    [goNext],
  );

  if (total === 0) {
    return (
      <div className={`p-8 text-center text-text-tertiary ${fontClass}`}>
        Add a field to preview the slides layout.
      </div>
    );
  }

  const progress = ((step + 1) / total) * 100;

  const containerClass = compact
    ? `px-4 py-6 ${fontClass}`
    : `min-h-screen flex flex-col ${fontClass}`;
  const containerStyle = compact
    ? undefined
    : ({
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
      } as React.CSSProperties);

  return (
    <div className={containerClass} style={containerStyle} onKeyDown={handleKey}>
      {/* Progress bar */}
      <div className={`${compact ? "" : "px-4 sm:px-6 pt-4"}`}>
        <div className="h-1 bg-surface rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: brandColor }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-text-tertiary">
            {step + 1} of {total}
          </p>
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="text-[11px] text-text-tertiary hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}
        </div>
      </div>

      <div className={`flex-1 flex items-center justify-center ${compact ? "py-6" : "px-4 sm:px-6 py-10"}`}>
        <div className="w-full max-w-xl mx-auto">
          {/* Header (only on first slide) */}
          {step === 0 && (
            <div className="mb-6">
              {form.branding.coverImage && (
                <div className="mb-4">
                  <CoverImage src={form.branding.coverImage} />
                </div>
              )}
              {logo && (
                <div className="mb-3">
                  <LogoBadge src={logo} size={compact ? 36 : 44} />
                </div>
              )}
              <h1 className={`text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight ${headingFontClass}`}>
                {form.name}
              </h1>
              <p className="text-[13px] text-text-secondary mt-1 whitespace-pre-wrap">{description}</p>
            </div>
          )}

          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, y: dir === 1 ? 16 : -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir === 1 ? -16 : 16 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
                Question {step + 1}
              </p>
              <div className="mb-1">
                <FieldRow
                  field={current}
                  value={values[current.name] || ""}
                  brandColor={brandColor}
                  accentColor={accentColor}
                  onChange={(v) => {
                    onChange(current.name, v);
                    if (stepError) setStepError("");
                  }}
                  size={compact ? "md" : "lg"}
                  preview={preview}
                  services={services}
                  autoFocus
                  error={props.fieldErrors?.[current.name]}
                />
              </div>
              {stepError && (
                <p className="text-[12px] text-red-600 mt-2">{stepError}</p>
              )}
              {error && !stepError && (
                <p className="text-[12px] text-red-600 mt-2">{error}</p>
              )}
            </motion.div>
          </AnimatePresence>

          <Honeypot values={values} onChange={onChange} />

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-all hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 8px 24px -8px ${brandColor}66`,
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </>
              ) : isLast ? (
                <>
                  <Send className="w-4 h-4" /> {submitLabel ?? "Submit"}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <span className="text-[11px] text-text-tertiary">
              press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-light text-[10px] font-mono">Enter</kbd>
            </span>
          </div>
        </div>
      </div>

      {showPoweredBy && (
        <div className="pb-4">
          <PoweredBy />
        </div>
      )}
    </div>
  );
}

// ── Editor-side preview helper ────────────────────────

/**
 * Convenience wrapper used by the in-app editor preview. Holds local input
 * state (since the editor doesn't care about real submissions) and exposes
 * a `view` prop to flip between the form and success states.
 *
 * Keyed on the field-name list so adding/removing fields naturally resets
 * the preview's input values without setState-in-effect gymnastics.
 */
export function FormPreviewRenderer({
  form,
  view,
  brandColorOverride,
  workspaceLogo,
  services,
  forceSuccessVariantId,
}: {
  form: RenderableForm;
  view: "welcome" | "form" | "success";
  brandColorOverride?: string;
  workspaceLogo?: string;
  services?: RenderableService[];
  forceSuccessVariantId?: string;
}) {
  // Reset preview values when fields are added/removed or types change. We
  // intentionally don't key on field.name here — the editor rewrites `name`
  // from the label on every keystroke, which would remount the preview and
  // erase typed sample values.
  const fieldKey = `${form.fields.length}:${form.fields.map((f) => f.type).join(",")}`;
  return (
    <FormPreviewInner
      key={fieldKey}
      form={form}
      view={view}
      brandColorOverride={brandColorOverride}
      workspaceLogo={workspaceLogo}
      services={services}
      forceSuccessVariantId={forceSuccessVariantId}
    />
  );
}

function FormPreviewInner({
  form,
  view,
  brandColorOverride,
  workspaceLogo,
  services,
  forceSuccessVariantId,
}: {
  form: RenderableForm;
  view: "welcome" | "form" | "success";
  brandColorOverride?: string;
  workspaceLogo?: string;
  services?: RenderableService[];
  forceSuccessVariantId?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <FormRenderer
      form={form}
      values={values}
      onChange={(name, value) => setValues((p) => ({ ...p, [name]: value }))}
      onSubmit={() => {}}
      preview
      forceView={view}
      brandColorOverride={brandColorOverride}
      workspaceLogo={workspaceLogo}
      services={services}
      forceSuccessVariantId={forceSuccessVariantId}
    />
  );
}
