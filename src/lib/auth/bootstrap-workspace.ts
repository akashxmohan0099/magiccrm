import { createAdminClient } from "@/lib/supabase-server";

interface BootstrapWorkspaceParams {
  authUserId: string;
  email: string;
  workspaceName?: string | null;
  ownerName?: string | null;
}

interface BootstrapWorkspaceResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMissingBookingPageSlugError(error: { message?: string } | null | undefined) {
  return !!error?.message && error.message.includes("booking_page_slug");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

async function generateUniqueBookingSlug(workspaceName: string) {
  const admin = await createAdminClient();
  const baseSlug = slugify(workspaceName) || "business";

  for (let suffix = 0; suffix < 25; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const { data: existing, error } = await admin
      .from("workspace_settings")
      .select("workspace_id")
      .eq("booking_page_slug", candidate)
      .maybeSingle();

    if (isMissingBookingPageSlugError(error)) {
      return null;
    }

    if (error) {
      throw new Error(error.message);
    }

    if (!existing) {
      return candidate;
    }
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

async function insertOwnerMembership(params: {
  authUserId: string;
  workspaceId: string;
  name: string;
  email: string;
}) {
  const admin = await createAdminClient();
  const retryDelays = [0, 150, 400, 900];
  let lastError: string | null = null;

  for (const delay of retryDelays) {
    if (delay > 0) {
      await sleep(delay);
    }

    const { error } = await admin.from("workspace_members").insert({
      auth_user_id: params.authUserId,
      workspace_id: params.workspaceId,
      name: params.name,
      email: params.email,
      role: "owner",
      status: "active",
    });

    if (!error) {
      return;
    }

    lastError = error.message;

    if (!/foreign key|violates.*auth_user_id|auth_user_id/i.test(error.message)) {
      break;
    }
  }

  throw new Error(lastError || "Failed to create workspace member");
}

export async function bootstrapWorkspaceForUser({
  authUserId,
  email,
  workspaceName,
  ownerName,
}: BootstrapWorkspaceParams): Promise<BootstrapWorkspaceResult> {
  const admin = await createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedWorkspaceName =
    typeof workspaceName === "string" && workspaceName.trim()
      ? workspaceName.trim()
      : "My Workspace";
  const normalizedOwnerName =
    typeof ownerName === "string" && ownerName.trim()
      ? ownerName.trim()
      : normalizedEmail.split("@")[0] || "Owner";

  const { data: existingMember, error: existingMemberError } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("auth_user_id", authUserId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMemberError) {
    return { success: false, error: existingMemberError.message };
  }

  if (existingMember?.workspace_id) {
    return { success: true, workspaceId: existingMember.workspace_id };
  }

  let createdWorkspaceId: string | null = null;

  try {
    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({
        name: normalizedWorkspaceName,
      })
      .select("id")
      .single();

    if (workspaceError || !workspace) {
      throw new Error(workspaceError?.message || "Failed to create workspace");
    }

    const workspaceId = workspace.id;
    createdWorkspaceId = workspaceId;

    await insertOwnerMembership({
      authUserId,
      workspaceId,
      name: normalizedOwnerName,
      email: normalizedEmail,
    });

    const bookingPageSlug = await generateUniqueBookingSlug(normalizedWorkspaceName);
    const settingsPayload: Record<string, string> = {
      workspace_id: workspaceId,
    };

    if (bookingPageSlug) {
      settingsPayload.booking_page_slug = bookingPageSlug;
    }

    let { error: settingsError } = await admin
      .from("workspace_settings")
      .insert(settingsPayload);

    if (settingsError && bookingPageSlug && isMissingBookingPageSlugError(settingsError)) {
      ({ error: settingsError } = await admin
        .from("workspace_settings")
        .insert({ workspace_id: workspaceId }));
    }

    if (settingsError) {
      throw new Error(settingsError.message);
    }

    return { success: true, workspaceId: workspace.id };
  } catch (error) {
    if (createdWorkspaceId) {
      const { error: cleanupWorkspaceError } = await admin
        .from("workspaces")
        .delete()
        .eq("id", createdWorkspaceId);

      if (cleanupWorkspaceError) {
        console.error(
          "Failed to clean up workspace after bootstrap error:",
          cleanupWorkspaceError
        );
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create workspace",
    };
  }
}
