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
      max_tokens: 800,
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

Generate 6 yes/no questions organized into 2 categories (3 questions each). These should help us understand what ELSE this business needs that wasn't covered by their chip selections.

Category 1: "Day-to-day operations" — questions about their daily workflows, tools, and habits
Category 2: "Growth & client experience" — questions about how they want to grow and improve client experience

Rules:
- Each question must be specific to their industry and persona
- Don't ask about things they already selected
- Focus on gaps — features they might need but didn't think to select
- Keep questions under 15 words each
- Make them conversational and easy to understand, not technical
- Each question should map to one of these modules: scheduling, projects, billing, marketing, team, automations, reporting, products, documents, communication
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
      "title": "Growth & client experience",
      "subtitle": "How you want to grow and delight clients",
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
