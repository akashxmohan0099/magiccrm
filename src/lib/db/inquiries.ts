import { createClient } from "@/lib/supabase";
import type { Inquiry, InquirySource, InquiryStatus } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Inquiry (camelCase). */
export function mapInquiryFromDB(row: Record<string, unknown>): Inquiry {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    email: (row.email as string) || "",
    phone: (row.phone as string) || "",
    message: (row.message as string) || "",
    serviceInterest: (row.service_interest as string) || undefined,
    eventType: (row.event_type as string) || undefined,
    dateRange: (row.date_range as string) || undefined,
    source: row.source as InquirySource,
    status: row.status as InquiryStatus,
    conversationId: (row.conversation_id as string) || undefined,
    formId: (row.form_id as string) || undefined,
    bookingId: (row.booking_id as string) || undefined,
    clientId: (row.client_id as string) || undefined,
    notes: (row.notes as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Inquiry (camelCase) to a Supabase-ready object (snake_case). */
function mapInquiryToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.email !== undefined) row.email = data.email;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.message !== undefined) row.message = data.message;
  if (data.serviceInterest !== undefined) row.service_interest = data.serviceInterest || null;
  if (data.eventType !== undefined) row.event_type = data.eventType || null;
  if (data.dateRange !== undefined) row.date_range = data.dateRange || null;
  if (data.source !== undefined) row.source = data.source;
  if (data.status !== undefined) row.status = data.status;
  if (data.conversationId !== undefined) row.conversation_id = data.conversationId || null;
  if (data.formId !== undefined) row.form_id = data.formId || null;
  if (data.bookingId !== undefined) row.booking_id = data.bookingId || null;
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.notes !== undefined) row.notes = data.notes ?? "";
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all inquiries for a workspace. */
export async function fetchInquiries(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapInquiryFromDB);
}

/** Insert a new inquiry row. */
export async function dbCreateInquiry(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapInquiryToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("inquiries")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapInquiryFromDB(created);
}

/** Update an existing inquiry row. Only sends fields that are provided. */
export async function dbUpdateInquiry(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapInquiryToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("inquiries")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete an inquiry row. */
export async function dbDeleteInquiry(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
