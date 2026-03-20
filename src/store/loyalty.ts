import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LoyaltyTransaction, ReferralCode } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface LoyaltyStore {
  transactions: LoyaltyTransaction[];
  referralCodes: ReferralCode[];
  pointsPerDollar: number;
  redeemThreshold: number;
  redeemValue: number;
  referralBonus: number;
  setConfig: (config: { pointsPerDollar?: number; redeemThreshold?: number; redeemValue?: number; referralBonus?: number }) => void;
  addTransaction: (data: Omit<LoyaltyTransaction, "id" | "createdAt">) => void;
  getClientPoints: (clientId: string) => number;
  addReferralCode: (data: Omit<ReferralCode, "id" | "createdAt" | "timesUsed">) => ReferralCode;
  useReferralCode: (code: string) => void;
}

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      referralCodes: [],
      pointsPerDollar: 1,
      redeemThreshold: 100,
      redeemValue: 10,
      referralBonus: 50,
      setConfig: (config) => set(config),
      addTransaction: (data) => {
        const tx: LoyaltyTransaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ transactions: [...s.transactions, tx] }));
        if (data.type === "earned") {
          logActivity("create", "loyalty", `${data.clientName} earned ${data.points} points`);
        }
      },
      getClientPoints: (clientId) => {
        const txs = get().transactions.filter((t) => t.clientId === clientId);
        return txs.reduce((sum, t) => sum + (t.type === "redeemed" ? -t.points : t.points), 0);
      },
      addReferralCode: (data) => {
        const code: ReferralCode = { ...data, id: generateId(), timesUsed: 0, createdAt: new Date().toISOString() };
        set((s) => ({ referralCodes: [...s.referralCodes, code] }));
        toast(`Referral code ${data.code} created`);
        return code;
      },
      useReferralCode: (code) => {
        set((s) => ({ referralCodes: s.referralCodes.map((r) => r.code === code ? { ...r, timesUsed: r.timesUsed + 1 } : r) }));
      },
    }),
    { name: "magic-crm-loyalty" }
  )
);
