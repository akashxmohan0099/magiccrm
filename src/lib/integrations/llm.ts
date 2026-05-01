/**
 * LLM helpers — auto-reply drafts for the client inbox. We use Anthropic's
 * SDK directly with a small system prompt; no streaming since the operator
 * approves before send. Failures throw so the calling endpoint can return
 * a 503 (LLM unavailable) instead of a fake confident-but-wrong reply.
 */
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  _client = new Anthropic({ apiKey: key });
  return _client;
}

const MODEL = "claude-haiku-4-5-20251001";

export interface InboxMessage {
  /** "client" = inbound from customer, "operator" = staff reply. */
  role: "client" | "operator";
  body: string;
  channel?: string;
  /** ISO timestamp for ordering. */
  at?: string;
}

export interface DraftReplyContext {
  businessName: string;
  /** Optional client name to personalize the draft. */
  clientName?: string;
  /** Recent inbox messages, oldest first. */
  thread: InboxMessage[];
  /**
   * Optional facts the operator wants the model to consider — service
   * pricing, opening hours, "we don't take walk-ins on Sundays". Each
   * line is treated as a discrete fact.
   */
  facts?: string[];
}

export async function draftInboxReply(ctx: DraftReplyContext): Promise<string> {
  const client = getClient();

  // System prompt is tight on tone + format. We always reply as the
  // operator (third-person reference to the salon), warm but brief.
  const factsBlock = ctx.facts && ctx.facts.length > 0
    ? `\n\nKnown facts about ${ctx.businessName}:\n${ctx.facts.map((f) => `- ${f}`).join("\n")}`
    : "";

  const system = `You draft short, warm SMS-style replies for ${ctx.businessName}, a beauty/wellness salon. Reply as the salon staff would. Aim for 1–3 sentences. Use the client's name only when natural. Never invent prices, hours, or policies — if the client asks for something not in the facts below, say you'll check and get back to them.${factsBlock}`;

  const transcript = ctx.thread
    .map((m) => `${m.role === "client" ? "Client" : "Salon"}: ${m.body}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system,
    messages: [
      {
        role: "user",
        content: `Here is the conversation so far:\n\n${transcript}\n\nWrite ONLY the salon's next reply. No preface, no commentary, no quotes — just the message text.`,
      },
    ],
  });

  // Extract the text from the response. Anthropic returns content blocks;
  // we only care about the first text block.
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("LLM returned no text content");
  }
  return block.text.trim();
}
