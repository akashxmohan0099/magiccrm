"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, Send } from "lucide-react";
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
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Form not found</h1>
          <p className="text-sm text-text-secondary">{error || "This form doesn&apos;t exist or has been disabled."}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card-bg border border-border-light rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: (form.branding.primaryColor || "#34D399") + "15" }}>
            <Check className="w-7 h-7" style={{ color: form.branding.primaryColor || "#34D399" }} />
          </div>
          <h2 className="text-[20px] font-bold text-foreground mb-2">Thank you!</h2>
          <p className="text-[14px] text-text-secondary">
            Your inquiry has been submitted. We&apos;ll get back to you soon.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && !values[field.name]?.trim()) {
        setError(`${field.label} is required`);
        return;
      }
    }

    try {
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
    }
  };

  const brandColor = form.branding.primaryColor || "#34D399";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card-bg border border-border-light rounded-2xl overflow-hidden">
          {/* Header with brand color */}
          <div className="h-2" style={{ backgroundColor: brandColor }} />
          <div className="p-8">
            <h1 className="text-[22px] font-bold text-foreground mb-1">{form.name}</h1>
            <p className="text-[14px] text-text-secondary mb-6">Fill out the form below and we&apos;ll be in touch.</p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {form.fields.map((field) => (
                <div key={field.name}>
                  <label className="text-[13px] font-medium text-foreground block mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.name] || ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [field.name]: e.target.value })); setError(""); }}
                      rows={4}
                      placeholder={field.label}
                      className="w-full px-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ "--tw-ring-color": brandColor + "40" } as React.CSSProperties}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={values[field.name] || ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [field.name]: e.target.value })); setError(""); }}
                      className="w-full px-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2"
                      style={{ "--tw-ring-color": brandColor + "40" } as React.CSSProperties}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "date" ? "date" : "text"}
                      value={values[field.name] || ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [field.name]: e.target.value })); setError(""); }}
                      placeholder={field.label}
                      className="w-full px-4 py-3 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2"
                      style={{ "--tw-ring-color": brandColor + "40" } as React.CSSProperties}
                    />
                  )}
                </div>
              ))}

              <button type="submit"
                className="w-full py-3.5 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ backgroundColor: brandColor }}>
                <Send className="w-4 h-4" /> Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
