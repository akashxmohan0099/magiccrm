import { createClient } from "@/lib/supabase";
import type { CalendarBlock, BlockKind } from "@/types/models";

function mapFromDB(row: Record<string, unknown>): CalendarBlock {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    teamMemberId: (row.team_member_id as string) || undefined,
    kind: (row.kind as BlockKind) || "blocked",
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    label: (row.label as string) || undefined,
    reason: (row.reason as string) || undefined,
    isPrivate: row.is_private !== false,
    isRecurring: !!row.is_recurring,
    recurrencePattern: (row.recurrence_pattern as CalendarBlock["recurrencePattern"]) || undefined,
    recurrenceEndDate: (row.recurrence_end_date as string) || undefined,
    color: (row.color as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || (row.created_at as string),
  };
}

function mapToDB(workspaceId: string, data: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.teamMemberId !== undefined) row.team_member_id = data.teamMemberId || null;
  if (data.kind !== undefined) row.kind = data.kind;
  if (data.date !== undefined) row.date = data.date;
  if (data.startTime !== undefined) row.start_time = data.startTime;
  if (data.endTime !== undefined) row.end_time = data.endTime;
  if (data.label !== undefined) row.label = data.label || null;
  if (data.reason !== undefined) row.reason = data.reason || null;
  if (data.isPrivate !== undefined) row.is_private = data.isPrivate;
  if (data.isRecurring !== undefined) row.is_recurring = data.isRecurring;
  if (data.recurrencePattern !== undefined) row.recurrence_pattern = data.recurrencePattern || null;
  if (data.recurrenceEndDate !== undefined) row.recurrence_end_date = data.recurrenceEndDate || null;
  if (data.color !== undefined) row.color = data.color || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

export async function fetchCalendarBlocks(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calendar_blocks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFromDB);
}

export async function dbCreateCalendarBlock(workspaceId: string, data: Record<string, unknown>) {
  const supabase = createClient();
  const { data: created, error } = await supabase
    .from("calendar_blocks")
    .insert(mapToDB(workspaceId, data))
    .select()
    .single();

  if (error) throw error;
  return mapFromDB(created);
}

export async function dbUpdateCalendarBlock(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("calendar_blocks")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteCalendarBlock(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("calendar_blocks")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
