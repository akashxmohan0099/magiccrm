import "server-only";

import { createAdminClient } from "@/lib/supabase-server";

interface ResolvedBookingWorkspace {
  workspaceId: string;
  businessName: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function resolveBookingWorkspaceBySlug(
  slug: string,
): Promise<ResolvedBookingWorkspace | null> {
  const trimmedSlug = slug.trim();
  if (!trimmedSlug) return null;

  const supabase = await createAdminClient();

  const { data: workspaceById } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", trimmedSlug)
    .maybeSingle();

  if (workspaceById) {
    return {
      workspaceId: workspaceById.id,
      businessName: workspaceById.name || "Business",
    };
  }

  const { data: settingsBySlug } = await supabase
    .from("workspace_settings")
    .select("workspace_id")
    .eq("booking_page_slug", trimmedSlug)
    .maybeSingle();

  if (settingsBySlug) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", settingsBySlug.workspace_id)
      .maybeSingle();

    return {
      workspaceId: settingsBySlug.workspace_id,
      businessName: workspace?.name || "Business",
    };
  }

  const { data: allWorkspaces } = await supabase.from("workspaces").select("id, name");
  const matchedWorkspace = (allWorkspaces ?? []).find((workspace) => {
    return slugify(workspace.name || "") === trimmedSlug.toLowerCase();
  });

  if (!matchedWorkspace) {
    return null;
  }

  return {
    workspaceId: matchedWorkspace.id,
    businessName: matchedWorkspace.name || "Business",
  };
}
