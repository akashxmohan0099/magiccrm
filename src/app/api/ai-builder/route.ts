import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAccess } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`ai-builder:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const { prompt, workspaceId, businessContext, personaProfile } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const { error: authError } = await requireWorkspaceAccess(workspaceId, "staff");
    if (authError) return authError;

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
${personaProfile ? `\nHow this business typically operates:\n${personaProfile}` : ""}

They requested: "${prompt}"

Describe how this feature would work in their workspace. Be specific, practical, and keep it under 200 words.
Format: Start with the feature name, then describe what it does, how the user interacts with it, and any automations included.
Make sure the feature fits how this specific type of business operates day-to-day.`,
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
