import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GiftCard } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateGiftCard, sanitize, sanitizeEmail } from "@/lib/validation";
import {
  fetchGiftCards, dbCreateGiftCard, dbUpdateGiftCard, dbDeleteGiftCard,
  dbUpsertGiftCards, mapGiftCardFromDB,
} from "@/lib/db/gift-cards";

function generateCode(): string {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

interface GiftCardStore {
  giftCards: GiftCard[];
  addGiftCard: (data: Omit<GiftCard, "id" | "code" | "balance" | "status" | "createdAt">, workspaceId?: string) => GiftCard;
  updateGiftCard: (id: string, data: Partial<Pick<GiftCard, "recipientName" | "recipientEmail" | "purchasedBy" | "expiresAt">>, workspaceId?: string) => void;
  redeemGiftCard: (id: string, amount: number, workspaceId?: string) => void;
  deleteGiftCard: (id: string, workspaceId?: string) => void;
  getGiftCardByCode: (code: string) => GiftCard | undefined;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useGiftCardStore = create<GiftCardStore>()(
  persist(
    (set, get) => ({
      giftCards: [],
      addGiftCard: (data, workspaceId?) => {
        const validation = validateGiftCard(data);
        if (validation.errors.length > 0) {
          toast(validation.errors[0], "error");
          return null as any;
        }

        const sanitizedData = {
          ...data,
          recipientName: sanitize(data.recipientName),
          recipientEmail: sanitizeEmail(data.recipientEmail),
          purchasedBy: data.purchasedBy ? sanitize(data.purchasedBy) : data.purchasedBy,
        };
        const card: GiftCard = {
          ...sanitizedData,
          id: generateId(),
          code: generateCode(),
          balance: sanitizedData.amount,
          status: "active",
          createdAt: new Date().toISOString(),
        };
        const previousGiftCards = get().giftCards;
        set((s) => ({ giftCards: [...s.giftCards, card] }));
        logActivity("create", "gift-cards", `Gift card ${card.code} created for $${card.amount}`);
        toast(`Gift card ${card.code} created`);

        if (workspaceId) {
          dbCreateGiftCard(workspaceId, card).catch((err) => {
            set({ giftCards: previousGiftCards });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving gift card" }));
          });
        }
        return card;
      },
      updateGiftCard: (id, data, workspaceId?) => {
        const card = get().giftCards.find((c) => c.id === id);
        if (card && (data.recipientName || data.recipientEmail)) {
          const validation = validateGiftCard({ ...card, amount: card.balance, ...data } as any);
          if (validation.errors.length > 0) {
            toast(validation.errors[0], "error");
            return;
          }
        }

        const sanitizedData = {
          ...data,
          recipientName: data.recipientName ? sanitize(data.recipientName) : data.recipientName,
          recipientEmail: data.recipientEmail ? sanitizeEmail(data.recipientEmail) : data.recipientEmail,
          purchasedBy: data.purchasedBy ? sanitize(data.purchasedBy) : data.purchasedBy,
        };
        const previousGiftCards = get().giftCards;
        set((s) => ({
          giftCards: s.giftCards.map((c) =>
            c.id === id ? { ...c, ...sanitizedData } : c
          ),
        }));
        if (card) {
          logActivity("update", "gift-cards", `Gift card ${card.code} updated`);
          toast(`Gift card ${card.code} updated`);
        }

        if (workspaceId) {
          dbUpdateGiftCard(workspaceId, id, sanitizedData).catch((err) => {
            set({ giftCards: previousGiftCards });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating gift card" }));
          });
        }
      },
      redeemGiftCard: (id, amount, workspaceId?) => {
        const card = get().giftCards.find((c) => c.id === id);
        if (!card || card.status !== "active") return;
        const newBalance = Math.max(0, card.balance - amount);
        const newStatus = newBalance === 0 ? "redeemed" as const : "active" as const;
        const previousGiftCards = get().giftCards;
        set((s) => ({
          giftCards: s.giftCards.map((c) =>
            c.id === id ? { ...c, balance: newBalance, status: newStatus } : c
          ),
        }));
        logActivity("update", "gift-cards", `Gift card ${card.code} redeemed $${amount}`);
        toast(`$${amount} redeemed from gift card ${card.code}`);

        if (workspaceId) {
          dbUpdateGiftCard(workspaceId, id, { balance: newBalance, status: newStatus }).catch((err) => {
            set({ giftCards: previousGiftCards });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "redeeming gift card" }));
          });
        }
      },
      deleteGiftCard: (id, workspaceId?) => {
        const card = get().giftCards.find((c) => c.id === id);
        const previousGiftCards = get().giftCards;
        set((s) => ({ giftCards: s.giftCards.filter((c) => c.id !== id) }));
        if (card) {
          logActivity("delete", "gift-cards", `Gift card ${card.code} deleted`);
          toast(`Gift card deleted`);
        }

        if (workspaceId) {
          dbDeleteGiftCard(workspaceId, id).catch((err) => {
            set({ giftCards: previousGiftCards });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting gift card" }));
          });
        }
      },
      getGiftCardByCode: (code) => {
        return get().giftCards.find((c) => c.code === code);
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { giftCards } = get();
          await dbUpsertGiftCards(workspaceId, giftCards);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing gift cards to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchGiftCards(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapGiftCardFromDB(row)
          );
          set({ giftCards: mapped });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading gift cards from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-gift-cards" }
  )
);
