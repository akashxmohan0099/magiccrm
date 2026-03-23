import { createClient } from "@/lib/supabase";
import type { GiftCard } from "@/types/models";

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

export function mapGiftCardFromDB(row: Record<string, unknown>): GiftCard {
  return {
    id: row.id as string,
    code: row.code as string,
    amount: row.amount as number,
    balance: row.balance as number,
    purchasedBy: (row.purchased_by as string) || undefined,
    recipientName: (row.recipient_name as string) || undefined,
    recipientEmail: (row.recipient_email as string) || undefined,
    status: row.status as GiftCard["status"],
    expiresAt: (row.expires_at as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchGiftCards(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function dbCreateGiftCard(workspaceId: string, card: GiftCard) {
  const supabase = createClient();
  const { error } = await supabase.from("gift_cards").insert({
    id: card.id,
    workspace_id: workspaceId,
    code: card.code,
    amount: card.amount,
    balance: card.balance,
    purchased_by: card.purchasedBy || null,
    recipient_name: card.recipientName || null,
    recipient_email: card.recipientEmail || null,
    status: card.status,
    expires_at: card.expiresAt || null,
    created_at: card.createdAt,
  });
  if (error) throw error;
}

export async function dbUpdateGiftCard(
  workspaceId: string,
  id: string,
  updates: Partial<GiftCard>
) {
  const supabase = createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.recipientName !== undefined) row.recipient_name = updates.recipientName || null;
  if (updates.recipientEmail !== undefined) row.recipient_email = updates.recipientEmail || null;
  if (updates.purchasedBy !== undefined) row.purchased_by = updates.purchasedBy || null;
  if (updates.balance !== undefined) row.balance = updates.balance;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.expiresAt !== undefined) row.expires_at = updates.expiresAt || null;

  const { error } = await supabase
    .from("gift_cards")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbDeleteGiftCard(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gift_cards")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}

export async function dbUpsertGiftCards(workspaceId: string, items: GiftCard[]) {
  if (items.length === 0) return;
  const supabase = createClient();
  const rows = items.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    code: c.code,
    amount: c.amount,
    balance: c.balance,
    purchased_by: c.purchasedBy || null,
    recipient_name: c.recipientName || null,
    recipient_email: c.recipientEmail || null,
    status: c.status,
    expires_at: c.expiresAt || null,
    created_at: c.createdAt,
  }));
  const { error } = await supabase.from("gift_cards").upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
