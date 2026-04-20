import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature } from "@/lib/integrations/twilio";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Twilio webhook handler — receives inbound SMS messages.
 *
 * Flow:
 * 1. Verify Twilio signature
 * 2. Match phone number to a client in the workspace
 * 3. Create or append to a conversation
 * 4. Store the message in Supabase
 *
 * Configure in Twilio Console → Phone Number → Messaging webhook:
 * URL: https://yourapp.com/api/webhooks/twilio
 * Method: POST
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-twilio-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const formData = await req.formData();
    const url = req.url;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value as string;
    });

    if (!verifyTwilioSignature(url, params, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;
    const messageSid = formData.get("MessageSid") as string;
    const to = formData.get("To") as string;

    if (!from || !body) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const supabase = await createAdminClient();

    // Normalize phone: strip non-digits except leading +
    const normalizedPhone = from.replace(/[^\d+]/g, "");
    const phoneFilter = `contact_phone.eq.${normalizedPhone},contact_phone.eq.${from}`;

    const { data: existingConversations } = await supabase
      .from("conversations")
      .select("id, workspace_id, client_id, contact_name, unread_count")
      .eq("channel", "sms")
      .or(phoneFilter)
      .limit(3);

    let conversationId: string | null = null;
    let workspaceId: string | null = null;
    let clientId: string | null = null;
    let clientName = from;
    let unreadCount = 0;

    if (existingConversations && existingConversations.length === 1) {
      const existingConversation = existingConversations[0];
      conversationId = existingConversation.id;
      workspaceId = existingConversation.workspace_id;
      clientId = existingConversation.client_id;
      clientName = existingConversation.contact_name || from;
      unreadCount = Number(existingConversation.unread_count ?? 0);
    } else {
      const { data: matchedClients } = await supabase
        .from("clients")
        .select("id, workspace_id, name")
        .or(`phone.eq.${normalizedPhone},phone.eq.${from}`)
        .limit(3);

      if (!matchedClients || matchedClients.length === 0) {
        console.warn(`[Twilio] Inbound SMS from unknown number: ${from}`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      if (matchedClients.length !== 1) {
        console.warn(`[Twilio] Ambiguous inbound SMS from ${from}; refusing to route across workspaces.`);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      const matchedClient = matchedClients[0];
      workspaceId = matchedClient.workspace_id;
      clientId = matchedClient.id;
      clientName = matchedClient.name || from;
    }

    if (!workspaceId) {
      console.warn(`[Twilio] Unable to resolve workspace for inbound SMS from ${from} to ${to}`);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    if (conversationId) {
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          unread_count: unreadCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("workspace_id", workspaceId);
    } else {
      const { data: newConversation, error: convoErr } = await supabase
        .from("conversations")
        .insert({
          workspace_id: workspaceId,
          client_id: clientId,
          contact_name: clientName,
          contact_phone: normalizedPhone || from,
          channel: "sms",
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convoErr || !newConversation) {
        console.error("[Twilio] Failed to create conversation:", convoErr?.message);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      conversationId = newConversation.id;
    }

    // Store the message
    await supabase.from("messages").insert({
      workspace_id: workspaceId,
      conversation_id: conversationId,
      sender: "client",
      content: body,
      external_message_id: messageSid,
      created_at: new Date().toISOString(),
    });

    // Log activity
    await supabase.from("activity_log").insert({
      workspace_id: workspaceId,
      type: "create",
      entity_type: "messages",
      entity_id: conversationId,
      description: `SMS received from ${clientName}`,
    });

    console.log(`[Twilio] Inbound SMS from ${from} stored in conversation ${conversationId}`);

    // Return empty TwiML (no auto-reply)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("[Twilio Webhook Error]", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
