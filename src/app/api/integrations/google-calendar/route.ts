import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_CALENDAR_STATE_COOKIE,
  createEvent,
  createGoogleCalendarOAuthState,
  deleteEvent,
  getAuthUrl,
  getFreeBusy,
  refreshToken,
} from "@/lib/integrations/google-calendar";
import { requireAuth, requireWorkspaceAccess } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase-server";

const OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

function getOAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
  };
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function GET(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "auth-url": {
        const workspaceId = searchParams.get("workspaceId");
        if (!workspaceId) {
          return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const {
          error: accessError,
          user: accessUser,
        } = await requireWorkspaceAccess(workspaceId, "admin");
        if (accessError || !accessUser) return accessError;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;
        const nonce = randomUUID();
        const state = createGoogleCalendarOAuthState({
          workspaceId,
          userId: accessUser.id,
          nonce,
        });
        const response = NextResponse.json({ url: getAuthUrl(redirectUri, state) });
        response.cookies.set(
          GOOGLE_CALENDAR_STATE_COOKIE,
          nonce,
          getOAuthCookieOptions(),
        );
        return response;
      }
      case "status": {
        const workspaceId = searchParams.get("workspaceId");
        if (!workspaceId) {
          return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const { error: accessError } = await requireWorkspaceAccess(workspaceId, "admin");
        if (accessError) return accessError;

        const { data: settings, error } = await supabase
          .from("workspace_settings")
          .select("google_calendar_tokens")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        if (error) {
          console.error("[Google Calendar API] status lookup failed:", error);
          return NextResponse.json({ error: "Failed to load Google Calendar status" }, { status: 500 });
        }

        const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
        const connected = !!(tokens?.refresh_token);
        return NextResponse.json({
          connected,
          connectedAt: tokens?.connected_at || null,
        });
      }
      case "free-busy": {
        const accessToken = req.headers.get("x-google-token");
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        const timeMin = searchParams.get("timeMin") ?? new Date().toISOString();
        const timeMax = searchParams.get("timeMax") ?? new Date(Date.now() + 7 * 86400000).toISOString();
        return NextResponse.json(await getFreeBusy(accessToken, { timeMin, timeMax }));
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Google Calendar API Error]", error);
    return NextResponse.json({ error: "Google Calendar request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { action, ...params } = await req.json();
    let accessToken = req.headers.get("x-google-token");

    switch (action) {
      case "exchange-code": {
        return NextResponse.json(
          { error: "Use the OAuth callback route to complete Google Calendar auth" },
          { status: 410 },
        );
      }
      case "refresh-token": {
        const { workspaceId } = params;
        if (!workspaceId) {
          return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const { error: accessError } = await requireWorkspaceAccess(workspaceId, "admin");
        if (accessError) return accessError;

        const { data: settings, error } = await supabase
          .from("workspace_settings")
          .select("google_calendar_tokens")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        if (error) {
          console.error("[Google Calendar API] refresh lookup failed:", error);
          return NextResponse.json({ error: "Failed to load Google Calendar settings" }, { status: 500 });
        }

        const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
        if (!tokens?.refresh_token) {
          return NextResponse.json({ error: "No refresh token found. Please reconnect Google Calendar." }, { status: 400 });
        }

        const newTokens = await refreshToken(tokens.refresh_token as string);

        const { error: updateError } = await supabase
          .from("workspace_settings")
          .update({
            google_calendar_tokens: {
              ...tokens,
              access_token: newTokens.access_token,
              expires_at: Date.now() + newTokens.expires_in * 1000,
            },
          })
          .eq("workspace_id", workspaceId);

        if (updateError) {
          console.error("[Google Calendar API] refresh update failed:", updateError);
          return NextResponse.json({ error: "Failed to store refreshed token" }, { status: 500 });
        }

        return NextResponse.json({
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
        });
      }
      case "get-token": {
        const { workspaceId } = params;
        if (!workspaceId) {
          return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const access = await requireWorkspaceAccess(workspaceId, "admin");
        if (access.error) return access.error;

        const token = await getWorkspaceToken(access.supabase, workspaceId);
        if (!token) {
          return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
        }
        return NextResponse.json({ access_token: token });
      }
      case "disconnect": {
        const { workspaceId } = params;
        if (!workspaceId) {
          return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
        }

        const { error: accessError } = await requireWorkspaceAccess(workspaceId, "admin");
        if (accessError) return accessError;

        const { error } = await supabase
          .from("workspace_settings")
          .update({ google_calendar_tokens: null })
          .eq("workspace_id", workspaceId);

        if (error) {
          console.error("[Google Calendar API] disconnect failed:", error);
          return NextResponse.json({ error: "Failed to disconnect Google Calendar" }, { status: 500 });
        }

        return NextResponse.json({ disconnected: true });
      }
      case "create-event": {
        if (!accessToken) {
          if (params.workspaceId) {
            const access = await requireWorkspaceAccess(params.workspaceId, "staff");
            if (access.error) return access.error;
            const tokenRes = await getWorkspaceToken(access.supabase, params.workspaceId);
            if (tokenRes) accessToken = tokenRes;
          }
          if (!accessToken) {
            return NextResponse.json({ error: "Missing access token" }, { status: 401 });
          }
        }
        return NextResponse.json(await createEvent(accessToken, params));
      }
      case "delete-event": {
        if (!accessToken) {
          if (params.workspaceId) {
            const access = await requireWorkspaceAccess(params.workspaceId, "staff");
            if (access.error) return access.error;
            const tokenRes = await getWorkspaceToken(access.supabase, params.workspaceId);
            if (tokenRes) accessToken = tokenRes;
          }
          if (!accessToken) {
            return NextResponse.json({ error: "Missing access token" }, { status: 401 });
          }
        }
        await deleteEvent(accessToken, params.eventId);
        return NextResponse.json({ deleted: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Google Calendar API Error]", error);
    return NextResponse.json({ error: "Google Calendar request failed" }, { status: 500 });
  }
}

async function getWorkspaceToken(
  supabase: ServerSupabaseClient,
  workspaceId: string,
): Promise<string | null> {
  const { data: settings, error } = await supabase
    .from("workspace_settings")
    .select("google_calendar_tokens")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    console.error("[Google Calendar API] token lookup failed:", error);
    throw new Error("Failed to load workspace Google Calendar token");
  }

  const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
  if (!tokens?.refresh_token) return null;

  const expiresAt = (tokens.expires_at as number) || 0;
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshToken(tokens.refresh_token as string);
    const { error: updateError } = await supabase
      .from("workspace_settings")
      .update({
        google_calendar_tokens: {
          ...tokens,
          access_token: newTokens.access_token,
          expires_at: Date.now() + newTokens.expires_in * 1000,
        },
      })
      .eq("workspace_id", workspaceId);

    if (updateError) {
      console.error("[Google Calendar API] token refresh store failed:", updateError);
      throw new Error("Failed to store refreshed workspace Google Calendar token");
    }

    return newTokens.access_token;
  }

  return tokens.access_token as string;
}
