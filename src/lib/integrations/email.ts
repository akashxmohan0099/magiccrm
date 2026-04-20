/**
 * Email integration via Resend.
 *
 * Centralises all transactional email sending so we don't duplicate
 * the Resend setup across cron jobs, automation runner, etc.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const DEFAULT_FROM = "Magic <bookings@magiccrm.app>";

/**
 * Send a transactional email via Resend.
 * Returns { success, id } on success, { success: false, error } on failure.
 * Does NOT throw -- caller can check result.success.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: params.from || DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Template helpers
// ---------------------------------------------------------------------------

/** Replace {{variable}} placeholders in a template string. */
export function interpolateTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

/**
 * Wrap plain text content in a branded HTML email layout.
 * Matches the existing booking confirmation email style.
 */
export function wrapInEmailLayout(body: string, businessName: string): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
  <div style="background:#f9f9f9;border-radius:12px;padding:24px;margin-bottom:16px;">
    ${body}
  </div>
  <p style="text-align:center;font-size:11px;color:#999;margin:0;">
    Sent by ${businessName} via Magic
  </p>
</div>`.trim();
}

// ---------------------------------------------------------------------------
// Pre-built automation email templates
// ---------------------------------------------------------------------------

interface AutomationEmailContext {
  clientName: string;
  businessName: string;
  serviceName?: string;
  date?: string;
  time?: string;
}

export function buildWelcomeEmail(ctx: AutomationEmailContext): { subject: string; html: string } {
  return {
    subject: `Welcome to ${ctx.businessName}!`,
    html: wrapInEmailLayout(
      `<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111;">Welcome, ${ctx.clientName}!</p>
       <p style="margin:0 0 16px;font-size:14px;color:#333;">Thanks for choosing ${ctx.businessName}. We're excited to have you as a client.</p>
       <p style="margin:0;font-size:14px;color:#333;">If you'd like to book your next appointment, just visit our booking page or reach out anytime.</p>`,
      ctx.businessName,
    ),
  };
}

export function buildPostAppointmentEmail(ctx: AutomationEmailContext): { subject: string; html: string } {
  return {
    subject: `Thanks for visiting ${ctx.businessName}!`,
    html: wrapInEmailLayout(
      `<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111;">Thanks for your visit, ${ctx.clientName}!</p>
       <p style="margin:0 0 16px;font-size:14px;color:#333;">We hope you loved your ${ctx.serviceName || "appointment"} at ${ctx.businessName}.</p>
       <p style="margin:0;font-size:14px;color:#333;">We'd love to see you again soon. Book your next appointment whenever you're ready!</p>`,
      ctx.businessName,
    ),
  };
}

export function buildRebookingNudgeEmail(
  ctx: AutomationEmailContext & { daysSince: number },
): { subject: string; html: string } {
  return {
    subject: `We miss you at ${ctx.businessName}!`,
    html: wrapInEmailLayout(
      `<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#111;">It's been a while, ${ctx.clientName}!</p>
       <p style="margin:0 0 16px;font-size:14px;color:#333;">It's been ${ctx.daysSince} days since your last visit to ${ctx.businessName}. We'd love to see you again.</p>
       <p style="margin:0;font-size:14px;color:#333;">Book your next appointment and treat yourself!</p>`,
      ctx.businessName,
    ),
  };
}
