"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useBookingCart } from "@/store/booking-cart";
import type { PublicService } from "./types";
import { computeLine, formatPrice } from "./helpers";

interface MobileCartBarProps {
  serviceMap: Map<string, PublicService>;
  onContinue: () => void;
}

/**
 * Sticky bottom bar shown on mobile when the cart has items. Always visible,
 * thumb-reachable, summarizes count + total + Continue.
 */
export function MobileCartBar({ serviceMap, onContinue }: MobileCartBarProps) {
  const items = useBookingCart((s) => s.items);
  const friends = useBookingCart((s) => s.friends);

  const lines = items
    .map((it) => {
      const service = serviceMap.get(it.serviceId);
      if (!service) return null;
      const computed = computeLine(service, {
        variantId: it.variantId,
        tierId: it.tierId,
        addonIds: it.addonIds,
      });
      return { qty: it.qty, service, price: computed.price };
    })
    .filter((row): row is { qty: number; service: PublicService; price: number } => row !== null);

  const groupEnabled = lines.length > 0 && lines.every((l) => l.service.allowGroupBooking);
  const groupCap = groupEnabled ? Math.min(...lines.map((l) => l.service.maxGroupSize ?? 4)) : 1;
  const visibleFriends = groupEnabled ? friends.slice(0, Math.max(0, groupCap - 1)) : [];
  const guestMultiplier = visibleFriends.length + 1;
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0) * guestMultiplier;
  const visible = count > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 bg-background/95 backdrop-blur-md border-t border-border-light"
        >
          <button
            type="button"
            onClick={onContinue}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-full bg-foreground text-background hover:opacity-90 cursor-pointer active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <ShoppingBag className="w-4 h-4" />
              {count} {count === 1 ? "service" : "services"}
              <span className="opacity-50">·</span>
              <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
            </span>
            <span className="flex items-center gap-1 text-[13px] font-semibold">
              Continue
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
