import { NextRequest, NextResponse } from "next/server";
import { renderInvoicePdf, type PdfData } from "@/lib/invoice-templates";
import { requireWorkspaceAccess } from "@/lib/api-auth";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * POST /api/invoices/pdf
 *
 * Accepts invoice data + brand settings + template ID in the request body
 * and returns rendered HTML for print-to-PDF.
 *
 * This is a pure render endpoint — all data is passed from the client.
 * No Supabase queries needed (works in local-only mode too).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workspaceId = asString(body.workspaceId);

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing required workspaceId" }, { status: 400 });
    }

    const access = await requireWorkspaceAccess(workspaceId, "staff");
    if (access.error) {
      return access.error;
    }

    const {
      templateId = "clean",
      documentType = "invoice",
      businessName = "My Business",
      tagline = "",
      logoBase64 = "",
      brandColor = "#34D399",
      clientName = "",
      clientEmail = "",
      clientAddress = "",
      number = "",
      date = "",
      dueDate = "",
      status = "draft",
      items = [],
      subtotal = 0,
      taxRate = 0,
      taxAmount = 0,
      total = 0,
      notes = "",
    } = body;

    const pdfData: PdfData = {
      documentType: documentType === "quote" ? "quote" : "invoice",
      businessName: asString(businessName, "My Business"),
      tagline: asString(tagline),
      logoBase64: asString(logoBase64),
      brandColor: asString(brandColor, "#34D399"),
      clientName: asString(clientName),
      clientEmail: asString(clientEmail),
      clientAddress: asString(clientAddress),
      number: asString(number),
      date: asString(date),
      dueDate: asString(dueDate),
      status: asString(status, "draft"),
      items: Array.isArray(items)
        ? items.map((item) => ({
            description: asString(item?.description),
            quantity: asNumber(item?.quantity),
            unitPrice: asNumber(item?.unitPrice),
            discount: asNumber(item?.discount),
            amount: asNumber(item?.amount),
          }))
        : [],
      subtotal: asNumber(subtotal),
      taxRate: asNumber(taxRate),
      taxAmount: asNumber(taxAmount),
      total: asNumber(total),
      notes: asString(notes),
    };

    const html = renderInvoicePdf(asString(templateId, "clean"), pdfData);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Invoice PDF Error]", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
