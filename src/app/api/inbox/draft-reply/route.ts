/**
 * Generate an LLM draft reply for an inbox conversation. Operator approves
 * + edits before send — we never auto-send.
 *
 * POST /api/inbox/draft-reply
 * Body: { conversationId, facts? }
 *
 * Returns: { draft: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { draftInboxReply, type InboxMessage } from "@/lib/integrations/llm";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimit(`inbox-draft:${ip}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("auth_user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!member?.workspace_id) {
    return NextResponse.json({ error: "No active workspace" }, { status: 403 });
  }
  const workspaceId = member.workspace_id as string;

  let body: { conversationId?: string; facts?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
  }

  // Pull the conversation + last 20 messages + workspace name.
  const [{ data: convo }, { data: messages }, { data: settings }] = await Promise.all([
    admin
      .from("conversations")
      .select("client_id, channel")
      .eq("id", body.conversationId)
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    admin
      .from("messages")
      .select("body, direction, sent_at")
      .eq("conversation_id", body.conversationId)
      .order("sent_at", { ascending: true })
      .limit(20),
    admin
      .from("workspace_settings")
      .select("business_name")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
  ]);

  if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  let clientName: string | undefined;
  if (convo.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("name")
      .eq("id", convo.client_id as string)
      .maybeSingle();
    clientName = (client?.name as string) ?? undefined;
  }

  const thread: InboxMessage[] = (messages ?? []).map((m) => ({
    role: (m.direction as string) === "inbound" ? "client" : "operator",
    body: (m.body as string) ?? "",
    at: (m.sent_at as string) ?? undefined,
  }));

  if (thread.length === 0) {
    return NextResponse.json({ error: "No messages to draft from" }, { status: 400 });
  }

  try {
    const draft = await draftInboxReply({
      businessName: (settings?.business_name as string) ?? "the salon",
      clientName,
      thread,
      facts: body.facts,
    });
    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM error";
    if (/ANTHROPIC_API_KEY/.test(message)) {
      return NextResponse.json({ error: "AI replies are not configured." }, { status: 503 });
    }
    console.error("[inbox/draft-reply] error:", err);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
