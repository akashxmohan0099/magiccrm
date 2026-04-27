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
}

export async function fetchPublicInquiryFormBySlug(
  slug: string,
): Promise<PublicInquiryForm | null> {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) return null;

  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("forms")
    .select("id, workspace_id, type, name, fields, branding, slug, enabled, created_at, updated_at")
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
  return {
    id: form.id,
    workspaceId: form.workspaceId,
    name: form.name,
    slug: form.slug,
    fields: form.fields,
    branding: form.branding,
  };
}
