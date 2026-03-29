import { NextRequest, NextResponse } from "next/server";
import { renderInvoicePdf, type PdfData } from "@/lib/invoice-templates";

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
      documentType,
      businessName,
      tagline,
      logoBase64,
      brandColor,
      clientName,
      clientEmail,
      clientAddress,
      number,
      date,
      dueDate,
      status,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes,
    };

    const html = renderInvoicePdf(templateId, pdfData);

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
