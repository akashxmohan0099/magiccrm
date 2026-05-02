// ── Payment Document ────────────────────────────────

export type PaymentDocLabel = 'quote' | 'invoice';
export type PaymentDocStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'stripe' | 'cash' | 'bank_transfer' | 'card_in_person';

export interface PaymentDocument {
  id: string;
  workspaceId: string;
  documentNumber: string;
  clientId: string;
  bookingId?: string;
  label: PaymentDocLabel;
  status: PaymentDocStatus;
  paymentMethod?: PaymentMethod;
  stripeInvoiceId?: string;
  stripeHostedUrl?: string;
  total: number;
  notes: string;
  sentAt?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLineItem {
  id: string;
  paymentDocumentId: string;
  workspaceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

export interface Refund {
  id: string;
  workspaceId: string;
  paymentDocumentId: string;
  amount: number;
  reason?: string;
  status: 'processed' | 'failed';
  stripeRefundId?: string;
  createdAt: string;
}
