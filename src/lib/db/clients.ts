import { createClient } from "@/lib/supabase";
import type { Client } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Client (camelCase). */
export function mapClientFromDB(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    email: (row.email as string) || "",
    phone: (row.phone as string) || "",
    notes: (row.notes as string) || "",
    birthday: (row.birthday as string) || undefined,
    medicalAlerts: (row.medical_alerts as string) || undefined,
    source: (row.source as string) || undefined,
    addressStreet: (row.address_street as string) || undefined,
    addressSuburb: (row.address_suburb as string) || undefined,
    addressPostcode: (row.address_postcode as string) || undefined,
    addressState: (row.address_state as string) || undefined,
    stripePaymentMethodId: (row.stripe_payment_method_id as string) || undefined,
    patchTests: (row.patch_tests as Client["patchTests"]) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Client (camelCase) to a Supabase-ready object (snake_case). */
function mapClientToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.email !== undefined) row.email = data.email;
  if (data.phone !== undefined) row.phone = data.phone;
  if (data.notes !== undefined) row.notes = data.notes;
  if (data.birthday !== undefined) row.birthday = data.birthday;
  if (data.medicalAlerts !== undefined) row.medical_alerts = data.medicalAlerts;
  if (data.source !== undefined) row.source = data.source;
  if (data.addressStreet !== undefined) row.address_street = data.addressStreet;
  if (data.addressSuburb !== undefined) row.address_suburb = data.addressSuburb;
  if (data.addressPostcode !== undefined) row.address_postcode = data.addressPostcode;
  if (data.addressState !== undefined) row.address_state = data.addressState;
  if (data.stripePaymentMethodId !== undefined) row.stripe_payment_method_id = data.stripePaymentMethodId;
  if (data.patchTests !== undefined) row.patch_tests = data.patchTests;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all clients for a workspace. */
export async function fetchClients(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapClientFromDB);
}

/** Insert a new client row. */
export async function dbCreateClient(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapClientToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("clients")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapClientFromDB(created);
}

/** Update an existing client row. Only sends fields that are provided. */
export async function dbUpdateClient(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapClientToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("clients")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a client row. */
export async function dbDeleteClient(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
