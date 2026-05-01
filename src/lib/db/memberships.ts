import { createClient } from "@/lib/supabase";
import type { MembershipPlan, ClientMembership, MembershipStatus } from "@/types/models";

// ── MembershipPlan ────────────────────────────────────────────────

export function mapMembershipPlanFromDB(row: Record<string, unknown>): MembershipPlan {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    serviceIds: (row.service_ids as string[] | null) ?? [],
    sessionsPerPeriod: (row.sessions_per_period as number) ?? 0,
    price: Number(row.price ?? 0),
    billingCycle: ((row.billing_cycle as MembershipPlan["billingCycle"]) ?? "monthly") as MembershipPlan["billingCycle"],
    enabled: (row.enabled as boolean | null) ?? true,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMembershipPlanToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description;
  if (data.serviceIds !== undefined) row.service_ids = data.serviceIds;
  if (data.sessionsPerPeriod !== undefined) row.sessions_per_period = data.sessionsPerPeriod;
  if (data.price !== undefined) row.price = data.price;
  if (data.billingCycle !== undefined) row.billing_cycle = data.billingCycle;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchMembershipPlans(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMembershipPlanFromDB);
}

export async function dbCreateMembershipPlan(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapMembershipPlanToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("membership_plans")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapMembershipPlanFromDB(created);
}

export async function dbUpdateMembershipPlan(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapMembershipPlanToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("membership_plans")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteMembershipPlan(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("membership_plans")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

// ── ClientMembership ──────────────────────────────────────────────

export function mapClientMembershipFromDB(row: Record<string, unknown>): ClientMembership {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    clientId: row.client_id as string,
    planId: row.plan_id as string,
    status: ((row.status as MembershipStatus) ?? "active") as MembershipStatus,
    sessionsUsed: (row.sessions_used as number) ?? 0,
    currentPeriodStart: row.current_period_start as string,
    nextRenewalDate: (row.next_renewal_date as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapClientMembershipToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.planId !== undefined) row.plan_id = data.planId;
  if (data.status !== undefined) row.status = data.status;
  if (data.sessionsUsed !== undefined) row.sessions_used = data.sessionsUsed;
  if (data.currentPeriodStart !== undefined) row.current_period_start = data.currentPeriodStart;
  if (data.nextRenewalDate !== undefined) row.next_renewal_date = data.nextRenewalDate || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchClientMemberships(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("client_memberships")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []).map(mapClientMembershipFromDB);
}

export async function dbCreateClientMembership(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapClientMembershipToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("client_memberships")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapClientMembershipFromDB(created);
}

export async function dbUpdateClientMembership(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapClientMembershipToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("client_memberships")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
