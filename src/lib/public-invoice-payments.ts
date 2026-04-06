import { createHmac, timingSafeEqual } from "node:crypto";
import { safeRedirect } from "@/lib/safe-redirect";

interface PublicInvoicePaymentPayload {
  invoiceId: string;
  workspaceId: string;
  clientId: string;
}

interface PublicInvoicePaymentToken extends PublicInvoicePaymentPayload {
  returnTo?: string;
}

function getPublicInvoicePaymentSecret() {
  const secret = process.env.PUBLIC_INVOICE_PAYMENT_SECRET;

  if (!secret) {
    throw new Error(
      "PUBLIC_INVOICE_PAYMENT_SECRET must be configured. Generate one with: openssl rand -base64 32",
    );
  }

  return secret;
}

function signPayload(payload: string) {
  return createHmac("sha256", getPublicInvoicePaymentSecret())
    .update(payload)
    .digest("base64url");
}

export function createPublicInvoicePaymentToken(
  payload: PublicInvoicePaymentToken,
) {
  const normalized: PublicInvoicePaymentToken = {
    invoiceId: payload.invoiceId,
    workspaceId: payload.workspaceId,
    clientId: payload.clientId,
    ...(payload.returnTo ? { returnTo: safeRedirect(payload.returnTo, "/pay") } : {}),
  };

  const encodedPayload = Buffer.from(JSON.stringify(normalized)).toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyPublicInvoicePaymentToken(token: string) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  try {
    if (
      !timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<PublicInvoicePaymentToken>;

    if (
      !payload.invoiceId ||
      !payload.workspaceId ||
      !payload.clientId
    ) {
      return null;
    }

    return {
      invoiceId: payload.invoiceId,
      workspaceId: payload.workspaceId,
      clientId: payload.clientId,
      returnTo: payload.returnTo ? safeRedirect(payload.returnTo, "/pay") : undefined,
    };
  } catch {
    return null;
  }
}

export function buildPublicInvoicePaymentUrl(args: {
  origin: string;
  invoiceId: string;
  workspaceId: string;
  clientId: string;
  returnTo?: string;
}) {
  const token = createPublicInvoicePaymentToken({
    invoiceId: args.invoiceId,
    workspaceId: args.workspaceId,
    clientId: args.clientId,
    ...(args.returnTo ? { returnTo: args.returnTo } : {}),
  });

  return `${args.origin}/api/public/pay?token=${encodeURIComponent(token)}`;
}
