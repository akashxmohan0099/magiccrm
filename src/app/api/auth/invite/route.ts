import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { inviteTeamMember } from "@/lib/auth/invite";

/**
 * POST /api/auth/invite
 * Invites a new team member to a workspace.
 *
 * Body: { email, name, role, workspaceId }
 *
 * Requires the caller to be an authenticated owner or admin of the workspace.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, role, workspaceId } = body;

    // Validate required fields
    if (!email || !name || !role || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, role, workspaceId" },
        { status: 400 }
      );
    }

    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'staff'" },
        { status: 400 }
      );
    }

    // Verify the caller is an owner or admin of the workspace
    const { data: callerMember } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!callerMember || !["owner", "admin"].includes(callerMember.role)) {
      return NextResponse.json(
        { error: "You must be a workspace owner or admin to invite members" },
        { status: 403 }
      );
    }

    // Perform the invite
    const result = await inviteTeamMember({
      email,
      name,
      role,
      workspaceId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
    });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
