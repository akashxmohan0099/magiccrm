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

interface BookingCartStore {
  /** Slug scopes the cart — clearing on slug change keeps state from leaking
   *  between businesses if a visitor opens two booking pages in one tab. */
  slug: string | null;
  items: CartLineItem[];
  /** Group-booking friends sharing the same time slot. Each friend gets the
   *  same set of services as the primary client (parallel chairs). */
  friends: string[];

  setSlug: (slug: string) => void;
  addItem: (input: Omit<CartLineItem, "lineId" | "qty"> & { qty?: number }) => CartLineItem;
  updateItem: (lineId: string, patch: Partial<Omit<CartLineItem, "lineId">>) => void;
  removeItem: (lineId: string) => void;
  addFriend: (name: string) => void;
  removeFriend: (index: number) => void;
  clear: () => void;

  itemCount: () => number;
}

function makeLineId() {
  return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useBookingCart = create<BookingCartStore>()(
  persist(
    (set, get) => ({
      slug: null,
      items: [],
      friends: [],

      setSlug: (slug) => {
        const current = get().slug;
        if (current && current !== slug) {
          set({ slug, items: [], friends: [] });
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

      addFriend: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({ friends: [...s.friends, trimmed] }));
      },

      removeFriend: (index) => {
        set((s) => ({ friends: s.friends.filter((_, i) => i !== index) }));
      },

      clear: () => set({ items: [], friends: [] }),

      itemCount: () => get().items.reduce((sum, it) => sum + it.qty, 0),
    }),
    {
      name: "magic-booking-cart",
      version: 1,
      // Public visitors — no point persisting across browser sessions.
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
