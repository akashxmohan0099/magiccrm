/**
 * Google Calendar integration — two-way sync with bookings.
 *
 * Handles:
 * - OAuth2 flow for connecting Google accounts
 * - Pushing new bookings as Google Calendar events
 * - Pulling busy/free times for availability
 * - Syncing cancellations and reschedules
 */

interface GoogleCalConfig {
  clientId: string;
  clientSecret: string;
}

let _config: GoogleCalConfig | null = null;

export function getGoogleCalendarClient(): GoogleCalConfig {
  if (_config) return _config;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar credentials not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local");
  }

  _config = { clientId, clientSecret };
  return _config;
}

/** Generate the OAuth2 authorization URL */
export function getAuthUrl(redirectUri: string, state?: string): string {
  const config = getGoogleCalendarClient();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Exchange an authorization code for tokens */
export async function exchangeCode(code: string, redirectUri: string) {
  const config = getGoogleCalendarClient();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.statusText}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

/** Refresh an expired access token */
export async function refreshToken(refreshTokenStr: string) {
  const config = getGoogleCalendarClient();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshTokenStr,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.statusText}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

/** Create a calendar event from a booking */
export async function createEvent(accessToken: string, params: {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  timeZone?: string;
  attendeeEmail?: string;
}) {
  const event = {
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.startDateTime, timeZone: params.timeZone ?? "Australia/Sydney" },
    end: { dateTime: params.endDateTime, timeZone: params.timeZone ?? "Australia/Sydney" },
    ...(params.attendeeEmail ? { attendees: [{ email: params.attendeeEmail }] } : {}),
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Google Calendar createEvent failed: ${res.statusText}`);
  return res.json();
}

/** Get free/busy times for a date range */
export async function getFreeBusy(accessToken: string, params: {
  timeMin: string; // ISO 8601
  timeMax: string;
  timeZone?: string;
}) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: params.timeMin,
      timeMax: params.timeMax,
      timeZone: params.timeZone ?? "Australia/Sydney",
      items: [{ id: "primary" }],
    }),
  });
  if (!res.ok) throw new Error(`Google Calendar freeBusy failed: ${res.statusText}`);
  return res.json();
}

/** Delete a calendar event */
export async function deleteEvent(accessToken: string, eventId: string) {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 410) throw new Error(`Google Calendar deleteEvent failed: ${res.statusText}`);
}
