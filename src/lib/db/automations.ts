import { createClient } from "@/lib/supabase";
import type { AutomationRule, RecurringTaskTemplate } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapRuleFromDB(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    name: row.name as string,
    trigger: row.trigger as AutomationRule["trigger"],
    action: row.action as AutomationRule["action"],
    actionConfig: (row.action_config as Record<string, string>) || {},
    enabled: row.enabled as boolean,
    createdAt: row.created_at as string,
  };
}

export function mapTemplateFromDB(row: Record<string, unknown>): RecurringTaskTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    frequency: row.frequency as RecurringTaskTemplate["frequency"],
    category: row.category as string,
    taskTitle: row.task_title as string,
    isBuiltIn: row.is_built_in as boolean,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Automation Rules CRUD
// ---------------------------------------------------------------------------

export async function fetchAutomationRules(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function dbCreateRule(workspaceId: string, rule: AutomationRule) {
  const supabase = createClient();
  const { error } = await supabase.from("automation_rules").insert({
    id: rule.id,
    workspace_id: workspaceId,
    name: rule.name,
    trigger: rule.trigger,
    action: rule.action,
    action_config: rule.actionConfig,
    enabled: rule.enabled,
    created_at: rule.createdAt,
  });

  if (error) throw error;
}

export async function dbUpdateRule(
  workspaceId: string,
  id: string,
  updates: Partial<AutomationRule>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.trigger !== undefined) row.trigger = updates.trigger;
  if (updates.action !== undefined) row.action = updates.action;
  if (updates.actionConfig !== undefined) row.action_config = updates.actionConfig;
  if (updates.enabled !== undefined) row.enabled = updates.enabled;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("automation_rules")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteRule(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("automation_rules")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertRules(workspaceId: string, rules: AutomationRule[]) {
  if (rules.length === 0) return;

  const supabase = createClient();
  const rows = rules.map((r) => ({
    id: r.id,
    workspace_id: workspaceId,
    name: r.name,
    trigger: r.trigger,
    action: r.action,
    action_config: r.actionConfig,
    enabled: r.enabled,
    created_at: r.createdAt,
  }));

  const { error } = await supabase
    .from("automation_rules")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Recurring Templates CRUD
// ---------------------------------------------------------------------------

export async function fetchRecurringTemplates(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function dbCreateTemplate(
  workspaceId: string,
  template: RecurringTaskTemplate
) {
  const supabase = createClient();
  const { error } = await supabase.from("recurring_templates").insert({
    id: template.id,
    workspace_id: workspaceId,
    name: template.name,
    description: template.description,
    frequency: template.frequency,
    category: template.category,
    task_title: template.taskTitle,
    is_built_in: template.isBuiltIn,
    created_at: template.createdAt,
  });

  if (error) throw error;
}

export async function dbDeleteTemplate(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_templates")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertTemplates(
  workspaceId: string,
  templates: RecurringTaskTemplate[]
) {
  if (templates.length === 0) return;

  const supabase = createClient();
  const rows = templates.map((t) => ({
    id: t.id,
    workspace_id: workspaceId,
    name: t.name,
    description: t.description,
    frequency: t.frequency,
    category: t.category,
    task_title: t.taskTitle,
    is_built_in: t.isBuiltIn,
    created_at: t.createdAt,
  }));

  const { error } = await supabase
    .from("recurring_templates")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
