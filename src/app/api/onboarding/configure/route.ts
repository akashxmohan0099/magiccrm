import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

/**
 * AI rewording endpoint for deep-dive configuration questions.
 *
 * The AI's ONLY job: reword pre-selected questions using the user's
 * industry vocabulary and business context. Selection logic is deterministic
 * (handled client-side by selectQuestionsForUser).
 *
 * Fallback: if AI fails, client uses the original question text.
 */
export async function POST(req: NextRequest) {
  try {
    const { industry, persona, businessName, businessDescription, vocabulary, questions, personaProfile } =
      await req.json();

    if (!industry || !persona || !questions?.length) {
      return NextResponse.json({ questions: [] });
    }

    const questionList = questions
      .map((q: { id: string; question: string; moduleId: string }) =>
        `- [${q.id}] (${q.moduleId}): "${q.question}"`
      )
      .join("\n");

    const vocabHints = vocabulary
      ? `Use this vocabulary: clients="${vocabulary.clients}", bookings="${vocabulary.bookings}", jobs="${vocabulary.jobs}", leads="${vocabulary.leads}", invoices="${vocabulary.invoices}".`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Reword these onboarding configuration questions for a ${persona} in ${industry}.
Business: ${businessName || "Not provided"}. ${businessDescription || ""}
${personaProfile ? `How this persona typically operates: ${personaProfile}` : ""}

${vocabHints}

Questions to reword:
${questionList}

Rules:
- Keep each question under 12 words
- Make them conversational and specific to this business type
- Preserve the original meaning exactly
- Use the vocabulary provided (e.g. "patients" instead of "clients" if specified)
- Return the SAME question IDs

Return ONLY valid JSON:
{
  "questions": [
    {"id": "question-id-here", "text": "reworded question text"},
    ...
  ]
}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ questions: [] });
    }

    try {
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ questions: [] });
    }
  } catch (err) {
    console.error("Configure reword error:", err);
    return NextResponse.json({ questions: [] });
  }
}
