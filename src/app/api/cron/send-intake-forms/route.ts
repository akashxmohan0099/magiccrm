/**
 * Cron — send pre-appointment intake form links.
 *
 * GET /api/cron/send-intake-forms
 *
 * Walks confirmed bookings that:
 *   - reference a service with `intake_form_id` set
 *   - start within an upcoming window (default 24h)
 *   - haven't had an intake form sent yet
 *
 * Sends the client a unique form link via email (and SMS when phone known)
 * and stamps `intake_form_sent_at` to dedupe.
 *
 * Hourly via Vercel Cron. Protect with CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/integrations/email";

const DEFAULT_LEAD_HOURS = 24;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://magiccrm.app";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = Date.now();
  const upper = new Date(now + DEFAULT_LEAD_HOURS * 3_600_000).toISOString();
  const lower = new Date(now + (DEFAULT_LEAD_HOURS - 1) * 3_600_000).toISOString();

  // Find candidate bookings whose appointment is between (now+lead-1h) and
  // (now+lead). Hourly run + 1h window means each booking gets exactly one
  // chance. The intake_form_sent_at stamp is the safety net for double-sends.
  // Filter on the joined service.intake_form_id so bookings without an
  // attached form drop out of the result set.
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, workspace_id, client_id, service_id, start_at, date,
      services!inner(id, name, intake_form_id),
      clients!inner(id, name, email, phone)
    `)
    .in("status", ["confirmed", "pending"])
    .gte("start_at", lower)
    .lt("start_at", upper)
    .is("intake_form_sent_at", null)
    .not("services.intake_form_id", "is", null);

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  for (const b of bookings as unknown as Array<Record<string, unknown>>) {
    const service = b.services as
      | { id: string; name: string; intake_form_id: string | null }
      | undefined;
    if (!service?.intake_form_id) continue;
    const client = b.clients as { name: string; email: string; phone?: string } | undefined;
    if (!client?.email) continue;

    // Public forms live at /inquiry/[slug] keyed by form.slug, not id.
    // Fetch the slug now (one-shot per booking; cheaper than a second join).
    const { data: formRow } = await supabase
      .from("forms")
      .select("slug, name")
      .eq("id", service.intake_form_id)
      .maybeSingle();
    if (!formRow?.slug) continue;

    const formUrl = `${APP_BASE_URL}/inquiry/${formRow.slug}?booking=${b.id}`;
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("business_name")
      .eq("workspace_id", b.workspace_id as string)
      .maybeSingle();
    const businessName = (settings?.business_name as string) ?? "your salon";

    try {
      await sendEmail({
        to: client.email,
        subject: `Quick form before your ${service.name} appointment`,
        html: `
          <p>Hi ${client.name},</p>
          <p>You're booked for <strong>${service.name}</strong>. Please take a moment to fill out this form before your appointment so we can be ready for you.</p>
          <p><a href="${formUrl}">Complete intake form</a></p>
          <p>— ${businessName}</p>
        `,
      });

      await supabase
        .from("bookings")
        .update({
          intake_form_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", b.id as string);
      sent += 1;
    } catch (err) {
      console.warn(`[send-intake-forms] failed for booking ${b.id}:`, err);
    }
  }

  return NextResponse.json({ sent, candidates: bookings.length });
}
