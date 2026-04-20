import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking } from "@/types/models";
import { generateId } from "@/lib/id";
import { toast } from "@/components/ui/Toast";
import {
  fetchBookings,
  dbCreateBooking,
  dbUpdateBooking,
  dbDeleteBooking,
} from "@/lib/db/bookings";
import { fireAutomationForBooking } from "@/lib/automation-trigger";

interface BookingsStore {
  bookings: Booking[];
  addBooking: (
    data: Omit<Booking, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Booking;
  updateBooking: (
    id: string,
    data: Partial<Booking>,
    workspaceId?: string
  ) => void;
  deleteBooking: (id: string, workspaceId?: string) => void;
  getBookingsForDate: (date: string) => Booking[];
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useBookingsStore = create<BookingsStore>()(
  persist(
    (set, get) => ({
      bookings: [],

      addBooking: (data, workspaceId) => {
        const now = new Date().toISOString();
        const booking: Booking = {
          id: generateId(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        toast("Booking created");
        if (workspaceId) {
          dbCreateBooking(
            workspaceId,
            booking as unknown as Record<string, unknown>
          ).catch(console.error);
        }
        return booking;
      },

      updateBooking: (id, data, workspaceId) => {
        const now = new Date().toISOString();
        const prev = get().bookings.find((b) => b.id === id);
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: now } : b
          ),
        }));
        if (workspaceId) {
          dbUpdateBooking(
            workspaceId,
            id,
            data as Record<string, unknown>
          ).catch(console.error);
        }

        // Fire event-driven automations on status transitions.
        if (prev && data.status && data.status !== prev.status) {
          fireAutomationForBooking(prev, data.status);
        }
      },

      deleteBooking: (id, workspaceId) => {
        set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) }));
        toast("Booking deleted");
        if (workspaceId) {
          dbDeleteBooking(workspaceId, id).catch(console.error);
        }
      },

      getBookingsForDate: (date) => {
        return get().bookings.filter((b) => b.date === date);
      },

      loadFromSupabase: async (workspaceId) => {
        try {
          const bookings = await fetchBookings(workspaceId);
          set({ bookings });
        } catch (err) {
          console.debug("[store] loadFromSupabase skipped:", err);
        }
      },
    }),
    { name: "magic-crm-bookings", version: 2 }
  )
);
