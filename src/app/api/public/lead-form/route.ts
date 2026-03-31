import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { generateId } from "@/lib/id";
import { runAutomationRules } from "@/lib/server/automation-runner";

/**
 * Public lead-capture endpoint. No auth required.
 *
 * POST /api/public/lead-form
 * Body: { workspaceId, name, email, phone?, source?, message?, formId? }
 *
 * Creates a lead row in Supabase with status "open" and stage "new",
 * then fires the "lead-created" automation trigger for the workspace.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`lead-form:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { workspaceId, name, email, phone, source, message, formId } = body;

    // ---- validation ----
    if (!workspaceId || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, name, email" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // ---- verify the workspace exists ----
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // ---- create the lead ----
    const now = new Date().toISOString();
    const leadId = generateId();

    const { error: insertErr } = await supabase.from("leads").insert({
      id: leadId,
      workspace_id: workspaceId,
      name,
      email,
      phone: phone || "",
      source: source || "web-form",
      stage: "new",
      value: null,
      notes: message || "",
      client_id: null,
      last_contacted_at: null,
      next_follow_up_date: null,
      created_at: now,
      updated_at: now,
      ...(formId ? { form_id: formId } : {}),
    });

    if (insertErr) {
      console.error("[lead-form] Insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    // ---- log activity (non-critical) ----
    try {
      await supabase.from("activity_log").insert({
        workspace_id: workspaceId,
        action: "create",
        entity_type: "leads",
        entity_id: leadId,
        description: `Web form lead: "${name}" (${email})`,
      });
    } catch {
      // activity logging is non-critical
    }

    // ---- fire automation trigger ----
    try {
      await runAutomationRules({
        workspaceId,
        trigger: "lead-created",
        entityId: leadId,
        entityData: { type: "lead", table: "leads", name, email },
      });
    } catch {
      // Automation failures should not block the lead creation response
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: "Thank you! Your enquiry has been received.",
    });
  } catch (error) {
    console.error("[lead-form] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
