"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, Send, ArrowRight } from "lucide-react";
import type { FormFieldConfig } from "@/types/models";

interface PublicInquiryForm {
  id: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: {
    logo?: string;
    primaryColor?: string;
    accentColor?: string;
  };
}

export default function InquiryFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<PublicInquiryForm | null>(null);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadForm = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/public/inquiry/info?slug=${encodeURIComponent(slug)}`);
        const data = await res.json().catch(() => ({ error: "Form not found" }));

        if (cancelled) return;

        if (!res.ok) {
          setForm(null);
          setError(data.error || "Form not found");
          return;
        }

        setForm(data);
      } catch {
        if (!cancelled) {
          setForm(null);
          setError("Failed to load form");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Form not found</h1>
          <p className="text-sm text-text-secondary">{error || "This form doesn't exist or has been disabled."}</p>
        </div>
      </div>
    );
  }

  const brandColor = form.branding.primaryColor || "#34D399";

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
        }}
      >
        <div className="w-full max-w-md bg-card-bg border border-border-light rounded-3xl p-10 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.08)]">
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
          <p className="text-[14px] text-text-secondary leading-relaxed">
            Your inquiry has been received. We&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !values[field.name]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/public/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, values }),
      });

      const data = await res.json().catch(() => ({ error: "Failed to submit inquiry" }));
      if (!res.ok) {
        setError(data.error || "Failed to submit inquiry");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${brandColor}1A, transparent 65%), var(--background)`,
      }}
    >
      <div className="w-full max-w-lg">
        <div className="bg-card-bg border border-border-light rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.08)]">
          {/* Branded header — soft gradient instead of a flat bar */}
          <div
            className="px-8 pt-8 pb-6 relative"
            style={{
              background: `linear-gradient(180deg, ${brandColor}14 0%, transparent 100%)`,
            }}
          >
            <h1 className="text-[24px] font-bold text-foreground tracking-tight">{form.name}</h1>
            <p className="text-[13px] text-text-secondary mt-1.5">
              Fill in the form and we&apos;ll be in touch.
            </p>
          </div>

          <div className="px-8 pb-8">
            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-xl text-[13px]"
                style={{
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                className="group w-full py-3.5 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <Send className="w-4 h-4" /> Submit Inquiry
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

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
  // Focus border uses the form's brand color as a CSS variable so every
  // input picks up the same accent regardless of the form's color choice.
  const ringStyle = { "--brand": brandColor } as React.CSSProperties;
  const inputClass =
    "w-full px-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary outline-none transition-colors focus:border-[var(--brand)]";

  return (
    <div>
      <label className="text-[12px] font-semibold text-foreground block mb-1.5">
        {field.label}
        {field.required && (
          <span className="text-text-tertiary font-normal ml-1">*</span>
        )}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
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
