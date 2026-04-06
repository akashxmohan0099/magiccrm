import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyPublicInvoicePaymentToken } from "@/lib/public-invoice-payments";
import { rateLimit } from "@/lib/rate-limit";
import { createInvoicePaymentSession } from "@/lib/integrations/stripe";
import { safeRedirect } from "@/lib/safe-redirect";

function buildReturnUrl(
  origin: string,
  status: "success" | "cancelled",
  returnTo?: string,
) {
  const path = returnTo ? safeRedirect(returnTo, "/pay") : "/pay";
  const url = new URL(path, origin);
  url.searchParams.set("status", status);
  return url.toString();
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`public-pay:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const paymentToken = verifyPublicInvoicePaymentToken(token);
    if (!paymentToken) {
      return NextResponse.json({ error: "Invalid payment link" }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, number, status, workspace_id, client_id")
      .eq("id", paymentToken.invoiceId)
      .eq("workspace_id", paymentToken.workspaceId)
      .eq("client_id", paymentToken.clientId)
      .maybeSingle();

    if (invoiceError) {
      console.error("[public pay] invoice lookup failed:", invoiceError);
      return NextResponse.json({ error: "Failed to load invoice" }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return NextResponse.redirect(
        buildReturnUrl(req.nextUrl.origin, "cancelled", paymentToken.returnTo),
        303,
      );
    }

    const { data: lineItems, error: lineItemError } = await supabase
      .from("invoice_line_items")
      .select("quantity, unit_price, discount")
      .eq("invoice_id", invoice.id);

    if (lineItemError) {
      console.error("[public pay] line-item lookup failed:", lineItemError);
      return NextResponse.json({ error: "Failed to calculate invoice total" }, { status: 500 });
    }

    const amount = (lineItems ?? []).reduce((sum, item) => {
      return (
        sum +
        Number(item.quantity ?? 0) * Number(item.unit_price ?? 0) -
        Number(item.discount ?? 0)
      );
    }, 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invoice total must be greater than zero" }, { status: 400 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("email")
      .eq("id", invoice.client_id)
      .eq("workspace_id", invoice.workspace_id)
      .maybeSingle();

    if (clientError) {
      console.error("[public pay] client lookup failed:", clientError);
      return NextResponse.json({ error: "Failed to load invoice client" }, { status: 500 });
    }

    if (!client?.email) {
      return NextResponse.json({ error: "Invoice client must have an email address" }, { status: 400 });
    }

    const session = await createInvoicePaymentSession({
      invoiceId: invoice.id,
      workspaceId: invoice.workspace_id,
      invoiceNumber: invoice.number,
      amount: Math.round(amount * 100),
      currency: "aud",
      customerEmail: client.email,
      successUrl: buildReturnUrl(req.nextUrl.origin, "success", paymentToken.returnTo),
      cancelUrl: buildReturnUrl(req.nextUrl.origin, "cancelled", paymentToken.returnTo),
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("[public pay] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to start payment" }, { status: 500 });
  }
}
