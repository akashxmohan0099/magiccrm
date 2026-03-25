import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase-server";
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
  const { allowed } = rateLimit(`ai-insights:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, personaProfile } = await req.json();
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Fetch workspace data for analysis
    const [
      { data: clients },
      { data: bookings },
      { data: invoices },
      { data: leads },
    ] = await Promise.all([
      supabase.from("clients").select("id, name, status, created_at, last_visit_at, total_spent, visit_count, tags").eq("workspace_id", workspaceId).limit(100),
      supabase.from("bookings").select("id, client_id, service_name, status, date, created_at, satisfaction_rating, no_show").eq("workspace_id", workspaceId).order("date", { ascending: false }).limit(50),
      supabase.from("invoices").select("id, number, client_id, status, total, due_date, created_at, paid_at").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(50),
      supabase.from("leads").select("id, name, status, source, created_at, stage").eq("workspace_id", workspaceId).limit(50),
    ]);

    // Build a concise data summary for the AI
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const clientCount = clients?.length ?? 0;
    const activeClients = clients?.filter(c => c.status === "active").length ?? 0;
    const recentBookings = bookings?.filter(b => new Date(b.date) >= thirtyDaysAgo).length ?? 0;
    const noShows = bookings?.filter(b => b.no_show).length ?? 0;
    const overdueInvoices = invoices?.filter(i => i.status === "sent" && i.due_date && new Date(i.due_date) < now).length ?? 0;
    const unpaidTotal = invoices?.filter(i => i.status !== "paid").reduce((sum, i) => sum + (i.total || 0), 0) ?? 0;
    const openLeads = leads?.filter(l => l.status === "open" || l.stage === "new").length ?? 0;
    const ratedBookings = bookings?.filter(b => b.satisfaction_rating) ?? [];
    const avgRating = ratedBookings.length > 0 ? ratedBookings.reduce((sum, b) => sum + (b.satisfaction_rating ?? 0), 0) / ratedBookings.length : 0;

    // Find clients who haven't visited in 60+ days
    const lapsedClients = clients?.filter(c => {
      if (!c.last_visit_at) return false;
      return new Date(c.last_visit_at) < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    }) ?? [];

    const dataSummary = `
Workspace snapshot:
- ${clientCount} total clients (${activeClients} active)
- ${recentBookings} bookings in last 30 days
- ${noShows} no-shows in booking history
- ${overdueInvoices} overdue invoices ($${unpaidTotal.toFixed(2)} unpaid)
- ${openLeads} open leads
- ${lapsedClients.length} clients haven't visited in 60+ days
- Average satisfaction: ${avgRating ? avgRating.toFixed(1) + "/5" : "no ratings yet"}
${lapsedClients.length > 0 ? `\nLapsed clients: ${lapsedClients.slice(0, 5).map(c => c.name).join(", ")}${lapsedClients.length > 5 ? ` (+${lapsedClients.length - 5} more)` : ""}` : ""}
${overdueInvoices > 0 ? `\nOverdue invoices: ${invoices?.filter(i => i.status === "sent" && i.due_date && new Date(i.due_date) < now).slice(0, 3).map(i => `${i.number} ($${i.total})`).join(", ")}` : ""}
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
