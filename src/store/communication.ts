import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Conversation, Message, Channel } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface CommunicationStore {
  conversations: Conversation[];
  addConversation: (data: Omit<Conversation, "id" | "messages" | "lastMessageAt" | "createdAt">) => Conversation;
  addMessage: (conversationId: string, content: string, sender: "user" | "client") => void;
  deleteConversation: (id: string) => void;
  getConversationsByChannel: (channel: Channel) => Conversation[];
}

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      conversations: [],

      addConversation: (data) => {
        const conversation: Conversation = {
          ...data,
          id: generateId(),
          messages: [],
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ conversations: [...s.conversations, conversation] }));
        logActivity("create", "communication", `New conversation with ${data.clientName}`);
        toast(`Created conversation with ${data.clientName}`);
        return conversation;
      },

      addMessage: (conversationId, content, sender) => {
        const message: Message = {
          id: generateId(),
          content,
          sender,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], lastMessageAt: message.timestamp }
              : c
          ),
        }));
      },

      deleteConversation: (id) => {
        set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) }));
      },

      getConversationsByChannel: (channel) =>
        get().conversations.filter((c) => c.channel === channel),
    }),
    { name: "magic-crm-communication" }
  )
);
