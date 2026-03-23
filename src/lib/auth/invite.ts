import { createAdminClient } from "@/lib/supabase-server";

interface InviteParams {
  email: string;
  name: string;
  role: "admin" | "staff";
  workspaceId: string;
  moduleAccess?: string[];
}

/**
 * Invites a team member to the workspace.
 * Uses the service role key to call admin APIs — server-side only.
 *
 * Steps:
 *   1. Sends an invite email via Supabase Auth admin
 *   2. Creates a workspace_members record with status 'invited'
 *   3. Creates member_module_permissions records for granted modules
 */
export async function inviteTeamMember({
  email,
  name,
  role,
  workspaceId,
  moduleAccess,
}: InviteParams) {
  const supabase = await createAdminClient();

  // 1. Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: name,
        invited_to_workspace: workspaceId,
      },
    }
  );

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  const authUserId = inviteData.user.id;

  // 2. Create workspace_members record
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      auth_user_id: authUserId,
      workspace_id: workspaceId,
      name,
      email,
      role,
      status: "invited",
    })
    .select("id")
    .single();

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  // 3. Create module permissions (if moduleAccess provided and role is staff)
  if (moduleAccess && moduleAccess.length > 0 && member) {
    const permissionRows = moduleAccess.map((moduleId) => ({
      member_id: member.id,
      module_id: moduleId,
      can_view: true,
      can_edit: true,
      can_delete: false,
    }));

    const { error: permError } = await supabase
      .from("member_module_permissions")
      .insert(permissionRows);

    if (permError) {
      // Non-critical — the member is created, permissions can be set later
      console.warn("Failed to create module permissions:", permError.message);
    }
  }

  return { success: true, memberId: member.id, authUserId };
}
