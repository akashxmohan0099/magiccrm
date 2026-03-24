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
      max_tokens: 512,
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

Based on this context, generate exactly 3 short yes/no questions that would help us understand what ELSE this business needs that wasn't already covered by their selections.

Rules:
- Each question must be specific to their industry and persona
- Don't ask about things they already selected
- Focus on gaps — features or workflows they might need but didn't think to select
- Keep questions under 12 words each
- Make them conversational, not technical
- Each question should map to a specific module: scheduling, projects, billing, marketing, team, automations, reporting, products, documents, or communication

Return ONLY a JSON array of objects with "question" and "module" fields. No explanation, no markdown, just the JSON array.

Example: [{"question":"Do you offer gift cards or vouchers?","module":"products"},{"question":"Do you need to track stock levels?","module":"products"},{"question":"Do clients sign waivers before sessions?","module":"documents"}]`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ questions: [] });
    }

    try {
      // Extract JSON from response (handle potential markdown wrapping)
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      const questions = JSON.parse(jsonStr);
      return NextResponse.json({ questions });
    } catch {
      return NextResponse.json({ questions: [] });
    }
  } catch (err) {
    console.error("AI questions error:", err);
    return NextResponse.json({ questions: [] });
  }
}
