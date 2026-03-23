import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { safeRedirect } from "@/lib/api-auth";

/**
 * Handles the OAuth / email-confirmation callback from Supabase.
 * Exchanges the `code` query param for a session, then redirects to /dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
