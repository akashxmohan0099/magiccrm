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

    if (!from || !body) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    const supabase = await createAdminClient();

    // Normalize phone: strip non-digits except leading +
    const normalizedPhone = from.replace(/[^\d+]/g, "");

    // Find client by phone number across all workspaces
    const { data: client } = await supabase
      .from("clients")
      .select("id, workspace_id, name")
      .or(`phone.eq.${normalizedPhone},phone.eq.${from}`)
      .limit(1)
      .single();

    if (!client) {
      console.warn(`[Twilio] Inbound SMS from unknown number: ${from}`);
      // Still return 200 so Twilio doesn't retry
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Find or create a conversation for this client + SMS channel
    const { data: existingConvo } = await supabase
      .from("conversations")
      .select("id")
      .eq("workspace_id", client.workspace_id)
      .eq("client_id", client.id)
      .eq("channel", "sms")
      .limit(1)
      .single();

    let conversationId: string;

    if (existingConvo) {
      conversationId = existingConvo.id;
      // Update conversation with latest message
      await supabase
        .from("conversations")
        .update({
          last_message: body.slice(0, 200),
          last_message_at: new Date().toISOString(),
          unread: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } else {
      // Create new conversation
      const { data: newConvo, error: convoErr } = await supabase
        .from("conversations")
        .insert({
          workspace_id: client.workspace_id,
          client_id: client.id,
          client_name: client.name || from,
          channel: "sms",
          subject: `SMS from ${client.name || from}`,
          last_message: body.slice(0, 200),
          last_message_at: new Date().toISOString(),
          unread: true,
        })
        .select("id")
        .single();

      if (convoErr || !newConvo) {
        console.error("[Twilio] Failed to create conversation:", convoErr?.message);
        return new NextResponse(
          '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
          { headers: { "Content-Type": "text/xml" } }
        );
      }
      conversationId = newConvo.id;
    }

    // Store the message
    await supabase.from("messages").insert({
      workspace_id: client.workspace_id,
      conversation_id: conversationId,
      sender_type: "client",
      sender_name: client.name || from,
      content: body,
      channel: "sms",
      external_id: messageSid,
      created_at: new Date().toISOString(),
    });

    // Log activity
    await supabase.from("activity_log").insert({
      workspace_id: client.workspace_id,
      action: "create",
      entity_type: "messages",
      entity_id: conversationId,
      description: `SMS received from ${client.name || from}`,
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
