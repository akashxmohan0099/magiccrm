import { createAdminClient } from "@/lib/supabase-server";

interface BootstrapWorkspaceParams {
  authUserId: string;
  email: string;
  workspaceName?: string | null;
  industry?: string | null;
  persona?: string | null;
  ownerName?: string | null;
}

interface BootstrapWorkspaceResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

export async function bootstrapWorkspaceForUser({
  authUserId,
  email,
  workspaceName,
  industry,
  persona,
  ownerName,
}: BootstrapWorkspaceParams): Promise<BootstrapWorkspaceResult> {
  const admin = await createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedWorkspaceName =
    typeof workspaceName === "string" && workspaceName.trim()
      ? workspaceName.trim()
      : "My Workspace";
  const normalizedOwnerName =
    typeof ownerName === "string" && ownerName.trim()
      ? ownerName.trim()
      : normalizedEmail.split("@")[0] || "Owner";

  const { data: existingMember, error: existingMemberError } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMemberError) {
    return { success: false, error: existingMemberError.message };
  }

  if (existingMember?.workspace_id) {
    return { success: true, workspaceId: existingMember.workspace_id };
  }

  let createdWorkspaceId: string | null = null;

  try {
    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({
        name: normalizedWorkspaceName,
        industry: typeof industry === "string" && industry.trim() ? industry.trim() : null,
        persona: typeof persona === "string" && persona.trim() ? persona.trim() : null,
      })
      .select("id")
      .single();

    if (workspaceError || !workspace) {
      throw new Error(workspaceError?.message || "Failed to create workspace");
    }

    createdWorkspaceId = workspace.id;

    const { error: memberError } = await admin.from("workspace_members").insert({
      auth_user_id: authUserId,
      workspace_id: createdWorkspaceId,
      name: normalizedOwnerName,
      email: normalizedEmail,
      role: "owner",
      status: "active",
    });

    if (memberError) {
      throw new Error(memberError.message);
    }

    const { error: settingsError } = await admin.from("workspace_settings").insert({
      workspace_id: createdWorkspaceId,
    });

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    return { success: true, workspaceId: workspace.id };
  } catch (error) {
    if (createdWorkspaceId) {
      const { error: cleanupWorkspaceError } = await admin
        .from("workspaces")
        .delete()
        .eq("id", createdWorkspaceId);

      if (cleanupWorkspaceError) {
        console.error(
          "Failed to clean up workspace after bootstrap error:",
          cleanupWorkspaceError
        );
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create workspace",
    };
  }
}
