import { NextRequest, NextResponse } from "next/server";
import { kimiChat } from "@/lib/integrations/kimi";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`ai-questions:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const {
      industry,
      persona,
      businessName,
      businessDescription,
      location,
      selectedChips,
      activatedModules,
      declinedModules,
      localQuestionTopics,
      personaProfile,
    } = await req.json();

    if (!industry || !persona) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const chipLabels = (selectedChips || []).join(", ");
    const activeModules = (activatedModules || []).join(", ");
    const declined = (declinedModules || []).join(", ");
    const localTopics = (localQuestionTopics || []).join("\n- ");
    const profileContext = personaProfile || "";

    const systemPrompt = "You are an onboarding assistant for a CRM platform. Return ONLY valid JSON. No markdown, no explanation.";

    const userPrompt = `You are helping personalize a CRM platform during onboarding. The user just answered activity-based questions and some deterministic follow-ups. Now generate 4 smart questions to uncover what they STILL missed.

ABOUT THIS USER:
- Industry: ${industry}
- Role: ${persona}
- Business: ${businessName || "Not provided"}
- Description: ${businessDescription || "Not provided"}
- Location: ${location || "Not provided"}
${profileContext ? `\nHOW THIS PERSONA TYPICALLY OPERATES:\n${profileContext}` : ""}

WHAT THEY ALREADY TOLD US (do NOT repeat these topics):
${chipLabels || "Nothing selected"}

MODULES ALREADY ACTIVATED (do NOT ask about these):
${activeModules || "None"}

MODULES THE USER EXPLICITLY DECLINED (do NOT ask about these either):
${declined || "None"}
${localTopics ? `\nLOCAL FOLLOW-UP QUESTIONS ALREADY BEING ASKED (do NOT cover these topics):\n- ${localTopics}` : ""}

Generate exactly 4 yes/no questions in 2 categories (2 each).

Category 1: "A few more about your workflow"
Category 2: "Things you might find useful"

AVAILABLE MODULE KEYS — use exactly one per question:
Core modules (prioritize these if not already activated):
- scheduling: appointments, calendar, availability, reminders
- projects: job tracking, tasks, milestones, time tracking
- marketing: campaigns, referral codes, coupons, email blasts
- products: service catalog, pricing, inventory
- team: staff management, roles, permissions, rosters
- automations: auto-reminders, follow-ups, recurring tasks
- reporting: revenue tracking, dashboards, performance reports
- client-portal: self-service hub for clients to view bookings, invoices, history

Add-ons (only ask if highly relevant to this persona):
- documents: contracts, agreements, e-signatures
- waitlist: walk-in queues, auto-notify when spots open
- proposals: branded proposal pages with interactive pricing

STRICT RULES:
- NEVER ask about modules already activated (listed above)
- NEVER ask about modules the user explicitly declined (listed above)
- NEVER ask about features the user already selected in their chip answers
- NEVER ask about topics already covered by local follow-up questions (listed above)
- NEVER ask about social media posting, review collection, or content publishing
- NEVER ask about billing, invoicing, or payment — everyone gets that
- NEVER ask about messaging or communication channels — everyone gets that
- NEVER ask about travel or travel charges — already handled locally
- Each question must feel natural for a ${persona} in ${industry}
- Questions must be under 12 words, conversational, not technical
- Ask about real business needs, not granular settings
- Prioritize core module gaps over add-ons
- If a module is already activated, skip it entirely — find a DIFFERENT gap

Return ONLY valid JSON:
{
  "categories": [
    {
      "title": "A few more about your workflow",
      "subtitle": "...",
      "questions": [
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."}
      ]
    },
    {
      "title": "Things you might find useful",
      "subtitle": "...",
      "questions": [
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."}
      ]
    }
  ]
}`;

    const result = await kimiChat(systemPrompt, userPrompt);

    if (!result) {
      return NextResponse.json({ categories: [] });
    }

    try {
      const data = JSON.parse(result);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ categories: [] });
    }
  } catch (err) {
    console.error("AI questions error:", err);
    return NextResponse.json({ categories: [] });
  }
}
