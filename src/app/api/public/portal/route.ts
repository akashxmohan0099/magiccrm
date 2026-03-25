import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Public portal API — serves client-facing portal data.
 * No auth required — uses a portal access token to identify the client.
 *
 * GET /api/public/portal?token=xxx — returns portal config + client data
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Look up portal access by token (the access ID serves as token)
    const { data: access, error: accessErr } = await supabase
      .from("portal_access")
      .select("*, workspace_id, client_id, client_name, enabled")
      .eq("id", token)
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
        .select("id, service_name, date, time, status, duration_minutes")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("date", { ascending: false })
        .limit(20);
      results.bookings = bookings ?? [];
    }

    if (config.showInvoices) {
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, number, status, total, due_date, paid_at, created_at, payment_link")
        .eq("workspace_id", workspaceId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(20);
      results.invoices = invoices ?? [];
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
