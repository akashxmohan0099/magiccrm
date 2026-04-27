// Client-only fallbacks for the public inquiry page so dev demo state
// (where forms live in local Zustand only, not Supabase) still renders
// and accepts submissions. In production these helpers fall through to
// the API path — never touched.

import type { FormFieldConfig, FormBranding } from "@/types/models";
import { useFormsStore } from "@/store/forms";
import { useInquiriesStore } from "@/store/inquiries";

export interface PublicInquiryForm {
  id: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Resolve a public inquiry form by slug. Tries the Supabase-backed API
 * first; in dev, falls back to the local Zustand forms store so seeded
 * demo forms render without needing real Supabase data.
 */
export async function resolvePublicInquiryForm(
  slug: string,
): Promise<PublicInquiryForm | null> {
  // 1. Try the real API.
  try {
    const res = await fetch(
      `/api/public/inquiry/info?slug=${encodeURIComponent(slug)}`,
    );
    if (res.ok) {
      return (await res.json()) as PublicInquiryForm;
    }
    // Non-404 errors propagate to the caller as null + caller handles UI.
    if (res.status !== 404) return null;
  } catch {
    // network blip — fall through to dev fallback
  }

  // 2. Dev-only Zustand fallback.
  if (!isDev || typeof window === "undefined") return null;
  const form = useFormsStore
    .getState()
    .forms.find(
      (f) => f.type === "inquiry" && f.enabled && f.slug === slug,
    );
  if (!form) return null;
  return {
    id: form.id,
    name: form.name,
    slug: form.slug,
    fields: form.fields,
    branding: form.branding,
  };
}

/**
 * Submit a public inquiry. Tries the API first; in dev, falls back to
 * pushing the inquiry directly into the local Zustand store so the
 * /dashboard/inquiries inbox picks it up.
 */
export async function submitPublicInquiry(
  slug: string,
  values: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // 1. Try the real API.
  try {
    const res = await fetch("/api/public/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, values }),
    });
    if (res.ok) return { ok: true };
    if (res.status !== 404) {
      const data = await res.json().catch(() => ({ error: "Failed to submit inquiry" }));
      return { ok: false, error: data.error || "Failed to submit inquiry" };
    }
  } catch {
    // network blip — fall through
  }

  // 2. Dev fallback: write to local Zustand inquiries.
  if (!isDev || typeof window === "undefined") {
    return { ok: false, error: "Failed to submit inquiry" };
  }
  // Mirror the server's honeypot behavior so dev parity stays clean.
  if (values.__hp) return { ok: true };
  const form = useFormsStore
    .getState()
    .forms.find(
      (f) => f.type === "inquiry" && f.enabled && f.slug === slug,
    );
  if (!form) return { ok: false, error: "Form not found" };

  // Strip the honeypot field — never persist it.
  const { __hp: _hp, ...submissionValues } = values;
  void _hp;

  useInquiriesStore.getState().addInquiry(
    {
      workspaceId: form.workspaceId,
      name: values.name || values.full_name || "Demo Submission",
      email: values.email || "",
      phone: values.phone || "",
      message: values.message || "",
      serviceInterest: values.service_interest,
      eventType: values.event_type,
      dateRange: values.date_range,
      source: "form",
      status: "new",
      formId: form.id,
      submissionValues,
    },
    undefined, // no workspaceId → stays local, doesn't hit Supabase
  );

  return { ok: true };
}
