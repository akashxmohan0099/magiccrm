import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { bootstrapWorkspaceForUser } from "@/lib/auth/bootstrap-workspace";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { workspaceName } = body ?? {};

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await bootstrapWorkspaceForUser({
      authUserId: user.id,
      email: user.email,
      workspaceName,
    });

    if (!result.success || !result.workspaceId) {
      return NextResponse.json(
        { error: result.error || "Failed to create workspace" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, workspaceId: result.workspaceId });
  } catch (error) {
    console.error("Workspace bootstrap error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
