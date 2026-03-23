import { createClient } from "@/lib/supabase";
import type { TeamMember, TeamShift, AvailabilitySlot } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapTeamMemberFromDB(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || undefined,
    role: row.role as TeamMember["role"],
    title: row.title as string | undefined,
    status: (row.status as TeamMember["status"]) || "active",
    avatar: row.avatar as string | undefined,
    moduleAccess: (row.module_access as string[]) || undefined,
    assignedServices: (row.assigned_services as string[]) || undefined,
    availability: (row.availability as AvailabilitySlot[]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapShiftFromDB(row: Record<string, unknown>): TeamShift {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    memberName: row.member_name as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    label: row.label as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Members CRUD — reads from workspace_members table
// ---------------------------------------------------------------------------

export async function fetchTeamMembers(workspaceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function dbCreateMember(
  workspaceId: string,
  member: TeamMember
) {
  const supabase = createClient();

  const { error } = await supabase.from("workspace_members").insert({
    id: member.id,
    workspace_id: workspaceId,
    name: member.name,
    email: member.email,
    phone: member.phone || null,
    role: member.role,
    title: member.title || null,
    status: member.status || "active",
    avatar: member.avatar || null,
    module_access: member.moduleAccess || null,
    assigned_services: member.assignedServices || null,
    availability: member.availability || null,
    created_at: member.createdAt,
    updated_at: member.updatedAt,
  });

  if (error) throw error;
}

export async function dbUpdateMember(
  workspaceId: string,
  id: string,
  updates: Partial<TeamMember>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.phone !== undefined) row.phone = updates.phone || null;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.title !== undefined) row.title = updates.title || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.avatar !== undefined) row.avatar = updates.avatar || null;
  if (updates.moduleAccess !== undefined) row.module_access = updates.moduleAccess;
  if (updates.assignedServices !== undefined)
    row.assigned_services = updates.assignedServices;
  if (updates.availability !== undefined) row.availability = updates.availability;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("workspace_members")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteMember(workspaceId: string, id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertMembers(
  workspaceId: string,
  members: TeamMember[]
) {
  if (members.length === 0) return;

  const supabase = createClient();

  const rows = members.map((m) => ({
    id: m.id,
    workspace_id: workspaceId,
    name: m.name,
    email: m.email,
    phone: m.phone || null,
    role: m.role,
    title: m.title || null,
    status: m.status || "active",
    avatar: m.avatar || null,
    module_access: m.moduleAccess || null,
    assigned_services: m.assignedServices || null,
    availability: m.availability || null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }));

  const { error } = await supabase
    .from("workspace_members")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}

export async function dbSetMemberAvailability(
  workspaceId: string,
  memberId: string,
  availability: AvailabilitySlot[]
) {
  const supabase = createClient();

  const { error } = await supabase
    .from("workspace_members")
    .update({
      availability,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Shifts CRUD — team_shifts table
// ---------------------------------------------------------------------------

export async function fetchShifts(workspaceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("team_shifts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("day_of_week", { ascending: true });

  if (error) {
    // Table might not exist yet — fail silently
    console.warn("[team] fetchShifts:", error.message);
    return [];
  }
  return data;
}

export async function dbCreateShift(
  workspaceId: string,
  shift: TeamShift
) {
  const supabase = createClient();

  const { error } = await supabase.from("team_shifts").insert({
    id: shift.id,
    workspace_id: workspaceId,
    member_id: shift.memberId,
    member_name: shift.memberName,
    day_of_week: shift.dayOfWeek,
    start_time: shift.startTime,
    end_time: shift.endTime,
    label: shift.label || null,
  });

  if (error) throw error;
}

export async function dbUpdateShift(
  workspaceId: string,
  id: string,
  updates: Partial<TeamShift>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.memberId !== undefined) row.member_id = updates.memberId;
  if (updates.memberName !== undefined) row.member_name = updates.memberName;
  if (updates.dayOfWeek !== undefined) row.day_of_week = updates.dayOfWeek;
  if (updates.startTime !== undefined) row.start_time = updates.startTime;
  if (updates.endTime !== undefined) row.end_time = updates.endTime;
  if (updates.label !== undefined) row.label = updates.label || null;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("team_shifts")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteShift(workspaceId: string, id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("team_shifts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertShifts(
  workspaceId: string,
  shifts: TeamShift[]
) {
  if (shifts.length === 0) return;

  const supabase = createClient();

  const rows = shifts.map((s) => ({
    id: s.id,
    workspace_id: workspaceId,
    member_id: s.memberId,
    member_name: s.memberName,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    label: s.label || null,
  }));

  const { error } = await supabase
    .from("team_shifts")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.warn("[team] dbUpsertShifts:", error.message);
  }
}
