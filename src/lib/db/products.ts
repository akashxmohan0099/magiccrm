import { createClient } from "@/lib/supabase";
import type { Product } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Product (camelCase). */
export function mapProductFromDB(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    price: row.price as number,
    category: (row.category as string) || "",
    sku: row.sku as string | undefined,
    inStock: (row.in_stock as boolean) ?? true,
    quantity: row.quantity as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Product (camelCase) to a Supabase-ready object (snake_case). */
function mapProductToDB(
  workspaceId: string,
  product: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (product.id !== undefined) row.id = product.id;
  if (product.name !== undefined) row.name = product.name;
  if (product.description !== undefined) row.description = product.description || "";
  if (product.price !== undefined) row.price = product.price;
  if (product.category !== undefined) row.category = product.category || "";
  if (product.sku !== undefined) row.sku = product.sku || null;
  if (product.inStock !== undefined) row.in_stock = product.inStock;
  if (product.quantity !== undefined) row.quantity = product.quantity ?? null;
  if (product.createdAt !== undefined) row.created_at = product.createdAt;
  if (product.updatedAt !== undefined) row.updated_at = product.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all products for a workspace. */
export async function fetchProducts(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Insert a new product row. */
export async function dbCreateProduct(
  workspaceId: string,
  product: Product
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      id: product.id,
      workspace_id: workspaceId,
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category || "",
      sku: product.sku || null,
      in_stock: product.inStock ?? true,
      quantity: product.quantity ?? null,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing product row. Only sends fields that are provided. */
export async function dbUpdateProduct(
  workspaceId: string,
  id: string,
  updates: Partial<Product>
) {
  const supabase = createClient();

  const row = mapProductToDB(workspaceId, updates as Record<string, unknown>);
  // Remove workspace_id — it's used in the filter, not the update payload
  delete row.workspace_id;

  const { error } = await supabase
    .from("products")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a product row. */
export async function dbDeleteProduct(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Upsert many products at once (used for initial localStorage → Supabase migration). */
export async function dbUpsertProducts(
  workspaceId: string,
  products: Product[]
) {
  if (products.length === 0) return;

  const supabase = createClient();
  const rows = products.map((p) => ({
    id: p.id,
    workspace_id: workspaceId,
    name: p.name,
    description: p.description || "",
    price: p.price,
    category: p.category || "",
    sku: p.sku || null,
    in_stock: p.inStock ?? true,
    quantity: p.quantity ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));

  const { error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
