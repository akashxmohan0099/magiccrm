import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createConnectLink, listConversations, getMessages, sendMessage, sendEmail } from "@/lib/integrations/unipile";
import { requireWorkspaceAccess } from "@/lib/api-auth";

/**
 * Unipile API routes.
 * GET: List accounts or conversations.
 * POST: Send message, connect account, or send email.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const { error: authError } = await requireWorkspaceAccess(workspaceId, "staff");
    if (authError) return authError;

    const resource = searchParams.get("resource");

    switch (resource) {
      case "accounts":
        return NextResponse.json(await listAccounts());
      case "conversations":
        return NextResponse.json(await listConversations({
          limit: parseInt(searchParams.get("limit") ?? "20"),
          cursor: searchParams.get("cursor") ?? undefined,
        }));
      case "messages": {
        const chatId = searchParams.get("chatId");
        if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });
        return NextResponse.json(await getMessages(chatId));
      }
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Unipile API Error]", error);
    return NextResponse.json({ error: "Unipile request failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, workspaceId, ...params } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const { error: authError } = await requireWorkspaceAccess(workspaceId, "staff");
    if (authError) return authError;

    switch (action) {
      case "connect":
        return NextResponse.json(await createConnectLink(params.provider));
      case "send-message":
        return NextResponse.json(await sendMessage(params.chatId, params.text));
      case "send-email":
        return NextResponse.json(await sendEmail(params));
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Unipile API Error]", error);
    return NextResponse.json({ error: "Unipile request failed" }, { status: 500 });
  }
}
