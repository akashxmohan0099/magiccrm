import { createAdminClient } from "@/lib/supabase-server";
import type { TeamRole, TeamMemberSocialLinks, WorkingHours } from "@/types/models";

interface InviteParams {
  email: string;
  name: string;
  role: TeamRole;
  workspaceId: string;
  phone?: string;
  workingHours?: Record<string, WorkingHours>;
  daysOff?: string[];
  avatarUrl?: string;
  bio?: string;
  socialLinks?: TeamMemberSocialLinks;
  /** Absolute URL to redirect the invitee to after they click the email link. */
  redirectTo?: string;
}

/**
 * Invites a team member to the workspace.
 * Uses the service role key to call admin APIs — server-side only.
 *
 * Steps:
 *   1. Sends an invite email via Supabase Auth admin (redirects to /team/onboard)
 *   2. Creates a workspace_members record with status 'invited'
 */
export async function inviteTeamMember({
  email,
  name,
  role,
  workspaceId,
  phone,
  workingHours,
  daysOff,
  avatarUrl,
  bio,
  socialLinks,
  redirectTo,
}: InviteParams) {
  const supabase = await createAdminClient();

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: name,
        invited_to_workspace: workspaceId,
      },
      ...(redirectTo ? { redirectTo } : {}),
    }
  );

  if (inviteError) {
    return { success: false, error: inviteError.message };
  }

  const authUserId = inviteData.user.id;

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      auth_user_id: authUserId,
      workspace_id: workspaceId,
      name,
      email,
      role,
      status: "invited",
      phone: phone ?? null,
      working_hours: workingHours ?? {},
      days_off: daysOff ?? [],
      avatar_url: avatarUrl ?? null,
      bio: bio ?? null,
      social_links: socialLinks ?? {},
    })
    .select("id")
    .single();

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  return { success: true, memberId: member.id, authUserId };
}
