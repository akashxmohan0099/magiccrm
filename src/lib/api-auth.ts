import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export { safeRedirect } from "@/lib/safe-redirect";

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
