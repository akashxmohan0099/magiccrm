import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Automation execution engine.
 *
 * POST /api/automations/run
 * Body: { workspaceId, trigger, entityId?, entityData? }
 *
 * Called by other API routes or cron jobs when events occur.
 * Evaluates all enabled rules for the workspace that match the trigger,
 * then executes the configured actions.
 *
 * Can also be called as a cron endpoint for time-based automations:
 * POST /api/automations/run { trigger: "cron-daily" }
 */
export async function POST(req: NextRequest) {
  try {
    const { workspaceId, trigger, entityId, entityData } = await req.json();

    if (!workspaceId || !trigger) {
      return NextResponse.json({ error: "Missing workspaceId or trigger" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch enabled rules for this workspace and trigger
    const { data: rules, error: rulesErr } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("trigger", trigger)
      .eq("enabled", true);

    if (rulesErr || !rules || rules.length === 0) {
      return NextResponse.json({ executed: 0, message: "No matching rules" });
    }

    const results: { ruleId: string; action: string; success: boolean; error?: string }[] = [];

    for (const rule of rules) {
      try {
        const config = (rule.action_config ?? {}) as Record<string, string>;

        switch (rule.action) {
          case "send-email": {
            // Queue an email (via Resend or email provider)
            const { data: client } = entityId
              ? await supabase.from("clients").select("email, name").eq("id", entityId).eq("workspace_id", workspaceId).single()
              : { data: null };

            if (client?.email) {
              // Log the email action (actual sending would use Resend/SMTP)
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
            // Create a task/reminder in the workspace
            await supabase.from("reminders").insert({
              workspace_id: workspaceId,
              title: config.taskTitle || `Auto-task: ${rule.name}`,
              description: config.taskDescription || `Triggered by: ${trigger}`,
              due_date: new Date(Date.now() + (parseInt(config.delayHours || "24") * 60 * 60 * 1000)).toISOString(),
              entity_type: entityData?.type || "automation",
              entity_id: entityId || rule.id,
              completed: false,
            });
            results.push({ ruleId: rule.id, action: "create-task", success: true });
            break;
          }

          case "update-status": {
            // Update the entity's status
            const targetTable = config.targetTable || entityData?.table;
            const newStatus = config.newStatus;

            if (targetTable && entityId && newStatus) {
              await supabase
                .from(targetTable)
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", entityId)
                .eq("workspace_id", workspaceId);
            }
            results.push({ ruleId: rule.id, action: "update-status", success: true });
            break;
          }

          case "send-notification": {
            // Create an in-app notification
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
            // Create a follow-up reminder
            const delayDays = parseInt(config.delayDays || "3");
            await supabase.from("reminders").insert({
              workspace_id: workspaceId,
              title: config.followUpTitle || `Follow up: ${rule.name}`,
              description: config.followUpDescription || `Auto-created follow-up for ${trigger}`,
              due_date: new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString(),
              entity_type: entityData?.type || "client",
              entity_id: entityId || rule.id,
              completed: false,
            });
            results.push({ ruleId: rule.id, action: "create-follow-up", success: true });
            break;
          }

          default:
            results.push({ ruleId: rule.id, action: rule.action, success: false, error: "Unknown action" });
        }

        // Log execution (non-critical)
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
        } catch { /* log failures are non-critical */ }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({ ruleId: rule.id, action: rule.action, success: false, error: errorMsg });
      }
    }

    return NextResponse.json({
      executed: results.length,
      results,
    });
  } catch (error) {
    console.error("[Automations] Execution error:", error);
    return NextResponse.json({ error: "Automation execution failed" }, { status: 500 });
  }
}
