import { createClient } from "@/lib/supabase";
import type { BookingWaitlistEntry } from "@/types/models";

export function mapBookingWaitlistFromDB(row: Record<string, unknown>): BookingWaitlistEntry {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    clientId: (row.client_id as string | null) ?? undefined,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    clientPhone: (row.client_phone as string | null) ?? undefined,
    serviceId: row.service_id as string,
    preferredDate: row.preferred_date as string,
    preferredDateEnd: (row.preferred_date_end as string | null) ?? undefined,
    artistId: (row.artist_id as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    notifiedAt: (row.notified_at as string | null) ?? undefined,
    fulfilledBookingId: (row.fulfilled_booking_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapBookingWaitlistToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.clientName !== undefined) row.client_name = data.clientName;
  if (data.clientEmail !== undefined) row.client_email = data.clientEmail;
  if (data.clientPhone !== undefined) row.client_phone = data.clientPhone || null;
  if (data.serviceId !== undefined) row.service_id = data.serviceId;
  if (data.preferredDate !== undefined) row.preferred_date = data.preferredDate;
  if (data.preferredDateEnd !== undefined) row.preferred_date_end = data.preferredDateEnd || null;
  if (data.artistId !== undefined) row.artist_id = data.artistId || null;
  if (data.notes !== undefined) row.notes = data.notes || null;
  if (data.notifiedAt !== undefined) row.notified_at = data.notifiedAt || null;
  if (data.fulfilledBookingId !== undefined) row.fulfilled_booking_id = data.fulfilledBookingId || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchBookingWaitlist(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("booking_waitlist")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("fulfilled_booking_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBookingWaitlistFromDB);
}

export async function dbCreateBookingWaitlistEntry(
  workspaceId: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapBookingWaitlistToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("booking_waitlist")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapBookingWaitlistFromDB(created);
}

export async function dbUpdateBookingWaitlistEntry(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapBookingWaitlistToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("booking_waitlist")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteBookingWaitlistEntry(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("booking_waitlist")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
