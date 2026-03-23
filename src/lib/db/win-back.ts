import { createClient } from "@/lib/supabase";
import type { WinBackRule, LapsedClient } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapWinBackRuleFromDB(row: Record<string, unknown>): WinBackRule {
  return {
    id: row.id as string,
    name: row.name as string,
    inactiveDays: row.inactive_days as number,
    messageTemplate: row.message_template as string,
    channel: row.channel as WinBackRule["channel"],
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
  };
}

export function mapLapsedClientFromDB(row: Record<string, unknown>): LapsedClient {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    lastVisitDate: row.last_visit_date as string,
    daysSinceVisit: row.days_since_visit as number,
    ruleId: row.rule_id as string,
    status: row.status as LapsedClient["status"],
    detectedAt: row.detected_at as string,
  };
}

// ---------------------------------------------------------------------------
// Rules CRUD
// ---------------------------------------------------------------------------

export async function fetchWinBackRules(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("win_back_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateWinBackRule(workspaceId: string, rule: WinBackRule) {
  const supabase = createClient();
  const { error } = await supabase.from("win_back_rules").insert({
    id: rule.id,
    workspace_id: workspaceId,
    name: rule.name,
    inactive_days: rule.inactiveDays,
    message_template: rule.messageTemplate,
    channel: rule.channel,
    enabled: rule.enabled,
    created_at: rule.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateWinBackRule(
  workspaceId: string,
  id: string,
  updates: Partial<WinBackRule>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.inactiveDays !== undefined) row.inactive_days = updates.inactiveDays;
  if (updates.messageTemplate !== undefined) row.message_template = updates.messageTemplate;
  if (updates.channel !== undefined) row.channel = updates.channel;
  if (updates.enabled !== undefined) row.enabled = updates.enabled;

  const { error } = await supabase
    .from("win_back_rules")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteWinBackRule(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("win_back_rules")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertWinBackRules(workspaceId: string, items: WinBackRule[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    name: r.name,
    inactive_days: r.inactiveDays,
    message_template: r.messageTemplate,
    channel: r.channel,
    enabled: r.enabled,
    created_at: r.createdAt,
  }));
  const { error } = await supabase.from("win_back_rules").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Lapsed Clients CRUD
// ---------------------------------------------------------------------------

export async function fetchLapsedClients(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lapsed_clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("detected_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateLapsedClient(workspaceId: string, entry: LapsedClient) {
  const supabase = createClient();
  const { error } = await supabase.from("lapsed_clients").insert({
    id: entry.id,
    workspace_id: workspaceId,
    client_id: entry.clientId,
    client_name: entry.clientName,
    last_visit_date: entry.lastVisitDate,
    days_since_visit: entry.daysSinceVisit,
    rule_id: entry.ruleId,
    status: entry.status,
    detected_at: entry.detectedAt,
  });
  if (error) throw error;
}

export async function dbUpdateLapsedClient(
  workspaceId: string,
  id: string,
  status: LapsedClient["status"]
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("lapsed_clients")
    .update({ status })
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertLapsedClients(workspaceId: string, items: LapsedClient[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    client_id: c.clientId,
    client_name: c.clientName,
    last_visit_date: c.lastVisitDate,
    days_since_visit: c.daysSinceVisit,
    rule_id: c.ruleId,
    status: c.status,
    detected_at: c.detectedAt,
  }));
  const { error } = await supabase.from("lapsed_clients").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
