import "server-only";

import type { FormFieldConfig, FormBranding } from "@/types/models";
import { createAdminClient } from "@/lib/supabase-server";
import { mapFormFromDB } from "@/lib/db/forms";

export interface PublicInquiryForm {
  id: string;
  workspaceId: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  autoPromoteToInquiry: boolean;
  /** Workspace logo from Settings. Used as a fallback when the form has no
   *  logo of its own — keeps branding uniform across forms by default. */
  workspaceLogo?: string;
  /** Live services list — powers the Service field dropdown so options stay
   *  in sync as services are added/renamed. */
  services?: { id: string; name: string }[];
}

export async function fetchPublicInquiryFormBySlug(
  slug: string,
): Promise<PublicInquiryForm | null> {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) return null;

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("forms")
    .select("id, workspace_id, type, name, fields, branding, slug, enabled, auto_promote_to_inquiry, created_at, updated_at")
    .eq("type", "inquiry")
    .eq("enabled", true)
    .ilike("slug", trimmedSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const form = mapFormFromDB(data);

  // Pull the workspace's branding logo so the public form can fall back to
  // it when no per-form logo is set. One extra small read per public load.
  const { data: settingsRow } = await supabase
    .from("workspace_settings")
    .select("branding")
    .eq("workspace_id", form.workspaceId)
    .maybeSingle();
  const workspaceLogo = (settingsRow?.branding as { logo?: string } | null)?.logo;

  // Live services for the Service field dropdown. Only enabled services are
  // exposed publicly — disabled ones shouldn't show up as bookable interests.
  const { data: servicesData } = await supabase
    .from("services")
    .select("id, name")
    .eq("workspace_id", form.workspaceId)
    .eq("enabled", true)
    .order("sort_order", { ascending: true });
  const services = (servicesData ?? []).map((s) => ({ id: s.id as string, name: s.name as string }));

  return {
    id: form.id,
    workspaceId: form.workspaceId,
    name: form.name,
    slug: form.slug,
    fields: form.fields,
    branding: form.branding,
    autoPromoteToInquiry: form.autoPromoteToInquiry,
    workspaceLogo,
    services,
  };
}
