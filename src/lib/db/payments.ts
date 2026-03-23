import { createClient } from "@/lib/supabase";
import type { Payment } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase payment row (snake_case) to a frontend Payment (camelCase). */
export function mapPaymentFromDB(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    invoiceId: (row.invoice_id as string) || undefined,
    clientId: (row.client_id as string) || undefined,
    amount: row.amount as number,
    method: row.method as Payment["method"],
    notes: (row.notes as string) || "",
    date: row.paid_at as string, // DB stores paid_at, frontend uses date
    status: (row.status as Payment["status"]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || undefined,
  };
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all payments for a workspace. */
export async function fetchPayments(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new payment row. */
export async function dbCreatePayment(
  workspaceId: string,
  payment: Payment
) {
  const supabase = createClient();
  const { error } = await supabase.from("payments").insert({
    id: payment.id,
    workspace_id: workspaceId,
    invoice_id: payment.invoiceId || null,
    client_id: payment.clientId || null,
    amount: payment.amount,
    method: payment.method,
    notes: payment.notes || "",
    paid_at: payment.date, // frontend date -> DB paid_at
    status: payment.status || null,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt || null,
  });

  if (error) throw error;
}

/** Update an existing payment row. */
export async function dbUpdatePayment(
  workspaceId: string,
  id: string,
  updates: Partial<Payment>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.invoiceId !== undefined) row.invoice_id = updates.invoiceId || null;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.method !== undefined) row.method = updates.method;
  if (updates.notes !== undefined) row.notes = updates.notes || "";
  if (updates.date !== undefined) row.paid_at = updates.date; // frontend date -> DB paid_at
  if (updates.status !== undefined) row.status = updates.status || null;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  const { error } = await supabase
    .from("payments")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a payment row. */
export async function dbDeletePayment(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many payments at once (localStorage -> Supabase migration). */
export async function dbUpsertPayments(
  workspaceId: string,
  payments: Payment[]
) {
  if (payments.length === 0) return;

  const supabase = createClient();
  const rows = payments.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    invoice_id: p.invoiceId || null,
    client_id: p.clientId || null,
    amount: p.amount,
    method: p.method,
    notes: p.notes || "",
    paid_at: p.date, // frontend date -> DB paid_at
    status: p.status || null,
    created_at: p.createdAt,
    updated_at: p.updatedAt || null,
  }));

  const { error } = await supabase
    .from("payments")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
