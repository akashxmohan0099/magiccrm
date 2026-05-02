// ── Automation ──────────────────────────────────────

export type AutomationType =
  | 'booking_confirmation'
  | 'appointment_reminder'
  | 'post_service_followup'
  | 'review_request'
  | 'rebooking_nudge'
  | 'no_show_followup'
  | 'invoice_auto_send'
  | 'cancellation_confirmation';

export type AutomationChannel = 'email' | 'sms' | 'both';

export interface AutomationRule {
  id: string;
  workspaceId: string;
  type: AutomationType;
  enabled: boolean;
  channel: AutomationChannel;
  messageTemplate: string;
  timingValue?: number;       // e.g., 24 for 24 hours before
  timingUnit?: 'minutes' | 'hours' | 'days';
  createdAt: string;
  updatedAt: string;
}
