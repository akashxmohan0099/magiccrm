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
import { captureHiddenFieldValues } from "@/lib/form-logic";
import { validatePublicInquirySubmission } from "@/lib/forms/public-validation";

type LoadState =
  | { status: "loading" }
  | { status: "ok"; form: PublicInquiryForm }
  | { status: "disabled" }
  | { status: "not_found" }
  | { status: "error" };

export default function InquiryFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const form = load.status === "ok" ? load.form : null;

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Capture URL params (UTMs, source, ref) into hidden fields once the
  // form definition loads. Also lets the operator pre-fill any field via
  // ?fieldName=... so personalised links can land with answers pre-set.
  // Match against multiple key shapes (raw name, label, normalized) so the
  // operator's URL doesn't have to know the internal field id.
  useEffect(() => {
    if (!form) return;
    const hidden = captureHiddenFieldValues(form.fields, searchParams);
    const prefilled: Record<string, string> = { ...hidden };
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const paramByNorm = new Map<string, string>();
    if (searchParams) {
      searchParams.forEach((v, k) => {
        if (!paramByNorm.has(norm(k))) paramByNorm.set(norm(k), v);
      });
    }
    for (const f of form.fields) {
      if (f.type === "hidden") continue;
      const direct = searchParams?.get(f.name);
      const fuzzy =
        paramByNorm.get(norm(f.name)) ??
        (f.label ? paramByNorm.get(norm(f.label)) : undefined);
      const got = direct ?? fuzzy;
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
      setLoad({ status: "loading" });
      try {
        const resolved = await resolvePublicInquiryForm(slug);
        if (cancelled) return;
        if (resolved.status === "ok") setLoad({ status: "ok", form: resolved.form });
        else setLoad({ status: resolved.status });
      } catch {
        if (!cancelled) setLoad({ status: "error" });
      }
    };

    void loadForm();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Browser tab title — generic dashboard title is wrong for a public form.
  useEffect(() => {
    if (load.status === "ok") {
      document.title = load.form.name;
    } else if (load.status === "disabled") {
      document.title = "Form unavailable";
    } else if (load.status === "not_found") {
      document.title = "Form not found";
    }
  }, [load]);

  if (load.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (load.status === "disabled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">Not accepting responses</h1>
          <p className="text-sm text-text-secondary">
            This form isn&apos;t accepting responses right now. Check back soon, or get in touch directly.
          </p>
        </div>
      </div>
    );
  }

  if (load.status === "not_found" || load.status === "error" || !form) {
    const isError = load.status === "error";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">
            {isError ? "Couldn't reach the server" : "Form not found"}
          </h1>
          <p className="text-sm text-text-secondary">
            {isError
              ? "We had trouble loading this form. Please try again in a moment."
              : "This form doesn't exist or has been removed. Double-check the link."}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (submitting) return;

    const { fieldErrors: errs, firstErrorField } = validatePublicInquirySubmission(
      form.fields,
      values,
    );
    if (firstErrorField) {
      setFieldErrors(errs);
      setError("Please fix the highlighted fields.");
      // Scroll to the first error so visitors don't need to hunt for what's wrong.
      if (typeof document !== "undefined") {
        const el = document.getElementById(`f-${firstErrorField}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el && "focus" in el) (el as HTMLElement).focus({ preventScroll: true });
      }
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setFieldErrors({});

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
          // Clear the per-field error as soon as the user starts editing the
          // offending field — feels less punitive than waiting until resubmit.
          if (fieldErrors[name]) {
            setFieldErrors((prev) => {
              const next = { ...prev };
              delete next[name];
              return next;
            });
          }
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitted={submitted}
        error={error}
        fieldErrors={fieldErrors}
        workspaceLogo={form.workspaceLogo}
        services={form.services}
        showPoweredBy
      />
    </div>
  );
}
