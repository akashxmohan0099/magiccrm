import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/api-auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { prompt, businessContext } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an AI assistant for Magic, a custom business software platform for small businesses.

A user with the following business context wants to build a custom feature:
- Business: ${businessContext?.businessName || "Unknown"}
- Industry: ${businessContext?.industry || "Unknown"}
- Description: ${businessContext?.description || "Unknown"}

They requested: "${prompt}"

Describe how this feature would work in their workspace. Be specific, practical, and keep it under 200 words.
Format: Start with the feature name, then describe what it does, how the user interacts with it, and any automations included.`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const result = textContent ? textContent.text : "Feature generated successfully.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI Builder error:", error);
    return NextResponse.json(
      { error: "Failed to generate feature" },
      { status: 500 }
    );
  }
}
