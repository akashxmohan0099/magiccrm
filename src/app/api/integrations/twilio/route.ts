import { NextRequest, NextResponse } from "next/server";
import { sendSMS, sendBookingReminder, sendPaymentReminder } from "@/lib/integrations/twilio";
import { requireAuth } from "@/lib/api-auth";

/**
 * Twilio API routes.
 * POST: Send an SMS message.
 */
export async function POST(req: NextRequest) {
  try {
    const { user: _user, error: authError } = await requireAuth();
    if (authError) return authError;

    const { action, ...params } = await req.json();

    switch (action) {
      case "send": {
        const result = await sendSMS({ to: params.to, body: params.body });
        return NextResponse.json(result);
      }
      case "booking-reminder": {
        const result = await sendBookingReminder(params);
        return NextResponse.json(result);
      }
      case "payment-reminder": {
        const result = await sendPaymentReminder(params);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Twilio API Error]", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
