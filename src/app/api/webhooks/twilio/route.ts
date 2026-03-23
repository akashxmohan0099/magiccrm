import { NextRequest, NextResponse } from "next/server";
import { verifyTwilioSignature } from "@/lib/integrations/twilio";

/**
 * Twilio webhook handler.
 * Receives inbound SMS messages.
 *
 * Configure in Twilio Console → Phone Number → Messaging webhook:
 * URL: https://yourapp.com/api/webhooks/twilio
 * Method: POST
 */
export async function POST(req: NextRequest) {
  try {
    // Verify Twilio webhook signature
    const signature = req.headers.get("x-twilio-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const formData = await req.formData();

    // Build URL and params for signature verification
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

    console.log(`[Twilio] Inbound SMS from ${from}: ${body} (SID: ${messageSid})`);

    // TODO: Match phone number to client in Supabase
    // TODO: Create conversation/message record
    // TODO: Notify user via realtime subscription

    // Return TwiML response (empty = no auto-reply)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("[Twilio Webhook Error]", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
