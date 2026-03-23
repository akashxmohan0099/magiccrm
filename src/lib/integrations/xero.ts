/**
 * Xero integration — accounting sync.
 *
 * Handles:
 * - OAuth2 flow for connecting Xero accounts
 * - Pushing invoices to Xero when created/updated
 * - Syncing payments received
 * - Pulling chart of accounts for tax mapping
 */

interface XeroConfig {
  clientId: string;
  clientSecret: string;
}

let _config: XeroConfig | null = null;

export function getXeroClient(): XeroConfig {
  if (_config) return _config;

  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Xero credentials not configured. Add XERO_CLIENT_ID and XERO_CLIENT_SECRET to .env.local");
  }

  _config = { clientId, clientSecret };
  return _config;
}

/** Generate the OAuth2 authorization URL */
export function getAuthUrl(redirectUri: string, state?: string): string {
  const config = getXeroClient();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email accounting.transactions accounting.contacts offline_access",
    ...(state ? { state } : {}),
  });
  return `https://login.xero.com/identity/connect/authorize?${params}`;
}

/** Exchange an authorization code for tokens */
export async function exchangeCode(code: string, redirectUri: string) {
  const config = getXeroClient();
  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Xero token exchange failed: ${res.statusText}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

/** Refresh an expired access token */
export async function refreshToken(refreshTokenStr: string) {
  const config = getXeroClient();
  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshTokenStr,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Xero token refresh failed: ${res.statusText}`);
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

/** Get connected tenants (organizations) */
export async function getTenants(accessToken: string) {
  const res = await fetch("https://api.xero.com/connections", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Xero getTenants failed: ${res.statusText}`);
  return res.json() as Promise<Array<{ tenantId: string; tenantName: string }>>;
}

/** Create an invoice in Xero */
export async function createInvoice(accessToken: string, tenantId: string, invoice: {
  contactName: string;
  contactEmail: string;
  lineItems: Array<{ description: string; quantity: number; unitAmount: number; accountCode?: string }>;
  dueDate: string; // YYYY-MM-DD
  reference?: string;
}) {
  const res = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Type: "ACCREC",
      Contact: { Name: invoice.contactName, EmailAddress: invoice.contactEmail },
      LineItems: invoice.lineItems.map((li) => ({
        Description: li.description,
        Quantity: li.quantity,
        UnitAmount: li.unitAmount,
        AccountCode: li.accountCode ?? "200",
      })),
      DueDate: invoice.dueDate,
      Reference: invoice.reference,
      Status: "AUTHORISED",
    }),
  });
  if (!res.ok) throw new Error(`Xero createInvoice failed: ${res.statusText}`);
  return res.json();
}

/** Record a payment against an invoice */
export async function createPayment(accessToken: string, tenantId: string, payment: {
  invoiceId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  accountCode?: string;
}) {
  const res = await fetch("https://api.xero.com/api.xro/2.0/Payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "xero-tenant-id": tenantId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Invoice: { InvoiceID: payment.invoiceId },
      Amount: payment.amount,
      Date: payment.date,
      Account: { Code: payment.accountCode ?? "090" },
    }),
  });
  if (!res.ok) throw new Error(`Xero createPayment failed: ${res.statusText}`);
  return res.json();
}
