import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are MagicAI, the built-in assistant for Magic — a business management platform. You can read and write data across the workspace: clients, bookings, invoices, leads, jobs, and products.

When the user asks you to do something:
1. If you need clarification, ask before acting
2. If you have enough info, use the appropriate tool
3. After acting, confirm what you did in natural language

Be conversational, brief, and helpful. Use the user's language (if they say "appointment" you say "appointment", not "booking").

The current workspace data is provided in each message. Use it to answer questions and find records.`;

const tools: Anthropic.Tool[] = [
  // ── Read tools ──────────────────────────────────────────
  {
    name: "list_clients",
    description:
      "List all clients in the workspace. Returns name, id, email, phone, status, and tags for each client.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_bookings",
    description:
      "List all bookings/appointments in the workspace. Returns title, client, date, time, status for each booking.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_leads",
    description:
      "List all leads in the pipeline. Returns name, stage, value, email, phone for each lead.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_invoices",
    description:
      "List all invoices. Returns number, clientId, status, line items total for each invoice.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_jobs",
    description:
      "List all jobs/projects. Returns title, clientId, stage, due date for each job.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_products",
    description:
      "List all products and services. Returns name, price, category, stock status for each product.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },

  // ── Write tools ─────────────────────────────────────────
  {
    name: "create_client",
    description:
      "Create a new client in the workspace. Requires at least a name.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Client's full name" },
        email: { type: "string", description: "Client's email address" },
        phone: { type: "string", description: "Client's phone number" },
        notes: { type: "string", description: "Any notes about the client" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags to categorize the client",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "create_booking",
    description:
      "Create a new booking/appointment. Requires title, clientId, date, start and end time.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Title or service name for the booking" },
        clientId: { type: "string", description: "ID of the client this booking is for" },
        date: { type: "string", description: "Date of the booking in YYYY-MM-DD format" },
        startTime: { type: "string", description: "Start time in HH:MM (24h) format" },
        endTime: { type: "string", description: "End time in HH:MM (24h) format" },
        serviceId: { type: "string", description: "Optional service ID" },
        price: { type: "number", description: "Optional price for the booking" },
      },
      required: ["title", "clientId", "date", "startTime", "endTime"],
    },
  },
  {
    name: "cancel_booking",
    description:
      "Cancel an existing booking by setting its status to cancelled.",
    input_schema: {
      type: "object" as const,
      properties: {
        bookingId: { type: "string", description: "ID of the booking to cancel" },
        reason: { type: "string", description: "Optional cancellation reason" },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "update_booking",
    description:
      "Update an existing booking's date, time, or status.",
    input_schema: {
      type: "object" as const,
      properties: {
        bookingId: { type: "string", description: "ID of the booking to update" },
        date: { type: "string", description: "New date in YYYY-MM-DD format" },
        startTime: { type: "string", description: "New start time in HH:MM format" },
        endTime: { type: "string", description: "New end time in HH:MM format" },
        status: {
          type: "string",
          enum: ["confirmed", "pending", "cancelled", "completed"],
          description: "New status",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "create_lead",
    description:
      "Create a new lead in the pipeline. Requires at least a name.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Lead's full name" },
        email: { type: "string", description: "Lead's email address" },
        phone: { type: "string", description: "Lead's phone number" },
        source: { type: "string", description: "How the lead was acquired (e.g. referral, website)" },
        notes: { type: "string", description: "Notes about the lead" },
        value: { type: "number", description: "Estimated deal value" },
      },
      required: ["name"],
    },
  },
  {
    name: "create_invoice",
    description:
      "Create a new invoice for a client with line items.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string", description: "ID of the client to invoice" },
        lineItems: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              quantity: { type: "number" },
              unitPrice: { type: "number" },
            },
            required: ["description", "quantity", "unitPrice"],
          },
          description: "Line items for the invoice",
        },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
      },
      required: ["clientId", "lineItems"],
    },
  },
  {
    name: "create_job",
    description:
      "Create a new job/project. Requires at least a title.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Title of the job" },
        description: { type: "string", description: "Description of the job" },
        clientId: { type: "string", description: "ID of the client this job is for" },
        dueDate: { type: "string", description: "Due date in YYYY-MM-DD format" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_client",
    description:
      "Update an existing client's information.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string", description: "ID of the client to update" },
        name: { type: "string", description: "New name" },
        email: { type: "string", description: "New email" },
        phone: { type: "string", description: "New phone" },
        status: {
          type: "string",
          enum: ["active", "inactive", "prospect", "vip", "churned"],
          description: "New status",
        },
        notes: { type: "string", description: "New notes" },
      },
      required: ["clientId"],
    },
  },
];

// Context type from client
interface WorkspaceContext {
  clients: { id: string; name: string; email: string; phone: string; status: string; tags: string[] }[];
  bookings: { id: string; title: string; clientId?: string; clientName?: string; date: string; startTime: string; endTime: string; status: string }[];
  leads: { id: string; name: string; email: string; stage: string; value?: number }[];
  invoices: { id: string; number: string; clientId?: string; status: string; total: number }[];
  jobs: { id: string; title: string; clientId?: string; stage: string; dueDate?: string }[];
  products: { id: string; name: string; price: number; category: string }[];
}

function buildContextBlock(context: WorkspaceContext): string {
  const parts: string[] = ["## Current Workspace Data\n"];

  if (context.clients.length > 0) {
    parts.push(`### Clients (${context.clients.length})`);
    for (const c of context.clients) {
      parts.push(`- ${c.name} (id: ${c.id}) — ${c.email || "no email"}, ${c.phone || "no phone"}, status: ${c.status}${c.tags.length ? `, tags: ${c.tags.join(", ")}` : ""}`);
    }
    parts.push("");
  } else {
    parts.push("### Clients\nNo clients yet.\n");
  }

  if (context.bookings.length > 0) {
    parts.push(`### Bookings (${context.bookings.length})`);
    for (const b of context.bookings) {
      parts.push(`- "${b.title}" (id: ${b.id}) — ${b.date} ${b.startTime}-${b.endTime}, status: ${b.status}${b.clientName ? `, client: ${b.clientName}` : ""}`);
    }
    parts.push("");
  } else {
    parts.push("### Bookings\nNo bookings yet.\n");
  }

  if (context.leads.length > 0) {
    parts.push(`### Leads (${context.leads.length})`);
    for (const l of context.leads) {
      parts.push(`- ${l.name} (id: ${l.id}) — stage: ${l.stage}${l.value ? `, value: $${l.value}` : ""}, ${l.email || "no email"}`);
    }
    parts.push("");
  } else {
    parts.push("### Leads\nNo leads yet.\n");
  }

  if (context.invoices.length > 0) {
    parts.push(`### Invoices (${context.invoices.length})`);
    for (const inv of context.invoices) {
      parts.push(`- ${inv.number} (id: ${inv.id}) — status: ${inv.status}, total: $${inv.total.toFixed(2)}`);
    }
    parts.push("");
  } else {
    parts.push("### Invoices\nNo invoices yet.\n");
  }

  if (context.jobs.length > 0) {
    parts.push(`### Jobs (${context.jobs.length})`);
    for (const j of context.jobs) {
      parts.push(`- "${j.title}" (id: ${j.id}) — stage: ${j.stage}${j.dueDate ? `, due: ${j.dueDate}` : ""}`);
    }
    parts.push("");
  } else {
    parts.push("### Jobs\nNo jobs yet.\n");
  }

  if (context.products.length > 0) {
    parts.push(`### Products (${context.products.length})`);
    for (const p of context.products) {
      parts.push(`- ${p.name} (id: ${p.id}) — $${p.price}, category: ${p.category}`);
    }
    parts.push("");
  } else {
    parts.push("### Products\nNo products yet.\n");
  }

  return parts.join("\n");
}

function handleReadTool(
  toolName: string,
  context: WorkspaceContext
): string {
  switch (toolName) {
    case "list_clients":
      return JSON.stringify(context.clients);
    case "list_bookings":
      return JSON.stringify(context.bookings);
    case "list_leads":
      return JSON.stringify(context.leads);
    case "list_invoices":
      return JSON.stringify(context.invoices);
    case "list_jobs":
      return JSON.stringify(context.jobs);
    case "list_products":
      return JSON.stringify(context.products);
    default:
      return "[]";
  }
}

const READ_TOOLS = new Set([
  "list_clients",
  "list_bookings",
  "list_leads",
  "list_invoices",
  "list_jobs",
  "list_products",
]);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`ai-chat:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { message, context } = (await req.json()) as {
      message: string;
      context: WorkspaceContext;
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const contextBlock = buildContextBlock(context);

    // Build conversation messages for Claude
    const messages: Anthropic.MessageParam[] = [
      {
        role: "user",
        content: `${contextBlock}\n\n---\n\nUser message: ${message}`,
      },
    ];

    // First API call
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    const allToolCalls: {
      name: string;
      input: Record<string, unknown>;
      result?: string;
    }[] = [];

    // Process tool use in a loop (Claude may want to call multiple tools, or
    // read data then respond). We cap iterations to prevent runaway loops.
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (response.stop_reason === "tool_use" && iterations < MAX_ITERATIONS) {
      iterations++;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ContentBlock & { type: "tool_use" } =>
          b.type === "tool_use"
      );

      // Build tool results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        const input = block.input as Record<string, unknown>;

        if (READ_TOOLS.has(block.name)) {
          // Handle read tools server-side
          const result = handleReadTool(block.name, context);
          allToolCalls.push({ name: block.name, input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        } else {
          // Write tools — return a success placeholder, client will execute
          allToolCalls.push({ name: block.name, input });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
              success: true,
              message: `Tool "${block.name}" will be executed on the client.`,
            }),
          });
        }
      }

      // Continue the conversation with tool results
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });
    }

    // Extract the final text response
    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const responseText = textBlocks.map((b) => b.text).join("\n");

    return NextResponse.json({
      response: responseText,
      toolCalls: allToolCalls,
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
