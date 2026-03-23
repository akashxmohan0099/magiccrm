import { createClient } from "@/lib/supabase";
import type {
  Conversation,
  Message,
  Channel,
  ChannelConnectionConfig,
  CommunicationAutomationSettings,
} from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case ↔ camelCase mapping
// ---------------------------------------------------------------------------

/** Convert a Supabase row (snake_case) to a frontend Message (camelCase). */
function mapMessageFromDB(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    content: row.content as string,
    sender: row.sender as "user" | "client",
    timestamp: row.created_at as string,
  };
}

/** Convert a Supabase row (snake_case) to a frontend Conversation (camelCase). */
export function mapConversationFromDB(
  row: Record<string, unknown>,
  messages: Message[] = []
): Conversation {
  return {
    id: row.id as string,
    clientId: (row.client_id as string) || undefined,
    clientName: row.client_name as string,
    channel: row.channel as Channel,
    subject: (row.subject as string) || undefined,
    messages,
    lastMessageAt: row.last_message_at as string,
    unreadCount: (row.unread_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || undefined,
  };
}

// ---------------------------------------------------------------------------
// CRUD — conversations
// ---------------------------------------------------------------------------

/** Fetch all conversations (with their messages) for a workspace. */
export async function fetchConversations(workspaceId: string) {
  const supabase = createClient();

  // 1. Fetch conversations
  const { data: convRows, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("last_message_at", { ascending: false });

  if (convError) throw convError;
  if (!convRows || convRows.length === 0) return [];

  // 2. Fetch all messages for these conversations in one query
  const convIds = convRows.map((r: Record<string, unknown>) => r.id as string);
  const { data: msgRows, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: true });

  if (msgError) throw msgError;

  // 3. Group messages by conversation_id
  const msgsByConv: Record<string, Message[]> = {};
  for (const row of msgRows ?? []) {
    const cid = row.conversation_id as string;
    if (!msgsByConv[cid]) msgsByConv[cid] = [];
    msgsByConv[cid].push(mapMessageFromDB(row as Record<string, unknown>));
  }

  // 4. Map conversations with their messages
  return convRows.map((row: Record<string, unknown>) =>
    mapConversationFromDB(
      row,
      msgsByConv[row.id as string] || []
    )
  );
}

/** Insert a new conversation row. */
export async function dbCreateConversation(
  workspaceId: string,
  conversation: Conversation
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      id: conversation.id,
      workspace_id: workspaceId,
      client_id: conversation.clientId || null,
      client_name: conversation.clientName,
      channel: conversation.channel,
      subject: conversation.subject || null,
      last_message_at: conversation.lastMessageAt,
      unread_count: conversation.unreadCount ?? 0,
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update an existing conversation row. */
export async function dbUpdateConversation(
  workspaceId: string,
  id: string,
  updates: Partial<Conversation>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.channel !== undefined) row.channel = updates.channel;
  if (updates.subject !== undefined) row.subject = updates.subject || null;
  if (updates.lastMessageAt !== undefined) row.last_message_at = updates.lastMessageAt;
  if (updates.unreadCount !== undefined) row.unread_count = updates.unreadCount;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("conversations")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

/** Delete a conversation row (cascade deletes messages on DB side). */
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
// CRUD — messages
// ---------------------------------------------------------------------------

/** Insert a new message row. */
export async function dbCreateMessage(
  conversationId: string,
  message: Message
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .insert({
      id: message.id,
      conversation_id: conversationId,
      content: message.content,
      sender: message.sender,
      created_at: message.timestamp,
    });

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bulk upsert (localStorage → Supabase migration)
// ---------------------------------------------------------------------------

/** Upsert many conversations + their messages at once. */
export async function dbUpsertConversations(
  workspaceId: string,
  conversations: Conversation[]
) {
  if (conversations.length === 0) return;

  const supabase = createClient();

  // 1. Upsert conversations
  const convRows = conversations.map((c) => ({
    id: c.id,
    workspace_id: workspaceId,
    client_id: c.clientId || null,
    client_name: c.clientName,
    channel: c.channel,
    subject: c.subject || null,
    last_message_at: c.lastMessageAt,
    unread_count: c.unreadCount ?? 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt || null,
  }));

  const { error: convError } = await supabase
    .from("conversations")
    .upsert(convRows, { onConflict: "id" });

  if (convError) throw convError;

  // 2. Upsert all messages
  const allMessages = conversations.flatMap((c) =>
    c.messages.map((m) => ({
      id: m.id,
      conversation_id: c.id,
      content: m.content,
      sender: m.sender,
      created_at: m.timestamp,
    }))
  );

  if (allMessages.length > 0) {
    const { error: msgError } = await supabase
      .from("messages")
      .upsert(allMessages, { onConflict: "id" });

    if (msgError) throw msgError;
  }
}

// ---------------------------------------------------------------------------
// Communication config in workspace_settings
// ---------------------------------------------------------------------------

export interface CommunicationConfig {
  connectedChannels: Channel[];
  channelConfigs: Partial<Record<Channel, ChannelConnectionConfig>>;
  automationSettings: CommunicationAutomationSettings;
}

/** Fetch communication_config from workspace_settings. */
export async function fetchCommunicationConfig(
  workspaceId: string
): Promise<CommunicationConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select("communication_config")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.communication_config) return null;

  const cfg = data.communication_config as Record<string, unknown>;
  return {
    connectedChannels: (cfg.connectedChannels as Channel[]) || [],
    channelConfigs:
      (cfg.channelConfigs as Partial<Record<Channel, ChannelConnectionConfig>>) || {},
    automationSettings:
      (cfg.automationSettings as CommunicationAutomationSettings) || undefined as unknown as CommunicationAutomationSettings,
  };
}

/** Save communication_config to workspace_settings. */
export async function saveCommunicationConfig(
  workspaceId: string,
  config: CommunicationConfig
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_settings")
    .update({ communication_config: config })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}
