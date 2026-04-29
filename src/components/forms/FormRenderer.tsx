"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Send, ArrowRight, ArrowLeft, ExternalLink, Upload, X as XIcon } from "lucide-react";
import type {
  FormBranding,
  FormFieldConfig,
  FormFontFamily,
  FormSuccessVariant,
  FormTemplate,
  FormTheme,
  FormType,
} from "@/types/models";
import { isFieldVisible, splitMulti } from "@/lib/form-logic";

// Shared shape so editor preview, public inquiry page, and embed page can
// all hand the same renderer their form. Only the bits the renderer needs.
export interface RenderableForm {
  id?: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  type?: FormType;
}

/** Minimal shape the renderer needs for the Service field dropdown. */
export interface RenderableService {
  id: string;
  name: string;
}

export interface FormRendererProps {
  form: RenderableForm;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  submitted?: boolean;
  error?: string;
  compact?: boolean;
  /** Disables real submission and lets the editor force the success view. */
  preview?: boolean;
  /** Editor-only: pin which view (welcome / form / success) is rendered. */
  forceView?: "welcome" | "form" | "success";
  submitLabel?: string;
  /** Embed page can override accent via query param. */
  brandColorOverride?: string;
  showPoweredBy?: boolean;
  /** Workspace-level logo from Settings. Used when the form has no logo
   *  override of its own — keeps branding uniform by default. */
  workspaceLogo?: string;
  /** Live services from the workspace. Powers the Service field dropdown so
   *  options stay in sync as services are added/renamed. */
  services?: RenderableService[];
}

function effectiveLogo(form: RenderableForm, workspaceLogo?: string): string | undefined {
  return form.branding.logo || workspaceLogo;
}

const FONT_CLASS: Record<FormFontFamily, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  display:
    "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide",
};

function fontClassFor(branding: FormBranding) {
  return FONT_CLASS[branding.fontFamily ?? "sans"];
}

function templateFor(branding: FormBranding): FormTemplate {
  return branding.template ?? "classic";
}

function themeFor(branding: FormBranding): FormTheme {
  return branding.theme ?? "light";
}

// Resolves "auto" against the system preference. Returns 'dark' or 'light'.
// Re-evaluated whenever the OS preference changes so an open form picks up
// the switch without a reload.
function useResolvedTheme(theme: FormTheme): "light" | "dark" {
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemDark ? "dark" : "light";
}

// Wraps the rendered form so the form's theme tokens (--card-bg, --background,
// etc.) resolve from the .dark scope when needed. The dashboard's own theme
// stays unaffected — the wrapper applies a div-scoped colour-scheme override
// only to its descendants.
function ThemeScope({
  theme,
  children,
}: {
  theme: FormTheme;
  children: React.ReactNode;
}) {
  const resolved = useResolvedTheme(theme);
  // `display: contents` so the wrapper participates in cascading and
  // scoping (.dark applies to descendants) but contributes no box of its
  // own. Templates control their own height/layout. `colorScheme` flips
  // the UA's default form-control palette for this subtree.
  return (
    <div
      className={resolved === "dark" ? "dark contents" : "contents"}
      style={{ colorScheme: resolved }}
    >
      {children}
    </div>
  );
}

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
function WelcomeView({
  form,
  brandColorOverride,
  workspaceLogo,
  showPoweredBy,
  compact,
  onStart,
}: FormRendererProps & { onStart: () => void }) {
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const fontClass = fontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);
  const title = form.branding.welcomeTitle?.trim() || form.name;
  const subtitle = form.branding.welcomeSubtitle?.trim();
  const ctaLabel = form.branding.welcomeCtaLabel?.trim() || "Get started";

  const containerClass = compact
    ? `px-4 py-8 ${fontClass}`
    : `min-h-full flex items-center justify-center p-4 ${fontClass}`;
  const containerStyle = compact
    ? undefined
    : ({
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
      } as React.CSSProperties);

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="w-full max-w-lg">
        <div className="bg-card-bg border border-border-light rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.08)]">
          {form.branding.coverImage && (
            <CoverImage src={form.branding.coverImage} rounded="" />
          )}
          <div className="px-8 py-10 text-center">
            {logo && (
              <div className="flex justify-center mb-4">
                <LogoBadge src={logo} size={48} />
              </div>
            )}
            <h1 className="text-[26px] font-bold text-foreground tracking-tight leading-[1.15]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[14px] text-text-secondary mt-3 leading-relaxed whitespace-pre-wrap">
                {subtitle}
              </p>
            )}
            <button
              type="button"
              onClick={onStart}
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white cursor-pointer transition-all hover:opacity-95"
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 8px 24px -8px ${brandColor}66`,
              }}
            >
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showPoweredBy && <PoweredBy />}
      </div>
    </div>
  );
}

// ── Logo badge (shared) ────────────────────────────────

/**
 * Renders the form's logo at a given size. Plain <img> rather than next/image
 * because logos are user-uploaded base64 data URLs — no remotePatterns config
 * needed. Returns null if no logo is set.
 */
function LogoBadge({
  src,
  size,
  className = "",
}: {
  src?: string;
  size: number;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Logo"
      style={{ width: size, height: size }}
      className={`rounded-2xl object-cover ${className}`}
    />
  );
}

// ── Success view ───────────────────────────────────────

function pickSuccessVariant(
  form: RenderableForm,
  values: Record<string, string>,
): FormSuccessVariant | undefined {
  const fieldName = form.branding.successRouteFieldName;
  const variants = form.branding.successVariants;
  if (!fieldName || !variants?.length) return undefined;
  const answer = (values[fieldName] || "").trim();
  if (!answer) return undefined;
  const selected = splitMulti(answer);
  for (const v of variants) {
    const targets = (v.matchValues || []).map((t) => t.trim()).filter(Boolean);
    if (targets.length === 0) continue;
    const matches = targets.includes(answer) || selected.some((s) => targets.includes(s));
    if (matches) return v;
  }
  return undefined;
}

function SuccessView({ form, values, compact, brandColorOverride, showPoweredBy, workspaceLogo, preview }: FormRendererProps) {
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const variant = pickSuccessVariant(form, values);
  const successMessage =
    variant?.message?.trim() ||
    form.branding.successMessage?.trim() ||
    "Your inquiry has been received. We'll be in touch shortly.";
  const fontClass = fontClassFor(form.branding);
  const logo = effectiveLogo(form, workspaceLogo);

  const ctaLabel = (variant?.ctaLabel ?? form.branding.successCtaLabel)?.trim();
  const ctaUrl = (variant?.ctaUrl ?? form.branding.successCtaUrl)?.trim();
  const hasCta = Boolean(ctaLabel && ctaUrl);

  const redirectUrl = (variant?.redirectUrl ?? form.branding.successRedirectUrl)?.trim();
  const redirectDelay = Math.max(
    0,
    variant?.redirectDelaySeconds ?? form.branding.successRedirectDelaySeconds ?? 5,
  );
  const [redirectCountdown, setRedirectCountdown] = useState(redirectDelay);

  // Auto-redirect (skipped in editor preview so the editor stays inspectable).
  useEffect(() => {
    if (preview || !redirectUrl) return;
    if (redirectCountdown <= 0) {
      try {
        window.location.assign(redirectUrl);
      } catch {
        // ignore — invalid URL
      }
      return;
    }
    const t = setTimeout(() => setRedirectCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [preview, redirectUrl, redirectCountdown]);

  const ctaButton = hasCta ? (
    <a
      href={ctaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-95"
      style={{
        backgroundColor: brandColor,
        boxShadow: `0 8px 24px -8px ${brandColor}66`,
      }}
    >
      {ctaLabel}
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  ) : null;

  const redirectNotice =
    redirectUrl && !preview ? (
      <p className="text-[11px] text-text-tertiary mt-4">
        Redirecting in {redirectCountdown}s…
      </p>
    ) : null;

  if (compact) {
    return (
      <div className={`px-4 py-8 ${fontClass}`}>
        <div className="max-w-md mx-auto text-center">
          <div
            className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: `${brandColor}1A` }}
          >
            <Check className="w-6 h-6" style={{ color: brandColor }} strokeWidth={2.5} />
          </div>
          <h2 className="text-[16px] font-bold text-foreground mb-1">Thank you!</h2>
          <p className="text-[12px] text-text-secondary whitespace-pre-wrap">{successMessage}</p>
          {hasCta && <div className="mt-4">{ctaButton}</div>}
          {redirectNotice}
          {showPoweredBy && <p className="text-[10px] text-text-tertiary pt-3">Powered by Magic</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-full flex items-center justify-center p-4 ${fontClass}`}
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
      }}
    >
      <div className="w-full max-w-md bg-card-bg border border-border-light rounded-3xl p-10 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.08)]">
        {logo && (
          <div className="flex justify-center mb-4">
            <LogoBadge src={logo} size={48} />
          </div>
        )}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            backgroundColor: `${brandColor}1A`,
            boxShadow: `0 8px 24px -8px ${brandColor}40`,
          }}
        >
          <Check className="w-8 h-8" style={{ color: brandColor }} strokeWidth={2.5} />
        </div>
        <h2 className="text-[22px] font-bold text-foreground mb-2">Thank you!</h2>
        <p className="text-[14px] text-text-secondary leading-relaxed whitespace-pre-wrap">
          {successMessage}
        </p>
        {hasCta && <div className="mt-6">{ctaButton}</div>}
        {redirectNotice}
      </div>
    </div>
  );
}

// ── Honeypot (shared) ───────────────────────────────────

function Honeypot({ values, onChange }: { values: Record<string, string>; onChange: (n: string, v: string) => void }) {
  return (
    <input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={values.__hp || ""}
      onChange={(e) => onChange("__hp", e.target.value)}
      style={{
        position: "absolute",
        left: "-9999px",
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Field row (shared, with size variants) ─────────────

function FieldRow({
  field,
  value,
  brandColor,
  onChange,
  size = "md",
  preview,
  autoFocus,
  services,
}: {
  field: FormFieldConfig;
  value: string;
  brandColor: string;
  onChange: (v: string) => void;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  autoFocus?: boolean;
  services?: RenderableService[];
}) {
  const ringStyle = { "--brand": brandColor } as React.CSSProperties;
  const sizing =
    size === "lg"
      ? "px-4 py-4 text-[16px] rounded-xl"
      : size === "sm"
      ? "px-3 py-2 text-[13px] rounded-lg"
      : "px-4 py-3 text-[14px] rounded-xl";
  const inputClass = `w-full bg-surface border border-border-light text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-[var(--brand)] ${sizing}`;
  const placeholder = field.placeholder ?? field.label;
  const labelSize = size === "lg" ? "text-[14px]" : size === "sm" ? "text-[11px]" : "text-[12px]";

  // Hidden fields render nothing; they're auto-populated from URL params.
  if (field.type === "hidden") return null;

  const selected = splitMulti(value);

  return (
    <div>
      <label className={`${labelSize} font-semibold text-foreground block mb-1.5`}>
        {field.label}
        {field.required && <span className="text-text-tertiary font-normal ml-1">*</span>}
      </label>
      {field.type === "radio" ? (
        <div className="space-y-1.5">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={preview}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: brandColor }}
              />
              <span className="text-[14px] text-foreground group-hover:text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" || field.type === "multi_select" ? (
        <div className="space-y-1.5">
          {(field.options ?? []).map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isOn}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt]
                      : selected.filter((v) => v !== opt);
                    onChange(next.join(", "));
                  }}
                  disabled={preview}
                  className="w-4 h-4 cursor-pointer rounded"
                  style={{ accentColor: brandColor }}
                />
                <span className="text-[14px] text-foreground group-hover:text-foreground">{opt}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === "file" ? (
        <FileInput
          field={field}
          value={value}
          onChange={onChange}
          preview={preview}
          inputClass={inputClass}
          brandColor={brandColor}
        />
      ) : field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={size === "lg" ? 5 : size === "sm" ? 3 : 4}
          placeholder={placeholder}
          style={ringStyle}
          readOnly={preview}
          autoFocus={autoFocus}
          className={`${inputClass} resize-none`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          disabled={preview}
          autoFocus={autoFocus}
          className={inputClass}
        >
          <option value="">
            {placeholder ? `Select ${placeholder.toLowerCase()}` : `Select ${field.label.toLowerCase()}`}
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "service" ? (
        // Live-services dropdown. Always appends "Other" so visitors aren't
        // boxed in if their need doesn't match a configured service.
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          disabled={preview}
          autoFocus={autoFocus}
          className={inputClass}
        >
          <option value="">
            {placeholder ? `Select ${placeholder.toLowerCase()}` : `Select ${field.label.toLowerCase()}`}
          </option>
          {services?.map((svc) => (
            <option key={svc.id} value={svc.name}>
              {svc.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      ) : field.type === "date_range" ? (
        // Two date inputs side by side; values stored as a single
        // "YYYY-MM-DD to YYYY-MM-DD" string so the existing string-based
        // submission pipeline keeps working without schema changes.
        <DateRangeInput
          value={value}
          onChange={onChange}
          ringStyle={ringStyle}
          inputClass={inputClass}
          preview={preview}
        />
      ) : (
        <input
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
              ? "tel"
              : field.type === "url"
              ? "url"
              : field.type === "number"
              ? "number"
              : field.type === "date"
              ? "date"
              : field.type === "time"
              ? "time"
              : "text"
          }
          inputMode={
            field.type === "number"
              ? "numeric"
              : field.type === "phone"
              ? "tel"
              : field.type === "url"
              ? "url"
              : undefined
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            field.type === "url"
              ? placeholder ?? "https://"
              : placeholder
          }
          style={ringStyle}
          readOnly={preview}
          autoFocus={autoFocus}
          className={inputClass}
        />
      )}
      {field.helpText && (
        <p className={`${size === "sm" ? "text-[10px]" : "text-[11px]"} text-text-tertiary mt-1.5`}>{field.helpText}</p>
      )}
    </div>
  );
}

function DateRangeInput({
  value,
  onChange,
  ringStyle,
  inputClass,
  preview,
}: {
  value: string;
  onChange: (v: string) => void;
  ringStyle: React.CSSProperties;
  inputClass: string;
  preview?: boolean;
}) {
  const [start = "", end = ""] = value.split(" to ");
  const emit = (next: { start?: string; end?: string }) => {
    const s = next.start ?? start;
    const e = next.end ?? end;
    if (!s && !e) onChange("");
    else if (s && e) onChange(`${s} to ${e}`);
    else onChange(s || e);
  };
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={start}
        onChange={(e) => emit({ start: e.target.value })}
        style={ringStyle}
        readOnly={preview}
        className={inputClass}
      />
      <span className="text-[12px] text-text-tertiary flex-shrink-0">to</span>
      <input
        type="date"
        value={end}
        onChange={(e) => emit({ end: e.target.value })}
        style={ringStyle}
        readOnly={preview}
        className={inputClass}
      />
    </div>
  );
}

// ── File input (shared) ───────────────────────────────
//
// File uploads are stored as a JSON-encoded array of { name, type, dataUrl }
// inside the regular string-based answer pipeline. Keeps the existing form
// submission shape (Record<string, string>) unchanged — no schema migration.
// Each file is base64-encoded; per-file size cap is enforced on the client.

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

function decodeFileValue(value: string): UploadedFile[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f): f is UploadedFile =>
          typeof f === "object" && f !== null && typeof f.dataUrl === "string",
      );
    }
  } catch {
    // ignore — legacy or non-JSON value
  }
  return [];
}

function FileInput({
  field,
  value,
  onChange,
  preview,
  inputClass,
  brandColor,
}: {
  field: FormFieldConfig;
  value: string;
  onChange: (v: string) => void;
  preview?: boolean;
  inputClass: string;
  brandColor: string;
}) {
  const [error, setError] = useState("");
  const files = useMemo(() => decodeFileValue(value), [value]);
  const maxMb = field.maxFileSizeMb ?? 5;
  const allowMany = !!field.multipleFiles;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || preview) return;
    const list = Array.from(incoming);
    Promise.all(
      list.map(
        (f) =>
          new Promise<UploadedFile | null>((resolve) => {
            if (f.size > maxMb * 1024 * 1024) {
              setError(`${f.name} is over the ${maxMb}MB limit.`);
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target?.result;
              if (typeof dataUrl !== "string") {
                resolve(null);
                return;
              }
              resolve({ name: f.name, type: f.type, dataUrl });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(f);
          }),
      ),
    ).then((parsed) => {
      const ok = parsed.filter((p): p is UploadedFile => p !== null);
      if (ok.length === 0) return;
      const next = allowMany ? [...files, ...ok] : ok.slice(0, 1);
      onChange(JSON.stringify(next));
      setError("");
    });
  };

  const removeAt = (i: number) => {
    const next = files.filter((_, idx) => idx !== i);
    onChange(next.length ? JSON.stringify(next) : "");
  };

  return (
    <div>
      <label
        className={`${inputClass} flex items-center gap-2 cursor-pointer hover:border-[var(--brand)] transition-colors`}
        style={{ "--brand": brandColor } as React.CSSProperties}
      >
        <Upload className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        <span className="text-text-tertiary truncate">
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? "s" : ""} selected — add another`
            : `Click to upload${allowMany ? " (multiple allowed)" : ""}`}
        </span>
        <input
          type="file"
          accept={field.acceptedFileTypes || undefined}
          multiple={allowMany}
          disabled={preview}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>
      {error && <p className="text-[11px] text-red-600 mt-1.5">{error}</p>}
      {files.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {files.map((f, i) => {
            const isImage = f.type.startsWith("image/");
            return (
              <div key={i} className="relative rounded-lg border border-border-light overflow-hidden bg-surface aspect-square">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center">
                    <span className="text-[10px] text-text-secondary truncate">{f.name}</span>
                  </div>
                )}
                {!preview && (
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label={`Remove ${f.name}`}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Submit button (shared) ────────────────────────────

function SubmitButton({
  brandColor,
  submitting,
  label,
  size = "md",
}: {
  brandColor: string;
  submitting?: boolean;
  label: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizing =
    size === "lg"
      ? "py-4 text-[15px] rounded-2xl"
      : size === "sm"
      ? "py-2.5 text-[13px] rounded-xl"
      : "py-3.5 text-[14px] rounded-xl";
  return (
    <button
      type="submit"
      disabled={submitting}
      className={`group w-full font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed ${sizing}`}
      style={{
        backgroundColor: brandColor,
        boxShadow: `0 8px 24px -8px ${brandColor}66`,
      }}
    >
      {submitting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Sending…
        </>
      ) : (
        <>
          <Send className="w-4 h-4" /> {label}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

// ── Cover image (shared) ──────────────────────────────

function CoverImage({ src, rounded = "rounded-2xl" }: { src?: string; rounded?: string }) {
  if (!src) return null;
  return (
    <div className={`w-full overflow-hidden ${rounded}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-auto max-h-64 object-cover" />
    </div>
  );
}

// ── Common header content ─────────────────────────────

function FormHeader({ form, variant }: { form: RenderableForm; variant: "card" | "minimal" | "editorial" }) {
  const description =
    form.branding.description?.trim() || "Fill in the form and we'll be in touch.";

  if (variant === "editorial") {
    return (
      <div className="text-center mb-8">
        <h1 className="text-[36px] sm:text-[44px] font-bold text-foreground tracking-tight leading-[1.1]">
          {form.name}
        </h1>
        <div className="w-12 h-[2px] bg-foreground/20 mx-auto my-5" />
        <p className="text-[15px] text-text-secondary leading-relaxed whitespace-pre-wrap max-w-md mx-auto">
          {description}
        </p>
      </div>
    );
  }
  if (variant === "minimal") {
    return (
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
          {form.name}
        </h1>
        <p className="text-[13px] text-text-secondary mt-1 whitespace-pre-wrap">{description}</p>
      </div>
    );
  }
  // card
  return (
    <>
      <h1 className="text-[24px] font-bold text-foreground tracking-tight">{form.name}</h1>
      <p className="text-[13px] text-text-secondary mt-1.5 whitespace-pre-wrap">{description}</p>
    </>
  );
}

// ── Error banner (shared) ─────────────────────────────

function ErrorBanner({ error, size = "md" }: { error?: string; size?: "sm" | "md" }) {
  if (!error) return null;
  return (
    <div
      className={`mb-${size === "sm" ? "3" : "5"} px-${size === "sm" ? "3" : "4"} py-${
        size === "sm" ? "2" : "3"
      } rounded-xl text-[${size === "sm" ? "11" : "13"}px]`}
      style={{
        backgroundColor: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#B91C1C",
      }}
    >
      {error}
    </div>
  );
}

// ── Wrapper that owns the form's <form> element + submit handling ──

function useSubmitHandler(props: FormRendererProps) {
  return useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (props.preview) return;
      void props.onSubmit();
    },
    [props],
  );
}

function PoweredBy() {
  return (
    <p className="text-center text-[11px] text-text-tertiary mt-5">
      Powered by{" "}
      <a
        href="https://usemagic.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-secondary hover:text-foreground transition-colors"
      >
        Magic
      </a>
    </p>
  );
}

// ── Classic template ──────────────────────────────────

function ClassicTemplate(props: FormRendererProps) {
  const { form, values, onChange, error, submitting, compact, brandColorOverride, showPoweredBy, submitLabel, preview, workspaceLogo, services } = props;
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  const fontClass = fontClassFor(form.branding);
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
            <FormHeader form={form} variant="card" />
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
                  onChange={(v) => onChange(field.name, v)}
                  size={inputSize}
                  preview={preview}
                  services={services}
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
  const fontClass = fontClassFor(form.branding);
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
        <FormHeader form={form} variant="minimal" />
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
              onChange={(v) => onChange(field.name, v)}
              size={compact ? "sm" : "md"}
              preview={preview}
              services={services}
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
  const fontClass = fontClassFor(form.branding);
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
        <FormHeader form={form} variant="editorial" />
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
              onChange={(v) => onChange(field.name, v)}
              size={compact ? "md" : "lg"}
              preview={preview}
              services={services}
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
  const fontClass = fontClassFor(form.branding);
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
    : `min-h-full flex flex-col ${fontClass}`;
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
              <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">
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
                  onChange={(v) => {
                    onChange(current.name, v);
                    if (stepError) setStepError("");
                  }}
                  size={compact ? "md" : "lg"}
                  preview={preview}
                  services={services}
                  autoFocus
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
}: {
  form: RenderableForm;
  view: "welcome" | "form" | "success";
  brandColorOverride?: string;
  workspaceLogo?: string;
  services?: RenderableService[];
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
    />
  );
}

function FormPreviewInner({
  form,
  view,
  brandColorOverride,
  workspaceLogo,
  services,
}: {
  form: RenderableForm;
  view: "welcome" | "form" | "success";
  brandColorOverride?: string;
  workspaceLogo?: string;
  services?: RenderableService[];
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
    />
  );
}
