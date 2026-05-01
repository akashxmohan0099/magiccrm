import { createClient } from "@/lib/supabase";
import type { GiftCard, GiftCardStatus } from "@/types/models";

export function mapGiftCardFromDB(row: Record<string, unknown>): GiftCard {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    code: row.code as string,
    originalAmount: Number(row.original_amount ?? 0),
    remainingBalance: Number(row.remaining_balance ?? 0),
    status: ((row.status as GiftCardStatus) ?? "active") as GiftCardStatus,
    purchaserName: (row.purchaser_name as string | null) ?? undefined,
    purchaserEmail: (row.purchaser_email as string | null) ?? undefined,
    recipientName: (row.recipient_name as string | null) ?? undefined,
    recipientEmail: (row.recipient_email as string | null) ?? undefined,
    expiresAt: (row.expires_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapGiftCardToDB(
  workspaceId: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };
  if (data.id !== undefined) row.id = data.id;
  if (data.code !== undefined) row.code = data.code;
  if (data.originalAmount !== undefined) row.original_amount = data.originalAmount;
  if (data.remainingBalance !== undefined) row.remaining_balance = data.remainingBalance;
  if (data.status !== undefined) row.status = data.status;
  if (data.purchaserName !== undefined) row.purchaser_name = data.purchaserName || null;
  if (data.purchaserEmail !== undefined) row.purchaser_email = data.purchaserEmail || null;
  if (data.recipientName !== undefined) row.recipient_name = data.recipientName || null;
  if (data.recipientEmail !== undefined) row.recipient_email = data.recipientEmail || null;
  if (data.expiresAt !== undefined) row.expires_at = data.expiresAt || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;
  return row;
}

export async function fetchGiftCards(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapGiftCardFromDB);
}

export async function dbCreateGiftCard(workspaceId: string, data: Record<string, unknown>) {
  const supabase = createClient();
  const row = mapGiftCardToDB(workspaceId, data);
  const { data: created, error } = await supabase
    .from("gift_cards")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapGiftCardFromDB(created);
}

export async function dbUpdateGiftCard(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>,
) {
  const supabase = createClient();
  const row = mapGiftCardToDB(workspaceId, data);
  delete row.workspace_id;
  const { error } = await supabase
    .from("gift_cards")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw error;
}
