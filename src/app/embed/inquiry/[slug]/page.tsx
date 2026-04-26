"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";
import type { FormFieldConfig } from "@/types/models";
import {
  resolvePublicInquiryForm,
  submitPublicInquiry,
  type PublicInquiryForm,
} from "@/lib/public-inquiry-fallback";

/** Post height to parent window so the iframe can auto-resize. */
function postHeight() {
  if (typeof window === "undefined") return;
  try {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: "magic-embed-resize", height }, "*");
  } catch {
    // cross-origin parent — ignore
  }
}

export default function EmbedInquiryFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const accentOverride = searchParams.get("accent");

  const containerRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<PublicInquiryForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // auto-resize: post height on every render and on state changes
  useEffect(() => {
    postHeight();
  });
  useEffect(() => {
    const timer = setTimeout(postHeight, 100);
    return () => clearTimeout(timer);
  }, [submitted, error, form]);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const resolved = await resolvePublicInquiryForm(slug);
        if (cancelled) return;
        if (!resolved) {
          setForm(null);
          setError("Form not found");
          return;
        }
        setForm(resolved);
      } catch {
        if (!cancelled) {
          setForm(null);
          setError("Failed to load form");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || submitting) return;

    for (const field of form.fields) {
      if (field.required && !values[field.name]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      const result = await submitPublicInquiry(slug, values);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      try {
        window.parent.postMessage({ type: "magic-embed-inquiry-submitted" }, "*");
      } catch { /* cross-origin */ }

      setSubmitted(true);
    } catch {
      setError("Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <p className="text-sm text-text-tertiary text-center">
          {error || "This form doesn't exist or has been disabled."}
        </p>
      </div>
    );
  }

  const brandColor = accentOverride
    ? `#${accentOverride.replace("#", "")}`
    : form.branding.primaryColor || "#34D399";

  if (submitted) {
    return (
      <div ref={containerRef} className="px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div
            className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: `${brandColor}1A` }}
          >
            <Check className="w-6 h-6" style={{ color: brandColor }} strokeWidth={2.5} />
          </div>
          <h2 className="text-[16px] font-bold text-foreground mb-1">Thank you!</h2>
          <p className="text-[12px] text-text-secondary">
            Your inquiry has been received. We&apos;ll be in touch shortly.
          </p>
          <p className="text-[10px] text-text-tertiary pt-3">Powered by Magic</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="px-3 py-4 sm:px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
          {/* Soft brand gradient header — matches the standalone page */}
          <div
            className="px-5 pt-5 pb-4"
            style={{
              background: `linear-gradient(180deg, ${brandColor}14 0%, transparent 100%)`,
            }}
          >
            <h1 className="text-[16px] font-bold text-foreground">{form.name}</h1>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Fill in the form and we&apos;ll be in touch.
            </p>
          </div>

          <div className="px-5 pb-5">
            {error && (
              <div
                className="mb-3 px-3 py-2 rounded-lg text-[11px]"
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {form.fields.map((field) => (
                <FieldRow
                  key={field.name}
                  field={field}
                  value={values[field.name] || ""}
                  brandColor={brandColor}
                  onChange={(v) => {
                    setValues((p) => ({ ...p, [field.name]: v }));
                    setError("");
                  }}
                />
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-white text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: brandColor }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Sending…" : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-text-tertiary mt-3">
          Powered by{" "}
          <a
            href="https://usemagic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary"
          >
            Magic
          </a>
        </p>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  brandColor,
  onChange,
}: {
  field: FormFieldConfig;
  value: string;
  brandColor: string;
  onChange: (v: string) => void;
}) {
  const ringStyle = { "--brand": brandColor } as React.CSSProperties;
  const inputClass =
    "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-[var(--brand)]";

  return (
    <div>
      <label className="block text-[11px] font-semibold text-foreground mb-1">
        {field.label}
        {field.required && (
          <span className="text-text-tertiary font-normal ml-0.5">*</span>
        )}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={field.label}
          style={ringStyle}
          className={`${inputClass} resize-none`}
        />
      ) : field.type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={ringStyle}
          className={inputClass}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
              ? "tel"
              : field.type === "date"
              ? "date"
              : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          style={ringStyle}
          className={inputClass}
        />
      )}
    </div>
  );
}
