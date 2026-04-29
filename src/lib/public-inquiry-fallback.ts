// Client-only fallbacks for the public inquiry page so dev demo state
// (where forms live in local Zustand only, not Supabase) still renders
// and accepts submissions. In production these helpers fall through to
// the API path — never touched.

import type { FormFieldConfig, FormBranding } from "@/types/models";
import { useFormsStore } from "@/store/forms";
import { useInquiriesStore } from "@/store/inquiries";
import { useFormResponsesStore } from "@/store/form-responses";
import { useSettingsStore } from "@/store/settings";
import { useServicesStore } from "@/store/services";
import { extractContactFromValues } from "@/lib/form-response-extract";

export interface PublicInquiryForm {
  id: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  autoPromoteToInquiry: boolean;
  /** Workspace logo from Settings. Falls back when the form has no logo. */
  workspaceLogo?: string;
  /** Live workspace services for the Service field dropdown. */
  services?: { id: string; name: string }[];
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Resolve a public inquiry form by slug. Tries the Supabase-backed API
 * first; in dev, falls back to the local Zustand forms store so seeded
 * demo forms render without needing real Supabase data.
 *
 * - Returns the form on 200.
 * - Returns null only when the form is genuinely not found (404 + nothing
 *   matched in the dev fallback).
 * - Throws on network failures and 5xx so the page can distinguish "form
 *   doesn't exist" from "server is broken" and show the right message.
 */
export async function resolvePublicInquiryForm(
  slug: string,
): Promise<PublicInquiryForm | null> {
  let serverFailure = false;
  try {
    const res = await fetch(
      `/api/public/inquiry/info?slug=${encodeURIComponent(slug)}`,
    );
    if (res.ok) {
      return (await res.json()) as PublicInquiryForm;
    }
    if (res.status !== 404) {
      // 5xx, 429, etc. — try the dev fallback before surfacing the failure.
      serverFailure = true;
    }
  } catch {
    // Network blip — try dev fallback before surfacing the failure.
    serverFailure = true;
  }

  // Dev-only Zustand fallback so seeded demo forms render without Supabase.
  if (isDev && typeof window !== "undefined") {
    const form = useFormsStore
      .getState()
      .forms.find(
        (f) => f.type === "inquiry" && f.enabled && f.slug === slug,
      );
    if (form) {
      const settings = useSettingsStore.getState().settings;
      const services = useServicesStore
        .getState()
        .services.filter((s) => s.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ id: s.id, name: s.name }));
      return {
        id: form.id,
        name: form.name,
        slug: form.slug,
        fields: form.fields,
        branding: form.branding,
        autoPromoteToInquiry: form.autoPromoteToInquiry,
        workspaceLogo: settings?.branding?.logo,
        services,
      };
    }
  }

  if (serverFailure) {
    throw new Error("Failed to load form");
  }
  return null;
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

  const contact = extractContactFromValues(submissionValues, form.fields);

  // Always log the form response. Dev fallback never has a workspaceId so
  // everything stays local; addFormResponse skips the Supabase write.
  const response = useFormResponsesStore.getState().addFormResponse(
    {
      workspaceId: form.workspaceId,
      formId: form.id,
      values: submissionValues,
      contactName: contact.name,
      contactEmail: contact.email ?? undefined,
      contactPhone: contact.phone ?? undefined,
    },
    undefined,
  );

  if (form.autoPromoteToInquiry) {
    const inquiry = useInquiriesStore.getState().addInquiry(
      {
        workspaceId: form.workspaceId,
        name: contact.name,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        message: contact.message,
        serviceInterest: contact.serviceInterest ?? undefined,
        eventType: contact.eventType ?? undefined,
        dateRange: contact.dateRange ?? undefined,
        source: "form",
        status: "new",
        formId: form.id,
        formResponseId: response.id,
        submissionValues,
      },
      undefined,
    );
    useFormResponsesStore.getState().updateFormResponse(response.id, {
      inquiryId: inquiry.id,
    });
  }

  return { ok: true };
}
