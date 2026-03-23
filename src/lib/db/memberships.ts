import { createClient } from "@/lib/supabase";
import type { MembershipPlan, Membership } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapPlanFromDB(row: Record<string, unknown>): MembershipPlan {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    price: row.price as number,
    interval: row.interval as MembershipPlan["interval"],
    sessionsIncluded: (row.sessions_included as number) ?? undefined,
    unlimitedSessions: (row.unlimited_sessions as boolean) ?? false,
    active: row.active as boolean,
    createdAt: row.created_at as string,
  };
}

export function mapMembershipFromDB(row: Record<string, unknown>): Membership {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
    planName: row.plan_name as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    status: row.status as Membership["status"],
    startDate: row.start_date as string,
    nextBillingDate: row.next_billing_date as string,
    sessionsUsed: (row.sessions_used as number) ?? 0,
    sessionsTotal: (row.sessions_total as number) ?? undefined,
    autoRenew: (row.auto_renew as boolean) ?? undefined,
    renewalDate: (row.renewal_date as string) || undefined,
    cancellationReason: (row.cancellation_reason as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Plans CRUD
// ---------------------------------------------------------------------------

export async function fetchMembershipPlans(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreatePlan(workspaceId: string, plan: MembershipPlan) {
  const supabase = createClient();
  const { error } = await supabase.from("membership_plans").insert({
    id: plan.id,
    workspace_id: workspaceId,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    interval: plan.interval,
    sessions_included: plan.sessionsIncluded ?? null,
    unlimited_sessions: plan.unlimitedSessions ?? false,
    active: plan.active,
    created_at: plan.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdatePlan(
  workspaceId: string,
  id: string,
  updates: Partial<MembershipPlan>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.price !== undefined) row.price = updates.price;
  if (updates.interval !== undefined) row.interval = updates.interval;
  if (updates.sessionsIncluded !== undefined) row.sessions_included = updates.sessionsIncluded ?? null;
  if (updates.unlimitedSessions !== undefined) row.unlimited_sessions = updates.unlimitedSessions;
  if (updates.active !== undefined) row.active = updates.active;

  const { error } = await supabase
    .from("membership_plans")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeletePlan(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("membership_plans")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertPlans(workspaceId: string, items: MembershipPlan[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    name: p.name,
    description: p.description,
    price: p.price,
    interval: p.interval,
    sessions_included: p.sessionsIncluded ?? null,
    unlimited_sessions: p.unlimitedSessions ?? false,
    active: p.active,
    created_at: p.createdAt,
  }));
  const { error } = await supabase.from("membership_plans").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Memberships CRUD
// ---------------------------------------------------------------------------

export async function fetchMemberships(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateMembership(workspaceId: string, m: Membership) {
  const supabase = createClient();
  const { error } = await supabase.from("memberships").insert({
    id: m.id,
    workspace_id: workspaceId,
    plan_id: m.planId,
    plan_name: m.planName,
    client_id: m.clientId,
    client_name: m.clientName,
    status: m.status,
    start_date: m.startDate,
    next_billing_date: m.nextBillingDate,
    sessions_used: m.sessionsUsed,
    sessions_total: m.sessionsTotal ?? null,
    auto_renew: m.autoRenew ?? null,
    renewal_date: m.renewalDate || null,
    cancellation_reason: m.cancellationReason || null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  });
  if (error) throw error;
}

export async function dbUpdateMembership(
  workspaceId: string,
  id: string,
  updates: Partial<Membership>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.planId !== undefined) row.plan_id = updates.planId;
  if (updates.planName !== undefined) row.plan_name = updates.planName;
  if (updates.clientId !== undefined) row.client_id = updates.clientId;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.startDate !== undefined) row.start_date = updates.startDate;
  if (updates.nextBillingDate !== undefined) row.next_billing_date = updates.nextBillingDate;
  if (updates.sessionsUsed !== undefined) row.sessions_used = updates.sessionsUsed;
  if (updates.sessionsTotal !== undefined) row.sessions_total = updates.sessionsTotal ?? null;
  if (updates.autoRenew !== undefined) row.auto_renew = updates.autoRenew;
  if (updates.renewalDate !== undefined) row.renewal_date = updates.renewalDate || null;
  if (updates.cancellationReason !== undefined) row.cancellation_reason = updates.cancellationReason || null;

  const { error } = await supabase
    .from("memberships")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteMembership(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertMemberships(workspaceId: string, items: Membership[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((m) => ({
    id: m.id,
    workspace_id: workspaceId,
    plan_id: m.planId,
    plan_name: m.planName,
    client_id: m.clientId,
    client_name: m.clientName,
    status: m.status,
    start_date: m.startDate,
    next_billing_date: m.nextBillingDate,
    sessions_used: m.sessionsUsed,
    sessions_total: m.sessionsTotal ?? null,
    auto_renew: m.autoRenew ?? null,
    renewal_date: m.renewalDate || null,
    cancellation_reason: m.cancellationReason || null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }));
  const { error } = await supabase.from("memberships").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
