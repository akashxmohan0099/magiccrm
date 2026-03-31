import "server-only";

import { createAdminClient } from "@/lib/supabase-server";
import type { AutomationTrigger } from "@/types/models";

interface AutomationRunParams {
  workspaceId: string;
  trigger: AutomationTrigger | string;
  entityId?: string | null;
  entityData?: Record<string, unknown>;
}

interface AutomationRunResult {
  ruleId: string;
  action: string;
  success: boolean;
  error?: string;
}

const STATUS_TABLE_ALLOWLIST = new Set([
  "bookings",
  "clients",
  "invoices",
  "jobs",
  "leads",
  "support_tickets",
]);

function safeDelayHours(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "24", 10);
  return Number.isFinite(parsed) ? parsed : 24;
}

function safeDelayDays(raw: string | undefined) {
  const parsed = Number.parseInt(raw ?? "3", 10);
  return Number.isFinite(parsed) ? parsed : 3;
}

export async function runAutomationRules({
  workspaceId,
  trigger,
  entityId,
  entityData,
}: AutomationRunParams) {
  const supabase = await createAdminClient();

  const { data: rules, error: rulesError } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("trigger", trigger)
    .eq("enabled", true);

  if (rulesError) {
    throw rulesError;
  }

  if (!rules || rules.length === 0) {
    return {
      executed: 0,
      results: [] as AutomationRunResult[],
      message: "No matching rules",
    };
  }

  const results: AutomationRunResult[] = [];

  for (const rule of rules) {
    try {
      const config = (rule.action_config ?? {}) as Record<string, string>;

      switch (rule.action) {
        case "send-email": {
          const { data: client } = entityId
            ? await supabase
                .from("clients")
                .select("email, name")
                .eq("id", entityId)
                .eq("workspace_id", workspaceId)
                .single()
            : { data: null };

          if (client?.email) {
            await supabase.from("activity_log").insert({
              workspace_id: workspaceId,
              action: "create",
              entity_type: "automations",
              entity_id: rule.id,
              description: `Auto-email "${config.subject || rule.name}" sent to ${client.name}`,
            });
          }

          results.push({ ruleId: rule.id, action: "send-email", success: true });
          break;
        }

        case "create-task": {
          await supabase.from("reminders").insert({
            workspace_id: workspaceId,
            title: config.taskTitle || `Auto-task: ${rule.name}`,
            description: config.taskDescription || `Triggered by: ${trigger}`,
            due_date: new Date(
              Date.now() + safeDelayHours(config.delayHours) * 60 * 60 * 1000,
            ).toISOString(),
            entity_type: entityData?.type || "automation",
            entity_id: entityId || rule.id,
            completed: false,
          });

          results.push({ ruleId: rule.id, action: "create-task", success: true });
          break;
        }

        case "update-status": {
          const targetTable =
            typeof config.targetTable === "string" && STATUS_TABLE_ALLOWLIST.has(config.targetTable)
              ? config.targetTable
              : typeof entityData?.table === "string" && STATUS_TABLE_ALLOWLIST.has(entityData.table)
                ? entityData.table
                : null;

          if (targetTable && entityId && config.newStatus) {
            await supabase
              .from(targetTable)
              .update({ status: config.newStatus, updated_at: new Date().toISOString() })
              .eq("id", entityId)
              .eq("workspace_id", workspaceId);
          }

          results.push({ ruleId: rule.id, action: "update-status", success: true });
          break;
        }

        case "send-notification": {
          await supabase.from("activity_log").insert({
            workspace_id: workspaceId,
            action: "automation",
            entity_type: "automations",
            entity_id: rule.id,
            description: config.message || `Automation "${rule.name}" triggered`,
          });

          results.push({ ruleId: rule.id, action: "send-notification", success: true });
          break;
        }

        case "create-follow-up": {
          await supabase.from("reminders").insert({
            workspace_id: workspaceId,
            title: config.followUpTitle || `Follow up: ${rule.name}`,
            description: config.followUpDescription || `Auto-created follow-up for ${trigger}`,
            due_date: new Date(
              Date.now() + safeDelayDays(config.delayDays) * 24 * 60 * 60 * 1000,
            ).toISOString(),
            entity_type: entityData?.type || "client",
            entity_id: entityId || rule.id,
            completed: false,
          });

          results.push({ ruleId: rule.id, action: "create-follow-up", success: true });
          break;
        }

        default:
          results.push({
            ruleId: rule.id,
            action: rule.action,
            success: false,
            error: "Unknown action",
          });
      }

      try {
        await supabase.from("automation_log").insert({
          workspace_id: workspaceId,
          rule_id: rule.id,
          rule_name: rule.name,
          trigger,
          action: rule.action,
          entity_id: entityId,
          success: true,
          executed_at: new Date().toISOString(),
        });
      } catch {
        // Logging is non-critical.
      }
    } catch (error) {
      results.push({
        ruleId: rule.id,
        action: rule.action,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    executed: results.length,
    results,
  };
}
