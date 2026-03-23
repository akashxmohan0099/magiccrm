import { createClient } from "@/lib/supabase";
import type { Invoice, Quote, LineItem } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping helpers
// ---------------------------------------------------------------------------

/** Convert a Supabase invoice row + joined line_items to a frontend Invoice. */
export function mapInvoiceFromDB(
  row: Record<string, unknown>,
  lineItemRows: Record<string, unknown>[]
): Invoice {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: (row.client_id as string) || undefined,
    jobId: (row.job_id as string) || undefined,
    lineItems: lineItemRows
      .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))
      .map(mapLineItemFromDB),
    status: row.status as Invoice["status"],
    dueDate: (row.due_date as string) || undefined,
    notes: (row.notes as string) || "",
    paymentSchedule: (row.payment_schedule as string) || undefined,
    depositPercent: (row.deposit_percent as number) ?? undefined,
    depositPaid: (row.deposit_paid as boolean) ?? undefined,
    milestones: (row.milestones as Invoice["milestones"]) || undefined,
    paidAmount: (row.paid_amount as number) ?? undefined,
    lastReminderSentAt: (row.last_reminder_sent_at as string) || undefined,
    reminderCount: (row.reminder_count as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLineItemFromDB(row: Record<string, unknown>): LineItem {
  return {
    id: row.id as string,
    description: row.description as string,
    quantity: row.quantity as number,
    unitPrice: row.unit_price as number,
    discount: (row.discount as number) ?? undefined,
  };
}

/** Convert a Supabase quote row + joined line_items to a frontend Quote. */
export function mapQuoteFromDB(
  row: Record<string, unknown>,
  lineItemRows: Record<string, unknown>[]
): Quote {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: (row.client_id as string) || undefined,
    lineItems: lineItemRows
      .sort((a, b) => ((a.sort_order as number) ?? 0) - ((b.sort_order as number) ?? 0))
      .map(mapLineItemFromDB),
    status: row.status as Quote["status"],
    validUntil: (row.valid_until as string) || undefined,
    notes: (row.notes as string) || "",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    version: (row.version as number) ?? undefined,
    previousVersions: (row.previous_versions as Quote["previousVersions"]) || undefined,
  };
}

// ---------------------------------------------------------------------------
// Invoice CRUD
// ---------------------------------------------------------------------------

/** Fetch all invoices (with their line items) for a workspace. */
export async function fetchInvoices(workspaceId: string) {
  const supabase = createClient();

  const { data: invoiceRows, error: invErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (invErr) throw invErr;
  if (!invoiceRows || invoiceRows.length === 0) return [];

  const invoiceIds = invoiceRows.map((r: Record<string, unknown>) => r.id as string);

  const { data: lineItemRows, error: liErr } = await supabase
    .from("invoice_line_items")
    .select("*")
    .in("invoice_id", invoiceIds)
    .order("sort_order", { ascending: true });

  if (liErr) throw liErr;

  const lineItemsByInvoice = new Map<string, Record<string, unknown>[]>();
  for (const li of (lineItemRows || [])) {
    const invId = (li as Record<string, unknown>).invoice_id as string;
    if (!lineItemsByInvoice.has(invId)) lineItemsByInvoice.set(invId, []);
    lineItemsByInvoice.get(invId)!.push(li as Record<string, unknown>);
  }

  return invoiceRows.map((row: Record<string, unknown>) =>
    mapInvoiceFromDB(row, lineItemsByInvoice.get(row.id as string) || [])
  );
}

/** Insert a new invoice + its line items. */
export async function dbCreateInvoice(
  workspaceId: string,
  invoice: Invoice
) {
  const supabase = createClient();

  const { error: invErr } = await supabase.from("invoices").insert({
    id: invoice.id,
    workspace_id: workspaceId,
    number: invoice.number,
    client_id: invoice.clientId || null,
    job_id: invoice.jobId || null,
    status: invoice.status,
    due_date: invoice.dueDate || null,
    notes: invoice.notes || "",
    payment_schedule: invoice.paymentSchedule || null,
    deposit_percent: invoice.depositPercent ?? null,
    deposit_paid: invoice.depositPaid ?? null,
    milestones: invoice.milestones || null,
    paid_amount: invoice.paidAmount ?? null,
    last_reminder_sent_at: invoice.lastReminderSentAt || null,
    reminder_count: invoice.reminderCount ?? null,
    created_at: invoice.createdAt,
    updated_at: invoice.updatedAt,
  });

  if (invErr) throw invErr;

  if (invoice.lineItems.length > 0) {
    const liRows = invoice.lineItems.map((li, idx) => ({
      id: li.id,
      invoice_id: invoice.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      discount: li.discount ?? null,
      sort_order: idx,
    }));

    const { error: liErr } = await supabase
      .from("invoice_line_items")
      .insert(liRows);

    if (liErr) throw liErr;
  }
}

/** Update an existing invoice row (and replace its line items). */
export async function dbUpdateInvoice(
  workspaceId: string,
  id: string,
  updates: Partial<Invoice>
) {
  const supabase = createClient();

  // Build the update payload for the invoice table
  const row: Record<string, unknown> = {};
  if (updates.number !== undefined) row.number = updates.number;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.jobId !== undefined) row.job_id = updates.jobId || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate || null;
  if (updates.notes !== undefined) row.notes = updates.notes || "";
  if (updates.paymentSchedule !== undefined) row.payment_schedule = updates.paymentSchedule || null;
  if (updates.depositPercent !== undefined) row.deposit_percent = updates.depositPercent ?? null;
  if (updates.depositPaid !== undefined) row.deposit_paid = updates.depositPaid ?? null;
  if (updates.milestones !== undefined) row.milestones = updates.milestones || null;
  if (updates.paidAmount !== undefined) row.paid_amount = updates.paidAmount ?? null;
  if (updates.lastReminderSentAt !== undefined) row.last_reminder_sent_at = updates.lastReminderSentAt || null;
  if (updates.reminderCount !== undefined) row.reminder_count = updates.reminderCount ?? null;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length > 0) {
    const { error } = await supabase
      .from("invoices")
      .update(row)
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  // If lineItems were updated, replace them
  if (updates.lineItems !== undefined) {
    // Delete old line items
    const { error: delErr } = await supabase
      .from("invoice_line_items")
      .delete()
      .eq("invoice_id", id);

    if (delErr) throw delErr;

    // Insert new line items
    if (updates.lineItems.length > 0) {
      const liRows = updates.lineItems.map((li, idx) => ({
        id: li.id,
        invoice_id: id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unitPrice,
        discount: li.discount ?? null,
        sort_order: idx,
      }));

      const { error: insErr } = await supabase
        .from("invoice_line_items")
        .insert(liRows);

      if (insErr) throw insErr;
    }
  }
}

/** Delete an invoice (cascade handles line items on DB side). */
export async function dbDeleteInvoice(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many invoices at once (localStorage -> Supabase migration). */
export async function dbUpsertInvoices(
  workspaceId: string,
  invoices: Invoice[]
) {
  if (invoices.length === 0) return;

  const supabase = createClient();

  const invRows = invoices.map((inv) => ({
    id: inv.id,
    workspace_id: workspaceId,
    number: inv.number,
    client_id: inv.clientId || null,
    job_id: inv.jobId || null,
    status: inv.status,
    due_date: inv.dueDate || null,
    notes: inv.notes || "",
    payment_schedule: inv.paymentSchedule || null,
    deposit_percent: inv.depositPercent ?? null,
    deposit_paid: inv.depositPaid ?? null,
    milestones: inv.milestones || null,
    paid_amount: inv.paidAmount ?? null,
    last_reminder_sent_at: inv.lastReminderSentAt || null,
    reminder_count: inv.reminderCount ?? null,
    created_at: inv.createdAt,
    updated_at: inv.updatedAt,
  }));

  const { error: invErr } = await supabase
    .from("invoices")
    .upsert(invRows, { onConflict: "id" });

  if (invErr) throw invErr;

  // Collect all line items across all invoices
  const allLineItems = invoices.flatMap((inv) =>
    inv.lineItems.map((li, idx) => ({
      id: li.id,
      invoice_id: inv.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      discount: li.discount ?? null,
      sort_order: idx,
    }))
  );

  if (allLineItems.length > 0) {
    const { error: liErr } = await supabase
      .from("invoice_line_items")
      .upsert(allLineItems, { onConflict: "id" });

    if (liErr) throw liErr;
  }
}

// ---------------------------------------------------------------------------
// Quote CRUD
// ---------------------------------------------------------------------------

/** Fetch all quotes (with their line items) for a workspace. */
export async function fetchQuotes(workspaceId: string) {
  const supabase = createClient();

  const { data: quoteRows, error: qErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (qErr) throw qErr;
  if (!quoteRows || quoteRows.length === 0) return [];

  const quoteIds = quoteRows.map((r: Record<string, unknown>) => r.id as string);

  const { data: lineItemRows, error: liErr } = await supabase
    .from("quote_line_items")
    .select("*")
    .in("quote_id", quoteIds)
    .order("sort_order", { ascending: true });

  if (liErr) throw liErr;

  const lineItemsByQuote = new Map<string, Record<string, unknown>[]>();
  for (const li of (lineItemRows || [])) {
    const qId = (li as Record<string, unknown>).quote_id as string;
    if (!lineItemsByQuote.has(qId)) lineItemsByQuote.set(qId, []);
    lineItemsByQuote.get(qId)!.push(li as Record<string, unknown>);
  }

  return quoteRows.map((row: Record<string, unknown>) =>
    mapQuoteFromDB(row, lineItemsByQuote.get(row.id as string) || [])
  );
}

/** Insert a new quote + its line items. */
export async function dbCreateQuote(
  workspaceId: string,
  quote: Quote
) {
  const supabase = createClient();

  const { error: qErr } = await supabase.from("quotes").insert({
    id: quote.id,
    workspace_id: workspaceId,
    number: quote.number,
    client_id: quote.clientId || null,
    status: quote.status,
    valid_until: quote.validUntil || null,
    notes: quote.notes || "",
    version: quote.version ?? null,
    previous_versions: quote.previousVersions || null,
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  });

  if (qErr) throw qErr;

  if (quote.lineItems.length > 0) {
    const liRows = quote.lineItems.map((li, idx) => ({
      id: li.id,
      quote_id: quote.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      discount: li.discount ?? null,
      sort_order: idx,
    }));

    const { error: liErr } = await supabase
      .from("quote_line_items")
      .insert(liRows);

    if (liErr) throw liErr;
  }
}

/** Update an existing quote row (and replace its line items). */
export async function dbUpdateQuote(
  workspaceId: string,
  id: string,
  updates: Partial<Quote>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.number !== undefined) row.number = updates.number;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.validUntil !== undefined) row.valid_until = updates.validUntil || null;
  if (updates.notes !== undefined) row.notes = updates.notes || "";
  if (updates.version !== undefined) row.version = updates.version ?? null;
  if (updates.previousVersions !== undefined) row.previous_versions = updates.previousVersions || null;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length > 0) {
    const { error } = await supabase
      .from("quotes")
      .update(row)
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
  }

  if (updates.lineItems !== undefined) {
    const { error: delErr } = await supabase
      .from("quote_line_items")
      .delete()
      .eq("quote_id", id);

    if (delErr) throw delErr;

    if (updates.lineItems.length > 0) {
      const liRows = updates.lineItems.map((li, idx) => ({
        id: li.id,
        quote_id: id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unitPrice,
        discount: li.discount ?? null,
        sort_order: idx,
      }));

      const { error: insErr } = await supabase
        .from("quote_line_items")
        .insert(liRows);

      if (insErr) throw insErr;
    }
  }
}

/** Delete a quote (cascade handles line items on DB side). */
export async function dbDeleteQuote(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many quotes at once (localStorage -> Supabase migration). */
export async function dbUpsertQuotes(
  workspaceId: string,
  quotes: Quote[]
) {
  if (quotes.length === 0) return;

  const supabase = createClient();

  const qRows = quotes.map((q) => ({
    id: q.id,
    workspace_id: workspaceId,
    number: q.number,
    client_id: q.clientId || null,
    status: q.status,
    valid_until: q.validUntil || null,
    notes: q.notes || "",
    version: q.version ?? null,
    previous_versions: q.previousVersions || null,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  }));

  const { error: qErr } = await supabase
    .from("quotes")
    .upsert(qRows, { onConflict: "id" });

  if (qErr) throw qErr;

  const allLineItems = quotes.flatMap((q) =>
    q.lineItems.map((li, idx) => ({
      id: li.id,
      quote_id: q.id,
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unitPrice,
      discount: li.discount ?? null,
      sort_order: idx,
    }))
  );

  if (allLineItems.length > 0) {
    const { error: liErr } = await supabase
      .from("quote_line_items")
      .upsert(allLineItems, { onConflict: "id" });

    if (liErr) throw liErr;
  }
}
