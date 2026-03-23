import { createClient } from "@/lib/supabase";
import type { LoyaltyTransaction, ReferralCode } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapTransactionFromDB(row: Record<string, unknown>): LoyaltyTransaction {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    type: row.type as LoyaltyTransaction["type"],
    points: row.points as number,
    description: (row.description as string) || "",
    createdAt: row.created_at as string,
  };
}

export function mapReferralFromDB(row: Record<string, unknown>): ReferralCode {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    code: row.code as string,
    timesUsed: (row.times_used as number) ?? 0,
    rewardPoints: row.reward_points as number,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Transactions CRUD
// ---------------------------------------------------------------------------

export async function fetchLoyaltyTransactions(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateTransaction(workspaceId: string, tx: LoyaltyTransaction) {
  const supabase = createClient();
  const { error } = await supabase.from("loyalty_transactions").insert({
    id: tx.id,
    workspace_id: workspaceId,
    client_id: tx.clientId,
    client_name: tx.clientName,
    type: tx.type,
    points: tx.points,
    description: tx.description,
    created_at: tx.createdAt,
  });
  if (error) throw error;
}

export async function dbUpsertTransactions(workspaceId: string, items: LoyaltyTransaction[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((tx) => ({
    id: tx.id,
    workspace_id: workspaceId,
    client_id: tx.clientId,
    client_name: tx.clientName,
    type: tx.type,
    points: tx.points,
    description: tx.description,
    created_at: tx.createdAt,
  }));
  const { error } = await supabase.from("loyalty_transactions").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Referral Codes CRUD
// ---------------------------------------------------------------------------

export async function fetchReferralCodes(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("referral_codes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateReferralCode(workspaceId: string, code: ReferralCode) {
  const supabase = createClient();
  const { error } = await supabase.from("referral_codes").insert({
    id: code.id,
    workspace_id: workspaceId,
    client_id: code.clientId,
    client_name: code.clientName,
    code: code.code,
    times_used: code.timesUsed,
    reward_points: code.rewardPoints,
    created_at: code.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateReferralCode(
  workspaceId: string,
  code: string,
  timesUsed: number
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("referral_codes")
    .update({ times_used: timesUsed })
    .eq("workspace_id", workspaceId)
    .eq("code", code);
  if (error) throw error;
}

export async function dbUpsertReferralCodes(workspaceId: string, items: ReferralCode[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    client_id: c.clientId,
    client_name: c.clientName,
    code: c.code,
    times_used: c.timesUsed,
    reward_points: c.rewardPoints,
    created_at: c.createdAt,
  }));
  const { error } = await supabase.from("referral_codes").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
