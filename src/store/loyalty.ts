import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LoyaltyTransaction, ReferralCode } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateLoyaltyTransaction, sanitize } from "@/lib/validation";
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
        // Validate input
        const validation = validateLoyaltyTransaction(data);
        if (!validation.valid) {
          toast(validation.errors[0], "error");
          return;
        }

        // Sanitize string fields
        const sanitizedData = {
          ...data,
          clientName: sanitize(data.clientName),
          description: data.description ? sanitize(data.description) : "",
        };

        const tx: LoyaltyTransaction = { ...sanitizedData, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ transactions: [...s.transactions, tx] }));
        if (sanitizedData.type === "earned") {
          logActivity("create", "loyalty", `${sanitizedData.clientName} earned ${sanitizedData.points} points`);
          toast(`${sanitizedData.clientName} earned ${sanitizedData.points} points`);
        } else if (sanitizedData.type === "redeemed") {
          toast(`${sanitizedData.clientName} redeemed ${sanitizedData.points} points`);
        }

        if (workspaceId) {
          dbCreateTransaction(workspaceId, tx).catch((err) => {
            set((s) => ({ transactions: s.transactions.filter((t) => t.id !== tx.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving loyalty transaction" }));
          });
        }
      },
      getClientPoints: (clientId) => {
        const txs = get().transactions.filter((t) => t.clientId === clientId);
        return txs.reduce((sum, t) => sum + (t.type === "redeemed" ? -t.points : t.points), 0);
      },
      addReferralCode: (data, workspaceId?) => {
        // Sanitize code field
        const sanitizedData = {
          ...data,
          code: sanitize(data.code),
        };

        const code: ReferralCode = { ...sanitizedData, id: generateId(), timesUsed: 0, createdAt: new Date().toISOString() };
        set((s) => ({ referralCodes: [...s.referralCodes, code] }));
        toast(`Referral code ${sanitizedData.code} created`);

        if (workspaceId) {
          dbCreateReferralCode(workspaceId, code).catch((err) => {
            set((s) => ({ referralCodes: s.referralCodes.filter((c) => c.id !== code.id) }));
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving referral code" }));
          });
        }
        return code;
      },
      useReferralCode: (code, workspaceId?) => {
        // Capture previous state for rollback
        const previousCodes = get().referralCodes;
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
          dbUpdateReferralCode(workspaceId, code, newTimesUsed).catch((err) => {
            set({ referralCodes: previousCodes });
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating referral code usage" }));
          });
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing loyalty data to Supabase" }));
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
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading loyalty data from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-loyalty" }
  )
);
