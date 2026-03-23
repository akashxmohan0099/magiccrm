import { createClient } from "@/lib/supabase";
import type { StorefrontConfig } from "@/types/models";

// ---------------------------------------------------------------------------
// Storefront Config — stored in workspace_settings.storefront_config JSONB
// ---------------------------------------------------------------------------

export async function fetchStorefrontConfig(workspaceId: string): Promise<StorefrontConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("storefront_config")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.storefront_config) return null;
  return data.storefront_config as StorefrontConfig;
}

export async function saveStorefrontConfig(workspaceId: string, config: StorefrontConfig) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .update({ storefront_config: config })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
