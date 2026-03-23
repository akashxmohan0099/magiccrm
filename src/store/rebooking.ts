import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RebookingPrompt } from "@/types/models";
import { generateId } from "@/lib/id";
import { useBookingsStore } from "@/store/bookings";
import { useServicesStore } from "@/store/services";
import { useClientsStore } from "@/store/clients";
import {
  fetchRebookingPrompts, dbCreateRebookingPrompt, dbUpdateRebookingPrompt,
  dbUpsertRebookingPrompts, mapRebookingPromptFromDB,
} from "@/lib/db/rebooking";

interface RebookingStore {
  prompts: RebookingPrompt[];
  generatePrompts: (workspaceId?: string) => void;
  snoozePrompt: (id: string, days: number, workspaceId?: string) => void;
  dismissPrompt: (id: string, workspaceId?: string) => void;
  markBooked: (id: string, workspaceId?: string) => void;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useRebookingStore = create<RebookingStore>()(
  persist(
    (set, get) => ({
      prompts: [],

      generatePrompts: (workspaceId?) => {
        const bookings = useBookingsStore.getState().bookings;
        const services = useServicesStore.getState().services;
        const clients = useClientsStore.getState().clients;
        const existing = get().prompts;

        // Build a client lookup
        const clientMap: Record<string, string> = {};
        for (const c of clients) {
          clientMap[c.id] = c.name;
        }

        // Only consider services with rebookingIntervalDays
        const rebookableServices = services.filter(
          (s) => s.rebookingIntervalDays && s.rebookingIntervalDays > 0
        );
        if (rebookableServices.length === 0) return;

        const rebookableServiceIds = new Set(rebookableServices.map((s) => s.id));

        // Find completed bookings for rebookable services
        const completedBookings = bookings.filter(
          (b) => b.status === "completed" && b.serviceId && rebookableServiceIds.has(b.serviceId) && b.clientId
        );

        // For each service, find the most recent completed booking per client
        const latestPerClientService: Record<string, { date: string; clientId: string; serviceId: string }> = {};
        for (const b of completedBookings) {
          const key = `${b.clientId}::${b.serviceId}`;
          if (!latestPerClientService[key] || b.date > latestPerClientService[key].date) {
            latestPerClientService[key] = { date: b.date, clientId: b.clientId!, serviceId: b.serviceId! };
          }
        }

        const now = new Date();
        const today = now.toISOString().split("T")[0];
        const newPrompts: RebookingPrompt[] = [];

        for (const [, info] of Object.entries(latestPerClientService)) {
          const service = rebookableServices.find((s) => s.id === info.serviceId);
          if (!service || !service.rebookingIntervalDays) continue;

          const lastDate = new Date(info.date + "T00:00:00");
          const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSince < service.rebookingIntervalDays) continue;

          // Check for existing pending/snoozed prompt for this client+service
          const alreadyExists = existing.some(
            (p) =>
              p.clientId === info.clientId &&
              p.serviceId === info.serviceId &&
              (p.status === "pending" || (p.status === "snoozed" && p.snoozedUntil && p.snoozedUntil > today))
          );
          if (alreadyExists) continue;

          // Calculate suggested rebook date
          const suggestedDate = new Date(lastDate);
          suggestedDate.setDate(suggestedDate.getDate() + service.rebookingIntervalDays);

          newPrompts.push({
            id: generateId(),
            clientId: info.clientId,
            clientName: clientMap[info.clientId] ?? "Unknown",
            serviceId: info.serviceId,
            serviceName: service.name,
            lastBookingDate: info.date,
            suggestedRebookDate: suggestedDate.toISOString().split("T")[0],
            status: "pending",
            createdAt: new Date().toISOString(),
          });
        }

        if (newPrompts.length > 0) {
          set((s) => ({ prompts: [...s.prompts, ...newPrompts] }));

          if (workspaceId) {
            for (const prompt of newPrompts) {
              dbCreateRebookingPrompt(workspaceId, prompt).catch((err) =>
                console.error("[rebooking] dbCreateRebookingPrompt failed:", err)
              );
            }
          }
        }
      },

      snoozePrompt: (id, days, workspaceId?) => {
        const snoozedUntil = new Date();
        snoozedUntil.setDate(snoozedUntil.getDate() + days);
        const snoozedUntilStr = snoozedUntil.toISOString().split("T")[0];
        set((s) => ({
          prompts: s.prompts.map((p) =>
            p.id === id
              ? { ...p, status: "snoozed" as const, snoozedUntil: snoozedUntilStr }
              : p
          ),
        }));

        if (workspaceId) {
          dbUpdateRebookingPrompt(workspaceId, id, { status: "snoozed", snoozedUntil: snoozedUntilStr }).catch((err) =>
            console.error("[rebooking] dbUpdateRebookingPrompt failed:", err)
          );
        }
      },

      dismissPrompt: (id, workspaceId?) => {
        set((s) => ({
          prompts: s.prompts.map((p) =>
            p.id === id ? { ...p, status: "dismissed" as const } : p
          ),
        }));

        if (workspaceId) {
          dbUpdateRebookingPrompt(workspaceId, id, { status: "dismissed" }).catch((err) =>
            console.error("[rebooking] dbUpdateRebookingPrompt failed:", err)
          );
        }
      },

      markBooked: (id, workspaceId?) => {
        set((s) => ({
          prompts: s.prompts.map((p) =>
            p.id === id ? { ...p, status: "booked" as const } : p
          ),
        }));

        if (workspaceId) {
          dbUpdateRebookingPrompt(workspaceId, id, { status: "booked" }).catch((err) =>
            console.error("[rebooking] dbUpdateRebookingPrompt failed:", err)
          );
        }
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { prompts } = get();
          await dbUpsertRebookingPrompts(workspaceId, prompts);
        } catch (err) {
          console.error("[rebooking] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchRebookingPrompts(workspaceId);
          if (!rows || rows.length === 0) return;

          const mapped = rows.map((row: Record<string, unknown>) =>
            mapRebookingPromptFromDB(row)
          );
          set({ prompts: mapped });
        } catch (err) {
          console.error("[rebooking] loadFromSupabase failed:", err);
        }
      },
    }),
    { name: "magic-crm-rebooking" }
  )
);
