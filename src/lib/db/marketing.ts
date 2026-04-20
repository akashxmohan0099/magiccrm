import { createClient } from "@/lib/supabase";
import type { Campaign } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Campaign (camelCase). */
export function mapCampaignFromDB(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    name: row.name as string,
    subject: (row.subject as string) || undefined,
    body: (row.body as string) || "",
    channel: row.channel as import("@/types/models").CampaignChannel,
    targetSegment: row.target_segment as import("@/types/models").CampaignSegment,
    inactiveDays: (row.inactive_days as number) ?? undefined,
    status: row.status as import("@/types/models").CampaignStatus,
    scheduledAt: (row.scheduled_at as string) || undefined,
    sentCount: (row.sent_count as number) ?? 0,
    openCount: (row.open_count as number) ?? 0,
    clickCount: (row.click_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Campaign (camelCase) to a Supabase-ready object (snake_case). */
function mapCampaignToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.name !== undefined) row.name = data.name;
  if (data.subject !== undefined) row.subject = data.subject || null;
  if (data.body !== undefined) row.body = data.body;
  if (data.channel !== undefined) row.channel = data.channel;
  if (data.targetSegment !== undefined) row.target_segment = data.targetSegment;
  if (data.inactiveDays !== undefined) row.inactive_days = data.inactiveDays ?? null;
  if (data.status !== undefined) row.status = data.status;
  if (data.scheduledAt !== undefined) row.scheduled_at = data.scheduledAt || null;
  if (data.sentCount !== undefined) row.sent_count = data.sentCount;
  if (data.openCount !== undefined) row.open_count = data.openCount;
  if (data.clickCount !== undefined) row.click_count = data.clickCount;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Fetch all campaigns for a workspace. */
export async function fetchCampaigns(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapCampaignFromDB);
}

/** Insert a new campaign row. */
export async function dbCreateCampaign(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapCampaignToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("campaigns")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapCampaignFromDB(created);
}

/** Update an existing campaign row. Only sends fields that are provided. */
export async function dbUpdateCampaign(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapCampaignToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("campaigns")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a campaign row. */
export async function dbDeleteCampaign(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
