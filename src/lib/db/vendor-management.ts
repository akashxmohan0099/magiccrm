import { createClient } from "@/lib/supabase";
import type { Vendor } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapVendorFromDB(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    contactName: (row.contact_name as string) || undefined,
    email: (row.email as string) || undefined,
    phone: (row.phone as string) || undefined,
    website: (row.website as string) || undefined,
    notes: (row.notes as string) || "",
    rating: (row.rating as number) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchVendors(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateVendor(workspaceId: string, vendor: Vendor) {
  const supabase = createClient();
  const { error } = await supabase.from("vendors").insert({
    id: vendor.id,
    workspace_id: workspaceId,
    name: vendor.name,
    category: vendor.category,
    contact_name: vendor.contactName || null,
    email: vendor.email || null,
    phone: vendor.phone || null,
    website: vendor.website || null,
    notes: vendor.notes,
    rating: vendor.rating ?? null,
    created_at: vendor.createdAt,
    updated_at: vendor.updatedAt,
  });
  if (error) throw error;
}

export async function dbUpdateVendor(
  workspaceId: string,
  id: string,
  updates: Partial<Omit<Vendor, "id" | "createdAt">>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.contactName !== undefined) row.contact_name = updates.contactName || null;
  if (updates.email !== undefined) row.email = updates.email || null;
  if (updates.phone !== undefined) row.phone = updates.phone || null;
  if (updates.website !== undefined) row.website = updates.website || null;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.rating !== undefined) row.rating = updates.rating ?? null;

  const { error } = await supabase
    .from("vendors")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteVendor(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertVendors(workspaceId: string, items: Vendor[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((v) => ({
    id: v.id,
    workspace_id: workspaceId,
    name: v.name,
    category: v.category,
    contact_name: v.contactName || null,
    email: v.email || null,
    phone: v.phone || null,
    website: v.website || null,
    notes: v.notes,
    rating: v.rating ?? null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }));
  const { error } = await supabase.from("vendors").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
