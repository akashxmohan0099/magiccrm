import { createClient } from "@/lib/supabase";
import type { Service, MemberService } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — Service
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Service (camelCase). */
export function mapServiceFromDB(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    duration: row.duration as number,
    price: row.price as number,
    category: (row.category as string) || undefined,
    enabled: row.enabled as boolean,
    sortOrder: (row.sort_order as number) ?? 0,
    bufferMinutes: (row.buffer_minutes as number) ?? 0,
    requiresConfirmation: (row.requires_confirmation as boolean) ?? false,
    depositType: (row.deposit_type as Service["depositType"]) ?? "none",
    depositAmount: (row.deposit_amount as number) ?? 0,
    locationType: (row.location_type as Service["locationType"]) ?? "studio",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Service (camelCase) to a Supabase-ready object (snake_case). */
function mapServiceToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description;
  if (data.duration !== undefined) row.duration = data.duration;
  if (data.price !== undefined) row.price = data.price;
  if (data.category !== undefined) row.category = data.category || null;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
  if (data.bufferMinutes !== undefined) row.buffer_minutes = data.bufferMinutes;
  if (data.requiresConfirmation !== undefined) row.requires_confirmation = data.requiresConfirmation;
  if (data.depositType !== undefined) row.deposit_type = data.depositType;
  if (data.depositAmount !== undefined) row.deposit_amount = data.depositAmount;
  if (data.locationType !== undefined) row.location_type = data.locationType;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — Service
// ---------------------------------------------------------------------------

/** Fetch all services for a workspace. */
export async function fetchServices(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapServiceFromDB);
}

/** Insert a new service row. */
export async function dbCreateService(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapServiceToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("services")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapServiceFromDB(created);
}

/** Update an existing service row. Only sends fields that are provided. */
export async function dbUpdateService(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapServiceToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("services")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a service row. */
export async function dbDeleteService(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — MemberService
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend MemberService (camelCase). */
export function mapMemberServiceFromDB(row: Record<string, unknown>): MemberService {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    serviceId: row.service_id as string,
    workspaceId: row.workspace_id as string,
  };
}

/** Convert a frontend MemberService (camelCase) to a Supabase-ready object (snake_case). */
function mapMemberServiceToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.memberId !== undefined) row.member_id = data.memberId;
  if (data.serviceId !== undefined) row.service_id = data.serviceId;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — MemberService
// ---------------------------------------------------------------------------

/** Fetch all member-service assignments for a workspace. */
export async function fetchMemberServices(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("member_services")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return (data ?? []).map(mapMemberServiceFromDB);
}

/** Insert a new member-service assignment. */
export async function dbCreateMemberService(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMemberServiceToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("member_services")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapMemberServiceFromDB(created);
}

/** Update an existing member-service assignment. */
export async function dbUpdateMemberService(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMemberServiceToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("member_services")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a member-service assignment. */
export async function dbDeleteMemberService(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("member_services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
