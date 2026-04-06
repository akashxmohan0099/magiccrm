import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SupportTicket, KnowledgeBaseArticle, TicketMessage } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateSupportTicket, sanitize } from "@/lib/validation";
import {
  fetchTickets,
  fetchArticles,
  dbCreateTicket,
  dbUpdateTicket,
  dbDeleteTicket,
  dbUpsertTickets,
  dbCreateArticle,
  dbUpdateArticle as dbUpdateArticleRow,
  dbDeleteArticle as dbDeleteArticleRow,
  dbUpsertArticles,
  mapTicketFromDB,
  mapArticleFromDB,
} from "@/lib/db/support";

interface SupportStore {
  tickets: SupportTicket[];
  articles: KnowledgeBaseArticle[];

  addTicket: (data: Omit<SupportTicket, "id" | "messages" | "createdAt" | "updatedAt">, workspaceId?: string) => SupportTicket;
  updateTicket: (id: string, data: Partial<SupportTicket>, workspaceId?: string) => void;
  deleteTicket: (id: string, workspaceId?: string) => void;
  addTicketMessage: (ticketId: string, content: string, sender: "user" | "client", workspaceId?: string) => void;

  addArticle: (data: Omit<KnowledgeBaseArticle, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => void;
  updateArticle: (id: string, data: Partial<KnowledgeBaseArticle>, workspaceId?: string) => void;
  deleteArticle: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useSupportStore = create<SupportStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      articles: [],

      addTicket: (data, workspaceId?) => {
        // Validate
        const validation = validateSupportTicket({ subject: data.subject, clientName: data.clientName });
        if (!validation.valid) {
          validation.errors.forEach(error => toast(error, "error"));
          return {} as SupportTicket;
        }

        const sanitizedData = {
          ...data,
          subject: sanitize(data.subject, 500),
          clientName: sanitize(data.clientName, 200),
        };

        const ticket: SupportTicket = {
          ...sanitizedData,
          id: generateId(),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ tickets: [...s.tickets, ticket] }));
        logActivity("create", "support", `New ticket: "${ticket.subject}"`);
        toast(`Created ticket "${ticket.subject}"`);

        if (workspaceId) {
          dbCreateTicket(workspaceId, ticket).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving support ticket" }));
          });
        }

        return ticket;
      },

      updateTicket: (id, data, workspaceId?) => {
        // Validate if subject or clientName changed
        if (data.subject !== undefined || data.clientName !== undefined) {
          const validation = validateSupportTicket({
            subject: data.subject,
            clientName: data.clientName,
          });
          if (!validation.valid) {
            validation.errors.forEach(error => toast(error, "error"));
            return;
          }
        }

        const previousTickets = get().tickets;
        const sanitizedData = {
          ...data,
          ...(data.subject !== undefined && { subject: sanitize(data.subject, 500) }),
          ...(data.clientName !== undefined && { clientName: sanitize(data.clientName, 200) }),
          updatedAt: new Date().toISOString(),
        };

        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...sanitizedData } : t
          ),
        }));
        logActivity("update", "support", "Updated ticket");
        toast("Ticket updated");

        if (workspaceId) {
          dbUpdateTicket(workspaceId, id, sanitizedData).catch((err) => {
            set({ tickets: previousTickets });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating support ticket" }));
          });
        }
      },

      deleteTicket: (id, workspaceId?) => {
        const previousTickets = get().tickets;
        set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) }));
        toast("Ticket deleted", "info");

        if (workspaceId) {
          dbDeleteTicket(workspaceId, id).catch((err) => {
            set({ tickets: previousTickets });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting support ticket" }));
          });
        }
      },

      addTicketMessage: (ticketId, content, sender, workspaceId?) => {
        const sanitizedContent = sanitize(content);
        const message: TicketMessage = { id: generateId(), content: sanitizedContent, sender, timestamp: new Date().toISOString() };
        let updatedTicket: SupportTicket | undefined;
        const previousTickets = get().tickets;

        set((s) => {
          const tickets = s.tickets.map((t) => {
            if (t.id === ticketId) {
              const updated = { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() };
              updatedTicket = updated;
              return updated;
            }
            return t;
          });
          return { tickets };
        });

        if (workspaceId && updatedTicket) {
          dbUpdateTicket(workspaceId, ticketId, {
            messages: updatedTicket.messages,
            updatedAt: updatedTicket.updatedAt,
          }).catch((err) => {
            set({ tickets: previousTickets });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "adding ticket message" }));
          });
        }
      },

      addArticle: (data, workspaceId?) => {
        const now = new Date().toISOString();
        const article: KnowledgeBaseArticle = { ...data, id: generateId(), createdAt: now, updatedAt: now };
        set((s) => ({
          articles: [...s.articles, article],
        }));
        logActivity("create", "support", `Published article "${data.title}"`);
        toast(`Article "${data.title}" published`);

        if (workspaceId) {
          dbCreateArticle(workspaceId, article).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving knowledge base article" }));
          });
        }
      },

      updateArticle: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          articles: s.articles.map((a) =>
            a.id === id ? { ...a, ...updatedData } : a
          ),
        }));
        logActivity("update", "support", "Updated article");
        toast("Article updated");

        if (workspaceId) {
          dbUpdateArticleRow(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating knowledge base article" }));
          });
        }
      },

      deleteArticle: (id, workspaceId?) => {
        set((s) => ({ articles: s.articles.filter((a) => a.id !== id) }));
        logActivity("delete", "support", "Deleted article");
        toast("Article deleted", "info");

        if (workspaceId) {
          dbDeleteArticleRow(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting knowledge base article" }));
          });
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { tickets, articles } = get();
          await Promise.all([
            dbUpsertTickets(workspaceId, tickets),
            dbUpsertArticles(workspaceId, articles),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing support data to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [ticketRows, articleRows] = await Promise.all([
            fetchTickets(workspaceId),
            fetchArticles(workspaceId),
          ]);

          const mappedTickets = (ticketRows ?? []).map((row: Record<string, unknown>) =>
            mapTicketFromDB(row)
          );
          const mappedArticles = (articleRows ?? []).map((row: Record<string, unknown>) =>
            mapArticleFromDB(row)
          );
          set({ tickets: mappedTickets, articles: mappedArticles });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading support data from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-support" }
  )
);
