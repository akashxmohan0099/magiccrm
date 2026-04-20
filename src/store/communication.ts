import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchConversations,
  dbCreateConversation,
  dbUpdateConversation,
  fetchMessages,
  dbCreateMessage,
} from "@/lib/db/communication";

interface CommunicationStore {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  addConversation: (
    data: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Conversation;
  updateConversation: (
    id: string,
    data: Partial<Conversation>,
    workspaceId?: string
  ) => void;
  addMessage: (
    conversationId: string,
    data: Omit<Message, "id" | "createdAt">,
    workspaceId?: string
  ) => Message;
  getConversation: (id: string) => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},

      addConversation: (data, workspaceId) => {
        const now = new Date().toISOString();
        const conversation: Conversation = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          conversations: [conversation, ...s.conversations],
        }));
        toast("Conversation created");
        if (workspaceId) {
          dbCreateConversation(
            workspaceId,
            conversation as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return conversation;
      },

      updateConversation: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: now } : c
          ),
        }));
        if (workspaceId) {
          dbUpdateConversation(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }
      },

      addMessage: (conversationId, data, workspaceId) => {
        const now = new Date().toISOString();
        const message: Message = {
          id: generateId(),
          ...data,
          conversationId,
          createdAt: now,
        };
        set((s) => ({
          messages: {
            ...s.messages,
            [conversationId]: [
              ...(s.messages[conversationId] || []),
              message,
            ],
          },
        }));
        if (workspaceId) {
          dbCreateMessage(
            workspaceId,
            message as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return message;
      },

      getConversation: (id) =>
        get().conversations.find((c) => c.id === id),

      getMessages: (conversationId) =>
        get().messages[conversationId] || [],

      loadFromSupabase: async (workspaceId) => {
        try {
          const [conversations, allMessages] = await Promise.all([
            fetchConversations(workspaceId),
            fetchMessages(workspaceId),
          ]);
          // Group messages by conversationId
          const messages: Record<string, Message[]> = {};
          for (const msg of allMessages) {
            if (!messages[msg.conversationId]) {
              messages[msg.conversationId] = [];
            }
            messages[msg.conversationId].push(msg);
          }
          set({ conversations, messages });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-communication", version: 2 }
  )
);
