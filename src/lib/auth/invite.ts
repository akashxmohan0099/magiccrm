import { createAdminClient } from "@/lib/supabase-server";

interface InviteParams {
  email: string;
  name: string;
  role: "admin" | "staff";
  workspaceId: string;
}

/**
 * Invites a team member to the workspace.
 * Uses the service role key to call admin APIs — server-side only.
 *
 * Steps:
 *   1. Sends an invite email via Supabase Auth admin
 *   2. Creates a workspace_members record with status 'invited'
 */
export async function inviteTeamMember({
  email,
  name,
  role,
  workspaceId,
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

  return { success: true, memberId: member.id, authUserId };
}
