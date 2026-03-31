import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export { safeRedirect } from "@/lib/safe-redirect";

export type WorkspaceRole = "owner" | "admin" | "staff";

export interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  auth_user_id: string;
  role: WorkspaceRole;
  status: string;
}

const ROLE_PRIORITY: Record<WorkspaceRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
};

/**
 * Require authentication for an API route.
 * Returns the authenticated user and supabase client, or a 401 Response.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return { user, supabase, error: null } as const;
}

function hasRequiredRole(role: WorkspaceRole, minRole: WorkspaceRole) {
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[minRole];
}

export async function fetchWorkspaceMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUserId: string,
  workspaceId: string,
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, auth_user_id, role, status")
    .eq("auth_user_id", authUserId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as WorkspaceMembership | null) ?? null;
}

/**
 * Require that the authenticated user belongs to the given workspace.
 * Optionally enforce a minimum role for privileged operations.
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  minRole: WorkspaceRole = "staff",
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return {
      ...auth,
      member: null,
      error: auth.error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  let member: WorkspaceMembership | null = null;
  try {
    member = await fetchWorkspaceMembership(auth.supabase, auth.user.id, workspaceId);
  } catch (error) {
    console.error("[workspace-access] membership lookup failed:", error);
    return {
      ...auth,
      member: null,
      error: NextResponse.json({ error: "Failed to verify workspace access" }, { status: 500 }),
    } as const;
  }

  if (!member) {
    return {
      ...auth,
      member: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  if (!hasRequiredRole(member.role, minRole)) {
    return {
      ...auth,
      member,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return {
    ...auth,
    member,
    error: null,
  } as const;
}
