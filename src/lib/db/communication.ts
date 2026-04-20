import { createClient } from "@/lib/supabase";
import type { Conversation, Message, Channel } from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — Conversation
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Conversation (camelCase). */
export function mapConversationFromDB(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    contactName: (row.contact_name as string) || undefined,
    contactEmail: (row.contact_email as string) || undefined,
    contactPhone: (row.contact_phone as string) || undefined,
    contactSocialHandle: (row.contact_social_handle as string) || undefined,
    channel: row.channel as Channel,
    clientId: (row.client_id as string) || undefined,
    externalConversationId: (row.external_conversation_id as string) || undefined,
    lastMessageAt: (row.last_message_at as string) || undefined,
    unreadCount: (row.unread_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Convert a frontend Conversation (camelCase) to a Supabase-ready object (snake_case). */
function mapConversationToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.contactName !== undefined) row.contact_name = data.contactName || null;
  if (data.contactEmail !== undefined) row.contact_email = data.contactEmail || null;
  if (data.contactPhone !== undefined) row.contact_phone = data.contactPhone || null;
  if (data.contactSocialHandle !== undefined) row.contact_social_handle = data.contactSocialHandle || null;
  if (data.channel !== undefined) row.channel = data.channel;
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.externalConversationId !== undefined) row.external_conversation_id = data.externalConversationId || null;
  if (data.lastMessageAt !== undefined) row.last_message_at = data.lastMessageAt || null;
  if (data.unreadCount !== undefined) row.unread_count = data.unreadCount;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt !== undefined) row.updated_at = data.updatedAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — Conversation
// ---------------------------------------------------------------------------

/** Fetch all conversations for a workspace. */
export async function fetchConversations(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapConversationFromDB);
}

/** Insert a new conversation row. */
export async function dbCreateConversation(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapConversationToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("conversations")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapConversationFromDB(created);
}

/** Update an existing conversation row. */
export async function dbUpdateConversation(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapConversationToDB(workspaceId, data);
  delete row.workspace_id;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("conversations")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a conversation row. */
export async function dbDeleteConversation(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping — Message
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Message (camelCase). */
export function mapMessageFromDB(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    workspaceId: row.workspace_id as string,
    content: row.content as string,
    sender: row.sender as 'user' | 'client',
    externalMessageId: (row.external_message_id as string) || undefined,
    createdAt: row.created_at as string,
  };
}

/** Convert a frontend Message (camelCase) to a Supabase-ready object (snake_case). */
function mapMessageToDB(
  workspaceId: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { workspace_id: workspaceId };

  if (data.id !== undefined) row.id = data.id;
  if (data.conversationId !== undefined) row.conversation_id = data.conversationId;
  if (data.content !== undefined) row.content = data.content;
  if (data.sender !== undefined) row.sender = data.sender;
  if (data.externalMessageId !== undefined) row.external_message_id = data.externalMessageId || null;
  if (data.createdAt !== undefined) row.created_at = data.createdAt;

  return row;
}

// ---------------------------------------------------------------------------
// CRUD operations — Message
// ---------------------------------------------------------------------------

/** Fetch all messages for a workspace. */
export async function fetchMessages(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapMessageFromDB);
}

/** Insert a new message row. */
export async function dbCreateMessage(
  workspaceId: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMessageToDB(workspaceId, data);

  const { data: created, error } = await supabase
    .from("messages")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return mapMessageFromDB(created);
}

/** Update an existing message row. */
export async function dbUpdateMessage(
  workspaceId: string,
  id: string,
  data: Record<string, unknown>
) {
  const supabase = createClient();
  const row = mapMessageToDB(workspaceId, data);
  delete row.workspace_id;

  const { error } = await supabase
    .from("messages")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a message row. */
export async function dbDeleteMessage(workspaceId: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
