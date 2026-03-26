/**
 * Kimi (Moonshot AI) client — OpenAI-compatible API.
 *
 * Used for:
 * 1. Onboarding AI questions (smart feature discovery)
 * 2. Onboarding question rewording (vocabulary adaptation)
 * 3. Presentation patch generation (v2 — bounded AI surface)
 *
 * Base URL: https://api.moonshot.cn/v1
 * Model: moonshot-v1-8k (fast) or moonshot-v1-32k (longer context)
 */

import OpenAI from "openai";

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY || "",
  baseURL: "https://api.moonshot.cn/v1",
});

export { kimi };

/**
 * Send a chat completion to Kimi with JSON mode.
 * Falls back gracefully — returns null on any failure.
 */
export async function kimiChat(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; model?: string },
): Promise<string | null> {
  try {
    const response = await kimi.chat.completions.create({
      model: options?.model ?? "moonshot-v1-8k",
      max_tokens: options?.maxTokens ?? 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (err) {
    console.error("Kimi API error:", err);
    return null;
  }
}
