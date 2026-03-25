import type { BusinessContext } from "@/types/onboarding";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";

export async function requestBuilderBrief(args: {
  prompt: string;
  businessContext: BusinessContext;
  selectedPersona?: string;
}): Promise<string> {
  const response = await fetch("/api/ai-builder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: args.prompt,
      businessContext: {
        businessName: args.businessContext.businessName,
        industry: args.businessContext.industry,
        description: args.businessContext.businessDescription,
      },
      personaProfile: args.selectedPersona ? getProfileForAIPrompt(args.selectedPersona) : undefined,
    }),
  });

  const payload = (await response.json()) as { result?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Unable to generate AI brief");
  }

  return payload.result || "Request submitted successfully.";
}
