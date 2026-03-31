import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceAccess } from "@/lib/api-auth";
import { runAutomationRules } from "@/lib/server/automation-runner";

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

    const providedSecret = req.headers.get("x-automation-secret");
    const expectedSecret = process.env.AUTOMATIONS_RUN_SECRET;
    const hasInternalAccess =
      !!expectedSecret && !!providedSecret && providedSecret === expectedSecret;

    if (!hasInternalAccess) {
      const { error: accessError } = await requireWorkspaceAccess(workspaceId, "admin");
      if (accessError) return accessError;
    }

    return NextResponse.json(
      await runAutomationRules({
        workspaceId,
        trigger,
        entityId,
        entityData,
      }),
    );
  } catch (error) {
    console.error("[Automations] Execution error:", error);
    return NextResponse.json({ error: "Automation execution failed" }, { status: 500 });
  }
}
