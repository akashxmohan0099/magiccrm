import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { bootstrapWorkspaceForUser } from "@/lib/auth/bootstrap-workspace";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`signup:${ip}`, 5, 300_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again in a few minutes." }, { status: 429 });
  }

  let createdUserId: string | null = null;

  try {
    const {
      email,
      password,
      workspaceName,
      industry,
      persona,
    } = await req.json();

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedWorkspaceName =
      typeof workspaceName === "string" && workspaceName.trim()
        ? workspaceName.trim()
        : "My Workspace";

    if (!normalizedEmail || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 });
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400 });
    }

    const admin = await createAdminClient();

    // Create user with auto-confirm (admin API bypasses email verification)
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    createdUserId = userData.user.id;

    const bootstrapResult = await bootstrapWorkspaceForUser({
      authUserId: createdUserId,
      email: normalizedEmail,
      workspaceName: normalizedWorkspaceName,
      industry,
      persona,
    });

    if (!bootstrapResult.success || !bootstrapResult.workspaceId) {
      throw new Error(bootstrapResult.error || "Failed to create workspace");
    }

    return NextResponse.json({
      success: true,
      userId: createdUserId,
      workspaceId: bootstrapResult.workspaceId,
    });
  } catch (err) {
    console.error("Signup error:", err);

    if (createdUserId) {
      const admin = await createAdminClient();
      const { error: cleanupUserError } = await admin.auth.admin.deleteUser(createdUserId);

      if (cleanupUserError) {
        console.error("Failed to clean up user after signup error:", cleanupUserError);
      }
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
