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

// ---------------------------------------------------------------------------
// Inquiry confirmation templates (sent after a public form submission)
// ---------------------------------------------------------------------------

export interface InquiryEmailContext {
  clientName: string;
  businessName: string;
  serviceInterest?: string;
  eventType?: string;
  message?: string;
}

const DEFAULT_AUTO_REPLY_BODY =
  "Hi {{name}},\n\nThanks for reaching out to {{businessName}} — we've received your inquiry and will be in touch shortly.\n\nIf you need anything urgent in the meantime, just reply to this email.";

const DEFAULT_AUTO_REPLY_SMS =
  "Hi {{name}}, thanks for your inquiry with {{businessName}}. We'll be in touch shortly!";

/** Plain-text → HTML paragraphs, preserving blank lines between blocks. */
function textToHtmlParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) =>
      `<p style="margin:0 0 12px;font-size:14px;color:#333;line-height:1.55;">${block
        .replace(/\n/g, "<br/>")
        .trim()}</p>`,
    )
    .join("");
}

export function buildInquiryAutoReplyEmail(
  ctx: InquiryEmailContext,
  template?: { subject?: string; body?: string },
): { subject: string; html: string; text: string } {
  const subject = (template?.subject?.trim() || `We received your inquiry — ${ctx.businessName}`);
  const bodyText = interpolateTemplate(template?.body?.trim() || DEFAULT_AUTO_REPLY_BODY, {
    name: ctx.clientName,
    businessName: ctx.businessName,
    serviceInterest: ctx.serviceInterest,
    eventType: ctx.eventType,
  });
  return {
    subject: interpolateTemplate(subject, {
      name: ctx.clientName,
      businessName: ctx.businessName,
      serviceInterest: ctx.serviceInterest,
      eventType: ctx.eventType,
    }),
    html: wrapInEmailLayout(textToHtmlParagraphs(bodyText), ctx.businessName),
    text: bodyText,
  };
}

export function buildInquiryAutoReplySms(
  ctx: InquiryEmailContext,
  template?: { body?: string },
): string {
  return interpolateTemplate(template?.body?.trim() || DEFAULT_AUTO_REPLY_SMS, {
    name: ctx.clientName,
    businessName: ctx.businessName,
    serviceInterest: ctx.serviceInterest,
    eventType: ctx.eventType,
  });
}

export function buildOwnerInquiryNotifyEmail(ctx: {
  businessName: string;
  formName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  serviceInterest?: string;
  eventType?: string;
  message?: string;
  dashboardUrl?: string;
}): { subject: string; html: string } {
  const rows: string[] = [];
  const row = (label: string, value?: string) =>
    value
      ? `<p style="margin:0 0 8px;font-size:13px;color:#333;"><strong style="color:#111;">${label}:</strong> ${value}</p>`
      : "";
  rows.push(row("From", ctx.contactName));
  rows.push(row("Email", ctx.contactEmail));
  rows.push(row("Phone", ctx.contactPhone));
  rows.push(row("Service interest", ctx.serviceInterest));
  rows.push(row("Event type", ctx.eventType));
  if (ctx.message) {
    rows.push(
      `<p style="margin:8px 0 0;font-size:13px;color:#111;"><strong>Message</strong></p>
       <p style="margin:4px 0 0;font-size:13px;color:#333;line-height:1.55;white-space:pre-wrap;">${ctx.message}</p>`,
    );
  }
  const cta = ctx.dashboardUrl
    ? `<p style="margin:16px 0 0;"><a href="${ctx.dashboardUrl}" style="color:#111;font-size:13px;font-weight:600;text-decoration:underline;">Open in Magic →</a></p>`
    : "";

  return {
    subject: `New inquiry — ${ctx.formName}`,
    html: wrapInEmailLayout(
      `<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#111;">New inquiry from ${ctx.contactName}</p>
       ${rows.join("")}
       ${cta}`,
      ctx.businessName,
    ),
  };
}
