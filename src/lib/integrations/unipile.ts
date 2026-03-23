/**
 * Unipile integration — unified inbox for email, WhatsApp, Instagram DMs, LinkedIn.
 *
 * Handles:
 * - Connecting messaging accounts (OAuth flows)
 * - Fetching conversations across all channels
 * - Sending messages through any connected channel
 * - Webhook handling for incoming messages
 *
 * Docs: https://docs.unipile.com
 */

let _config: UnipileConfig | null = null;

interface UnipileConfig {
  apiKey: string;
  dsn: string;
}

export function getUnipileClient(): UnipileConfig {
  if (_config) return _config;

  const apiKey = process.env.UNIPILE_API_KEY;
  const dsn = process.env.UNIPILE_DSN;

  if (!apiKey || !dsn) {
    throw new Error("Unipile credentials not configured. Add UNIPILE_API_KEY and UNIPILE_DSN to .env.local");
  }

  _config = { apiKey, dsn };
  return _config;
}

function baseUrl(): string {
  return getUnipileClient().dsn;
}

function headers(): HeadersInit {
  return {
    "X-API-KEY": getUnipileClient().apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ── Account Management ──

/** List all connected messaging accounts */
export async function listAccounts() {
  const res = await fetch(`${baseUrl()}/api/v1/accounts`, { headers: headers() });
  if (!res.ok) throw new Error(`Unipile listAccounts failed: ${res.statusText}`);
  return res.json();
}

/** Generate an OAuth link to connect a new account */
export async function createConnectLink(provider: "GOOGLE" | "WHATSAPP" | "INSTAGRAM" | "LINKEDIN" | "MICROSOFT") {
  const res = await fetch(`${baseUrl()}/api/v1/hosted/accounts/link`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ provider }),
  });
  if (!res.ok) throw new Error(`Unipile createConnectLink failed: ${res.statusText}`);
  return res.json();
}

// ── Conversations ──

/** Fetch all conversations (paginated) */
export async function listConversations(params?: { limit?: number; cursor?: string; account_id?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.cursor) query.set("cursor", params.cursor);
  if (params?.account_id) query.set("account_id", params.account_id);

  const res = await fetch(`${baseUrl()}/api/v1/chats?${query}`, { headers: headers() });
  if (!res.ok) throw new Error(`Unipile listConversations failed: ${res.statusText}`);
  return res.json();
}

/** Get messages in a conversation */
export async function getMessages(chatId: string, params?: { limit?: number; cursor?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.cursor) query.set("cursor", params.cursor);

  const res = await fetch(`${baseUrl()}/api/v1/chats/${chatId}/messages?${query}`, { headers: headers() });
  if (!res.ok) throw new Error(`Unipile getMessages failed: ${res.statusText}`);
  return res.json();
}

// ── Sending Messages ──

/** Send a message in an existing conversation */
export async function sendMessage(chatId: string, text: string) {
  const res = await fetch(`${baseUrl()}/api/v1/chats/${chatId}/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Unipile sendMessage failed: ${res.statusText}`);
  return res.json();
}

/** Send a new message to a recipient (starts new conversation if needed) */
export async function sendNewMessage(params: {
  account_id: string;
  recipient_id: string;
  text: string;
}) {
  const res = await fetch(`${baseUrl()}/api/v1/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Unipile sendNewMessage failed: ${res.statusText}`);
  return res.json();
}

// ── Email ──

/** Send an email */
export async function sendEmail(params: {
  account_id: string;
  to: string;
  subject: string;
  body: string;
  body_type?: "text" | "html";
}) {
  const res = await fetch(`${baseUrl()}/api/v1/emails`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      account_id: params.account_id,
      to: [{ identifier: params.to }],
      subject: params.subject,
      body: params.body,
      body_type: params.body_type ?? "html",
    }),
  });
  if (!res.ok) throw new Error(`Unipile sendEmail failed: ${res.statusText}`);
  return res.json();
}
