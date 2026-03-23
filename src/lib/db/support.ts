import { createClient } from "@/lib/supabase";
import type {
  SupportTicket,
  KnowledgeBaseArticle,
  TicketMessage,
} from "@/types/models";

// ---------------------------------------------------------------------------
// snake_case <-> camelCase mapping
// ---------------------------------------------------------------------------

export function mapTicketFromDB(row: Record<string, unknown>): SupportTicket {
  return {
    id: row.id as string,
    subject: row.subject as string,
    clientId: row.client_id as string | undefined,
    clientName: (row.client_name as string) || "",
    priority: row.priority as SupportTicket["priority"],
    status: row.status as SupportTicket["status"],
    messages: (row.messages as TicketMessage[]) || [],
    satisfaction: row.satisfaction as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapArticleFromDB(
  row: Record<string, unknown>
): KnowledgeBaseArticle {
  return {
    id: row.id as string,
    title: row.title as string,
    content: (row.content as string) || "",
    category: (row.category as string) || "",
    published: (row.published as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// Tickets CRUD
// ---------------------------------------------------------------------------

export async function fetchTickets(workspaceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    // Table might not exist yet — warn but don't blow up
    console.warn("[support] fetchTickets:", error.message);
    return [];
  }
  return data;
}

export async function dbCreateTicket(
  workspaceId: string,
  ticket: SupportTicket
) {
  const supabase = createClient();

  const { error } = await supabase.from("support_tickets").insert({
    id: ticket.id,
    workspace_id: workspaceId,
    subject: ticket.subject,
    client_id: ticket.clientId || null,
    client_name: ticket.clientName || "",
    priority: ticket.priority,
    status: ticket.status,
    messages: ticket.messages || [],
    satisfaction: ticket.satisfaction ?? null,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
  });

  if (error) throw error;
}

export async function dbUpdateTicket(
  workspaceId: string,
  id: string,
  updates: Partial<SupportTicket>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};

  if (updates.subject !== undefined) row.subject = updates.subject;
  if (updates.clientId !== undefined) row.client_id = updates.clientId || null;
  if (updates.clientName !== undefined) row.client_name = updates.clientName;
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.messages !== undefined) row.messages = updates.messages;
  if (updates.satisfaction !== undefined)
    row.satisfaction = updates.satisfaction ?? null;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("support_tickets")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteTicket(workspaceId: string, id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("support_tickets")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertTickets(
  workspaceId: string,
  tickets: SupportTicket[]
) {
  if (tickets.length === 0) return;

  const supabase = createClient();

  const rows = tickets.map((t) => ({
    id: t.id,
    workspace_id: workspaceId,
    subject: t.subject,
    client_id: t.clientId || null,
    client_name: t.clientName || "",
    priority: t.priority,
    status: t.status,
    messages: t.messages || [],
    satisfaction: t.satisfaction ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  }));

  const { error } = await supabase
    .from("support_tickets")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.warn("[support] dbUpsertTickets:", error.message);
  }
}

// ---------------------------------------------------------------------------
// Articles CRUD
// ---------------------------------------------------------------------------

export async function fetchArticles(workspaceId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("knowledge_base_articles")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[support] fetchArticles:", error.message);
    return [];
  }
  return data;
}

export async function dbCreateArticle(
  workspaceId: string,
  article: KnowledgeBaseArticle
) {
  const supabase = createClient();

  const { error } = await supabase.from("knowledge_base_articles").insert({
    id: article.id,
    workspace_id: workspaceId,
    title: article.title,
    content: article.content || "",
    category: article.category || "",
    published: article.published ?? false,
    created_at: article.createdAt,
    updated_at: article.updatedAt,
  });

  if (error) throw error;
}

export async function dbUpdateArticle(
  workspaceId: string,
  id: string,
  updates: Partial<KnowledgeBaseArticle>
) {
  const supabase = createClient();

  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.title = updates.title;
  if (updates.content !== undefined) row.content = updates.content;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.published !== undefined) row.published = updates.published;
  if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from("knowledge_base_articles")
    .update(row)
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbDeleteArticle(workspaceId: string, id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("knowledge_base_articles")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) throw error;
}

export async function dbUpsertArticles(
  workspaceId: string,
  articles: KnowledgeBaseArticle[]
) {
  if (articles.length === 0) return;

  const supabase = createClient();

  const rows = articles.map((a) => ({
    id: a.id,
    workspace_id: workspaceId,
    title: a.title,
    content: a.content || "",
    category: a.category || "",
    published: a.published ?? false,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  }));

  const { error } = await supabase
    .from("knowledge_base_articles")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.warn("[support] dbUpsertArticles:", error.message);
  }
}
