import "server-only";

import { createAdminClient } from "@/lib/supabase-server";
import { sendEmail, interpolateTemplate, wrapInEmailLayout } from "@/lib/integrations/email";
import { sendSMS } from "@/lib/integrations/twilio";

interface AutomationRunParams {
  workspaceId: string;
  type: string;
  entityId?: string | null;
  /** Extra context: clientName, clientEmail, clientPhone, serviceName, date, time, etc. */
  entityData?: Record<string, unknown>;
}

interface AutomationRunResult {
  ruleId: string;
  channel: string;
  success: boolean;
  emailSent?: boolean;
  smsSent?: boolean;
  error?: string;
}

/**
 * Run all enabled automation rules for a given event type within a workspace.
 *
 * Called from:
 *  - API routes (event-driven: booking_confirmation, post_service_followup)
 *  - Cron jobs (time-driven: rebooking nudge, win-back)
 */
export async function runAutomationRules({
  workspaceId,
  type,
  entityId,
  entityData,
}: AutomationRunParams) {
  const supabase = await createAdminClient();

  const { data: rules, error: rulesError } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("type", type)
    .eq("enabled", true);

  if (rulesError) {
    throw rulesError;
  }

  if (!rules || rules.length === 0) {
    return {
      executed: 0,
      results: [] as AutomationRunResult[],
      message: "No matching rules",
    };
  }

  // Resolve business name for email branding.
  // Prefer workspace_settings.business_name (user-configured), fall back to workspaces.name.
  const [{ data: settings }, { data: workspaceRow }] = await Promise.all([
    supabase
      .from("workspace_settings")
      .select("business_name")
      .eq("workspace_id", workspaceId)
      .maybeSingle(),
    supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .maybeSingle(),
  ]);

  const businessName =
    (settings?.business_name as string) ||
    (workspaceRow?.name as string) ||
    "Your Salon";

  // Resolve client contact info
  let clientName = (entityData?.clientName as string) || null;
  let clientEmail = (entityData?.clientEmail as string) || null;
  let clientPhone = (entityData?.clientPhone as string) || null;

  if (entityId && (!clientName || !clientEmail)) {
    const { data: client } = await supabase
      .from("clients")
      .select("email, name, phone")
      .eq("id", entityId)
      .eq("workspace_id", workspaceId)
      .single();

    if (client) {
      clientName = clientName || (client.name as string);
      clientEmail = clientEmail || (client.email as string);
      clientPhone = clientPhone || (client.phone as string);
    }
  }

  const results: AutomationRunResult[] = [];

  for (const rule of rules) {
    try {
      const channel = (rule.channel ?? "email") as string;
      const messageTemplate = (rule.message_template ?? "") as string;

      // Build template variables from entityData
      const templateVars: Record<string, string | undefined> = {
        clientName: clientName || "there",
        businessName,
        serviceName: entityData?.serviceName as string | undefined,
        date: entityData?.date as string | undefined,
        time: entityData?.time as string | undefined,
        daysSince:
          entityData?.daysSince !== undefined
            ? String(entityData.daysSince)
            : undefined,
        invoiceNumber: entityData?.invoiceNumber as string | undefined,
        total: entityData?.total as string | undefined,
      };

      const renderedMessage = messageTemplate
        ? interpolateTemplate(messageTemplate, templateVars)
        : `Automated notification from ${businessName}`;

      let emailSent = false;
      let smsSent = false;

      // ── Send email ──
      if ((channel === "email" || channel === "both") && clientEmail) {
        const subject = interpolateTemplate(
          getSubjectForType(type, businessName),
          templateVars,
        );
        const html = wrapInEmailLayout(
          `<p style="margin:0 0 8px;font-size:14px;color:#333;">Hi ${clientName || "there"},</p>
           <p style="margin:0;font-size:14px;color:#333;">${renderedMessage.replace(/\n/g, "<br/>")}</p>`,
          businessName,
        );

        const result = await sendEmail({
          to: clientEmail,
          subject,
          html,
          from: `${businessName} <bookings@magiccrm.app>`,
        });

        emailSent = result.success;
        if (!result.success) {
          console.warn(`[automation-runner] Email failed for rule ${rule.id}:`, result.error);
        }
      }

      // ── Send SMS ──
      if ((channel === "sms" || channel === "both") && clientPhone) {
        const twilioConfigured = !!(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER
        );

        if (twilioConfigured) {
          try {
            await sendSMS({
              to: clientPhone,
              body: renderedMessage,
            });
            smsSent = true;
          } catch (smsErr) {
            console.warn(`[automation-runner] SMS failed for rule ${rule.id}:`, smsErr);
          }
        }
      }

      // ── Log to activity feed ──
      const channelsSent = [emailSent && "email", smsSent && "SMS"].filter(Boolean).join(" + ");
      const description = channelsSent
        ? `Auto "${type}" sent via ${channelsSent}${clientName ? ` to ${clientName}` : ""}`
        : `Auto "${type}" executed (no delivery — missing contact info)`;

      await supabase.from("activity_log").insert({
        workspace_id: workspaceId,
        type: "automation",
        entity_type: "automations",
        entity_id: rule.id,
        description,
      });

      results.push({ ruleId: rule.id, channel, success: true, emailSent, smsSent });
    } catch (error) {
      results.push({
        ruleId: rule.id,
        channel: (rule.channel ?? "unknown") as string,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    executed: results.length,
    results,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSubjectForType(type: string, businessName: string): string {
  const subjects: Record<string, string> = {
    booking_confirmation: `Booking Confirmed — {{serviceName}} at ${businessName}`,
    appointment_reminder: `Reminder: {{serviceName}} tomorrow at ${businessName}`,
    post_service_followup: `Thanks for visiting ${businessName}!`,
    review_request: `How was your visit to ${businessName}?`,
    rebooking_nudge: `We miss you at ${businessName}!`,
    no_show_followup: `We missed you at ${businessName}`,
    invoice_auto_send: `Invoice from ${businessName}`,
    cancellation_confirmation: `Cancellation Confirmed — ${businessName}`,
    welcome: `Welcome to ${businessName}!`,
  };
  return subjects[type] || `Update from ${businessName}`;
}
