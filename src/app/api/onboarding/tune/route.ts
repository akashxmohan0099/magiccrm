import { NextRequest, NextResponse } from "next/server";
import { kimiChat } from "@/lib/integrations/kimi";
import { rateLimit } from "@/lib/rate-limit";
import { getApplicableCombinations, combinationsConflict } from "@/lib/module-combinations";
import { getModuleById } from "@/lib/module-registry";
import type { PresentationPatch } from "@/types/workspace-blueprint";
import { validatePatch } from "@/lib/workspace-blueprints/validator";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`tune:${ip}`, 5, 60_000);
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
      chipSelections,
      enabledModuleIds,
      vocabulary,
      personaProfile,
    } = await req.json();

    if (!industry || !persona || !enabledModuleIds?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get applicable combinations for this persona
    const applicableCombos = getApplicableCombinations(industry, persona, enabledModuleIds);

    // Build the module list with current names for the AI
    const moduleList = enabledModuleIds
      .map((id: string) => {
        const mod = getModuleById(id);
        return mod ? `- ${mod.id} (currently "${mod.name}"): ${mod.description}` : null;
      })
      .filter(Boolean)
      .join("\n");

    // Build combination options for the AI
    const comboOptions = applicableCombos.length > 0
      ? applicableCombos.map((c) => {
          const mergedNames = c.mergedModuleIds
            .map((id) => getModuleById(id)?.name || id)
            .join(" + ");
          return `- "${c.id}": Merges ${mergedNames} → "${c.defaultLabel}" (${c.semanticTags.join(", ")})`;
        }).join("\n")
      : "No combinations are applicable for this persona.";

    const chipContext = (chipSelections || []).join(", ");
    const vocabContext = vocabulary
      ? `They call clients "${vocabulary.client}", jobs "${vocabulary.job}", bookings "${vocabulary.booking}", invoices "${vocabulary.invoice}".`
      : "";

    const systemPrompt = "You are a CRM personalization engine. Based on user context, you select module combinations and generate persona-specific module names and descriptions. Return ONLY valid JSON. No markdown, no explanation.";

    const userPrompt = `Personalize a CRM workspace for this user. Select applicable module combinations and generate persona-specific names and descriptions for all their enabled modules.

ABOUT THIS USER:
- Industry: ${industry}
- Role: ${persona}
- Business: ${businessName || "Not provided"}
- Description: ${businessDescription || "Not provided"}
- Location: ${location || "Not provided"}
- Their workflow preferences: ${chipContext || "Not specified"}
${vocabContext}
${personaProfile ? `\nHOW THIS PERSONA TYPICALLY OPERATES:\n${personaProfile}` : ""}

THEIR ENABLED MODULES:
${moduleList}

AVAILABLE MODULE COMBINATIONS (select 0 or more — only if the combination fits this user's workflow):
${comboOptions}

YOUR TASK:

1. COMBINATIONS: Decide which combinations to apply (if any). Only select a combination if it genuinely simplifies this user's workflow. A ${persona} who doesn't send separate quotes and just books + collects payment should get "book-pay". A ${persona} who schedules site visits and tracks job progress should get "schedule-jobs". If neither fits, select none.

2. MODULE NAMES & DESCRIPTIONS: For EVERY enabled module, generate a short, persona-specific name (1-3 words, max 40 chars) and description (1 sentence, max 120 chars). The name and description should feel like they were written specifically for a ${persona}. Use their industry language, not generic CRM jargon.

For modules that are part of a selected combination, still provide individual meta — these are used as fallback.

STRICT RULES:
- Only select combinations from the AVAILABLE list above
- Never invent new combinations
- Names must be 1-40 characters
- Descriptions must be 1-120 characters
- Use the persona's natural language — how they'd describe these features to a peer
- If a combination is selected, you may also provide a custom label and description for it

Return ONLY valid JSON:
{
  "combinations": [
    {"id": "combination-id", "label": "Custom Label", "description": "Custom description for this persona."}
  ],
  "moduleMeta": {
    "module-id": {"label": "Persona Name", "description": "Persona-specific one-liner."},
    "another-module-id": {"label": "...", "description": "..."}
  }
}

If no combinations are applicable, return an empty "combinations" array. Always return "moduleMeta" for all enabled modules.`;

    const result = await kimiChat(systemPrompt, userPrompt, {
      model: "moonshot-v1-32k",
      maxTokens: 2048,
    });

    if (!result) {
      return NextResponse.json({ patches: [], moduleMeta: {} });
    }

    try {
      const data = JSON.parse(result);

      // Build a minimal functional config for patch validation
      const functionalForValidation = {
        workflowPattern: "booking-first" as const,
        enabledModules: enabledModuleIds as string[],
        enabledAddons: [] as string[],
        moduleBehaviors: [],
      };

      const patches: PresentationPatch[] = [];
      const selectedCombinationIds: string[] = [];

      // Process combination selections
      if (Array.isArray(data.combinations)) {
        for (const combo of data.combinations) {
          if (!combo.id) continue;

          // Check for conflicts with already-selected combinations
          const conflicts = selectedCombinationIds.some((existingId) =>
            combinationsConflict(existingId, combo.id) || combinationsConflict(combo.id, existingId)
          );
          if (conflicts) continue;

          const patch: PresentationPatch = {
            op: "apply-module-combination",
            combinationId: combo.id,
            ...(combo.label ? { label: combo.label } : {}),
            ...(combo.description ? { description: combo.description } : {}),
          };

          const error = validatePatch(patch, functionalForValidation);
          if (error === null) {
            patches.push(patch);
            selectedCombinationIds.push(combo.id);
          }
        }
      }

      // Process module meta overrides
      const moduleMeta: Record<string, { label: string; description: string }> = {};
      if (data.moduleMeta && typeof data.moduleMeta === "object") {
        for (const [moduleId, meta] of Object.entries(data.moduleMeta)) {
          const m = meta as { label?: string; description?: string };
          if (!m.label || !m.description) continue;

          const patch: PresentationPatch = {
            op: "set-module-meta",
            moduleId,
            label: m.label.slice(0, 40),
            description: m.description.slice(0, 120),
          };

          const error = validatePatch(patch, functionalForValidation);
          if (error === null) {
            patches.push(patch);
            moduleMeta[moduleId] = { label: m.label.slice(0, 40), description: m.description.slice(0, 120) };
          }
        }
      }

      return NextResponse.json({ patches, moduleMeta });
    } catch {
      return NextResponse.json({ patches: [], moduleMeta: {} });
    }
  } catch (err) {
    console.error("Tuning API error:", err);
    return NextResponse.json({ patches: [], moduleMeta: {} });
  }
}
