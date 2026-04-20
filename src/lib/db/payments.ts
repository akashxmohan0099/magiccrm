import { createClient } from "@/lib/supabase";
import type {
  PaymentDocument,
  PaymentLineItem,
  PaymentDocLabel,
  PaymentDocStatus,
} from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — PaymentDocument
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend PaymentDocument (camelCase). */
export function mapPaymentDocumentFromDB(row: Record<string, unknown>): PaymentDocument {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    documentNumber: row.document_number as string,
    clientId: row.client_id as string,
    bookingId: (row.booking_id as string) || undefined,
    label: row.label as PaymentDocLabel,
    status: row.status as PaymentDocStatus,
    paymentMethod: (row.payment_method as import("@/types/models").PaymentMethod) || undefined,
    stripeInvoiceId: (row.stripe_invoice_id as string) || undefined,
    stripeHostedUrl: (row.stripe_hosted_url as string) || undefined,
    total: row.total as number,
    notes: (row.notes as string) || "",
    sentAt: (row.sent_at as string) || undefined,
    paidAt: (row.paid_at as string) || undefined,
    dueDate: (row.due_date as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend PaymentDocument (camelCase) to a Supabase-ready object (snake_case). */
function mapPaymentDocumentToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.documentNumber !== undefined) row.document_number = data.documentNumber;
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.bookingId !== undefined) row.booking_id = data.bookingId || null;
  if (data.label !== undefined) row.label = data.label;
  if (data.status !== undefined) row.status = data.status;
  if (data.paymentMethod !== undefined) row.payment_method = data.paymentMethod || null;
  if (data.stripeInvoiceId !== undefined) row.stripe_invoice_id = data.stripeInvoiceId || null;
  if (data.stripeHostedUrl !== undefined) row.stripe_hosted_url = data.stripeHostedUrl || null;
  if (data.total !== undefined) row.total = data.total;
  if (data.notes !== undefined) row.notes = data.notes;
  if (data.sentAt !== undefined) row.sent_at = data.sentAt || null;
  if (data.paidAt !== undefined) row.paid_at = data.paidAt || null;
  if (data.dueDate !== undefined) row.due_date = data.dueDate || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — PaymentDocument
// ---------------------------------------------------------------------------

/** Fetch all payment documents for a workspace. */
export async function fetchPaymentDocuments(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapPaymentDocumentFromDB);
}

/** Insert a new payment document row. */
export async function dbCreatePaymentDocument(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapPaymentDocumentToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("payment_documents")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapPaymentDocumentFromDB(created);
}

/** Update an existing payment document row. Only sends fields that are provided. */
export async function dbUpdatePaymentDocument(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapPaymentDocumentToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("payment_documents")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a payment document row. */
export async function dbDeletePaymentDocument(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_documents")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — PaymentLineItem
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend PaymentLineItem (camelCase). */
export function mapPaymentLineItemFromDB(row: Record<string, unknown>): PaymentLineItem {
  return {
    id: row.id as string,
    paymentDocumentId: row.payment_document_id as string,
    workspaceId: row.workspace_id as string,
    description: (row.description as string) || "",
    quantity: row.quantity as number,
    unitPrice: row.unit_price as number,
    sortOrder: (row.sort_order as number) ?? 0,
  };
}

/** Convert a frontend PaymentLineItem (camelCase) to a Supabase-ready object (snake_case). */
function mapPaymentLineItemToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.paymentDocumentId !== undefined) row.payment_document_id = data.paymentDocumentId;
  if (data.description !== undefined) row.description = data.description;
  if (data.quantity !== undefined) row.quantity = data.quantity;
  if (data.unitPrice !== undefined) row.unit_price = data.unitPrice;
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — PaymentLineItem
// ---------------------------------------------------------------------------

/** Fetch all payment line items for a workspace. */
export async function fetchPaymentLineItems(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payment_line_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPaymentLineItemFromDB);
}

/** Insert a new payment line item row. */
export async function dbCreatePaymentLineItem(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapPaymentLineItemToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("payment_line_items")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapPaymentLineItemFromDB(created);
}

/** Update an existing payment line item row. Only sends fields that are provided. */
export async function dbUpdatePaymentLineItem(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapPaymentLineItemToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("payment_line_items")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a payment line item row. */
export async function dbDeletePaymentLineItem(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_line_items")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
