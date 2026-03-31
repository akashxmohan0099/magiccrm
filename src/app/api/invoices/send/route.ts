import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { buildPublicInvoicePaymentUrl } from "@/lib/public-invoice-payments";
import { runAutomationRules } from "@/lib/server/automation-runner";

/**
 * POST /api/invoices/send
 * Send an invoice to the client via email.
 * Accepts { workspaceId, invoiceId }.
 * Uses Resend SDK if RESEND_API_KEY is set, otherwise logs the email.
 * Updates invoice status to "sent" and fires the "invoice-sent" automation trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { workspaceId, invoiceId } = await req.json();

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json({ error: "Missing required workspaceId" }, { status: 400 });
    }
    if (!invoiceId || typeof invoiceId !== "string") {
      return NextResponse.json({ error: "Missing required invoiceId" }, { status: 400 });
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (membershipError) {
      console.error("[Invoice Send] membership lookup failed:", membershipError);
      return NextResponse.json({ error: "Failed to verify workspace access" }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, number, workspace_id, client_id, status, due_date, notes, tax_rate")
      .eq("id", invoiceId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (invoiceError) {
      console.error("[Invoice Send] invoice lookup failed:", invoiceError);
      return NextResponse.json({ error: "Failed to look up invoice" }, { status: 500 });
    }
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch line items
    const { data: lineItems, error: liError } = await supabase
      .from("invoice_line_items")
      .select("description, quantity, unit_price, discount, sort_order")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true });

    if (liError) {
      console.error("[Invoice Send] line items lookup failed:", liError);
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 });
    }

    // Fetch client email
    let clientEmail: string | undefined;
    let clientName = "Client";
    if (invoice.client_id) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("email, name")
        .eq("id", invoice.client_id)
        .maybeSingle();

      if (clientError) {
        console.error("[Invoice Send] client lookup failed:", clientError);
        return NextResponse.json({ error: "Failed to look up client" }, { status: 500 });
      }

      if (client?.email && typeof client.email === "string" && client.email.trim()) {
        clientEmail = client.email.trim();
      }
      if (client?.name) {
        clientName = client.name;
      }
    }

    if (!clientEmail) {
      return NextResponse.json({ error: "Client does not have an email address" }, { status: 400 });
    }

    // Fetch workspace/business name
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle();

    const businessName = workspace?.name || "Your Business";

    // Calculate totals
    const items = (lineItems ?? []).map((li) => ({
      description: li.description as string,
      quantity: Number(li.quantity ?? 0),
      unitPrice: Number(li.unit_price ?? 0),
      discount: Number(li.discount ?? 0),
      amount: Number(li.quantity ?? 0) * Number(li.unit_price ?? 0) - Number(li.discount ?? 0),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Number(invoice.tax_rate ?? 0);
    const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + taxAmount;

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const paymentLink =
      invoice.client_id
        ? buildPublicInvoicePaymentUrl({
            origin,
            invoiceId: invoice.id,
            workspaceId,
            clientId: invoice.client_id,
          })
        : `${origin}/pay?status=cancelled`;

    // Build HTML email
    const emailHtml = buildInvoiceEmailHtml({
      businessName,
      clientName,
      invoiceNumber: invoice.number,
      dueDate: invoice.due_date,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: invoice.notes as string,
      paymentLink,
    });

    // Send via Resend or log
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.INVOICE_FROM_EMAIL || "invoices@magic-crm.app";

    if (resendApiKey) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);

        await resend.emails.send({
          from: `${businessName} <${fromEmail}>`,
          to: clientEmail,
          subject: `Invoice ${invoice.number} from ${businessName}`,
          html: emailHtml,
        });

        console.log(`[Invoice Send] Email sent for invoice ${invoice.number}`);
      } catch (emailErr) {
        console.error("[Invoice Send] Resend failed:", emailErr);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log("=== INVOICE EMAIL (no RESEND_API_KEY set) ===");
      console.log(`To: ${clientEmail}`);
      console.log(`Subject: Invoice ${invoice.number} from ${businessName}`);
      console.log(`Invoice Total: $${total.toFixed(2)}`);
      console.log(`Payment Link: ${paymentLink}`);
      console.log("=== END INVOICE EMAIL ===");
    }

    // Update invoice status to "sent"
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("workspace_id", workspaceId);

    if (updateError) {
      console.error("[Invoice Send] status update failed:", updateError);
      // Non-fatal: email was sent, just log the error
    }

    // Fire automation trigger (fire-and-forget from API side)
    // The client store will also fire this, but we fire from server for reliability
    try {
      await runAutomationRules({
        workspaceId,
        trigger: "invoice-sent",
        entityId: invoiceId,
        entityData: {
          type: "invoices",
          table: "invoices",
          invoiceNumber: invoice.number,
          clientEmail,
          total: total.toFixed(2),
        },
      });
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      sentTo: clientEmail,
      invoiceNumber: invoice.number,
      emailSent: !!resendApiKey,
    });
  } catch (error) {
    console.error("[Invoice Send Error]", error);
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// HTML email builder
// ---------------------------------------------------------------------------

interface EmailData {
  businessName: string;
  clientName: string;
  invoiceNumber: string;
  dueDate: string | null;
  items: { description: string; quantity: number; unitPrice: number; discount: number; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  paymentLink: string;
}

function buildInvoiceEmailHtml(data: EmailData): string {
  const dueDateStr = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })
    : "On receipt";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(item.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;text-align:right;">$${item.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const taxRow =
    data.taxRate > 0
      ? `<tr>
          <td colspan="3" style="padding:8px 12px;text-align:right;font-size:14px;color:#666;">Tax (${data.taxRate}%)</td>
          <td style="padding:8px 12px;text-align:right;font-size:14px;color:#333;font-weight:600;">$${data.taxAmount.toFixed(2)}</td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:#111;padding:32px 32px 24px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">${escapeHtml(data.businessName)}</h1>
        <p style="margin:8px 0 0;color:#aaa;font-size:14px;">Invoice ${escapeHtml(data.invoiceNumber)}</p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="margin:0 0 4px;font-size:14px;color:#666;">Bill to</p>
        <p style="margin:0 0 20px;font-size:16px;color:#111;font-weight:600;">${escapeHtml(data.clientName)}</p>

        <div style="display:flex;gap:32px;margin-bottom:24px;">
          <div>
            <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Invoice Number</p>
            <p style="margin:0;font-size:14px;color:#333;font-weight:500;">${escapeHtml(data.invoiceNumber)}</p>
          </div>
          <div>
            <p style="margin:0 0 4px;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Due Date</p>
            <p style="margin:0;font-size:14px;color:#333;font-weight:500;">${dueDateStr}</p>
          </div>
        </div>

        <!-- Line items -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#999;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:8px 12px;text-align:right;font-size:14px;color:#666;">Subtotal</td>
              <td style="padding:8px 12px;text-align:right;font-size:14px;color:#333;">$${data.subtotal.toFixed(2)}</td>
            </tr>
            ${taxRow}
            <tr>
              <td colspan="3" style="padding:12px;text-align:right;font-size:16px;color:#111;font-weight:700;">Total</td>
              <td style="padding:12px;text-align:right;font-size:16px;color:#111;font-weight:700;">$${data.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        ${data.notes ? `<div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;"><p style="margin:0 0 4px;font-size:12px;color:#999;font-weight:500;">Notes</p><p style="margin:0;font-size:14px;color:#555;white-space:pre-wrap;">${escapeHtml(data.notes)}</p></div>` : ""}

        <!-- Payment button -->
        <div style="text-align:center;margin-top:32px;">
          <a href="${data.paymentLink}" style="display:inline-block;background:#111;color:#fff;padding:14px 48px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">Pay Now</a>
        </div>

        <p style="text-align:center;margin-top:16px;font-size:12px;color:#999;">
          If you have any questions about this invoice, please contact us.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
