import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Conversation,
  Message,
  Channel,
  ChannelConnectionConfig,
  CommunicationAutomationSettings,
} from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchConversations,
  dbCreateConversation,
  dbCreateMessage,
  dbUpdateConversation,
  dbDeleteConversation,
  dbUpsertConversations,
  fetchCommunicationConfig,
  saveCommunicationConfig,
} from "@/lib/db/communication";

const OAUTH_CHANNELS: Channel[] = ["instagram", "facebook", "linkedin"];
const CHANNEL_LABELS: Record<Channel, string> = {
  email: "Email",
  sms: "SMS",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
};

const DEFAULT_AUTOMATION_SETTINGS: CommunicationAutomationSettings = {
  afterHoursEnabled: false,
  afterHoursMessage:
    "Thanks for your message! We're currently closed and will get back to you during business hours.",
  unreadAlertsEnabled: true,
  unreadAlertThresholdMinutes: 120,
  bulkMessageChannel: "email",
  bulkAudienceLabel: "",
  bulkMessageTemplate: "",
  includeUnsubscribeLink: true,
};

interface CommunicationStore {
  conversations: Conversation[];
  connectedChannels: Channel[];
  channelConfigs: Partial<Record<Channel, ChannelConnectionConfig>>;
  automationSettings: CommunicationAutomationSettings;
  addConversation: (data: Omit<Conversation, "id" | "messages" | "lastMessageAt" | "createdAt">, workspaceId?: string) => Conversation;
  addMessage: (conversationId: string, content: string, sender: "user" | "client", workspaceId?: string) => void;
  updateConversation: (id: string, data: Partial<Conversation>, workspaceId?: string) => void;
  deleteConversation: (id: string, workspaceId?: string) => void;
  getConversationsByChannel: (channel: Channel) => Conversation[];
  connectChannel: (channelId: Channel, workspaceId?: string) => void;
  disconnectChannel: (channelId: Channel, workspaceId?: string) => void;
  saveChannelConfig: (
    channelId: Channel,
    config: { identifier: string; displayName?: string; signature?: string },
    workspaceId?: string
  ) => ChannelConnectionConfig;
  updateChannelConfig: (channelId: Channel, data: Partial<ChannelConnectionConfig>, workspaceId?: string) => void;
  setAutomationSettings: (data: Partial<CommunicationAutomationSettings>, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useCommunicationStore = create<CommunicationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      connectedChannels: [],
      channelConfigs: {},
      automationSettings: DEFAULT_AUTOMATION_SETTINGS,

      connectChannel: (channelId, workspaceId?) => {
        set((s) => ({
          connectedChannels: s.connectedChannels.includes(channelId)
            ? s.connectedChannels
            : [...s.connectedChannels, channelId],
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { connectedChannels, channelConfigs, automationSettings } = get();
          saveCommunicationConfig(workspaceId, {
            connectedChannels,
            channelConfigs,
            automationSettings,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
          });
        }
      },

      disconnectChannel: (channelId, workspaceId?) => {
        set((s) => ({
          connectedChannels: s.connectedChannels.filter((id) => id !== channelId),
          channelConfigs: Object.fromEntries(
            Object.entries(s.channelConfigs).filter(([id]) => id !== channelId)
          ) as Partial<Record<Channel, ChannelConnectionConfig>>,
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { connectedChannels, channelConfigs, automationSettings } = get();
          saveCommunicationConfig(workspaceId, {
            connectedChannels,
            channelConfigs,
            automationSettings,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
          });
        }
      },

      saveChannelConfig: (channelId, config, workspaceId?) => {
        const now = new Date().toISOString();
        const existing = get().channelConfigs[channelId];
        const requiresOAuth = OAUTH_CHANNELS.includes(channelId);
        const savedConfig: ChannelConnectionConfig = {
          channel: channelId,
          identifier: config.identifier.trim(),
          displayName: config.displayName?.trim() || undefined,
          signature: config.signature?.trim() || undefined,
          status: requiresOAuth ? "action-required" : "configured",
          syncState: requiresOAuth ? "pending" : "idle",
          statusMessage: requiresOAuth
            ? "Authorization will start once the backend OAuth flow is connected."
            : "Configuration saved locally. Server sync will start once backend credentials are connected.",
          configuredAt: existing?.configuredAt ?? now,
          connectedAt: existing?.connectedAt,
          lastSyncedAt: existing?.lastSyncedAt,
        };

        set((s) => ({
          channelConfigs: {
            ...s.channelConfigs,
            [channelId]: savedConfig,
          },
          connectedChannels: requiresOAuth
            ? s.connectedChannels.filter((id) => id !== channelId)
            : s.connectedChannels.includes(channelId)
            ? s.connectedChannels
            : [...s.connectedChannels, channelId],
        }));

        toast(
          requiresOAuth
            ? `${CHANNEL_LABELS[channelId]} saved. OAuth will be connected from the backend.`
            : `${CHANNEL_LABELS[channelId]} configuration saved`
        );

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { connectedChannels, channelConfigs, automationSettings } = get();
          saveCommunicationConfig(workspaceId, {
            connectedChannels,
            channelConfigs,
            automationSettings,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
          });
        }

        return savedConfig;
      },

      updateChannelConfig: (channelId, data, workspaceId?) => {
        set((s) => {
          const existing = s.channelConfigs[channelId];
          if (!existing) return s;
          return {
            channelConfigs: {
              ...s.channelConfigs,
              [channelId]: {
                ...existing,
                ...data,
              },
            },
          };
        });

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { connectedChannels, channelConfigs, automationSettings } = get();
          saveCommunicationConfig(workspaceId, {
            connectedChannels,
            channelConfigs,
            automationSettings,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
          });
        }
      },

      setAutomationSettings: (data, workspaceId?) => {
        set((s) => ({
          automationSettings: {
            ...s.automationSettings,
            ...data,
          },
        }));

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { connectedChannels, channelConfigs, automationSettings } = get();
          saveCommunicationConfig(workspaceId, {
            connectedChannels,
            channelConfigs,
            automationSettings,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
          });
        }
      },

      addConversation: (data, workspaceId?) => {
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

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateConversation(workspaceId, conversation).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving message" }));
          });
        }

        return conversation;
      },

      addMessage: (conversationId, content, sender, workspaceId?) => {
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

        // Log outbound messages to activity timeline
        if (sender === "user") {
          const conversation = get().conversations.find((c) => c.id === conversationId);
          if (conversation) {
            logActivity("message", "communication", `Sent message to ${conversation.clientName}`, conversationId);
          }
        }

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateMessage(conversationId, message).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving message" }));
          });
          // Also update last_message_at on the conversation
          dbUpdateConversation(workspaceId, conversationId, {
            lastMessageAt: message.timestamp,
          }).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving message" }));
          });
        }
      },

      updateConversation: (id, data, workspaceId?) => {
        set((s) => ({
          conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        logActivity("update", "communication", "Updated conversation");
        toast("Conversation updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateConversation(workspaceId, id, data).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving message" }));
          });
        }
      },

      deleteConversation: (id, workspaceId?) => {
        set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) }));
        logActivity("delete", "communication", "Deleted conversation");
        toast("Conversation deleted", "info");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbDeleteConversation(workspaceId, id).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving message" }));
          });
        }
      },

      getConversationsByChannel: (channel) =>
        get().conversations.filter((c) => c.channel === channel),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { conversations, connectedChannels, channelConfigs, automationSettings } = get();
          await Promise.all([
            dbUpsertConversations(workspaceId, conversations),
            saveCommunicationConfig(workspaceId, {
              connectedChannels,
              channelConfigs,
              automationSettings,
            }),
          ]);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [conversations, config] = await Promise.all([
            fetchConversations(workspaceId),
            fetchCommunicationConfig(workspaceId),
          ]);

          const updates: Partial<CommunicationStore> = {
            conversations: conversations ?? [],
          };

          if (config) {
            updates.connectedChannels = config.connectedChannels ?? [];
            if (config.channelConfigs) {
              updates.channelConfigs = config.channelConfigs;
            }
            if (config.automationSettings) {
              updates.automationSettings = config.automationSettings;
            }
          }

          set(updates);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing messages" }));
        }
      },
    }),
    {
      name: "magic-crm-communication",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return {
            ...state,
            channelConfigs: state.channelConfigs ?? {},
            automationSettings: {
              ...DEFAULT_AUTOMATION_SETTINGS,
              ...(state.automationSettings as Record<string, unknown> | undefined),
            },
          };
        }
        return state;
      },
    }
  )
);
