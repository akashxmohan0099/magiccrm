import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SupportTicket, KnowledgeBaseArticle, TicketMessage } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface SupportStore {
  tickets: SupportTicket[];
  articles: KnowledgeBaseArticle[];

  addTicket: (data: Omit<SupportTicket, "id" | "messages" | "createdAt" | "updatedAt">) => SupportTicket;
  updateTicket: (id: string, data: Partial<SupportTicket>) => void;
  deleteTicket: (id: string) => void;
  addTicketMessage: (ticketId: string, content: string, sender: "user" | "client") => void;

  addArticle: (data: Omit<KnowledgeBaseArticle, "id" | "createdAt" | "updatedAt">) => void;
  updateArticle: (id: string, data: Partial<KnowledgeBaseArticle>) => void;
  deleteArticle: (id: string) => void;
}

export const useSupportStore = create<SupportStore>()(
  persist(
    (set) => ({
      tickets: [],
      articles: [],

      addTicket: (data) => {
        const ticket: SupportTicket = {
          ...data,
          id: generateId(),
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ tickets: [...s.tickets, ticket] }));
        logActivity("create", "support", `New ticket: "${ticket.subject}"`);
        toast(`Created ticket "${ticket.subject}"`);
        return ticket;
      },
      updateTicket: (id, data) => {
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },
      deleteTicket: (id) => {
        set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) }));
        toast("Ticket deleted", "info");
      },
      addTicketMessage: (ticketId, content, sender) => {
        const message: TicketMessage = { id: generateId(), content, sender, timestamp: new Date().toISOString() };
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? { ...t, messages: [...t.messages, message], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      addArticle: (data) => {
        const now = new Date().toISOString();
        set((s) => ({
          articles: [...s.articles, { ...data, id: generateId(), createdAt: now, updatedAt: now }],
        }));
        logActivity("create", "support", `Published article "${data.title}"`);
      },
      updateArticle: (id, data) => {
        set((s) => ({
          articles: s.articles.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
          ),
        }));
      },
      deleteArticle: (id) => {
        set((s) => ({ articles: s.articles.filter((a) => a.id !== id) }));
      },
    }),
    { name: "magic-crm-support" }
  )
);
