// ── Inquiry ─────────────────────────────────────────

export type InquirySource = 'form' | 'comms';
export type InquiryStatus = 'new' | 'in_progress' | 'converted' | 'closed';

export interface Inquiry {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  serviceInterest?: string;
  eventType?: string;
  dateRange?: string;
  source: InquirySource;
  status: InquiryStatus;
  conversationId?: string;
  formId?: string;
  formResponseId?: string;
  bookingId?: string;
  clientId?: string;
  notes?: string;
  submissionValues?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
