import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { inviteTeamMember } from "@/lib/auth/invite";

/**
 * POST /api/auth/invite
 * Invites a new team member to a workspace.
 *
 * Body: { email, name, role, workspaceId, phone?, workingHours?, daysOff? }
 *
 * Requires the caller to be an authenticated owner or admin of the workspace.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, role, workspaceId, phone, workingHours, daysOff, avatarUrl, bio, socialLinks } = body;

    if (!email || !name || !role || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, role, workspaceId" },
        { status: 400 }
      );
    }

    if (!["owner", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'owner' or 'staff'" },
        { status: 400 }
      );
    }

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

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      new URL(request.url).origin;
    const redirectTo = `${origin}/auth/callback?next=/team/onboard`;

    const result = await inviteTeamMember({
      email,
      name,
      role,
      workspaceId,
      phone,
      workingHours,
      daysOff,
      avatarUrl,
      bio,
      socialLinks,
      redirectTo,
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
