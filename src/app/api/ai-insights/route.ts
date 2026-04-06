import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAccess } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic();

/**
 * AI Insights engine — analyzes workspace data and generates actionable insights.
 *
 * Called from the dashboard to generate fresh insights based on real business data.
 * Uses Claude to analyze patterns in bookings, invoices, clients, and jobs.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`ai-insights:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const { workspaceId, personaProfile } = await req.json();
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const access = await requireWorkspaceAccess(workspaceId, "staff");
    if (access.error) return access.error;

    const { supabase } = access;

    const [
      { data: clients, error: clientsError },
      { data: bookings, error: bookingsError },
      { data: invoices, error: invoicesError },
      { data: leads, error: leadsError },
      { data: invoiceLineItems, error: invoiceLineItemsError },
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, status, created_at, tags")
        .eq("workspace_id", workspaceId)
        .limit(100),
      supabase
        .from("bookings")
        .select("id, client_id, service_name, status, date, created_at, satisfaction_rating, cancellation_reason")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false })
        .limit(100),
      supabase
        .from("invoices")
        .select("id, number, client_id, status, due_date, created_at, paid_amount")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("leads")
        .select("id, name, source, stage, last_contacted_at, next_follow_up_date, created_at")
        .eq("workspace_id", workspaceId)
        .limit(50),
      supabase
        .from("invoice_line_items")
        .select("invoice_id, quantity, unit_price, discount")
        .eq("workspace_id", workspaceId),
    ]);

    const queryErrors = [
      clientsError,
      bookingsError,
      invoicesError,
      leadsError,
      invoiceLineItemsError,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      console.error("[AI Insights] Failed to load workspace data:", queryErrors);
      return NextResponse.json({ error: "Failed to load workspace data" }, { status: 500 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const invoiceTotals = new Map<string, number>();
    for (const item of invoiceLineItems ?? []) {
      const amount =
        Number(item.quantity ?? 0) * Number(item.unit_price ?? 0) -
        Number(item.discount ?? 0);
      invoiceTotals.set(
        item.invoice_id,
        (invoiceTotals.get(item.invoice_id) ?? 0) + amount,
      );
    }

    const latestBookingByClient = new Map<string, Date>();
    for (const booking of bookings ?? []) {
      if (!booking.client_id || booking.status === "cancelled") continue;
      const bookingDate = new Date(booking.date);
      const currentLatest = latestBookingByClient.get(booking.client_id);
      if (!currentLatest || bookingDate > currentLatest) {
        latestBookingByClient.set(booking.client_id, bookingDate);
      }
    }

    const clientCount = clients?.length ?? 0;
    const activeClients = clients?.filter(c => c.status === "active").length ?? 0;
    const recentBookings = bookings?.filter(b => new Date(b.date) >= thirtyDaysAgo).length ?? 0;
    const noShows = bookings?.filter(
      (b) =>
        b.status === "cancelled" &&
        typeof b.cancellation_reason === "string" &&
        /no[- ]show/i.test(b.cancellation_reason),
    ).length ?? 0;
    const overdueInvoices = invoices?.filter(
      (i) =>
        i.status !== "paid" &&
        i.status !== "cancelled" &&
        i.due_date &&
        new Date(i.due_date) < now,
    ) ?? [];
    const unpaidTotal = invoices?.filter(
      (i) => i.status !== "paid" && i.status !== "cancelled",
    ).reduce((sum, i) => sum + (invoiceTotals.get(i.id) ?? 0), 0) ?? 0;
    const openLeads = leads?.filter(
      (l) => !["won", "lost", "closed", "converted"].includes(String(l.stage ?? "").toLowerCase()),
    ).length ?? 0;
    const ratedBookings = bookings?.filter(b => b.satisfaction_rating) ?? [];
    const avgRating = ratedBookings.length > 0 ? ratedBookings.reduce((sum, b) => sum + (b.satisfaction_rating ?? 0), 0) / ratedBookings.length : 0;

    const lapsedClients = clients?.filter(c => {
      const lastBooking = latestBookingByClient.get(c.id);
      if (!lastBooking) return false;
      return lastBooking < sixtyDaysAgo;
    }) ?? [];

    const dataSummary = `
Workspace snapshot:
- ${clientCount} total clients (${activeClients} active)
- ${recentBookings} bookings in last 30 days
- ${noShows} no-shows in booking history
- ${overdueInvoices.length} overdue invoices ($${unpaidTotal.toFixed(2)} unpaid)
- ${openLeads} open leads
- ${lapsedClients.length} clients haven't visited in 60+ days
- Average satisfaction: ${avgRating ? avgRating.toFixed(1) + "/5" : "no ratings yet"}
${lapsedClients.length > 0 ? `\nLapsed clients: ${lapsedClients.slice(0, 5).map(c => c.name).join(", ")}${lapsedClients.length > 5 ? ` (+${lapsedClients.length - 5} more)` : ""}` : ""}
${overdueInvoices.length > 0 ? `\nOverdue invoices: ${overdueInvoices.slice(0, 3).map(i => `${i.number} ($${(invoiceTotals.get(i.id) ?? 0).toFixed(2)})`).join(", ")}` : ""}
    `.trim();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an AI business analyst for a CRM platform. Analyze this workspace data and generate 3-5 actionable insights.
${personaProfile ? `\nHow this business typically operates:\n${personaProfile}\n\nUse this context to make insights specific to how this type of business works — their seasonal patterns, payment models, client interaction style, and common challenges.\n` : ""}
${dataSummary}

Rules:
- Each insight should be specific and actionable (not generic advice)
- Prioritize: revenue recovery > client retention > operational efficiency > growth
- If overdue invoices exist, always include one about that
- If lapsed clients exist, always include one about re-engagement
- If no-shows are high (>10%), include one about that
- Keep titles under 8 words, descriptions under 25 words
- Use these types: rebooking-alert, revenue-insight, churn-risk, performance-tip, follow-up-needed

Return ONLY valid JSON:
{
  "insights": [
    {
      "type": "revenue-insight",
      "title": "...",
      "description": "...",
      "priority": "high|medium|low",
      "entityType": "client|lead|booking|invoice" (optional),
      "entityName": "..." (optional),
      "actionLabel": "..." (optional, e.g. "Send reminder", "View invoice")
    }
  ]
}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ insights: [] });
    }

    try {
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ insights: [] });
    }
  } catch (err) {
    console.error("[AI Insights Error]", err);
    return NextResponse.json({ insights: [] });
  }
}
