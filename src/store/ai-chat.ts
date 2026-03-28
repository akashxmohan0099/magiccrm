import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolCalls?: { name: string; input: Record<string, unknown>; result?: string }[];
}

interface AIChatState {
  messages: ChatMessage[];
  loading: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  setLoading: (v: boolean) => void;
  clearHistory: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      messages: [],
      loading: false,

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            {
              ...msg,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      setLoading: (v) => set({ loading: v }),

      clearHistory: () => set({ messages: [] }),
    }),
    { name: "magic-crm-ai-chat" }
  )
);
