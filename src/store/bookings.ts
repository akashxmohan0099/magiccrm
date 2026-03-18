import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Booking, AvailabilitySlot } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

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

  addBooking: (data: Omit<Booking, "id" | "createdAt" | "updatedAt">) => Booking;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  setAvailability: (slots: AvailabilitySlot[]) => void;
  getBookingsForDate: (date: string) => Booking[];
  hasConflict: (date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
}

export const useBookingsStore = create<BookingsStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      availability: DEFAULT_AVAILABILITY,

      addBooking: (data) => {
        const booking: Booking = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ bookings: [...s.bookings, booking] }));
        logActivity("create", "bookings", `Booked "${booking.title}" on ${booking.date}`);
        toast(`Created booking "${booking.title}"`);
        return booking;
      },

      updateBooking: (id, data) => {
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b
          ),
        }));
      },

      deleteBooking: (id) => {
        const booking = get().bookings.find((b) => b.id === id);
        set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) }));
        if (booking) {
          logActivity("delete", "bookings", `Cancelled booking "${booking.title}"`);
          toast(`Booking "${booking.title}" deleted`, "info");
        }
      },

      setAvailability: (slots) => set({ availability: slots }),

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
    }),
    { name: "magic-crm-bookings" }
  )
);
