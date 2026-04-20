import { NextRequest, NextResponse } from "next/server";
import { createInvoicePaymentSession } from "@/lib/integrations/stripe";
import { requireAuth } from "@/lib/api-auth";

/**
 * Stripe API routes.
 * POST: Create a checkout session for invoice payment.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { invoiceId, currency } = await req.json();

    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ error: "Missing required invoiceId" }, { status: 400 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("payment_documents")
      .select("id, document_number, workspace_id, client_id, status")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) {
      console.error("[Stripe API] invoice lookup failed:", invoiceError);
      return NextResponse.json({ error: "Failed to look up invoice" }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", invoice.workspace_id)
      .maybeSingle();

    if (membershipError) {
      console.error("[Stripe API] membership lookup failed:", membershipError);
      return NextResponse.json({ error: "Failed to verify workspace access" }, { status: 500 });
    }

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return NextResponse.json({ error: "Invoice is not payable" }, { status: 400 });
    }

    const { data: lineItems, error: lineItemError } = await supabase
      .from("payment_line_items")
      .select("quantity, unit_price")
      .eq("payment_document_id", invoice.id);

    if (lineItemError) {
      console.error("[Stripe API] line-item lookup failed:", lineItemError);
      return NextResponse.json({ error: "Failed to calculate invoice total" }, { status: 500 });
    }

    const amount = (lineItems ?? []).reduce((sum, item) => {
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unit_price ?? 0);
      return sum + quantity * unitPrice;
    }, 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invoice total must be greater than zero" }, { status: 400 });
    }

    let customerEmail: string | undefined;
    if (invoice.client_id) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("email")
        .eq("id", invoice.client_id)
        .maybeSingle();

      if (clientError) {
        console.error("[Stripe API] client lookup failed:", clientError);
        return NextResponse.json({ error: "Failed to look up invoice client" }, { status: 500 });
      }

      if (typeof client?.email === "string" && client.email.trim()) {
        customerEmail = client.email.trim();
      }
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Invoice client must have an email address" }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const session = await createInvoicePaymentSession({
      invoiceId: invoice.id,
      workspaceId: invoice.workspace_id,
      invoiceNumber: invoice.document_number,
      amount: Math.round(amount * 100),
      currency: typeof currency === "string" && currency ? currency : "aud",
      customerEmail,
      successUrl: `${origin}/dashboard/payments?payment=success&invoice=${invoice.id}`,
      cancelUrl: `${origin}/dashboard/payments?payment=cancelled&invoice=${invoice.id}`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("[Stripe API Error]", error);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
