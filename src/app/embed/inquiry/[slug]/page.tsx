"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FormRenderer } from "@/components/forms/FormRenderer";
import {
  resolvePublicInquiryForm,
  submitPublicInquiry,
  type PublicInquiryForm,
} from "@/lib/public-inquiry-fallback";
import { captureHiddenFieldValues, isFieldVisible } from "@/lib/form-logic";

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

  // Auto-resize the iframe to match content height. ResizeObserver only
  // fires on actual layout changes — much cheaper than re-posting on every
  // React render (slides animations alone re-render dozens of times).
  useEffect(() => {
    if (typeof window === "undefined") return;
    postHeight();
    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

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

  // Capture URL params (utm_source etc.) into hidden fields, plus any
  // ?fieldName=... prefill keys, once the form definition loads.
  useEffect(() => {
    if (!form) return;
    const hidden = captureHiddenFieldValues(form.fields, searchParams);
    const prefilled: Record<string, string> = { ...hidden };
    for (const f of form.fields) {
      if (f.type === "hidden") continue;
      const got = searchParams?.get(f.name);
      if (got) prefilled[f.name] = got;
    }
    if (Object.keys(prefilled).length > 0) {
      setValues((prev) => ({ ...prefilled, ...prev }));
    }
  }, [form, searchParams]);

  const handleSubmit = async () => {
    if (!form || submitting) return;

    for (const field of form.fields) {
      if (!field.required) continue;
      if (field.type === "hidden") continue;
      if (!isFieldVisible(field, values, form.fields)) continue;
      if (!values[field.name]?.trim()) {
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

  return (
    <div ref={containerRef}>
      <FormRenderer
        form={form}
        values={values}
        onChange={(name, value) => {
          setValues((p) => ({ ...p, [name]: value }));
          setError("");
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitted={submitted}
        error={error}
        compact
        brandColorOverride={
          accentOverride ? `#${accentOverride.replace("#", "")}` : undefined
        }
        workspaceLogo={form.workspaceLogo}
        services={form.services}
        showPoweredBy
      />
    </div>
  );
}
