import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, exchangeCode, refreshToken, createEvent, getFreeBusy, deleteEvent } from "@/lib/integrations/google-calendar";
import { requireAuth } from "@/lib/api-auth";

/**
 * Google Calendar API routes.
 * GET: Get OAuth URL, free/busy times, or connection status.
 * POST: Exchange code, create event, delete event, or refresh token.
 */
export async function GET(req: NextRequest) {
  try {
    const { user: _user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "auth-url": {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        // Use the dedicated callback route as redirect URI
        const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;
        const workspaceId = searchParams.get("workspaceId") || "";
        const url = getAuthUrl(redirectUri, workspaceId);
        return NextResponse.json({ url });
      }
      case "status": {
        // Check if Google Calendar is connected for the workspace
        const workspaceId = searchParams.get("workspaceId");
        if (!workspaceId) return NextResponse.json({ connected: false });

        const { data: settings } = await supabase
          .from("workspace_settings")
          .select("google_calendar_tokens")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

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
    const { user: _user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { action, ...params } = await req.json();
    let accessToken = req.headers.get("x-google-token");

    switch (action) {
      case "exchange-code": {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`;
        const tokens = await exchangeCode(params.code, redirectUri);
        return NextResponse.json(tokens);
      }
      case "refresh-token": {
        // Refresh using stored refresh token from workspace_settings
        const { workspaceId } = params;
        if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

        const { data: settings } = await supabase
          .from("workspace_settings")
          .select("google_calendar_tokens")
          .eq("workspace_id", workspaceId)
          .single();

        const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
        if (!tokens?.refresh_token) {
          return NextResponse.json({ error: "No refresh token found. Please reconnect Google Calendar." }, { status: 400 });
        }

        const newTokens = await refreshToken(tokens.refresh_token as string);

        // Update stored tokens
        await supabase
          .from("workspace_settings")
          .update({
            google_calendar_tokens: {
              ...tokens,
              access_token: newTokens.access_token,
              expires_at: Date.now() + newTokens.expires_in * 1000,
            },
          })
          .eq("workspace_id", workspaceId);

        return NextResponse.json({
          access_token: newTokens.access_token,
          expires_in: newTokens.expires_in,
        });
      }
      case "get-token": {
        // Get a valid access token for the workspace (refresh if expired)
        const { workspaceId } = params;
        if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

        const { data: settings } = await supabase
          .from("workspace_settings")
          .select("google_calendar_tokens")
          .eq("workspace_id", workspaceId)
          .single();

        const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
        if (!tokens?.refresh_token) {
          return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
        }

        // Check if token is expired (with 5 min buffer)
        const expiresAt = (tokens.expires_at as number) || 0;
        if (Date.now() > expiresAt - 5 * 60 * 1000) {
          const newTokens = await refreshToken(tokens.refresh_token as string);
          const updatedTokens = {
            ...tokens,
            access_token: newTokens.access_token,
            expires_at: Date.now() + newTokens.expires_in * 1000,
          };
          await supabase
            .from("workspace_settings")
            .update({ google_calendar_tokens: updatedTokens })
            .eq("workspace_id", workspaceId);

          return NextResponse.json({ access_token: newTokens.access_token });
        }

        return NextResponse.json({ access_token: tokens.access_token });
      }
      case "disconnect": {
        const { workspaceId } = params;
        if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });

        await supabase
          .from("workspace_settings")
          .update({ google_calendar_tokens: null })
          .eq("workspace_id", workspaceId);

        return NextResponse.json({ disconnected: true });
      }
      case "create-event": {
        if (!accessToken) {
          // Try to get token from workspace
          if (params.workspaceId) {
            const tokenRes = await getWorkspaceToken(supabase, params.workspaceId);
            if (tokenRes) accessToken = tokenRes;
          }
          if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        }
        return NextResponse.json(await createEvent(accessToken, params));
      }
      case "delete-event": {
        if (!accessToken) {
          if (params.workspaceId) {
            const tokenRes = await getWorkspaceToken(supabase, params.workspaceId);
            if (tokenRes) accessToken = tokenRes;
          }
          if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getWorkspaceToken(supabase: any, workspaceId: string): Promise<string | null> {
  const { data: settings } = await supabase
    .from("workspace_settings")
    .select("google_calendar_tokens")
    .eq("workspace_id", workspaceId)
    .single();

  const tokens = settings?.google_calendar_tokens as Record<string, unknown> | null;
  if (!tokens?.refresh_token) return null;

  const expiresAt = (tokens.expires_at as number) || 0;
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshToken(tokens.refresh_token as string);
    await supabase
      .from("workspace_settings")
      .update({
        google_calendar_tokens: {
          ...tokens,
          access_token: newTokens.access_token,
          expires_at: Date.now() + newTokens.expires_in * 1000,
        },
      })
      .eq("workspace_id", workspaceId);
    return newTokens.access_token;
  }

  return tokens.access_token as string;
}
