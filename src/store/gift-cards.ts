import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GiftCard } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchGiftCards,
  dbCreateGiftCard,
  dbUpdateGiftCard,
} from "@/lib/db/gift-cards";
import { surfaceDbError } from "./_db-error";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface GiftCardStore {
  cards: GiftCard[];
  addCard: (
    data: Omit<GiftCard, "id" | "code" | "status" | "remainingBalance" | "createdAt" | "updatedAt">,
    workspaceId?: string,
  ) => GiftCard;
  redeemCard: (
    code: string,
    amount: number,
    workspaceId?: string,
  ) => { success: boolean; remaining: number };
  getCard: (id: string) => GiftCard | undefined;
  getCardByCode: (code: string) => GiftCard | undefined;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useGiftCardStore = create<GiftCardStore>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (data, workspaceId) => {
        const now = new Date().toISOString();
        const card: GiftCard = {
          id: generateId(),
          code: generateCode(),
          status: "active",
          remainingBalance: data.originalAmount,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ cards: [card, ...s.cards] }));
        toast(`Gift card ${card.code} created — $${card.originalAmount}`);
        if (workspaceId) {
          dbCreateGiftCard(workspaceId, card as unknown as Record<string, unknown>).catch(
            surfaceDbError("gift-cards"),
          );
        }
        return card;
      },

      redeemCard: (code, amount, workspaceId) => {
        const card = get().cards.find((c) => c.code === code && c.status === "active");
        if (!card) return { success: false, remaining: 0 };
        const redeemAmount = Math.min(amount, card.remainingBalance);
        const remaining = card.remainingBalance - redeemAmount;
        const now = new Date().toISOString();
        const nextStatus: GiftCard["status"] = remaining <= 0 ? "redeemed" : "active";
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === card.id
              ? { ...c, remainingBalance: remaining, status: nextStatus, updatedAt: now }
              : c,
          ),
        }));
        toast(`Redeemed $${redeemAmount} from gift card ${code}`);
        if (workspaceId) {
          dbUpdateGiftCard(workspaceId, card.id, {
            remainingBalance: remaining,
            status: nextStatus,
          }).catch(surfaceDbError("gift-cards"));
        }
        return { success: true, remaining };
      },

      getCard: (id) => get().cards.find((c) => c.id === id),
      getCardByCode: (code) => get().cards.find((c) => c.code === code),

      loadFromSupabase: async (workspaceId) => {
        try {
          const cards = await fetchGiftCards(workspaceId);
          set({ cards });
        } catch (err) {
          console.debug("[store] gift-cards load skipped:", err);
        }
      },
    }),
    { name: "magic-crm-gift-cards", version: 2 },
  ),
);
