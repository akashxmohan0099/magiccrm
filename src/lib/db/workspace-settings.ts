import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// workspace_settings
// ---------------------------------------------------------------------------

/** Fetch the full workspace_settings row (onboarding, dashboard, etc.) */
export async function fetchWorkspaceSettings(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Upsert the onboarding JSONB column */
export async function saveOnboardingState(
  workspaceId: string,
  onboarding: Record<string, unknown>
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .update({ onboarding })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert the dashboard JSONB column */
export async function saveDashboardConfig(
  workspaceId: string,
  dashboard: Record<string, unknown>
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .update({ dashboard })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// workspace_modules
// ---------------------------------------------------------------------------

export interface WorkspaceModuleRow {
  module_id: string;
  enabled: boolean;
  feature_selections: unknown[];
}

/** Fetch all module rows for a workspace */
export async function fetchWorkspaceModules(
  workspaceId: string
): Promise<WorkspaceModuleRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_modules")
    .select("module_id, enabled, feature_selections")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return (data ?? []) as WorkspaceModuleRow[];
}

/** Bulk-save module selections (called after onboarding completes) */
export async function saveWorkspaceModules(
  workspaceId: string,
  modules: {
    moduleId: string;
    enabled: boolean;
    featureSelections: unknown[];
  }[]
) {
  const supabase = createClient();

  const rows = modules.map((m) => ({
    workspace_id: workspaceId,
    module_id: m.moduleId,
    enabled: m.enabled,
    feature_selections: m.featureSelections,
  }));

  const { error } = await supabase
    .from("workspace_modules")
    .upsert(rows, { onConflict: "workspace_id,module_id" });

  if (error) throw error;
}

/** Toggle a single module on/off (used by addon store) */
export async function toggleWorkspaceModule(
  workspaceId: string,
  moduleId: string,
  enabled: boolean,
  featureSelections: unknown[] = []
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_modules")
    .upsert(
      {
        workspace_id: workspaceId,
        module_id: moduleId,
        enabled,
        feature_selections: featureSelections,
      },
      { onConflict: "workspace_id,module_id" }
    );

  if (error) throw error;
}
