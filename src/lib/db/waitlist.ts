import { createClient } from "@/lib/supabase";
import type { WaitlistEntry } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapWaitlistEntryFromDB(row: Record<string, unknown>): WaitlistEntry {
  return {
    id: row.id as string,
    clientId: (row.client_id as string) || undefined,
    clientName: row.client_name as string,
    date: row.date as string,
    startTime: (row.start_time as string) || undefined,
    endTime: (row.end_time as string) || undefined,
    serviceId: (row.service_id as string) || undefined,
    serviceName: (row.service_name as string) || undefined,
    status: row.status as WaitlistEntry["status"],
    notifiedAt: (row.notified_at as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchWaitlistEntries(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateWaitlistEntry(workspaceId: string, entry: WaitlistEntry) {
  const supabase = createClient();
  const { error } = await supabase.from("waitlist_entries").insert({
    id: entry.id,
    workspace_id: workspaceId,
    client_id: entry.clientId || null,
    client_name: entry.clientName,
    date: entry.date,
    start_time: entry.startTime || null,
    end_time: entry.endTime || null,
    service_id: entry.serviceId || null,
    service_name: entry.serviceName || null,
    status: entry.status,
    notified_at: entry.notifiedAt || null,
    created_at: entry.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateWaitlistEntry(
  workspaceId: string,
  id: string,
  updates: Partial<WaitlistEntry>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = {};

  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.startTime !== undefined) row.start_time = updates.startTime || null;
  if (updates.endTime !== undefined) row.end_time = updates.endTime || null;
  if (updates.serviceId !== undefined) row.service_id = updates.serviceId || null;
  if (updates.serviceName !== undefined) row.service_name = updates.serviceName || null;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.notifiedAt !== undefined) row.notified_at = updates.notifiedAt || null;

  const { error } = await supabase
    .from("waitlist_entries")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteWaitlistEntry(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("waitlist_entries")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertWaitlistEntries(workspaceId: string, items: WaitlistEntry[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((e) => ({
    id: e.id,
    workspace_id: workspaceId,
    client_id: e.clientId || null,
    client_name: e.clientName,
    date: e.date,
    start_time: e.startTime || null,
    end_time: e.endTime || null,
    service_id: e.serviceId || null,
    service_name: e.serviceName || null,
    status: e.status,
    notified_at: e.notifiedAt || null,
    created_at: e.createdAt,
  }));
  const { error } = await supabase.from("waitlist_entries").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
