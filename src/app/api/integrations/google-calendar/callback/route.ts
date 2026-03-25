import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/integrations/google-calendar";
import { createClient } from "@/lib/supabase-server";

/**
 * Google Calendar OAuth callback handler.
 *
 * GET /api/integrations/google-calendar/callback?code=xxx&state=workspaceId
 *
 * Exchanges the authorization code for tokens, stores the refresh token
 * in workspace_settings, then redirects back to dashboard settings.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // workspaceId
    const errorParam = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const dashboardSettings = `${appUrl}/dashboard/settings`;

    // If the user denied access
    if (errorParam) {
      const url = new URL(dashboardSettings);
      url.searchParams.set("gcal_error", errorParam);
      return NextResponse.redirect(url.toString());
    }

    if (!code) {
      const url = new URL(dashboardSettings);
      url.searchParams.set("gcal_error", "missing_code");
      return NextResponse.redirect(url.toString());
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = new URL(`${appUrl}/login`);
      url.searchParams.set("redirect", "/dashboard/settings");
      return NextResponse.redirect(url.toString());
    }

    // Exchange code for tokens
    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;
    const tokens = await exchangeCode(code, redirectUri);

    // Determine workspace ID from state param or look it up from user
    let workspaceId = state;
    if (!workspaceId) {
      const { data: member } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      workspaceId = member?.workspace_id;
    }

    if (!workspaceId) {
      const url = new URL(dashboardSettings);
      url.searchParams.set("gcal_error", "no_workspace");
      return NextResponse.redirect(url.toString());
    }

    // Store tokens in workspace_settings.google_calendar_tokens JSONB
    const { error: updateErr } = await supabase
      .from("workspace_settings")
      .update({
        google_calendar_tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
          connected_at: new Date().toISOString(),
          connected_by: user.id,
        },
      })
      .eq("workspace_id", workspaceId);

    if (updateErr) {
      console.error("[Google Calendar Callback] Failed to save tokens:", updateErr);
      // Try upsert as fallback (workspace_settings row might not exist yet)
      const { error: upsertErr } = await supabase
        .from("workspace_settings")
        .upsert({
          workspace_id: workspaceId,
          google_calendar_tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + tokens.expires_in * 1000,
            connected_at: new Date().toISOString(),
            connected_by: user.id,
          },
        }, { onConflict: "workspace_id" });

      if (upsertErr) {
        console.error("[Google Calendar Callback] Upsert also failed:", upsertErr);
        const url = new URL(dashboardSettings);
        url.searchParams.set("gcal_error", "save_failed");
        return NextResponse.redirect(url.toString());
      }
    }

    // Log activity (non-critical)
    try {
      await supabase.from("activity_log").insert({
        workspace_id: workspaceId,
        action: "create",
        entity_type: "integrations",
        description: `Google Calendar connected by ${user.email}`,
      });
    } catch {
      // non-critical
    }

    // Redirect back to dashboard settings with success indicator
    const url = new URL(dashboardSettings);
    url.searchParams.set("gcal", "connected");
    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error("[Google Calendar Callback] Error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = new URL(`${appUrl}/dashboard/settings`);
    url.searchParams.set("gcal_error", "callback_failed");
    return NextResponse.redirect(url.toString());
  }
}
