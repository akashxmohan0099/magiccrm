import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoyaltyConfig, LoyaltyBalance, ReferralCode } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";

function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${suffix}`;
}

interface LoyaltyStore {
  config: LoyaltyConfig;
  balances: Record<string, LoyaltyBalance>; // keyed by clientId
  referralCodes: ReferralCode[];

  updateConfig: (data: Partial<LoyaltyConfig>) => void;
  awardPoints: (clientId: string, points: number) => void;
  redeemPoints: (clientId: string, points: number) => boolean;
  getBalance: (clientId: string) => LoyaltyBalance;
  createReferralCode: (clientId: string, clientName: string, workspaceId: string) => ReferralCode;
  recordReferral: (code: string) => void;
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      config: {
        pointsPerBooking: 10,
        pointsPerDollar: 0,
        redemptionThreshold: 100, // 100 points = $10 off
        enabled: true,
      },
      balances: {},
      referralCodes: [],

      updateConfig: (data) => {
        set((s) => ({ config: { ...s.config, ...data } }));
        toast("Loyalty settings updated");
      },

      awardPoints: (clientId, points) => {
        set((s) => {
          const existing = s.balances[clientId] || { clientId, totalEarned: 0, totalRedeemed: 0, balance: 0 };
          return {
            balances: {
              ...s.balances,
              [clientId]: {
                ...existing,
                totalEarned: existing.totalEarned + points,
                balance: existing.balance + points,
              },
            },
          };
        });
      },

      redeemPoints: (clientId, points) => {
        const balance = get().balances[clientId];
        if (!balance || balance.balance < points) return false;
        set((s) => ({
          balances: {
            ...s.balances,
            [clientId]: {
              ...balance,
              totalRedeemed: balance.totalRedeemed + points,
              balance: balance.balance - points,
            },
          },
        }));
        toast(`Redeemed ${points} points`);
        return true;
      },

      getBalance: (clientId) => {
        return get().balances[clientId] || { clientId, totalEarned: 0, totalRedeemed: 0, balance: 0 };
      },

      createReferralCode: (clientId, clientName, workspaceId) => {
        const existing = get().referralCodes.find((r) => r.clientId === clientId);
        if (existing) return existing;
        const code: ReferralCode = {
          id: generateId(),
          workspaceId,
          clientId,
          clientName,
          code: generateReferralCode(clientName),
          referralsMade: 0,
          rewardsCredited: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ referralCodes: [...s.referralCodes, code] }));
        toast(`Referral code ${code.code} created for ${clientName}`);
        return code;
      },

      recordReferral: (code) => {
        set((s) => ({
          referralCodes: s.referralCodes.map((r) =>
            r.code === code ? { ...r, referralsMade: r.referralsMade + 1 } : r
          ),
        }));
      },
    }),
    { name: "magic-crm-loyalty", version: 1 }
  )
);
