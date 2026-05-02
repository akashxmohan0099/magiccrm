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
import {
  prepareSubmission,
  sanitiseAgainstForm,
} from "@/lib/forms/sanitise-public-submission";

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

export type ResolveResult =
  | { status: "ok"; form: PublicInquiryForm }
  | { status: "disabled" }
  | { status: "not_found" };

/**
 * Resolve a public inquiry form by slug. Tries the Supabase-backed API
 * first; in dev, falls back to the local Zustand forms store so seeded
 * demo forms render without needing real Supabase data.
 *
 * - status="ok" + form on 200.
 * - status="disabled" on 410 — form exists but the operator turned it off.
 * - status="not_found" on 404 + nothing matched in the dev fallback.
 * - Throws on network failures and 5xx so the page can distinguish
 *   "form doesn't exist" from "server is broken" and show the right message.
 */
export async function resolvePublicInquiryForm(
  slug: string,
): Promise<ResolveResult> {
  let serverFailure = false;
  try {
    const res = await fetch(
      `/api/public/inquiry/info?slug=${encodeURIComponent(slug)}`,
    );
    if (res.ok) {
      const form = (await res.json()) as PublicInquiryForm;
      return { status: "ok", form };
    }
    if (res.status === 410) {
      return { status: "disabled" };
    }
    if (res.status === 409) {
      throw new Error("Form slug is not unique");
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
  // Loud-log when this path activates: production never hits it (the isDev
  // guard short-circuits), but during QA the silent fallback was masking
  // real API failures and a missed slug. Loud is better than clever here.
  if (isDev && typeof window !== "undefined") {
    const allMatch = useFormsStore
      .getState()
      .forms.find((f) => f.type === "inquiry" && f.slug === slug);
    if (allMatch && !allMatch.enabled) {
      console.warn(
        `[public-inquiry] DEV FALLBACK serving "${slug}" from local Zustand — ` +
          "form is disabled. The API would return 410. This warning will not " +
          "fire in production.",
      );
      return { status: "disabled" };
    }
    const form = allMatch && allMatch.enabled ? allMatch : null;
    if (form) {
      console.info(
        `[public-inquiry] DEV FALLBACK serving "${slug}" from local Zustand. ` +
          "This usually means it's a seeded demo form (workspace_id=seed-workspace) " +
          "that never reached Supabase by design. Forms created via the editor " +
          "with a real workspace_id DO persist to Supabase. This message is " +
          "dev-only and will never fire in production.",
      );
      const settings = useSettingsStore.getState().settings;
      const services = useServicesStore
        .getState()
        .services.filter((s) => s.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ id: s.id, name: s.name }));
      return {
        status: "ok",
        form: {
          id: form.id,
          name: form.name,
          slug: form.slug,
          fields: form.fields,
          branding: form.branding,
          autoPromoteToInquiry: form.autoPromoteToInquiry,
          workspaceLogo: settings?.branding?.logo,
          services,
        },
      };
    }
  }

  if (serverFailure) {
    throw new Error("Failed to load form");
  }
  return { status: "not_found" };
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

  // Same two-phase pipeline as the production route. Step (1) is pure and
  // doesn't need form fields, so we honeypot-check and key-strip before
  // looking up the form — matching prod's "no DB read on bot hits" shape.
  const prepared = prepareSubmission(values);
  if (prepared.kind === "honeypot") return { ok: true };

  const form = useFormsStore
    .getState()
    .forms.find(
      (f) => f.type === "inquiry" && f.enabled && f.slug === slug,
    );
  if (!form) return { ok: false, error: "Form not found" };
  console.warn(
    `[public-inquiry] DEV FALLBACK accepting submission for "${slug}" into ` +
      "local Zustand — the real /api/public/inquiry call did not succeed. " +
      "This warning will not fire in production.",
  );

  // Step (2): whitelist + drop hidden + validators. Identical to prod.
  const sanitised = sanitiseAgainstForm(form.fields, prepared.values);
  if (!sanitised.ok) {
    return { ok: false, error: sanitised.error };
  }
  const submissionValues = sanitised.values;

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
