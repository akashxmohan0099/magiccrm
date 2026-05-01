import { createClient } from "@/lib/supabase";
import type { TeamMember } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend TeamMember (camelCase). */
export function mapTeamMemberFromDB(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    authUserId: row.auth_user_id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || undefined,
    role: row.role as import("@/types/models").TeamRole,
    avatarUrl: (row.avatar_url as string) || undefined,
    bio: (row.bio as string) || undefined,
    socialLinks: (row.social_links as import("@/types/models").TeamMemberSocialLinks) || undefined,
    status: row.status as import("@/types/models").MemberStatus,
    workingHours: (row.working_hours ?? {}) as Record<string, import("@/types/models").WorkingHours>,
    daysOff: (row.days_off ?? []) as string[],
    leavePeriods: (row.leave_periods ?? []) as import("@/types/models").LeavePeriod[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend TeamMember (camelCase) to a Supabase-ready object (snake_case). */
function mapTeamMemberToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.authUserId !== undefined) row.auth_user_id = data.authUserId;
  if (data.name !== undefined) row.name = data.name;
  if (data.email !== undefined) row.email = data.email;
  if (data.phone !== undefined) row.phone = data.phone || null;
  if (data.role !== undefined) row.role = data.role;
  if (data.avatarUrl !== undefined) row.avatar_url = data.avatarUrl || null;
  if (data.bio !== undefined) row.bio = data.bio || null;
  if (data.socialLinks !== undefined) row.social_links = data.socialLinks || {};
  if (data.status !== undefined) row.status = data.status;
  if (data.workingHours !== undefined) row.working_hours = data.workingHours;
  if (data.daysOff !== undefined) row.days_off = data.daysOff;
  if (data.leavePeriods !== undefined) row.leave_periods = data.leavePeriods;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all team members for a workspace. */
export async function fetchTeamMembers(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapTeamMemberFromDB);
}

/** Insert a new team member row. */
export async function dbCreateTeamMember(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapTeamMemberToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("workspace_members")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapTeamMemberFromDB(created);
}

/** Update an existing team member row. Only sends fields that are provided. */
export async function dbUpdateTeamMember(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapTeamMemberToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("workspace_members")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a team member row. */
export async function dbDeleteTeamMember(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
