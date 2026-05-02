import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Public-booking cart. Lives only in the visitor's browser (sessionStorage),
 * never written to the DB until the booking is confirmed. Each line item
 * references a service by id and captures the visitor's choices: variant,
 * tier, artist, add-ons, quantity, optional guest name (group bookings).
 */
export interface CartLineItem {
  /** Stable id for this row in the cart — independent of serviceId so the
   *  same service can appear twice (e.g. two friends booking the same cut). */
  lineId: string;
  serviceId: string;
  variantId?: string;
  tierId?: string;
  artistId?: string;          // null/undefined = "anyone available"
  addonIds: string[];
  qty: number;
  /** Group bookings: name attached to this line if it isn't the primary booker. */
  guestName?: string;
}

/**
 * Group-booking guest. Each guest is a parallel appointment sharing the
 * primary's time slot but choosing their OWN service / add-ons / artist —
 * matches Fresha's pattern (lead organizer + N independent sub-appointments).
 *
 * `id` is stable so the UI can key list rows without remounting on rename.
 */
export interface GuestConfig {
  id: string;
  name: string;
  serviceId: string;
  addonIds: string[];
  /** Optional artist preference for this guest. null/undefined = "anyone". */
  artistId?: string | null;
}

interface BookingCartStore {
  /** Slug scopes the cart — clearing on slug change keeps state from leaking
   *  between businesses if a visitor opens two booking pages in one tab. */
  slug: string | null;
  items: CartLineItem[];
  /**
   * Group-booking guests sharing the same time slot. Each guest carries
   * their own service + add-ons + optional artist; the primary client's
   * cart drives the time slot, but the bill is per-guest line items.
   */
  guests: GuestConfig[];

  setSlug: (slug: string) => void;
  addItem: (input: Omit<CartLineItem, "lineId" | "qty"> & { qty?: number }) => CartLineItem;
  updateItem: (lineId: string, patch: Partial<Omit<CartLineItem, "lineId">>) => void;
  removeItem: (lineId: string) => void;
  addGuest: (input: Omit<GuestConfig, "id">) => GuestConfig;
  updateGuest: (id: string, patch: Partial<Omit<GuestConfig, "id">>) => void;
  removeGuest: (id: string) => void;
  clear: () => void;

  itemCount: () => number;
}

function makeLineId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useBookingCart = create<BookingCartStore>()(
  persist(
    (set, get) => ({
      slug: null,
      items: [],
      guests: [],

      setSlug: (slug) => {
        const current = get().slug;
        if (current && current !== slug) {
          set({ slug, items: [], guests: [] });
        } else {
          set({ slug });
        }
      },

      addItem: (input) => {
        const item: CartLineItem = {
          lineId: makeLineId(),
          qty: input.qty ?? 1,
          serviceId: input.serviceId,
          variantId: input.variantId,
          tierId: input.tierId,
          artistId: input.artistId,
          addonIds: input.addonIds ?? [],
          guestName: input.guestName,
        };
        set((s) => ({ items: [...s.items, item] }));
        return item;
      },

      updateItem: (lineId, patch) => {
        set((s) => ({
          items: s.items.map((it) => (it.lineId === lineId ? { ...it, ...patch } : it)),
        }));
      },

      removeItem: (lineId) => {
        set((s) => ({ items: s.items.filter((it) => it.lineId !== lineId) }));
      },

      addGuest: (input) => {
        const guest: GuestConfig = {
          id: makeGuestId(),
          name: input.name.trim(),
          serviceId: input.serviceId,
          addonIds: input.addonIds ?? [],
          artistId: input.artistId,
        };
        set((s) => ({ guests: [...s.guests, guest] }));
        return guest;
      },

      updateGuest: (id, patch) => {
        set((s) => ({
          guests: s.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },

      removeGuest: (id) => {
        set((s) => ({ guests: s.guests.filter((g) => g.id !== id) }));
      },

      clear: () => set({ items: [], guests: [] }),

      itemCount: () => get().items.reduce((sum, it) => sum + it.qty, 0),
    }),
    {
      name: "magic-booking-cart",
      // Bump the version so sessions with the old `friends: string[]` shape
      // don't poison the new state. zustand/persist drops mismatched state
      // when versions disagree, falling back to the defaults above.
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
