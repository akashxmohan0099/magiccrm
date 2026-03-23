import { createClient } from "@/lib/supabase";
import type { PortalConfig, PortalAccess } from "@/types/models";

// ---------------------------------------------------------------------------
// Portal Config — stored in workspace_settings.portal_config JSONB
// ---------------------------------------------------------------------------

export async function fetchPortalConfig(workspaceId: string): Promise<PortalConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("portal_config")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.portal_config) return null;
  return data.portal_config as PortalConfig;
}

export async function savePortalConfig(workspaceId: string, config: PortalConfig) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .update({ portal_config: config })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Portal Access — separate table
// ---------------------------------------------------------------------------

export function mapPortalAccessFromDB(row: Record<string, unknown>): PortalAccess {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    email: row.email as string,
    lastLoginAt: (row.last_login_at as string) || undefined,
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchPortalAccess(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("portal_access")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreatePortalAccess(workspaceId: string, access: PortalAccess) {
  const supabase = createClient();
  const { error } = await supabase.from("portal_access").insert({
    id: access.id,
    workspace_id: workspaceId,
    client_id: access.clientId,
    client_name: access.clientName,
    email: access.email,
    last_login_at: access.lastLoginAt || null,
    enabled: access.enabled,
    created_at: access.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdatePortalAccess(
  workspaceId: string,
  id: string,
  updates: Partial<PortalAccess>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};

  if (updates.enabled !== undefined) row.enabled = updates.enabled;
  if (updates.lastLoginAt !== undefined) row.last_login_at = updates.lastLoginAt || null;

  const { error } = await supabase
    .from("portal_access")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeletePortalAccess(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("portal_access")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertPortalAccess(workspaceId: string, items: PortalAccess[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((a) => ({
    id: a.id,
    workspace_id: workspaceId,
    client_id: a.clientId,
    client_name: a.clientName,
    email: a.email,
    last_login_at: a.lastLoginAt || null,
    enabled: a.enabled,
    created_at: a.createdAt,
  }));
  const { error } = await supabase.from("portal_access").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
