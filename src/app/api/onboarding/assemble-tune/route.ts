import { NextRequest, NextResponse } from "next/server";
import { kimiChat } from "@/lib/integrations/kimi";
import { rateLimit } from "@/lib/rate-limit";
import type { SchemaTuningResult } from "@/types/module-schema";

/**
 * Assembly Tuning API — called during the assembly pipeline Stage 2.
 *
 * Sends all module schemas + business context to Kimi.
 * Kimi returns personalized labels for every module, field, view,
 * status, and action — making the workspace feel custom-built.
 *
 * ONLY changes presentation text. Never structural changes.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`assemble-tune:${ip}`, 3, 120_000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const {
      industry,
      persona,
      businessName,
      businessDescription,
      location,
      personaProfile,
      modules,
    } = await req.json();

    if (!industry || !persona || !modules?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build the module summary for the prompt
    const moduleSummary = modules.map((m: {
      id: string;
      label: string;
      description: string;
      fieldLabels: { id: string; label: string }[];
      viewLabels: { id: string; label: string }[];
      statusLabels?: { value: string; label: string }[];
      primaryActionLabel?: string;
      emptyStateTitle?: string;
    }) => {
      const fields = m.fieldLabels.map((f) => `  - ${f.id}: "${f.label}"`).join("\n");
      const views = m.viewLabels.map((v) => `  - ${v.id}: "${v.label}"`).join("\n");
      const statuses = m.statusLabels?.map((s) => `  - ${s.value}: "${s.label}"`).join("\n") || "  (none)";
      return `MODULE: ${m.id}
  Current name: "${m.label}"
  Current description: "${m.description}"
  Primary action: "${m.primaryActionLabel || "Add"}"
  Empty state title: "${m.emptyStateTitle || ""}"
  Fields:\n${fields}
  Views:\n${views}
  Statuses:\n${statuses}`;
    }).join("\n\n");

    const systemPrompt = `You are a CRM personalization engine. You receive module schemas for a specific business persona and return personalized labels that make the platform feel custom-built for them. Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Personalize ALL module labels for this user's workspace. Make every label, description, and placeholder feel like it was written specifically for a ${persona} in ${industry}.

ABOUT THIS USER:
- Industry: ${industry}
- Role: ${persona}
- Business: ${businessName || "Not provided"}
- Description: ${businessDescription || "Not provided"}
- Location: ${location || "Not provided"}
${personaProfile ? `\nHOW THIS PERSONA OPERATES:\n${personaProfile}` : ""}

THEIR MODULES:
${moduleSummary}

YOUR TASK:
For EACH module, return personalized labels. Use the persona's natural language — how they'd describe these features to a peer. Keep labels short (1-4 words). Keep descriptions under 120 chars.

RULES:
- Use industry-specific terminology (e.g., "Appointments" not "Bookings" for a salon)
- Make empty state titles encouraging and specific to their work
- Primary action labels should feel natural ("Book Client" not "Create Record")
- Field labels should match how the persona talks about their data
- Status labels should match their workflow language
- Only change labels that benefit from personalization — don't rename "Email" to "Email"
- Do NOT add, remove, or reorder anything — ONLY rename labels

Return this JSON structure:
{
  "tuningResults": [
    {
      "moduleId": "module-id",
      "labelOverrides": {
        "moduleLabel": "New Name",
        "moduleDescription": "New description for this persona.",
        "fieldLabels": { "fieldId": "New Label", ... },
        "fieldPlaceholders": { "fieldId": "New placeholder...", ... },
        "viewLabels": { "viewId": "New Label", ... },
        "statusLabels": { "statusValue": "New Label", ... },
        "primaryActionLabel": "New Action Label",
        "emptyStateTitle": "New empty state title",
        "emptyStateDescription": "New empty state description."
      }
    },
    ...
  ]
}

Return tuningResults for EVERY module. Omit labelOverrides keys you don't want to change.`;

    const result = await kimiChat(systemPrompt, userPrompt, {
      model: "moonshot-v1-32k",
      maxTokens: 4096,
    });

    if (!result) {
      return NextResponse.json({ tuningResults: [] });
    }

    try {
      const data = JSON.parse(result);
      const tuningResults: SchemaTuningResult[] = data.tuningResults || [];

      // Basic sanity check — strip any results without moduleId
      const validated = tuningResults.filter((t) => t.moduleId && t.labelOverrides);

      return NextResponse.json({ tuningResults: validated });
    } catch {
      return NextResponse.json({ tuningResults: [] });
    }
  } catch (err) {
    console.error("Assembly tuning error:", err);
    return NextResponse.json({ tuningResults: [] });
  }
}
