import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LoyaltyTransaction, ReferralCode } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchLoyaltyTransactions, dbCreateTransaction, dbUpsertTransactions, mapTransactionFromDB,
  fetchReferralCodes, dbCreateReferralCode, dbUpdateReferralCode, dbUpsertReferralCodes, mapReferralFromDB,
} from "@/lib/db/loyalty";

interface LoyaltyStore {
  transactions: LoyaltyTransaction[];
  referralCodes: ReferralCode[];
  pointsPerDollar: number;
  redeemThreshold: number;
  redeemValue: number;
  referralBonus: number;
  setConfig: (config: { pointsPerDollar?: number; redeemThreshold?: number; redeemValue?: number; referralBonus?: number }) => void;
  addTransaction: (data: Omit<LoyaltyTransaction, "id" | "createdAt">, workspaceId?: string) => void;
  getClientPoints: (clientId: string) => number;
  addReferralCode: (data: Omit<ReferralCode, "id" | "createdAt" | "timesUsed">, workspaceId?: string) => ReferralCode;
  useReferralCode: (code: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
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
      addTransaction: (data, workspaceId?) => {
        const tx: LoyaltyTransaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ transactions: [...s.transactions, tx] }));
        if (data.type === "earned") {
          logActivity("create", "loyalty", `${data.clientName} earned ${data.points} points`);
          toast(`${data.clientName} earned ${data.points} points`);
        } else if (data.type === "redeemed") {
          toast(`${data.clientName} redeemed ${data.points} points`);
        }

        if (workspaceId) {
          dbCreateTransaction(workspaceId, tx).catch((err) =>
            console.error("[loyalty] dbCreateTransaction failed:", err)
          );
        }
      },
      getClientPoints: (clientId) => {
        const txs = get().transactions.filter((t) => t.clientId === clientId);
        return txs.reduce((sum, t) => sum + (t.type === "redeemed" ? -t.points : t.points), 0);
      },
      addReferralCode: (data, workspaceId?) => {
        const code: ReferralCode = { ...data, id: generateId(), timesUsed: 0, createdAt: new Date().toISOString() };
        set((s) => ({ referralCodes: [...s.referralCodes, code] }));
        toast(`Referral code ${data.code} created`);

        if (workspaceId) {
          dbCreateReferralCode(workspaceId, code).catch((err) =>
            console.error("[loyalty] dbCreateReferralCode failed:", err)
          );
        }
        return code;
      },
      useReferralCode: (code, workspaceId?) => {
        let newTimesUsed = 0;
        set((s) => ({
          referralCodes: s.referralCodes.map((r) => {
            if (r.code === code) {
              newTimesUsed = r.timesUsed + 1;
              return { ...r, timesUsed: newTimesUsed };
            }
            return r;
          }),
        }));

        if (workspaceId) {
          dbUpdateReferralCode(workspaceId, code, newTimesUsed).catch((err) =>
            console.error("[loyalty] dbUpdateReferralCode failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { transactions, referralCodes } = get();
          await Promise.all([
            dbUpsertTransactions(workspaceId, transactions),
            dbUpsertReferralCodes(workspaceId, referralCodes),
          ]);
        } catch (err) {
          console.error("[loyalty] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [txRows, codeRows] = await Promise.all([
            fetchLoyaltyTransactions(workspaceId),
            fetchReferralCodes(workspaceId),
          ]);

          const updates: Record<string, unknown> = {};

          if (txRows && txRows.length > 0) {
            updates.transactions = txRows.map((r: Record<string, unknown>) => mapTransactionFromDB(r));
          }
          if (codeRows && codeRows.length > 0) {
            updates.referralCodes = codeRows.map((r: Record<string, unknown>) => mapReferralFromDB(r));
          }

          if (Object.keys(updates).length > 0) {
            set(updates as Partial<LoyaltyStore>);
          }
        } catch (err) {
          console.error("[loyalty] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-loyalty" }
  )
);
