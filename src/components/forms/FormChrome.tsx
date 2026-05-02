"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Send, ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import type { FormSuccessVariant } from "@/types/models";
import { splitMulti } from "@/lib/form-logic";
import type { FormRendererProps, RenderableForm } from "./renderer-types";
import {
  effectiveLogo,
  fontClassFor,
  headingFontClassFor,
  accentColorFor,
  themeFor,
} from "./renderer-helpers";
import { ThemeScope } from "./ThemeScope";

export function WelcomeView({
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
export function LogoBadge({
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

export function pickSuccessVariant(
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

export function SuccessView({ form, values, compact, brandColorOverride, showPoweredBy, workspaceLogo, preview, forceSuccessVariantId }: FormRendererProps) {
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

export function Honeypot({ values, onChange }: { values: Record<string, string>; onChange: (n: string, v: string) => void }) {
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

export function SubmitButton({
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

export function CoverImage({ src, rounded = "rounded-2xl" }: { src?: string; rounded?: string }) {
  if (!src) return null;
  return (
    <div className={`w-full overflow-hidden ${rounded}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-auto max-h-64 object-cover" />
    </div>
  );
}

// ── Common header content ─────────────────────────────

export function FormHeader({ form, variant, headingFontClass = "" }: { form: RenderableForm; variant: "card" | "minimal" | "editorial"; headingFontClass?: string }) {
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

export function ErrorBanner({ error, size = "md" }: { error?: string; size?: "sm" | "md" }) {
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

export function useSubmitHandler(props: FormRendererProps) {
  return useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (props.preview) return;
      void props.onSubmit();
    },
    [props],
  );
}

export function PoweredBy() {
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

