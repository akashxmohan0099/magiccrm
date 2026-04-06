import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { buildPublicInvoicePaymentUrl } from "@/lib/public-invoice-payments";
import { verifyPortalToken, createPortalToken } from "@/lib/portal-tokens";

/**
 * Public portal API — serves client-facing portal data.
 * No auth required — uses a portal access token to identify the client.
 *
 * GET /api/public/portal?token=xxx — returns portal config + client data
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`portal:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify HMAC-signed token to extract portal_access ID
    const accessId = verifyPortalToken(token);
    if (!accessId) {
      return NextResponse.json({ error: "Invalid portal token" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    // Look up portal access by verified ID
    const { data: access, error: accessErr } = await supabase
      .from("portal_access")
      .select("*, workspace_id, client_id, client_name, enabled")
      .eq("id", accessId)
      .single();

    if (accessErr || !access || !access.enabled) {
      return NextResponse.json({ error: "Invalid or disabled portal access" }, { status: 403 });
    }

    const workspaceId = access.workspace_id;
    const clientId = access.client_id;

    // Fetch portal config
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("portal_config")
      .eq("workspace_id", workspaceId)
      .single();

    const config = settings?.portal_config ?? {
      showBookings: true,
      showInvoices: true,
      showDocuments: false,
      showMessages: false,
      showJobProgress: false,
      welcomeMessage: "Welcome to your client portal.",
      accentColor: "#34D399",
    };

    // Fetch workspace name
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    // Fetch client data based on config visibility
    const results: Record<string, unknown> = {};

    if (config.showBookings) {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, service_name, date, start_at, end_at, status")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(20);

      results.bookings = (bookings ?? []).map((booking) => {
        const startAt = booking.start_at ? new Date(booking.start_at) : null;
        const endAt = booking.end_at ? new Date(booking.end_at) : null;
        const durationMinutes =
          startAt && endAt
            ? Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000))
            : undefined;

        return {
          id: booking.id,
          service_name: booking.service_name,
          date: booking.date || booking.start_at,
          time: startAt
            ? startAt.toLocaleTimeString("en-AU", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : undefined,
          status: booking.status,
          duration_minutes: durationMinutes,
        };
      });
    }

    if (config.showInvoices) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, number, status, due_date, paid_at, created_at, client_id")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20);

      const invoiceIds = (invoices ?? []).map((invoice) => invoice.id);
      const { data: lineItems } = invoiceIds.length
        ? await supabase
            .from("invoice_line_items")
            .select("invoice_id, quantity, unit_price, discount")
            .in("invoice_id", invoiceIds)
        : { data: [] };

      const totals = new Map<string, number>();
      for (const lineItem of lineItems ?? []) {
        const amount =
          Number(lineItem.quantity ?? 0) * Number(lineItem.unit_price ?? 0) -
          Number(lineItem.discount ?? 0);
        totals.set(
          lineItem.invoice_id,
          (totals.get(lineItem.invoice_id) ?? 0) + amount,
        );
      }

      results.invoices = (invoices ?? []).map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        total: totals.get(invoice.id) ?? 0,
        due_date: invoice.due_date,
        paid_at: invoice.paid_at,
        created_at: invoice.created_at,
        payment_link:
          invoice.status !== "paid" && invoice.status !== "cancelled"
            ? buildPublicInvoicePaymentUrl({
                origin: req.nextUrl.origin,
                invoiceId: invoice.id,
                workspaceId,
                clientId,
                returnTo: `/portal/${createPortalToken(access.id)}`,
              })
            : undefined,
      }));
    }

    if (config.showDocuments) {
      const { data: documents } = await supabase
        .from("documents")
        .select("id, name, type, created_at, file_url")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20);
      results.documents = documents ?? [];
    }

    if (config.showMessages) {
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id, subject, last_message, last_message_at, channel")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("last_message_at", { ascending: false })
        .limit(10);
      results.conversations = conversations ?? [];
    }

    if (config.showJobProgress) {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, status, stage, progress, created_at, updated_at")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .limit(10);
      results.jobs = jobs ?? [];
    }

    return NextResponse.json({
      clientName: access.client_name,
      businessName: workspace?.name ?? "Business",
      config: {
        welcomeMessage: config.welcomeMessage,
        accentColor: config.accentColor,
        showBookings: config.showBookings,
        showInvoices: config.showInvoices,
        showDocuments: config.showDocuments,
        showMessages: config.showMessages,
        showJobProgress: config.showJobProgress,
      },
      ...results,
    });
  } catch (error) {
    console.error("[Portal API Error]", error);
    return NextResponse.json({ error: "Failed to load portal" }, { status: 500 });
  }
}
