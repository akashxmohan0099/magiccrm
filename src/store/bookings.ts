import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Booking, AvailabilitySlot } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import { validateClientRef } from "@/lib/validate-refs";
import { useWaitlistStore } from "@/store/waitlist";
import {
  fetchBookings,
  dbCreateBooking,
  dbUpdateBooking,
  dbDeleteBooking,
  dbUpsertBookings,
  mapBookingFromDB,
  fetchBookingSettings,
  saveBookingSettings,
} from "@/lib/db/bookings";

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { day: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 5, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 6, startTime: "09:00", endTime: "12:00", enabled: false },
  { day: 0, startTime: "09:00", endTime: "12:00", enabled: false },
];

interface BookingsStore {
  bookings: Booking[];
  availability: AvailabilitySlot[];
  cancellationPolicy: string;
  bufferMinutes: number;
  cancelNotice: number;

  addBooking: (data: Omit<Booking, "id" | "createdAt" | "updatedAt">, workspaceId?: string) => Booking | null;
  updateBooking: (id: string, data: Partial<Booking>, workspaceId?: string) => void;
  deleteBooking: (id: string, workspaceId?: string) => void;
  setAvailability: (slots: AvailabilitySlot[], extras?: { bufferMinutes?: number; cancelNotice?: number }, workspaceId?: string) => void;
  setCancellationPolicy: (text: string, workspaceId?: string) => void;
  rateBooking: (id: string, rating: number, feedback?: string, workspaceId?: string) => void;
  getBookingsForDate: (date: string) => Booking[];
  hasConflict: (date: string, startTime: string, endTime: string, excludeId?: string) => boolean;

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useBookingsStore = create<BookingsStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      availability: DEFAULT_AVAILABILITY,
      cancellationPolicy: "",
      bufferMinutes: 0,
      cancelNotice: 0,

      addBooking: (data, workspaceId?) => {
        if (!validateClientRef(data.clientId)) {
          toast("Cannot create booking: client not found", "error");
          return null;
        }
        const booking: Booking = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ bookings: [...s.bookings, booking] }));
        logActivity("create", "bookings", `Booked "${booking.title}" on ${booking.date}`);
        toast(`Created booking "${booking.title}"`);

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateBooking(workspaceId, booking).catch((err) =>
            console.error("[bookings] dbCreateBooking failed:", err)
          );
        }

        return booking;
      },

      updateBooking: (id, data, workspaceId?) => {
        const existing = get().bookings.find((b) => b.id === id);
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, ...updatedData } : b
          ),
        }));
        logActivity("update", "bookings", "Updated booking");
        toast("Booking updated");
        // Notify waitlist when a booking is cancelled
        if (data.status === "cancelled" && existing && existing.status !== "cancelled") {
          useWaitlistStore.getState().checkAndNotify(existing.date, existing.startTime, existing.endTime);
        }

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          // Include the date so the db layer can build TIMESTAMPTZ from startTime/endTime
          const dbUpdates = { ...updatedData };
          if ((data.startTime || data.endTime) && !data.date && existing) {
            (dbUpdates as Record<string, unknown>).date = existing.date;
          }
          dbUpdateBooking(workspaceId, id, dbUpdates).catch((err) =>
            console.error("[bookings] dbUpdateBooking failed:", err)
          );
        }
      },

      deleteBooking: (id, workspaceId?) => {
        const booking = get().bookings.find((b) => b.id === id);
        set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) }));
        if (booking) {
          logActivity("delete", "bookings", `Cancelled booking "${booking.title}"`);
          toast(`Booking "${booking.title}" deleted`, "info");
          // Notify waitlist when a booking is deleted
          useWaitlistStore.getState().checkAndNotify(booking.date, booking.startTime, booking.endTime);

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteBooking(workspaceId, id).catch((err) =>
              console.error("[bookings] dbDeleteBooking failed:", err)
            );
          }
        }
      },

      setAvailability: (slots, extras?, workspaceId?) => {
        set({
          availability: slots,
          ...(extras?.bufferMinutes !== undefined && { bufferMinutes: extras.bufferMinutes }),
          ...(extras?.cancelNotice !== undefined && { cancelNotice: extras.cancelNotice }),
        });

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { cancellationPolicy } = get();
          saveBookingSettings(workspaceId, {
            availability: slots,
            cancellationPolicy,
          }).catch((err) =>
            console.error("[bookings] saveBookingSettings (availability) failed:", err)
          );
        }
      },

      setCancellationPolicy: (text, workspaceId?) => {
        set({ cancellationPolicy: text });

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          const { availability } = get();
          saveBookingSettings(workspaceId, {
            availability,
            cancellationPolicy: text,
          }).catch((err) =>
            console.error("[bookings] saveBookingSettings (policy) failed:", err)
          );
        }
      },

      rateBooking: (id, rating, feedback, workspaceId?) => {
        const ratingData = {
          satisfactionRating: rating,
          satisfactionFeedback: feedback,
          ratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  satisfactionRating: rating,
                  satisfactionFeedback: feedback ?? b.satisfactionFeedback,
                  ratedAt: ratingData.ratedAt,
                  updatedAt: ratingData.updatedAt,
                }
              : b
          ),
        }));
        toast("Rating submitted");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateBooking(workspaceId, id, ratingData).catch((err) =>
            console.error("[bookings] dbUpdateBooking (rating) failed:", err)
          );
        }
      },

      getBookingsForDate: (date) =>
        get().bookings.filter((b) => b.date === date && b.status !== "cancelled"),

      hasConflict: (date, startTime, endTime, excludeId) => {
        return get().bookings.some(
          (b) =>
            b.id !== excludeId &&
            b.date === date &&
            b.status !== "cancelled" &&
            b.startTime < endTime &&
            b.endTime > startTime
        );
      },

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { bookings, availability, cancellationPolicy } = get();
          await Promise.all([
            dbUpsertBookings(workspaceId, bookings),
            saveBookingSettings(workspaceId, { availability, cancellationPolicy }),
          ]);
        } catch (err) {
          console.error("[bookings] syncToSupabase failed:", err);
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const [rows, settings] = await Promise.all([
            fetchBookings(workspaceId),
            fetchBookingSettings(workspaceId),
          ]);

          const updates: Partial<BookingsStore> = {};

          updates.bookings = (rows ?? []).map((row: Record<string, unknown>) =>
            mapBookingFromDB(row)
          );

          if (settings) {
            if (settings.availability && settings.availability.length > 0) {
              updates.availability = settings.availability;
            }
            if (settings.cancellationPolicy !== undefined) {
              updates.cancellationPolicy = settings.cancellationPolicy;
            }
          }

          set(updates);
        } catch (err) {
          console.error("[bookings] loadFromSupabase failed:", err);
        }
      },
    }),
    {
      name: "magic-crm-bookings",
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let state = persisted as Record<string, any>;
        if (version < 2) {
          state = {
            ...state,
            bookings: (state.bookings ?? []).map((b: Record<string, unknown>) => ({
              ...b,
              serviceId: b.serviceId,
              serviceName: b.serviceName,
              price: b.price,
              duration: b.duration,
            })),
          };
        }
        if (version < 3) {
          state = {
            ...state,
            cancellationPolicy: state.cancellationPolicy ?? "",
          };
        }
        return state;
      },
    }
  )
);
