import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/invoices/pdf?invoiceId=xxx&workspaceId=xxx
 * Returns an HTML invoice that can be printed to PDF by the browser (Ctrl+P / window.print()).
 * Content-Type: text/html
 */
export async function GET(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");
    const workspaceId = searchParams.get("workspaceId");

    if (!invoiceId || !workspaceId) {
      return NextResponse.json(
        { error: "Missing required invoiceId and workspaceId query parameters" },
        { status: 400 }
      );
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (membershipError) {
      console.error("[Invoice PDF] membership lookup failed:", membershipError);
      return NextResponse.json({ error: "Failed to verify workspace access" }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, number, workspace_id, client_id, status, due_date, notes, tax_rate, created_at")
      .eq("id", invoiceId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (invoiceError) {
      console.error("[Invoice PDF] invoice lookup failed:", invoiceError);
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
      console.error("[Invoice PDF] line items lookup failed:", liError);
      return NextResponse.json({ error: "Failed to fetch line items" }, { status: 500 });
    }

    // Fetch client info
    let clientName = "";
    let clientEmail = "";
    let clientAddress = "";
    if (invoice.client_id) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email, address")
        .eq("id", invoice.client_id)
        .maybeSingle();

      if (client) {
        clientName = client.name || "";
        clientEmail = client.email || "";
        clientAddress = client.address || "";
      }
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
      description: (li.description as string) || "",
      quantity: Number(li.quantity ?? 0),
      unitPrice: Number(li.unit_price ?? 0),
      discount: Number(li.discount ?? 0),
      amount: Number(li.quantity ?? 0) * Number(li.unit_price ?? 0) - Number(li.discount ?? 0),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Number(invoice.tax_rate ?? 0);
    const taxAmount = taxRate > 0 ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + taxAmount;

    const invoiceDate = new Date(invoice.created_at).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dueDate = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString("en-AU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "On receipt";

    const statusLabel = (invoice.status as string).charAt(0).toUpperCase() + (invoice.status as string).slice(1);

    const html = buildInvoicePdfHtml({
      businessName,
      clientName,
      clientEmail,
      clientAddress,
      invoiceNumber: invoice.number,
      invoiceDate,
      dueDate,
      status: statusLabel,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: (invoice.notes as string) || "",
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Invoice PDF Error]", error);
    return NextResponse.json({ error: "Failed to generate invoice PDF" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// HTML PDF template builder
// ---------------------------------------------------------------------------

interface PdfData {
  businessName: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  items: { description: string; quantity: number; unitPrice: number; discount: number; amount: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
}

function buildInvoicePdfHtml(data: PdfData): string {
  const statusColor =
    data.status.toLowerCase() === "paid"
      ? "#22c55e"
      : data.status.toLowerCase() === "overdue"
        ? "#ef4444"
        : data.status.toLowerCase() === "sent"
          ? "#3b82f6"
          : "#6b7280";

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">${escapeHtml(item.description)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        ${item.discount > 0 ? `<td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#c00;text-align:right;">-$${item.discount.toFixed(2)}</td>` : `<td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#999;text-align:right;">--</td>`}
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;text-align:right;font-weight:500;">$${item.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const taxRow =
    data.taxRate > 0
      ? `<tr>
          <td colspan="4" style="padding:8px 16px;text-align:right;font-size:13px;color:#666;">Tax (${data.taxRate}%)</td>
          <td style="padding:8px 16px;text-align:right;font-size:14px;color:#333;font-weight:600;">$${data.taxAmount.toFixed(2)}</td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .page { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
    }
    @page { margin: 0.5in; size: A4; }
    * { box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:20px;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
  <!-- Print button -->
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#111;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="page" style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="padding:40px 40px 32px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 style="margin:0;font-size:24px;color:#111;font-weight:700;">${escapeHtml(data.businessName)}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:#999;">Invoice</p>
      </div>
      <div style="text-align:right;">
        <span style="display:inline-block;background:${statusColor}15;color:${statusColor};padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(data.status)}</span>
      </div>
    </div>

    <!-- Invoice meta + client info -->
    <div style="padding:32px 40px;display:flex;justify-content:space-between;gap:40px;">
      <div>
        <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Bill To</p>
        <p style="margin:0;font-size:16px;color:#111;font-weight:600;">${escapeHtml(data.clientName || "---")}</p>
        ${data.clientEmail ? `<p style="margin:4px 0 0;font-size:13px;color:#666;">${escapeHtml(data.clientEmail)}</p>` : ""}
        ${data.clientAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#666;white-space:pre-wrap;">${escapeHtml(data.clientAddress)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 2px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Invoice Number</p>
          <p style="margin:0;font-size:15px;color:#111;font-weight:600;">${escapeHtml(data.invoiceNumber)}</p>
        </div>
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 2px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Invoice Date</p>
          <p style="margin:0;font-size:13px;color:#333;">${data.invoiceDate}</p>
        </div>
        <div>
          <p style="margin:0 0 2px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Due Date</p>
          <p style="margin:0;font-size:13px;color:#333;font-weight:500;">${data.dueDate}</p>
        </div>
      </div>
    </div>

    <!-- Line items -->
    <div style="padding:0 40px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:12px 16px;text-align:left;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Description</th>
            <th style="padding:12px 16px;text-align:center;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Qty</th>
            <th style="padding:12px 16px;text-align:right;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Unit Price</th>
            <th style="padding:12px 16px;text-align:right;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Discount</th>
            <th style="padding:12px 16px;text-align:right;font-size:11px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-top:16px;border-top:2px solid #eee;padding-top:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <tbody>
            <tr>
              <td colspan="4" style="padding:6px 16px;text-align:right;font-size:13px;color:#666;">Subtotal</td>
              <td style="padding:6px 16px;text-align:right;font-size:14px;color:#333;">$${data.subtotal.toFixed(2)}</td>
            </tr>
            ${taxRow}
            <tr>
              <td colspan="4" style="padding:12px 16px;text-align:right;font-size:18px;color:#111;font-weight:700;">Total</td>
              <td style="padding:12px 16px;text-align:right;font-size:18px;color:#111;font-weight:700;">$${data.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    ${
      data.notes
        ? `<!-- Notes -->
    <div style="padding:0 40px 32px;">
      <div style="background:#fafafa;border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Notes</p>
        <p style="margin:0;font-size:13px;color:#555;white-space:pre-wrap;line-height:1.5;">${escapeHtml(data.notes)}</p>
      </div>
    </div>`
        : ""
    }

    <!-- Footer -->
    <div style="padding:24px 40px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">Thank you for your business.</p>
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
