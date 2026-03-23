import { createClient } from "@/lib/supabase";
import type { DiscussionComment } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapDiscussionFromDB(row: Record<string, unknown>): DiscussionComment {
  return {
    id: row.id as string,
    content: row.content as string,
    authorName: row.author_name as string,
    entityType: row.entity_type as DiscussionComment["entityType"],
    entityId: row.entity_id as string,
    parentId: (row.parent_id as string) || undefined,
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function fetchDiscussions(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("discussions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function dbCreateDiscussion(
  workspaceId: string,
  comment: DiscussionComment
) {
  const supabase = createClient();
  const { error } = await supabase.from("discussions").insert({
    id: comment.id,
    workspace_id: workspaceId,
    content: comment.content,
    author_name: comment.authorName,
    entity_type: comment.entityType,
    entity_id: comment.entityId,
    parent_id: comment.parentId || null,
    created_at: comment.createdAt,
  });

  if (error) throw error;
}

export async function dbUpdateDiscussion(
  workspaceId: string,
  id: string,
  content: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("discussions")
    .update({ content })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteDiscussion(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("discussions")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertDiscussions(
  workspaceId: string,
  comments: DiscussionComment[]
) {
  if (comments.length === 0) return;

  const supabase = createClient();
  const rows = comments.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    content: c.content,
    author_name: c.authorName,
    entity_type: c.entityType,
    entity_id: c.entityId,
    parent_id: c.parentId || null,
    created_at: c.createdAt,
  }));

  const { error } = await supabase
    .from("discussions")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
}
