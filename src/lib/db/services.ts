import { createClient } from "@/lib/supabase";
import type { ServiceDefinition } from "@/types/industry-config";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend ServiceDefinition (camelCase). */
export function mapServiceFromDB(row: Record<string, unknown>): ServiceDefinition {
  return {
    id: row.id as string,
    name: row.name as string,
    duration: row.duration as number,
    price: row.price as number,
    category: row.category as string | undefined,
    variants: (row.variants as ServiceDefinition["variants"]) || undefined,
    rebookingIntervalDays: row.rebooking_interval_days as number | undefined,
  };
}

/** Convert a frontend ServiceDefinition (camelCase) to a Supabase-ready object (snake_case). */
function mapServiceToDB(
  workspaceId: string,
  service: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (service.id !== undefined) row.id = service.id;
  if (service.name !== undefined) row.name = service.name;
  if (service.duration !== undefined) row.duration = service.duration;
  if (service.price !== undefined) row.price = service.price;
  if (service.category !== undefined) row.category = service.category || null;
  if (service.variants !== undefined) row.variants = service.variants || null;
  if (service.rebookingIntervalDays !== undefined) row.rebooking_interval_days = service.rebookingIntervalDays ?? null;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all services for a workspace. */
export async function fetchServices(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new service row. */
export async function dbCreateService(
  workspaceId: string,
  service: ServiceDefinition
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .insert({
      id: service.id,
      workspace_id: workspaceId,
      name: service.name,
      duration: service.duration,
      price: service.price,
      category: service.category || null,
      variants: service.variants || null,
      rebooking_interval_days: service.rebookingIntervalDays ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing service row. Only sends fields that are provided. */
export async function dbUpdateService(
  workspaceId: string,
  id: string,
  updates: Partial<ServiceDefinition>
) {
  const supabase = createClient();

  const row = mapServiceToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("services")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a service row. */
export async function dbDeleteService(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many services at once (used for initial localStorage → Supabase migration). */
export async function dbUpsertServices(
  workspaceId: string,
  services: ServiceDefinition[]
) {
  if (services.length === 0) return;

  const supabase = createClient();
  const rows = services.map((s) => ({
    id: s.id,
    workspace_id: workspaceId,
    name: s.name,
    duration: s.duration,
    price: s.price,
    category: s.category || null,
    variants: s.variants || null,
    rebooking_interval_days: s.rebookingIntervalDays ?? null,
  }));

  const { error } = await supabase
    .from("services")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
