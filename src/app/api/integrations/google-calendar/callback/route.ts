import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_CALENDAR_STATE_COOKIE,
  exchangeCode,
  verifyGoogleCalendarOAuthState,
} from "@/lib/integrations/google-calendar";
import { fetchWorkspaceMembership } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase-server";

/**
 * Google Calendar OAuth callback handler.
 *
 * GET /api/integrations/google-calendar/callback?code=xxx&state=signedState
 */
function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  };
}

function redirectWithStatus(
  destination: string,
  searchParam: string,
  value: string,
) {
  const url = new URL(destination);
  url.searchParams.set(searchParam, value);
  const response = NextResponse.redirect(url.toString());
  response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const dashboardSettings = `${appUrl}/dashboard/settings`;

    if (errorParam) {
      return redirectWithStatus(dashboardSettings, "gcal_error", errorParam);
    }

    if (!code) {
      return redirectWithStatus(dashboardSettings, "gcal_error", "missing_code");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = new URL(`${appUrl}/login`);
      url.searchParams.set("redirect", "/dashboard/settings");
      return NextResponse.redirect(url.toString());
    }

    const verifiedState = state ? verifyGoogleCalendarOAuthState(state) : null;
    const nonceCookie = req.cookies.get(GOOGLE_CALENDAR_STATE_COOKIE)?.value;
    if (
      !verifiedState ||
      !nonceCookie ||
      verifiedState.nonce !== nonceCookie ||
      verifiedState.userId !== user.id
    ) {
      return redirectWithStatus(dashboardSettings, "gcal_error", "invalid_state");
    }

    const membership = await fetchWorkspaceMembership(
      supabase,
      user.id,
      verifiedState.workspaceId,
    );

    if (!membership || membership.role === "staff") {
      return redirectWithStatus(dashboardSettings, "gcal_error", "forbidden");
    }

    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;
    const tokens = await exchangeCode(code, redirectUri);

    const workspaceId = verifiedState.workspaceId;
    const { data: existingSettings } = await supabase
      .from("workspace_settings")
      .select("google_calendar_tokens")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const existingTokens = existingSettings?.google_calendar_tokens as Record<string, unknown> | null;
    const { error: upsertErr } = await supabase
      .from("workspace_settings")
      .upsert({
        workspace_id: workspaceId,
        google_calendar_tokens: {
          access_token: tokens.access_token,
          refresh_token:
            tokens.refresh_token ||
            (typeof existingTokens?.refresh_token === "string"
              ? existingTokens.refresh_token
              : null),
          expires_at: Date.now() + tokens.expires_in * 1000,
          connected_at: new Date().toISOString(),
          connected_by: user.id,
        },
      }, { onConflict: "workspace_id" });

    if (upsertErr) {
      console.error("[Google Calendar Callback] Failed to save tokens:", upsertErr);
      return redirectWithStatus(dashboardSettings, "gcal_error", "save_failed");
    }

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

    return redirectWithStatus(dashboardSettings, "gcal", "connected");
  } catch (error) {
    console.error("[Google Calendar Callback] Error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return redirectWithStatus(`${appUrl}/dashboard/settings`, "gcal_error", "callback_failed");
  }
}
