import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase-server";
import { bootstrapWorkspaceForUser } from "@/lib/auth/bootstrap-workspace";
import { getPostHogClient } from "@/lib/posthog-server";

function isE2ESignupBypass(req: NextRequest) {
  return (
    process.env.NODE_ENV === "development" &&
    req.cookies.get("magic-e2e-signup")?.value === "1"
  );
}

export async function POST(req: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const {
      email,
      password,
      workspaceName,
      ownerName,
    } = await req.json();

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedWorkspaceName =
      typeof workspaceName === "string" && workspaceName.trim()
        ? workspaceName.trim()
        : "My Workspace";
    const normalizedOwnerName =
      typeof ownerName === "string" && ownerName.trim()
        ? ownerName.trim()
        : normalizedWorkspaceName;

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

    let requiresEmailConfirmation = false;

    if (isE2ESignupBypass(req)) {
      const admin = await createAdminClient();
      const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: normalizedOwnerName },
      });

      if (createUserError) {
        return NextResponse.json({ error: createUserError.message }, { status: 400 });
      }

      if (!createdUser.user?.id) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }

      createdUserId = createdUser.user.id;
    } else {
      const supabase = await createClient();
      const origin = new URL(req.url).origin;
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: normalizedOwnerName },
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 400 });
      }

      if (!userData.user?.id) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }

      createdUserId = userData.user.id;
      requiresEmailConfirmation = !userData.session;
    }

    if (requiresEmailConfirmation) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: "Check your email to confirm your account, then sign in to finish setup.",
      });
    }

    const bootstrapResult = await bootstrapWorkspaceForUser({
      authUserId: createdUserId,
      email: normalizedEmail,
      workspaceName: normalizedWorkspaceName,
      ownerName: normalizedOwnerName,
    });

    if (!bootstrapResult.success || !bootstrapResult.workspaceId) {
      throw new Error(bootstrapResult.error || "Failed to create workspace");
    }

    const posthog = getPostHogClient();
    posthog.identify({
      distinctId: createdUserId!,
      properties: { email: normalizedEmail, name: normalizedOwnerName },
    });
    posthog.capture({
      distinctId: createdUserId!,
      event: "signup_completed",
      properties: {
        email: normalizedEmail,
        workspace_name: normalizedWorkspaceName,
        owner_name: normalizedOwnerName,
        workspace_id: bootstrapResult.workspaceId,
      },
    });

    return NextResponse.json({
      success: true,
      userId: createdUserId,
      workspaceId: bootstrapResult.workspaceId,
      requiresEmailConfirmation: false,
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
