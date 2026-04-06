import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createPortalToken } from "@/lib/portal-tokens";

/**
 * GET /api/portal/link?accessId=xxx
 * Returns a signed portal URL for a given portal_access row.
 * Requires authentication + workspace membership.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const accessId = req.nextUrl.searchParams.get("accessId");
    if (!accessId) {
      return NextResponse.json({ error: "Missing accessId" }, { status: 400 });
    }

    // Verify portal_access exists and user belongs to the workspace
    const { data: access } = await supabase
      .from("portal_access")
      .select("id, workspace_id")
      .eq("id", accessId)
      .single();

    if (!access) {
      return NextResponse.json({ error: "Portal access not found" }, { status: 404 });
    }

    // Verify user belongs to workspace
    const { data: member } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", access.workspace_id)
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = createPortalToken(accessId);
    const origin = req.nextUrl.origin;
    const url = `${origin}/portal/${encodeURIComponent(token)}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Portal Link Error]", error);
    return NextResponse.json({ error: "Failed to generate portal link" }, { status: 500 });
  }
}
