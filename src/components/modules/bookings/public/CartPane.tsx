"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Trash2, ArrowRight, Pencil, Sparkles, UserPlus, X, MapPin, Building2 } from "lucide-react";
import { useBookingCart, type CartLineItem } from "@/store/booking-cart";
import type { PublicLocation, PublicMember, PublicService } from "./types";
import { computeLine, formatDuration, formatPrice, lineDeposit } from "./helpers";

interface CartPaneProps {
  serviceMap: Map<string, PublicService>;
  memberMap: Map<string, PublicMember>;
  /** serviceId → eligible memberIds. Used to scope per-guest artist pickers. */
  memberServiceMap?: Record<string, string[]>;
  /** Full active member list (so the picker can show "any" + the eligible set). */
  members?: PublicMember[];
  businessName: string;
  onContinue: () => void;
  onEdit: (lineId: string) => void;
  /** Continue-button label — defaults to "Continue". Lets the page pass step-aware copy. */
  continueLabel?: string;
  /** External disabling reason on top of the empty-cart guard. */
  continueDisabled?: boolean;
  /** Optional gift-card discount to surface in the breakdown. */
  giftCardBalance?: number;
  /** Selected location — only rendered when the workspace exposed a picker. */
  location?: PublicLocation | null;
  /** Forwarded to the outer aside so callers can apply layout (sticky etc). */
  className?: string;
}

/**
 * Persistent right-rail cart for desktop. Multi-service line items, running
 * totals, and the primary Continue CTA. Stays in sync with the sessionStorage
 * cart store so refreshes don't lose state.
 */
export function CartPane({ serviceMap, memberMap, memberServiceMap = {}, members = [], businessName, onContinue, onEdit, continueLabel = "Continue", continueDisabled = false, giftCardBalance = 0, location = null, className = "" }: CartPaneProps) {
  const items = useBookingCart((s) => s.items);
  const removeItem = useBookingCart((s) => s.removeItem);
  const guests = useBookingCart((s) => s.guests);
  const addGuest = useBookingCart((s) => s.addGuest);
  const updateGuest = useBookingCart((s) => s.updateGuest);
  const removeGuest = useBookingCart((s) => s.removeGuest);
  const [guestDraftName, setGuestDraftName] = useState("");
  const [guestDraftServiceId, setGuestDraftServiceId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const lines = items
    .map((it) => {
      const service = serviceMap.get(it.serviceId);
      if (!service) return null;
      const computed = computeLine(service, {
        variantId: it.variantId,
        tierId: it.tierId,
        addonIds: it.addonIds,
      });
      return { item: it, service, computed };
    })
    .filter((row): row is { item: CartLineItem; service: PublicService; computed: ReturnType<typeof computeLine> } => row !== null);

  // Group-booking affordance shows when at least one cart line allows it.
  // Cap is the min(maxGroupSize) across the group-eligible lines, per
  // Fresha: the primary's group rule defines the party limit; guest
  // services don't have to allow groups themselves.
  const groupEligibleLines = lines.filter(({ service }) => service.allowGroupBooking);
  const groupEnabled = groupEligibleLines.length > 0;
  const groupCap = groupEnabled
    ? Math.min(...groupEligibleLines.map(({ service }) => service.maxGroupSize ?? 4))
    : 1;
  const visibleGuests = groupEnabled ? guests.slice(0, Math.max(0, groupCap - 1)) : [];
  const guestServiceOptions = Array.from(serviceMap.values()).filter((service) => {
    if (service.isPackage || service.requiresPatchTest) return false;
    if (location?.id && service.locationIds.length > 0 && !service.locationIds.includes(location.id)) {
      return false;
    }
    return true;
  });
  const defaultGuestServiceId =
    guestServiceOptions.find((service) => service.id === lines[0]?.service.id)?.id ??
    guestServiceOptions[0]?.id ??
    "";

  // Per-guest computed line (own service → own price + duration). Guests
  // book in PARALLEL — they don't add to the slot length, but they each
  // contribute a line price.
  const guestLines = visibleGuests
    .map((g) => {
      const service = serviceMap.get(g.serviceId);
      if (!service) return null;
      const computed = computeLine(service, { addonIds: g.addonIds });
      return { guest: g, service, computed };
    })
    .filter(
      (row): row is { guest: typeof guests[number]; service: PublicService; computed: ReturnType<typeof computeLine> } =>
        row !== null,
    );

  const primarySubtotal = lines.reduce((sum, { item, computed }) => sum + computed.price * item.qty, 0);
  const guestSubtotal = guestLines.reduce((sum, { computed }) => sum + computed.price, 0);
  const subtotal = primarySubtotal + guestSubtotal;
  const primaryDuration = lines.reduce((sum, { item, computed }) => sum + computed.duration * item.qty, 0);
  const maxGuestDuration = guestLines.reduce((max, { computed }) => Math.max(max, computed.duration), 0);
  const totalDuration = Math.max(primaryDuration, maxGuestDuration);
  const primaryDeposit = lines.reduce(
    (sum, { item, service, computed }) => sum + lineDeposit(service, computed.price) * item.qty,
    0
  );
  const guestDeposit = guestLines.reduce(
    (sum, { service, computed }) => sum + lineDeposit(service, computed.price),
    0,
  );
  const dueToday = primaryDeposit + guestDeposit;

  const grandTotal = subtotal;
  const atAppointmentBeforeGift = grandTotal - dueToday;
  // Gift card draws down the at-appointment balance (deposits stay on Stripe).
  const giftCardApplied = Math.min(giftCardBalance, atAppointmentBeforeGift);
  const atAppointment = atAppointmentBeforeGift - giftCardApplied;

  const isEmpty = lines.length === 0;

  return (
    <aside
      className={`bg-card-bg border border-border-light rounded-2xl p-5 ${className}`}
      aria-label="Your booking"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-4 h-4 text-text-tertiary" />
        <p className="text-[13px] font-semibold text-foreground tracking-tight">
          {businessName}
        </p>
      </div>

      {location && (
        <div className="mb-4 -mt-1 flex items-start gap-2 px-3 py-2 rounded-lg bg-surface">
          {location.kind === "mobile" ? (
            <MapPin className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-none" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-none" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-foreground truncate">{location.name}</p>
            <p className="text-[11px] text-text-tertiary truncate">
              {location.kind === "mobile" ? "We travel to you" : location.address || "Studio appointment"}
            </p>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-3">
            <ShoppingBag className="w-5 h-5 text-text-tertiary" />
          </div>
          <p className="text-[13px] font-medium text-foreground">No services selected</p>
          <p className="text-[12px] text-text-tertiary mt-1 max-w-[220px]">
            Pick services from the catalog to start building your booking.
          </p>
        </div>
      ) : (
        <ul className="-mx-1 divide-y divide-border-light">
          <AnimatePresence initial={false}>
            {lines.map(({ item, service, computed }) => {
              const artist = item.artistId ? memberMap.get(item.artistId) : null;
              return (
                <motion.li
                  key={item.lineId}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="px-1 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground leading-tight">
                        {service.name}
                      </p>
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        {computed.subtitle ? `${computed.subtitle} · ` : ""}
                        {formatDuration(computed.duration)}
                      </p>
                      <button
                        type="button"
                        onClick={() => onEdit(item.lineId)}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-foreground cursor-pointer group"
                      >
                        {artist ? (
                          <>
                            <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {artist.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={artist.avatarUrl} alt={artist.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] font-bold text-primary">
                                  {artist.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </span>
                              )}
                            </span>
                            <span className="truncate">with {artist.name}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-text-tertiary" />
                            <span>Anyone available</span>
                          </>
                        )}
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground tabular-nums">
                      {formatPrice(computed.price * item.qty)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      aria-label={`Remove ${service.name}`}
                      className="text-text-tertiary hover:text-red-500 cursor-pointer p-0.5 -m-0.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Guests — group bookings (Fresha pattern: each guest picks their
          own service, has their own price line). */}
      {!isEmpty && groupEnabled && (
        <div className="mt-4 pt-4 border-t border-border-light">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
              Guests
            </p>
            {!adding && visibleGuests.length + 1 < groupCap && guestServiceOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-1 text-[12px] text-primary font-medium hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add a guest
              </button>
            )}
          </div>

          <AnimatePresence initial={false}>
            {guestLines.map(({ guest, service, computed }) => (
              <motion.div
                key={guest.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="mb-2 px-2.5 py-2 rounded-lg bg-surface text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0">
                    {guest.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "G"}
                  </span>
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
                    placeholder="Guest name"
                    className="flex-1 min-w-0 bg-transparent text-foreground outline-none border-b border-transparent focus:border-border-light"
                  />
                  <button
                    type="button"
                    onClick={() => removeGuest(guest.id)}
                    aria-label={`Remove ${guest.name || "guest"}`}
                    className="text-text-tertiary hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    value={guest.serviceId}
                    onChange={(e) => updateGuest(guest.id, { serviceId: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1 bg-card-bg border border-border-light rounded text-[11px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {guestServiceOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-text-tertiary tabular-nums shrink-0">
                    {formatDuration(computed.duration)} · {formatPrice(computed.price)}
                  </span>
                </div>
                {(() => {
                  // Per-guest artist picker. Eligible set = memberServiceMap
                  // entry for the guest's service; falls back to all active
                  // members when the service is "Anyone" (empty/missing
                  // member_services rows).
                  const eligibleIds = memberServiceMap[guest.serviceId];
                  const eligibleMembers =
                    eligibleIds && eligibleIds.length > 0
                      ? members.filter((m) => eligibleIds.includes(m.id))
                      : members;
                  if (eligibleMembers.length <= 1) return null;
                  return (
                    <div className="mt-1.5">
                      <select
                        value={guest.artistId ?? ""}
                        onChange={(e) =>
                          updateGuest(guest.id, {
                            artistId: e.target.value || null,
                          })
                        }
                        className="w-full px-2 py-1 bg-card-bg border border-border-light rounded text-[11px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Any artist</option>
                        {eligibleMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
                {service && computed.price === 0 && (
                  <p className="text-[10px] text-text-tertiary mt-1">
                    {service.name} doesn&apos;t have a fixed price set.
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {adding && visibleGuests.length + 1 < groupCap && guestServiceOptions.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = guestDraftName.trim();
                const serviceId =
                  guestDraftServiceId ||
                  // Default the guest to the primary's first service when
                  // it's eligible, otherwise the first safe guest option.
                  defaultGuestServiceId;
                if (!name || !serviceId) return;
                addGuest({ name, serviceId, addonIds: [] });
                setGuestDraftName("");
                setGuestDraftServiceId("");
                setAdding(false);
              }}
              className="space-y-1.5 mt-1.5"
            >
              <input
                value={guestDraftName}
                onChange={(e) => setGuestDraftName(e.target.value)}
                placeholder="Guest name"
                autoFocus
                className="w-full px-2.5 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAdding(false);
                    setGuestDraftName("");
                    setGuestDraftServiceId("");
                  }
                }}
              />
              <div className="flex gap-2">
                <select
                  value={guestDraftServiceId || defaultGuestServiceId}
                  onChange={(e) => setGuestDraftServiceId(e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-1.5 bg-surface border border-border-light rounded-lg text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {guestServiceOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 rounded-lg bg-foreground text-background text-[12px] font-medium hover:opacity-90 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {visibleGuests.length + 1 >= groupCap && (
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Up to {groupCap} people for this group.
            </p>
          )}
        </div>
      )}

      {!isEmpty && (
        <div className="mt-4 pt-4 border-t border-border-light space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] text-text-tertiary">
              Total{visibleGuests.length > 0 ? ` · ${visibleGuests.length + 1} people` : ""}
            </p>
            <motion.p
              key={grandTotal}
              initial={{ opacity: 0.5, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[18px] font-bold text-foreground tabular-nums"
            >
              {formatPrice(grandTotal)}
            </motion.p>
          </div>

          {(dueToday > 0 || giftCardApplied > 0) && (
            <div className="rounded-lg bg-surface px-3 py-2.5 space-y-1.5">
              {dueToday > 0 && (
                <div className="flex items-baseline justify-between">
                  <p className="text-[12px] font-medium text-foreground">Pay today</p>
                  <p className="text-[13px] font-semibold text-foreground tabular-nums">
                    {formatPrice(dueToday)}
                  </p>
                </div>
              )}
              {giftCardApplied > 0 && (
                <div className="flex items-baseline justify-between text-primary">
                  <p className="text-[11px] font-medium">Gift card</p>
                  <p className="text-[12px] tabular-nums">−{formatPrice(giftCardApplied)}</p>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-text-tertiary">At appointment</p>
                <p className="text-[12px] text-text-tertiary tabular-nums">
                  {formatPrice(atAppointment)}
                </p>
              </div>
            </div>
          )}

          <p className="text-[11px] text-text-tertiary">
            About {formatDuration(totalDuration)} total
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={isEmpty || continueDisabled}
        className={`mt-5 w-full inline-flex items-center justify-center gap-2 py-3 rounded-full text-[14px] font-semibold transition-all ${
          isEmpty || continueDisabled
            ? "bg-surface text-text-tertiary cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90 cursor-pointer active:scale-[0.98]"
        }`}
      >
        {continueLabel}
        {!(isEmpty || continueDisabled) && <ArrowRight className="w-4 h-4" />}
      </button>
    </aside>
  );
}
