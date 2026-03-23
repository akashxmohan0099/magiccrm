import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl, exchangeCode, createEvent, getFreeBusy, deleteEvent } from "@/lib/integrations/google-calendar";
import { requireAuth } from "@/lib/api-auth";

/**
 * Google Calendar API routes.
 * GET: Get OAuth URL or free/busy times.
 * POST: Exchange code, create event, or delete event.
 */
export async function GET(req: NextRequest) {
  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "auth-url": {
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`;
        const url = getAuthUrl(redirectUri);
        return NextResponse.json({ url });
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
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { action, ...params } = await req.json();
    const accessToken = req.headers.get("x-google-token");

    switch (action) {
      case "exchange-code": {
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/settings`;
        const tokens = await exchangeCode(params.code, redirectUri);
        return NextResponse.json(tokens);
      }
      case "create-event": {
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
        return NextResponse.json(await createEvent(accessToken, params));
      }
      case "delete-event": {
        if (!accessToken) return NextResponse.json({ error: "Missing access token" }, { status: 401 });
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
