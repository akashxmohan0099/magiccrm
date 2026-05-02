"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Send, ArrowRight, ArrowLeft, ExternalLink, Upload, X as XIcon } from "lucide-react";
import type {
  FormFieldConfig,
  FormSuccessVariant,
} from "@/types/models";
import { isFieldVisible, splitMulti } from "@/lib/form-logic";
import { SignaturePad } from "./SignaturePad";
import type {
  FormRendererProps,
  RenderableForm,
  RenderableService,
} from "./renderer-types";
export type { RenderableForm, RenderableService, FormRendererProps } from "./renderer-types";
import {
  autocompleteFor,
  selectPlaceholderText,
  effectiveLogo,
  fontClassFor,
  headingFontClassFor,
  accentColorFor,
  templateFor,
  themeFor,
} from "./renderer-helpers";
import { ThemeScope } from "./ThemeScope";

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
  const headingFontClass = headingFontClassFor(form.branding);
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
            <h1 className={`text-[26px] font-bold text-foreground tracking-tight leading-[1.15] ${headingFontClass}`}>
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

function SuccessView({ form, values, compact, brandColorOverride, showPoweredBy, workspaceLogo, preview, forceSuccessVariantId }: FormRendererProps) {
  const brandColor = brandColorOverride || form.branding.primaryColor || "#34D399";
  // Editor-pinned variant wins over value-derived match. `__default__` is
  // the sentinel for "show the fallback message" so the editor can flip
  // off all variants without unsetting routing.
  const forcedVariant =
    forceSuccessVariantId && forceSuccessVariantId !== "__default__"
      ? form.branding.successVariants?.find((v) => v.id === forceSuccessVariantId)
      : undefined;
  const variant =
    forcedVariant ||
    (forceSuccessVariantId === "__default__" ? undefined : pickSuccessVariant(form, values));
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
  accentColor,
  onChange,
  size = "md",
  preview,
  autoFocus,
  services,
  fieldId: providedId,
  error,
}: {
  field: FormFieldConfig;
  value: string;
  brandColor: string;
  /** Accent color for secondary surfaces (radio dots, checkbox marks). Defaults to brand. */
  accentColor?: string;
  onChange: (v: string) => void;
  size?: "sm" | "md" | "lg";
  preview?: boolean;
  autoFocus?: boolean;
  services?: RenderableService[];
  /** DOM id for the input — controls htmlFor/id linkage. Falls back to a
   *  derived id if omitted. */
  fieldId?: string;
  /** Inline validation error for this field. */
  error?: string;
}) {
  const checkColor = accentColor || brandColor;
  const ringStyle = { "--brand": brandColor } as React.CSSProperties;
  const sizing =
    size === "lg"
      ? "px-4 py-4 text-[16px] rounded-xl"
      : size === "sm"
      ? "px-3 py-2 text-[13px] rounded-lg"
      : "px-4 py-3 text-[14px] rounded-xl";
  const errorRing = error ? "border-red-400 focus:border-red-500" : "";
  const inputClass = `w-full bg-surface border border-border-light text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-[var(--brand)] ${sizing} ${errorRing}`.trim();
  const placeholder = field.placeholder ?? field.label;
  const labelSize = size === "lg" ? "text-[14px]" : size === "sm" ? "text-[11px]" : "text-[12px]";
  const fieldId = providedId ?? `f-${field.name}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = field.helpText ? `${fieldId}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;
  const ac = autocompleteFor(field);

  // Hidden fields render nothing; they're auto-populated from URL params.
  if (field.type === "hidden") return null;

  const selected = splitMulti(value);
  // For radio/checkbox/multi_select groups we use role=group + aria-labelledby
  // since the visual label points at a set of inputs, not one input.
  const isGroup = field.type === "radio" || field.type === "checkbox" || field.type === "multi_select";
  const labelProps = isGroup
    ? { id: `${fieldId}-label` }
    : { htmlFor: fieldId };

  return (
    <div>
      <label
        {...labelProps}
        className={`${labelSize} font-semibold text-foreground block mb-1.5`}
      >
        {field.label}
        {field.required && <span className="text-text-tertiary font-normal ml-1">*</span>}
      </label>
      {field.type === "radio" ? (
        <div
          role="radiogroup"
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={describedBy}
          className="space-y-1.5"
        >
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="w-4 h-4 cursor-pointer"
                style={{ accentColor: checkColor }}
              />
              <span className="text-[14px] text-foreground group-hover:text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" || field.type === "multi_select" ? (
        // Chip-style multi-select. Each option is a toggleable pill —
        // selected pills get a brand-tinted bg + border. Compared to bare
        // `<input type="checkbox">` rows this scans as obviously
        // interactive, gives a tap target sized for mobile, and matches
        // the routed-thank-you variant chip pattern elsewhere in the app.
        <div role="group" aria-labelledby={`${fieldId}-label`} aria-describedby={describedBy}>
          <div className="flex flex-wrap gap-1.5">
            {(field.options ?? []).map((opt) => {
              const isOn = selected.includes(opt);
              const atCap = !!field.maxSelections && selected.length >= field.maxSelections && !isOn;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (atCap) return;
                    const next = isOn
                      ? selected.filter((v) => v !== opt)
                      : [...selected, opt];
                    onChange(next.join(", "));
                  }}
                  aria-pressed={isOn}
                  disabled={atCap}
                  className={`px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors ${
                    atCap
                      ? "cursor-not-allowed opacity-50 bg-surface border-border-light text-text-tertiary"
                      : "cursor-pointer"
                  } ${
                    isOn || atCap
                      ? ""
                      : "bg-surface border-border-light text-text-secondary hover:border-text-tertiary hover:text-foreground"
                  }`}
                  style={
                    isOn
                      ? {
                          backgroundColor: `${checkColor}1A`,
                          borderColor: checkColor,
                          color: checkColor,
                        }
                      : undefined
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {field.maxSelections && (
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Select up to {field.maxSelections} ({selected.length}/{field.maxSelections})
            </p>
          )}
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
        <div>
          <textarea
            id={fieldId}
            name={field.name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={size === "lg" ? 5 : size === "sm" ? 3 : 4}
            placeholder={placeholder}
            style={ringStyle}
            autoFocus={autoFocus}
            maxLength={field.maxLength}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${inputClass} resize-none`}
          />
          {field.maxLength && (
            <p
              className={`text-[11px] mt-1 text-right ${
                value.length >= field.maxLength
                  ? "text-red-500 font-medium"
                  : "text-text-tertiary"
              }`}
              aria-live="polite"
            >
              {value.length} / {field.maxLength}
            </p>
          )}
        </div>
      ) : field.type === "select" ? (
        <select
          id={fieldId}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        >
          <option value="">{selectPlaceholderText(field)}</option>
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
          id={fieldId}
          name={field.name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        >
          <option value="">{selectPlaceholderText(field)}</option>
          {services?.map((svc) => (
            <option key={svc.id} value={svc.name}>
              {svc.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      ) : field.type === "signature" ? (
        <SignaturePad
          value={value}
          onChange={(dataUrl) => onChange(dataUrl)}
          invalid={!!error}
        />
      ) : field.type === "date_range" ? (
        // Two date inputs side by side; values stored as a single
        // "YYYY-MM-DD to YYYY-MM-DD" string so the existing string-based
        // submission pipeline keeps working without schema changes.
        <DateRangeInput
          fieldId={fieldId}
          value={value}
          onChange={onChange}
          ringStyle={ringStyle}
          inputClass={inputClass}
          describedBy={describedBy}
          invalid={!!error}
        />
      ) : (
        <input
          id={fieldId}
          name={field.name}
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
          autoComplete={ac}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            field.type === "url"
              ? placeholder ?? "https://"
              : placeholder
          }
          style={ringStyle}
          autoFocus={autoFocus}
          min={field.type === "number" ? field.min : undefined}
          max={field.type === "number" ? field.max : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      )}
      {field.helpText && (
        <p id={helpId} className={`${size === "sm" ? "text-[10px]" : "text-[11px]"} text-text-tertiary mt-1.5`}>{field.helpText}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[11px] text-red-600 mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

function DateRangeInput({
  fieldId,
  value,
  onChange,
  ringStyle,
  inputClass,
  describedBy,
  invalid,
}: {
  fieldId: string;
  value: string;
  onChange: (v: string) => void;
  ringStyle: React.CSSProperties;
  inputClass: string;
  describedBy?: string;
  invalid?: boolean;
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
        id={fieldId}
        type="date"
        aria-label="Start date"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        value={start}
        onChange={(e) => emit({ start: e.target.value })}
        style={ringStyle}
        className={inputClass}
      />
      <span className="text-[12px] text-text-tertiary flex-shrink-0">to</span>
      <input
        id={`${fieldId}-end`}
        type="date"
        aria-label="End date"
        aria-invalid={invalid ? true : undefined}
        value={end}
        onChange={(e) => emit({ end: e.target.value })}
        style={ringStyle}
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
  const maxFiles = allowMany ? field.maxFiles : undefined;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || preview) return;
    const list = Array.from(incoming);
    // Cap the total uploaded count when the operator set a maxFiles. Trims
    // the incoming batch so the user gets the first N rather than a hard
    // rejection of the whole drop.
    if (maxFiles && files.length >= maxFiles) {
      setError(`You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`);
      return;
    }
    const remainingSlots = maxFiles ? Math.max(0, maxFiles - files.length) : list.length;
    const trimmed = list.slice(0, remainingSlots);
    Promise.all(
      trimmed.map(
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
            ? maxFiles && files.length >= maxFiles
              ? `${files.length} of ${maxFiles} file${maxFiles === 1 ? "" : "s"} — at max`
              : `${files.length} file${files.length > 1 ? "s" : ""} selected — add another${maxFiles ? ` (max ${maxFiles})` : ""}`
            : `Click to upload${allowMany ? (maxFiles ? ` (up to ${maxFiles})` : " (multiple allowed)") : ""}`}
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

function FormHeader({ form, variant, headingFontClass = "" }: { form: RenderableForm; variant: "card" | "minimal" | "editorial"; headingFontClass?: string }) {
  const description =
    form.branding.description?.trim() || "Fill in the form and we'll be in touch.";

  if (variant === "editorial") {
    return (
      <div className="text-center mb-8">
        <h1 className={`text-[36px] sm:text-[44px] font-bold text-foreground tracking-tight leading-[1.1] ${headingFontClass}`}>
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
        <h1 className={`text-[20px] font-semibold text-foreground tracking-tight ${headingFontClass}`}>
          {form.name}
        </h1>
        <p className="text-[13px] text-text-secondary mt-1 whitespace-pre-wrap">{description}</p>
      </div>
    );
  }
  // card
  return (
    <>
      <h1 className={`text-[24px] font-bold text-foreground tracking-tight ${headingFontClass}`}>{form.name}</h1>
      <p className="text-[13px] text-text-secondary mt-1.5 whitespace-pre-wrap">{description}</p>
    </>
  );
}

// ── Error banner (shared) ─────────────────────────────

function ErrorBanner({ error, size = "md" }: { error?: string; size?: "sm" | "md" }) {
  if (!error) return null;
  // Tailwind's JIT can't generate classes from runtime template literals,
  // so the per-size classes have to be picked from a static lookup. The
  // earlier `mb-${...}`/`px-${...}` strings silently dropped to the browser
  // default, leaving the banner without spacing or sized text.
  const sizeClass =
    size === "sm"
      ? "mb-3 px-3 py-2 rounded-xl text-[11px]"
      : "mb-5 px-4 py-3 rounded-xl text-[13px]";
  return (
    <div
      role="alert"
      className={sizeClass}
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
