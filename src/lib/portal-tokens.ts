import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * HMAC-signed portal access tokens.
 * Instead of exposing raw portal_access UUIDs in URLs, we sign them
 * so tokens cannot be guessed or enumerated.
 */

function getPortalSecret(): string {
  const secret = process.env.PORTAL_TOKEN_SECRET || process.env.PUBLIC_INVOICE_PAYMENT_SECRET;

  if (!secret) {
    throw new Error(
      "PORTAL_TOKEN_SECRET (or PUBLIC_INVOICE_PAYMENT_SECRET) must be configured.",
    );
  }

  return secret;
}

function sign(accessId: string): string {
  return createHmac("sha256", getPortalSecret())
    .update(accessId)
    .digest("base64url");
}

/** Create a signed portal token from a portal_access row ID. */
export function createPortalToken(accessId: string): string {
  const sig = sign(accessId);
  return `${accessId}.${sig}`;
}

/**
 * Verify a signed portal token. Returns the portal_access ID if valid,
 * or null if the signature doesn't match.
 */
export function verifyPortalToken(token: string): string | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const accessId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  if (!accessId || !signature) return null;

  const expectedSignature = sign(accessId);

  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  return accessId;
}

/** Build a full portal URL with a signed token. */
export function buildPortalUrl(origin: string, accessId: string): string {
  const token = createPortalToken(accessId);
  return `${origin}/portal/${encodeURIComponent(token)}`;
}
