import { createClient } from "@/lib/supabase";
import type { AutomationRule, AutomationType, AutomationChannel } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend AutomationRule (camelCase). */
export function mapAutomationRuleFromDB(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    type: row.type as AutomationType,
    enabled: row.enabled as boolean,
    channel: row.channel as AutomationChannel,
    messageTemplate: row.message_template as string,
    timingValue: (row.timing_value as number) ?? undefined,
    timingUnit: (row.timing_unit as 'minutes' | 'hours' | 'days') || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend AutomationRule (camelCase) to a Supabase-ready object (snake_case). */
function mapAutomationRuleToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.type !== undefined) row.type = data.type;
  if (data.enabled !== undefined) row.enabled = data.enabled;
  if (data.channel !== undefined) row.channel = data.channel;
  if (data.messageTemplate !== undefined) row.message_template = data.messageTemplate;
  if (data.timingValue !== undefined) row.timing_value = data.timingValue ?? null;
  if (data.timingUnit !== undefined) row.timing_unit = data.timingUnit || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all automation rules for a workspace. */
export async function fetchAutomationRules(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapAutomationRuleFromDB);
}

/** Insert a new automation rule row. */
export async function dbCreateAutomationRule(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapAutomationRuleToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("automation_rules")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapAutomationRuleFromDB(created);
}

/** Update an existing automation rule row. Only sends fields that are provided. */
export async function dbUpdateAutomationRule(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapAutomationRuleToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("automation_rules")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete an automation rule row. */
export async function dbDeleteAutomationRule(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("automation_rules")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
