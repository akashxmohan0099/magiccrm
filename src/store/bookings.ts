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
import { surfaceDbError } from "./_db-error";

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
          ).catch(surfaceDbError("bookings"));
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
          ).catch(surfaceDbError("bookings"));
        }

        // Group reschedule cascade: when a primary booking moves, shift
        // every guest by the same time delta so the party stays aligned.
        // Only fires for time-mutating fields; status/notes/etc. don't
        // touch the schedule.
        if (
          prev &&
          (data.startAt || data.endAt || data.date) &&
          // Only the primary cascades — guests update independently.
          !prev.groupParentBookingId
        ) {
          const guests = get().bookings.filter(
            (b) => b.groupParentBookingId === id,
          );
          if (guests.length > 0) {
            const prevStartMs = new Date(prev.startAt).getTime();
            const nextStartIso = data.startAt ?? prev.startAt;
            const deltaMs = new Date(nextStartIso).getTime() - prevStartMs;
            if (deltaMs !== 0) {
              for (const g of guests) {
                const newStart = new Date(
                  new Date(g.startAt).getTime() + deltaMs,
                ).toISOString();
                const newEnd = new Date(
                  new Date(g.endAt).getTime() + deltaMs,
                ).toISOString();
                const newDate = newStart.slice(0, 10);
                set((s) => ({
                  bookings: s.bookings.map((b) =>
                    b.id === g.id
                      ? { ...b, startAt: newStart, endAt: newEnd, date: newDate, updatedAt: now }
                      : b,
                  ),
                }));
                if (workspaceId) {
                  dbUpdateBooking(workspaceId, g.id, {
                    startAt: newStart,
                    endAt: newEnd,
                    date: newDate,
                  } as Record<string, unknown>).catch(
                    surfaceDbError("bookings"),
                  );
                }
              }
            }
          }
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
          dbDeleteBooking(workspaceId, id).catch(surfaceDbError("bookings"));
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
