import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Proposal } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";

function generateShareToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

interface ProposalsStore {
  proposals: Proposal[];
  addProposal: (data: Omit<Proposal, "id" | "shareToken" | "viewCount" | "createdAt" | "updatedAt">) => Proposal;
  updateProposal: (id: string, data: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;
}

export const useProposalsStore = create<ProposalsStore>()(
  persist(
    (set) => ({
      proposals: [],

      addProposal: (data) => {
        const now = new Date().toISOString();
        const proposal: Proposal = {
          id: generateId(),
          shareToken: generateShareToken(),
          viewCount: 0,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        set((s) => ({ proposals: [proposal, ...s.proposals] }));
        toast("Proposal created");
        return proposal;
      },

      updateProposal: (id, data) => {
        const now = new Date().toISOString();
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: now } : p
          ),
        }));
      },

      deleteProposal: (id) => {
        set((s) => ({ proposals: s.proposals.filter((p) => p.id !== id) }));
        toast("Proposal deleted");
      },
    }),
    { name: "magic-crm-proposals", version: 1 }
  )
);
