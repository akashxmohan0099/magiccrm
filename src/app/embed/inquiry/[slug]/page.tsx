"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

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
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">{error || "This form doesn't exist or has been disabled."}</p>
        </div>
      </div>
    );
  }

  const brandColor = accentOverride
    ? `#${accentOverride.replace("#", "")}`
    : form.branding.primaryColor || "#34D399";

  if (submitted) {
    return (
      <div ref={containerRef} className="px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-3">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}20` }}
          >
            <Check className="w-6 h-6" style={{ color: brandColor }} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Thank you!</h2>
          <p className="text-xs text-gray-500">Your inquiry has been submitted. We&apos;ll get back to you soon.</p>
          <p className="text-[10px] text-gray-300 pt-2">Powered by Magic</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="px-2 py-4 sm:px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: brandColor }} />
          <div className="p-4 sm:p-5">
            <h1 className="text-base font-bold text-gray-900 mb-1">{form.name}</h1>
            <p className="text-xs text-gray-500 mb-4">Fill out the form and we&apos;ll be in touch.</p>

            {error && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {form.fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.name] || ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [field.name]: e.target.value })); setError(""); }}
                      rows={3}
                      placeholder={field.label}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition resize-none"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={values[field.name] || ""}
                      onChange={(e) => { setValues((v) => ({ ...v, [field.name]: e.target.value })); setError(""); }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: brandColor }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-3">
          Powered by <a href="https://usemagic.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Magic</a>
        </p>
      </div>
    </div>
  );
}
