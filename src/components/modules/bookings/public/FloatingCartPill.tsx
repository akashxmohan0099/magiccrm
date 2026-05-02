"use client";

import { useEffect, useState, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowUp } from "lucide-react";
import { useBookingCart } from "@/store/booking-cart";
import type { PublicService } from "./types";
import { computeLine, formatPrice } from "./helpers";

interface FloatingCartPillProps {
  /** Sentinel ref placed near the cart pane. When it leaves viewport, the
   *  pill appears so the user can re-enter the cart. */
  sentinelRef: RefObject<HTMLDivElement | null>;
  serviceMap: Map<string, PublicService>;
}

/**
 * Desktop-only floating cart re-entry pill. Appears centered at bottom-center
 * once the user has scrolled past the right-rail cart, mirroring Fresha's
 * "1 selected service ↑" widget. Mobile already has its own sticky bar.
 */
export function FloatingCartPill({ sentinelRef, serviceMap }: FloatingCartPillProps) {
  const items = useBookingCart((s) => s.items);
  const friends = useBookingCart((s) => s.friends);
  const [cartOutOfView, setCartOutOfView] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCartOutOfView(!entry.isIntersecting),
      { rootMargin: "-100px 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef]);

  const computed = items
    .map((it) => {
      const svc = serviceMap.get(it.serviceId);
      if (!svc) return null;
      const c = computeLine(svc, { variantId: it.variantId, tierId: it.tierId, addonIds: it.addonIds });
      return { qty: it.qty, price: c.price, service: svc };
    })
    .filter((x): x is { qty: number; price: number; service: PublicService } => x !== null);

  const groupEnabled = computed.length > 0 && computed.every((c) => c.service.allowGroupBooking);
  const groupCap = groupEnabled ? Math.min(...computed.map((c) => c.service.maxGroupSize ?? 4)) : 1;
  const visibleFriends = groupEnabled ? friends.slice(0, Math.max(0, groupCap - 1)) : [];
  const guestMultiplier = visibleFriends.length + 1;
  const count = computed.reduce((s, c) => s + c.qty, 0);
  const subtotal = computed.reduce((s, c) => s + c.price * c.qty, 0) * guestMultiplier;

  const visible = count > 0 && cartOutOfView;

  const scrollToCart = () => {
    sentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden lg:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
        >
          <button
            type="button"
            onClick={scrollToCart}
            className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-foreground text-background shadow-lg shadow-black/15 hover:opacity-90 cursor-pointer active:scale-[0.98] transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[13px] font-medium">
              {count} {count === 1 ? "service" : "services"}
              <span className="opacity-50 mx-1.5">·</span>
              <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
            </span>
            <ArrowUp className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
