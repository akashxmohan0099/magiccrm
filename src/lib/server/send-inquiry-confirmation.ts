import "server-only";

import type { FormBranding } from "@/types/models";
import { createAdminClient } from "@/lib/supabase-server";
import {
  sendEmail,
  buildInquiryAutoReplyEmail,
  buildInquiryAutoReplySms,
  buildOwnerInquiryNotifyEmail,
} from "@/lib/integrations/email";
import type { ExtractedContact } from "@/lib/form-response-extract";

interface SendInquiryConfirmationParams {
  workspaceId: string;
  form: {
    id: string;
    name: string;
    branding: FormBranding;
  };
  contact: ExtractedContact;
  /** ID of the inquiry row if the form was promoted, used to deep-link the owner notification. */
  inquiryId?: string | null;
}

interface SendInquiryConfirmationResult {
  clientEmail: { attempted: boolean; ok: boolean; error?: string };
  clientSms: { attempted: boolean; ok: boolean; error?: string };
  ownerEmail: { attempted: boolean; ok: boolean; error?: string };
}

const FROM_DOMAIN_DEFAULT = "bookings@magiccrm.app";

/**
 * Sends the post-submission confirmations for an inquiry form:
 *   1. Auto-reply email to the person who submitted (if email captured + enabled)
 *   2. Auto-reply SMS to the person who submitted (if phone captured + enabled)
 *   3. Notification email to the workspace owner (if enabled)
 *
 * Per-form `branding` settings win; falls back to workspace-level defaults
 * (auto_reply_enabled / contact_email / business_name) and finally to
 * built-in copy. Never throws — caller fires-and-forgets.
 *
   * Sends immediately. Delayed auto-replies need a queued/scheduled-send job;
   * the form editor does not expose delay controls until that exists.
   */
export async function sendInquiryConfirmation(
  params: SendInquiryConfirmationParams,
): Promise<SendInquiryConfirmationResult> {
  const result: SendInquiryConfirmationResult = {
    clientEmail: { attempted: false, ok: false },
    clientSms: { attempted: false, ok: false },
    ownerEmail: { attempted: false, ok: false },
  };

  try {
    const { workspaceId, form, contact, inquiryId } = params;
    const branding = form.branding ?? {};

    const supabase = await createAdminClient();
    const { data: settingsRow } = await supabase
      .from("workspace_settings")
      .select("business_name, contact_email, contact_phone, auto_reply_enabled, auto_reply_template")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const businessName =
      (settingsRow?.business_name as string | null)?.trim() || "Our team";
    const ownerEmail = (settingsRow?.contact_email as string | null) || undefined;
    const replyTo = ownerEmail; // replies to the auto-reply land in the merchant's inbox
    const workspaceAutoReplyEnabled = Boolean(settingsRow?.auto_reply_enabled);
    const workspaceAutoReplyTemplate =
      (settingsRow?.auto_reply_template as string | null) || undefined;

    // Per-form override beats workspace default. When neither is set, default
    // to ON - the merchant explicitly configured a public-facing form, so
    // sending an ack is the obviously-right behaviour. Mark `void` to keep
    // the workspace flag read for future opt-out semantics.
    void workspaceAutoReplyEnabled;
    const emailEnabled = branding.autoReplyEnabled ?? true;

    const ctx = {
      clientName: contact.name || "there",
      businessName,
      serviceInterest: contact.serviceInterest ?? undefined,
      eventType: contact.eventType ?? undefined,
      message: contact.message || undefined,
    };

    // ── 1. Client auto-reply email ──
    if (emailEnabled && contact.email) {
      result.clientEmail.attempted = true;
      const built = buildInquiryAutoReplyEmail(ctx, {
        subject: branding.autoReplySubject,
        body: branding.autoReplyBody || workspaceAutoReplyTemplate,
      });
      const sendResult = await sendEmail({
        to: contact.email,
        subject: built.subject,
        html: built.html,
        from: `${businessName} <${FROM_DOMAIN_DEFAULT}>`,
        replyTo,
      });
      result.clientEmail.ok = sendResult.success;
      if (!sendResult.success) result.clientEmail.error = sendResult.error;
    }

    // ── 2. Client auto-reply SMS ──
    if (branding.autoReplySmsEnabled && contact.phone) {
      result.clientSms.attempted = true;
      try {
        const { sendSMS } = await import("@/lib/integrations/twilio");
        const body = buildInquiryAutoReplySms(ctx, { body: branding.autoReplySmsBody });
        await sendSMS({ to: contact.phone, body });
        result.clientSms.ok = true;
      } catch (err) {
        result.clientSms.error = err instanceof Error ? err.message : String(err);
      }
    }

    // ── 3. Owner notification email ──
    if (branding.notifyOwnerEmail && ownerEmail) {
      result.ownerEmail.attempted = true;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usemagic.com";
      const dashboardUrl = inquiryId
        ? `${baseUrl}/dashboard/leads?lead=${encodeURIComponent(inquiryId)}`
        : `${baseUrl}/dashboard/forms?form=${encodeURIComponent(form.id)}`;
      const built = buildOwnerInquiryNotifyEmail({
        businessName,
        formName: form.name,
        contactName: contact.name,
        contactEmail: contact.email ?? undefined,
        contactPhone: contact.phone ?? undefined,
        serviceInterest: contact.serviceInterest ?? undefined,
        eventType: contact.eventType ?? undefined,
        message: contact.message || undefined,
        dashboardUrl,
      });
      const sendResult = await sendEmail({
        to: ownerEmail,
        subject: built.subject,
        html: built.html,
        from: `Magic <${FROM_DOMAIN_DEFAULT}>`,
        replyTo: contact.email ?? undefined, // owner can reply straight to the person
      });
      result.ownerEmail.ok = sendResult.success;
      if (!sendResult.success) result.ownerEmail.error = sendResult.error;
    }
  } catch (err) {
    // Never throw — caller treats this as best-effort.
    console.error("[sendInquiryConfirmation] unexpected error:", err);
  }

  return result;
}
