import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GiftCard } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";

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
  addCard: (data: Omit<GiftCard, "id" | "code" | "status" | "remainingBalance" | "createdAt" | "updatedAt">) => GiftCard;
  redeemCard: (code: string, amount: number) => { success: boolean; remaining: number };
  getCard: (id: string) => GiftCard | undefined;
  getCardByCode: (code: string) => GiftCard | undefined;
}

export const useGiftCardStore = create<GiftCardStore>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (data) => {
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
        return card;
      },

      redeemCard: (code, amount) => {
        const card = get().cards.find((c) => c.code === code && c.status === "active");
        if (!card) return { success: false, remaining: 0 };
        const redeemAmount = Math.min(amount, card.remainingBalance);
        const remaining = card.remainingBalance - redeemAmount;
        const now = new Date().toISOString();
        set((s) => ({
          cards: s.cards.map((c) =>
            c.id === card.id
              ? { ...c, remainingBalance: remaining, status: remaining <= 0 ? "redeemed" as const : "active" as const, updatedAt: now }
              : c
          ),
        }));
        toast(`Redeemed $${redeemAmount} from gift card ${code}`);
        return { success: true, remaining };
      },

      getCard: (id) => get().cards.find((c) => c.id === id),
      getCardByCode: (code) => get().cards.find((c) => c.code === code),
    }),
    { name: "magic-crm-gift-cards", version: 1 }
  )
);
