// ── Invoice PDF Templates ─────────────────────────────────────
//
// Four selectable templates that render invoices/quotes as HTML
// for print-to-PDF. All templates use brand settings (logo, color, tagline).

export interface InvoiceTemplateStyle {
  id: string;
  name: string;
  description: string;
  preview: { headerBg: string; accentBg: string; bodyBg: string };
}

export const INVOICE_TEMPLATES: InvoiceTemplateStyle[] = [
  {
    id: "clean",
    name: "Clean",
    description: "Minimal white layout with accent line",
    preview: { headerBg: "#ffffff", accentBg: "#34D399", bodyBg: "#ffffff" },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Dark header with bold typography",
    preview: { headerBg: "#111111", accentBg: "#34D399", bodyBg: "#ffffff" },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional business layout with borders",
    preview: { headerBg: "#f8f8f8", accentBg: "#333333", bodyBg: "#ffffff" },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Full-color header with white text",
    preview: { headerBg: "#34D399", accentBg: "#ffffff", bodyBg: "#ffffff" },
  },
];

// ── Shared types ────────────────────────────────────────────

export interface PdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

export interface PdfData {
  documentType: "invoice" | "quote";
  businessName: string;
  tagline: string;
  logoBase64: string;
  brandColor: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  number: string;
  date: string;
  dueDate: string;
  status: string;
  items: PdfLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
}

// ── Helpers ──────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeColor(color: string): string {
  const trimmed = color.trim();
  return /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)
    ? trimmed
    : "#34D399";
}

function sanitizeImageSrc(src: string): string {
  const trimmed = src.trim();

  if (
    /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=_-]+$/i.test(trimmed)
  ) {
    return trimmed;
  }

  if (/^https:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return trimmed;
  }

  return "";
}

function logoImg(base64: string, maxH = 40): string {
  const safeSrc = sanitizeImageSrc(base64);
  if (!safeSrc) return "";
  return `<img src="${esc(safeSrc)}" style="max-height:${maxH}px;max-width:180px;object-fit:contain;" alt="Logo" />`;
}

function statusBadge(status: string, color: string): string {
  const map: Record<string, string> = {
    paid: "#22c55e",
    overdue: "#ef4444",
    sent: "#3b82f6",
    accepted: "#22c55e",
    declined: "#ef4444",
    expired: "#f59e0b",
    draft: "#6b7280",
    cancelled: "#9ca3af",
  };
  const bg = map[status.toLowerCase()] || color;
  return `<span style="display:inline-block;background:${bg}18;color:${bg};padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${esc(status)}</span>`;
}

function itemRows(items: PdfLineItem[], _color: string): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">${esc(item.description)}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:center;">${item.quantity}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:${item.discount > 0 ? "#c00" : "#999"};text-align:right;">${item.discount > 0 ? `-$${item.discount.toFixed(2)}` : "--"}</td>
        <td style="padding:11px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;text-align:right;font-weight:500;">$${item.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");
}

function totalsBlock(data: PdfData, color: string): string {
  const taxRow =
    data.taxRate > 0
      ? `<tr><td colspan="4" style="padding:6px 16px;text-align:right;font-size:13px;color:#666;">Tax (${data.taxRate}%)</td><td style="padding:6px 16px;text-align:right;font-size:14px;color:#333;font-weight:600;">$${data.taxAmount.toFixed(2)}</td></tr>`
      : "";
  return `
    <div style="margin-top:16px;border-top:2px solid #eee;padding-top:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td colspan="4" style="padding:6px 16px;text-align:right;font-size:13px;color:#666;">Subtotal</td><td style="padding:6px 16px;text-align:right;font-size:14px;color:#333;">$${data.subtotal.toFixed(2)}</td></tr>
        ${taxRow}
        <tr><td colspan="4" style="padding:12px 16px;text-align:right;font-size:18px;color:${color};font-weight:700;">Total</td><td style="padding:12px 16px;text-align:right;font-size:18px;color:${color};font-weight:700;">$${data.total.toFixed(2)}</td></tr>
      </table>
    </div>`;
}

function notesBlock(notes: string): string {
  if (!notes) return "";
  return `
    <div style="padding:0 40px 32px;">
      <div style="background:#fafafa;border-radius:8px;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Notes</p>
        <p style="margin:0;font-size:13px;color:#555;white-space:pre-wrap;line-height:1.5;">${esc(notes)}</p>
      </div>
    </div>`;
}

function docLabel(type: "invoice" | "quote"): string {
  return type === "quote" ? "Quote" : "Invoice";
}

function dueDateLabel(type: "invoice" | "quote"): string {
  return type === "quote" ? "Valid Until" : "Due Date";
}

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
  <style>
    @media print {
      body { margin:0; padding:0; }
      .no-print { display:none !important; }
      .page { box-shadow:none !important; margin:0 !important; border-radius:0 !important; }
    }
    @page { margin:0.5in; size:A4; }
    * { box-sizing:border-box; }
  </style>
</head>
<body style="margin:0;padding:20px;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;">
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#111;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Print / Save as PDF
    </button>
  </div>
  ${body}
</body>
</html>`;
}

// ── Template: Clean ─────────────────────────────────────────

function renderClean(d: PdfData): string {
  const c = sanitizeColor(d.brandColor);
  const label = docLabel(d.documentType);
  const dateText = esc(d.date);
  const dueDateText = esc(d.dueDate);
  const body = `
  <div class="page" style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
    <!-- Accent bar -->
    <div style="height:4px;background:${c};"></div>

    <!-- Header -->
    <div style="padding:36px 40px 28px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        ${d.logoBase64 ? logoImg(d.logoBase64, 36) : `<h1 style="margin:0;font-size:22px;color:#111;font-weight:700;">${esc(d.businessName)}</h1>`}
        ${d.logoBase64 && d.businessName ? `<p style="margin:6px 0 0;font-size:14px;color:#333;font-weight:600;">${esc(d.businessName)}</p>` : ""}
        ${d.tagline ? `<p style="margin:4px 0 0;font-size:12px;color:#999;">${esc(d.tagline)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:28px;font-weight:700;color:${c};letter-spacing:-0.5px;">${label}</p>
        ${statusBadge(d.status, c)}
      </div>
    </div>

    <!-- Meta + Client -->
    <div style="padding:0 40px 28px;display:flex;justify-content:space-between;gap:40px;">
      <div>
        <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Bill To</p>
        <p style="margin:0;font-size:15px;color:#111;font-weight:600;">${esc(d.clientName || "---")}</p>
        ${d.clientEmail ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${esc(d.clientEmail)}</p>` : ""}
        ${d.clientAddress ? `<p style="margin:3px 0 0;font-size:12px;color:#666;white-space:pre-wrap;">${esc(d.clientAddress)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <div style="margin-bottom:10px;"><p style="margin:0 0 2px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">${label} Number</p><p style="margin:0;font-size:14px;color:#111;font-weight:600;">${esc(d.number)}</p></div>
        <div style="margin-bottom:10px;"><p style="margin:0 0 2px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">Date</p><p style="margin:0;font-size:12px;color:#333;">${dateText}</p></div>
        <div><p style="margin:0 0 2px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:500;">${dueDateLabel(d.documentType)}</p><p style="margin:0;font-size:12px;color:#333;font-weight:500;">${dueDateText}</p></div>
      </div>
    </div>

    <!-- Items -->
    <div style="padding:0 40px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;">
          <th style="padding:10px 16px;text-align:left;font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Description</th>
          <th style="padding:10px 16px;text-align:center;font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Discount</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #eee;">Amount</th>
        </tr></thead>
        <tbody>${itemRows(d.items, c)}</tbody>
      </table>
      ${totalsBlock(d, c)}
    </div>

    ${notesBlock(d.notes)}

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #eee;text-align:center;">
      <p style="margin:0;font-size:11px;color:#bbb;">Thank you for your business.</p>
    </div>
  </div>`;
  return pageShell(`${label} ${d.number}`, body);
}

// ── Template: Modern ────────────────────────────────────────

function renderModern(d: PdfData): string {
  const c = sanitizeColor(d.brandColor);
  const label = docLabel(d.documentType);
  const dateText = esc(d.date);
  const dueDateText = esc(d.dueDate);
  const body = `
  <div class="page" style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
    <!-- Dark header -->
    <div style="padding:36px 40px;background:#111;display:flex;justify-content:space-between;align-items:center;">
      <div>
        ${d.logoBase64 ? logoImg(d.logoBase64, 32) : `<h1 style="margin:0;font-size:20px;color:#fff;font-weight:700;">${esc(d.businessName)}</h1>`}
        ${d.tagline ? `<p style="margin:4px 0 0;font-size:11px;color:#888;">${esc(d.tagline)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:500;">${label}</p>
        <p style="margin:4px 0 0;font-size:24px;color:${c};font-weight:700;">${esc(d.number)}</p>
      </div>
    </div>

    <!-- Status bar -->
    <div style="padding:12px 40px;background:${c}12;border-bottom:1px solid ${c}25;display:flex;justify-content:space-between;align-items:center;">
      ${statusBadge(d.status, c)}
      <span style="font-size:12px;color:#666;">Date: ${dateText} &nbsp;·&nbsp; ${dueDateLabel(d.documentType)}: ${dueDateText}</span>
    </div>

    <!-- Client -->
    <div style="padding:28px 40px;">
      <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Bill To</p>
      <p style="margin:0;font-size:16px;color:#111;font-weight:600;">${esc(d.clientName || "---")}</p>
      ${d.clientEmail ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${esc(d.clientEmail)}</p>` : ""}
      ${d.clientAddress ? `<p style="margin:3px 0 0;font-size:12px;color:#666;white-space:pre-wrap;">${esc(d.clientAddress)}</p>` : ""}
    </div>

    <!-- Items -->
    <div style="padding:0 40px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="padding:10px 16px;text-align:left;font-size:10px;color:#fff;background:#111;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
          <th style="padding:10px 16px;text-align:center;font-size:10px;color:#fff;background:#111;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#fff;background:#111;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#fff;background:#111;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Discount</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#fff;background:#111;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr></thead>
        <tbody>${itemRows(d.items, c)}</tbody>
      </table>
      ${totalsBlock(d, c)}
    </div>

    ${notesBlock(d.notes)}

    <div style="padding:20px 40px;background:#111;text-align:center;">
      <p style="margin:0;font-size:11px;color:#666;">Thank you for your business.</p>
    </div>
  </div>`;
  return pageShell(`${label} ${d.number}`, body);
}

// ── Template: Classic ───────────────────────────────────────

function renderClassic(d: PdfData): string {
  const c = sanitizeColor(d.brandColor);
  const label = docLabel(d.documentType);
  const dateText = esc(d.date);
  const dueDateText = esc(d.dueDate);
  const body = `
  <div class="page" style="max-width:800px;margin:0 auto;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);border:1px solid #e0e0e0;">
    <!-- Header -->
    <div style="padding:32px 40px;background:#f8f8f8;border-bottom:2px solid #e0e0e0;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        ${d.logoBase64 ? logoImg(d.logoBase64, 36) : ""}
        <h1 style="margin:${d.logoBase64 ? "8px" : "0"} 0 0;font-size:18px;color:#333;font-weight:700;font-family:Georgia,serif;">${esc(d.businessName)}</h1>
        ${d.tagline ? `<p style="margin:2px 0 0;font-size:11px;color:#888;font-family:Georgia,serif;font-style:italic;">${esc(d.tagline)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:24px;font-weight:700;color:#333;font-family:Georgia,serif;">${label}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#555;font-family:Georgia,serif;">#${esc(d.number)}</p>
      </div>
    </div>

    <!-- Meta row -->
    <div style="padding:16px 40px;background:#fafafa;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;font-size:12px;color:#555;">
      <span>Date: <strong style="color:#333;">${dateText}</strong></span>
      <span>${dueDateLabel(d.documentType)}: <strong style="color:#333;">${dueDateText}</strong></span>
      <span>Status: ${statusBadge(d.status, c)}</span>
    </div>

    <!-- Client -->
    <div style="padding:24px 40px;">
      <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Bill To</p>
      <p style="margin:0;font-size:15px;color:#111;font-weight:600;">${esc(d.clientName || "---")}</p>
      ${d.clientEmail ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${esc(d.clientEmail)}</p>` : ""}
      ${d.clientAddress ? `<p style="margin:3px 0 0;font-size:12px;color:#666;white-space:pre-wrap;">${esc(d.clientAddress)}</p>` : ""}
    </div>

    <!-- Items -->
    <div style="padding:0 40px 28px;">
      <table style="width:100%;border-collapse:collapse;border:1px solid #e0e0e0;">
        <thead><tr style="background:#f0f0f0;">
          <th style="padding:10px 16px;text-align:left;font-size:10px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ccc;">Description</th>
          <th style="padding:10px 16px;text-align:center;font-size:10px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ccc;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ccc;">Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ccc;">Discount</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #ccc;">Amount</th>
        </tr></thead>
        <tbody>${itemRows(d.items, c)}</tbody>
      </table>
      ${totalsBlock(d, "#333")}
    </div>

    ${notesBlock(d.notes)}

    <div style="padding:20px 40px;border-top:2px solid #e0e0e0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#999;font-family:Georgia,serif;font-style:italic;">Thank you for your business.</p>
    </div>
  </div>`;
  return pageShell(`${label} ${d.number}`, body);
}

// ── Template: Bold ──────────────────────────────────────────

function renderBold(d: PdfData): string {
  const c = sanitizeColor(d.brandColor);
  const label = docLabel(d.documentType);
  const dateText = esc(d.date);
  const dueDateText = esc(d.dueDate);
  const body = `
  <div class="page" style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
    <!-- Full-color header -->
    <div style="padding:40px;background:${c};display:flex;justify-content:space-between;align-items:center;">
      <div>
        ${d.logoBase64 ? logoImg(d.logoBase64, 36) : `<h1 style="margin:0;font-size:22px;color:#fff;font-weight:700;">${esc(d.businessName)}</h1>`}
        ${d.tagline ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);">${esc(d.tagline)}</p>` : ""}
      </div>
      <div style="text-align:right;">
        <p style="margin:0;font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;">${label}</p>
        <p style="margin:4px 0 0;font-size:14px;color:rgba(255,255,255,0.8);font-weight:500;">${esc(d.number)}</p>
      </div>
    </div>

    <!-- Info row -->
    <div style="padding:20px 40px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #eee;">
      <div>
        <p style="margin:0 0 4px;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Bill To</p>
        <p style="margin:0;font-size:15px;color:#111;font-weight:600;">${esc(d.clientName || "---")}</p>
        ${d.clientEmail ? `<p style="margin:3px 0 0;font-size:12px;color:#666;">${esc(d.clientEmail)}</p>` : ""}
        ${d.clientAddress ? `<p style="margin:3px 0 0;font-size:12px;color:#666;white-space:pre-wrap;">${esc(d.clientAddress)}</p>` : ""}
      </div>
      <div style="text-align:right;font-size:12px;color:#666;">
        <p style="margin:0;">Date: <strong style="color:#333;">${dateText}</strong></p>
        <p style="margin:4px 0;">${dueDateLabel(d.documentType)}: <strong style="color:#333;">${dueDateText}</strong></p>
        <div style="margin-top:4px;">${statusBadge(d.status, c)}</div>
      </div>
    </div>

    <!-- Items -->
    <div style="padding:24px 40px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:${c}10;">
          <th style="padding:10px 16px;text-align:left;font-size:10px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${c}30;">Description</th>
          <th style="padding:10px 16px;text-align:center;font-size:10px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${c}30;">Qty</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${c}30;">Price</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${c}30;">Discount</th>
          <th style="padding:10px 16px;text-align:right;font-size:10px;color:${c};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${c}30;">Amount</th>
        </tr></thead>
        <tbody>${itemRows(d.items, c)}</tbody>
      </table>
      ${totalsBlock(d, c)}
    </div>

    ${notesBlock(d.notes)}

    <div style="padding:20px 40px;background:${c};text-align:center;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);">Thank you for your business.</p>
    </div>
  </div>`;
  return pageShell(`${label} ${d.number}`, body);
}

// ── Renderer dispatch ───────────────────────────────────────

const RENDERERS: Record<string, (d: PdfData) => string> = {
  clean: renderClean,
  modern: renderModern,
  classic: renderClassic,
  bold: renderBold,
};

export function renderInvoicePdf(templateId: string, data: PdfData): string {
  const render = RENDERERS[templateId] || RENDERERS.clean;
  return render(data);
}
