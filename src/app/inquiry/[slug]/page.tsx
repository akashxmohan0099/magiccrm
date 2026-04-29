"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { FormRenderer } from "@/components/forms/FormRenderer";
import {
  resolvePublicInquiryForm,
  submitPublicInquiry,
  type PublicInquiryForm,
} from "@/lib/public-inquiry-fallback";
import { captureHiddenFieldValues, isFieldVisible } from "@/lib/form-logic";

export default function InquiryFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<PublicInquiryForm | null>(null);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Capture URL params (UTMs, source, ref) into hidden fields once the
  // form definition loads. Also lets the operator pre-fill any field via
  // ?fieldName=... so personalised links can land with answers pre-set.
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

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadForm = async () => {
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

  const handleSubmit = async () => {
    if (submitting) return;

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
      setSubmitted(true);
    } catch {
      setError("Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
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
        workspaceLogo={form.workspaceLogo}
        services={form.services}
        showPoweredBy
      />
    </div>
  );
}
