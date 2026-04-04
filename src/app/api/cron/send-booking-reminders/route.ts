import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Cron endpoint: Send 24-hour booking reminders.
 *
 * GET /api/cron/send-booking-reminders
 *
 * Finds all confirmed bookings starting in the next 23-25 hours
 * that haven't had a reminder sent yet, and sends an email via Resend.
 *
 * Call this every hour via Vercel Cron, EasyCron, or similar.
 * Protect with CRON_SECRET header in production.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const bearerToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const providedSecret = bearerToken || req.headers.get("x-cron-secret");

  if (!cronSecret) {
    console.error("[cron/reminders] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 500 });
  }

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find bookings starting in ~24 hours that haven't been reminded
    const { data: bookings, error: fetchErr } = await supabase
      .from("bookings")
      .select(`
        id, workspace_id, client_id, service_name, start_at, end_at, price,
        reminder_sent_at
      `)
      .eq("status", "confirmed")
      .gte("start_at", windowStart.toISOString())
      .lte("start_at", windowEnd.toISOString())
      .is("reminder_sent_at", null)
      .limit(100);

    if (fetchErr) {
      console.error("[cron/reminders] Fetch error:", fetchErr);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ sent: 0, message: "No reminders to send" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    let sent = 0;
    let skipped = 0;

    for (const booking of bookings) {
      try {
        // Get client email
        const { data: client } = await supabase
          .from("clients")
          .select("name, email")
          .eq("id", booking.client_id)
          .maybeSingle();

        if (!client?.email) {
          skipped++;
          continue;
        }

        // Get workspace name
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", booking.workspace_id)
          .maybeSingle();

        const businessName = workspace?.name || "Your Salon";
        const startAt = new Date(booking.start_at);
        const formattedDate = startAt.toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = startAt.toLocaleTimeString("en-AU", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        // Send email
        if (resendApiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(resendApiKey);

          await resend.emails.send({
            from: `${businessName} <bookings@magiccrm.app>`,
            to: client.email,
            subject: `Reminder: ${booking.service_name || "Appointment"} tomorrow at ${formattedTime}`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
                <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 4px;">Appointment Reminder</h1>
                <p style="font-size:14px;color:#666;margin:0 0 24px;">${businessName}</p>
                <div style="background:#f9f9f9;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#999;">Hi ${client.name},</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#333;">This is a friendly reminder about your upcoming appointment:</p>
                  <p style="margin:0 0 8px;"><strong style="color:#111;">${booking.service_name || "Appointment"}</strong></p>
                  <p style="margin:0 0 4px;font-size:13px;color:#555;">${formattedDate}</p>
                  <p style="margin:0;font-size:13px;color:#555;">${formattedTime}</p>
                </div>
                <p style="font-size:13px;color:#666;margin:0 0 24px;">If you need to reschedule, please contact us as soon as possible.</p>
                <p style="font-size:11px;color:#ccc;margin:0;">Powered by Magic</p>
              </div>
            `,
          });
        } else if (process.env.NODE_ENV === "development") {
          console.log(`[DEV] Reminder email → ${client.email}: ${booking.service_name} on ${formattedDate} at ${formattedTime}`);
        }

        // Mark reminder as sent
        await supabase
          .from("bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        sent++;
      } catch (err) {
        console.error(`[cron/reminders] Failed for booking ${booking.id}:`, err);
        skipped++;
      }
    }

    return NextResponse.json({
      sent,
      skipped,
      total: bookings.length,
      message: `Sent ${sent} reminder${sent !== 1 ? "s" : ""}, skipped ${skipped}`,
    });
  } catch (error) {
    console.error("[cron/reminders] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
