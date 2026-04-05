import { NextRequest, NextResponse } from "next/server";
import { sendSMS, sendBookingReminder, sendPaymentReminder } from "@/lib/integrations/twilio";
import { requireWorkspaceAccess } from "@/lib/api-auth";

/**
 * Twilio API routes.
 * POST: Send an SMS message.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, workspaceId, ...params } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    const { error: authError } = await requireWorkspaceAccess(workspaceId, "staff");
    if (authError) return authError;

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
