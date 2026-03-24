import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { industry, persona, businessName, businessDescription, location, selectedChips } = await req.json();

    if (!industry || !persona) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const chipLabels = (selectedChips || []).join(", ");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are helping personalize a business software platform during onboarding.

Here is what we know about this user:
- Industry: ${industry}
- Business type: ${persona}
- Business name: ${businessName || "Not provided"}
- What they do: ${businessDescription || "Not provided"}
- Location: ${location || "Not provided"}
- Activities they selected: ${chipLabels || "None selected"}

Generate 9 yes/no questions organized into 3 categories (3 questions each). These should help us understand what ELSE this business needs that wasn't covered by their chip selections.

Category 1: "Day-to-day operations" — questions about their daily workflows and tools
Category 2: "Client experience" — questions about how they interact with and serve clients
Category 3: "Business growth" — questions about scaling, efficiency, and tracking

IMPORTANT — Do NOT ask about:
- Social media posting or scheduling (we don't have that feature)
- Review collection (we don't have that feature)
- Anything related to posting content online
- Things the user already selected in their chip answers

DO ask about real features we have:
- scheduling: appointments, calendar, online booking, reminders, waitlist
- projects: job tracking, tasks, milestones, time tracking
- billing: invoices, quotes, deposits, recurring billing, proposals
- team: staff management, rosters, permissions
- automations: auto-reminders, follow-ups, status updates
- reporting: revenue tracking, dashboards, performance reports
- products: service catalog, pricing, inventory
- documents: contracts, agreements, e-signatures
- communication: email, SMS, WhatsApp, unified inbox
- marketing: email campaigns, referral codes, coupons (NOT social media posting)

Rules:
- Each question must be specific to their industry and persona
- Keep questions under 15 words each
- Make them conversational, not technical
- Include a short friendly subtitle for each category (under 10 words)

Return ONLY valid JSON with this exact structure:
{
  "categories": [
    {
      "title": "Day-to-day operations",
      "subtitle": "How you run things behind the scenes",
      "questions": [
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."}
      ]
    },
    {
      "title": "Client experience",
      "subtitle": "How you serve and communicate with clients",
      "questions": [
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."}
      ]
    },
    {
      "title": "Business growth",
      "subtitle": "How you want to scale and improve",
      "questions": [
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."},
        {"question": "...", "module": "..."}
      ]
    }
  ]
}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ categories: [] });
    }

    try {
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ categories: [] });
    }
  } catch (err) {
    console.error("AI questions error:", err);
    return NextResponse.json({ categories: [] });
  }
}
