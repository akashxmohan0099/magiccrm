"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Eye } from "lucide-react";

import { useBookingCart } from "@/store/booking-cart";
import { CategoryTabs } from "./CategoryTabs";
import { ServiceCard } from "./ServiceCard";
import { CartPane } from "./CartPane";
import { MobileCartBar } from "./MobileCartBar";
import { LineItemDrawer } from "./LineItemDrawer";
import { TimePicker } from "./TimePicker";
import { DetailsForm, isDetailsValid, type DetailsFormValues } from "./DetailsForm";
import { Confirmation, type ConfirmedBooking } from "./Confirmation";
import { CatalogSkeleton } from "./CatalogSkeleton";
import { FloatingCartPill } from "./FloatingCartPill";
import { CardOnFileForm } from "@/app/book/[slug]/CardOnFileForm";
import { GiftCardField, type GiftCardCheck } from "./GiftCardField";
import { LocationPicker } from "./LocationPicker";
import { categoryAnchor, computeLine } from "./helpers";
import type { PublicLocation, PublicMember, PublicService } from "./types";

export type Step = "browse" | "time" | "details" | "confirm";
const STEPS: { key: Step; label: string }[] = [
  { key: "browse", label: "Services" },
  { key: "time", label: "Time" },
  { key: "details", label: "Details" },
  { key: "confirm", label: "Confirm" },
];

export interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const EMPTY_DETAILS: DetailsFormValues = { name: "", email: "", phone: "", notes: "", address: "" };

/**
 * Submit payload assembled from the cart + details. Callers map this onto
 * either a real fetch (`/api/public/book/basket`) or a preview no-op.
 */
export interface PublicBookingSubmitPayload {
  slug: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  notes?: string;
  date: string;
  time: string;
  locationId?: string;
  address?: string;
  stripeCustomerId?: string;
  stripeSetupIntentId?: string;
  giftCardCode?: string;
  items: Array<{
    serviceId: string;
    variantId?: string;
    addonIds: string[];
    artistId?: string;
    intakeAnswers?: Record<string, string>;
    guestName?: string;
    guestOf?: number;
  }>;
}

export type PublicBookingSubmitResult =
  | { ok: true }
  | { ok: false; error: string };

export interface PublicBookingFlowProps {
  /** Workspace slug. Both modes need a real slug — the public TimePicker, info,
   *  and submit endpoints are all slug-keyed. Preview uses the workspace's
   *  own slug so availability matches what a customer would see. */
  slug: string;
  loading: boolean;
  error: string | null;
  businessName: string;
  brandColor: string;
  services: PublicService[];
  members: PublicMember[];
  memberServiceMap: Record<string, string[]>;
  availability: AvailabilitySlot[];
  locations: PublicLocation[];
  /** Called when the visitor confirms. The implementation either POSTs the
   *  basket or simulates success (preview). Resolved value drives whether
   *  the flow advances to the confirmation step. */
  onSubmit: (payload: PublicBookingSubmitPayload) => Promise<PublicBookingSubmitResult>;
  /** Preview mode flag. Surfaces a banner explaining that submit / Stripe /
   *  email-SMS are stubbed, and disables the Stripe card-on-file form
   *  (it requires a real Stripe customer that doesn't exist in preview). */
  previewMode?: boolean;
  /** Custom banner copy for preview mode. Defaults to a short note. */
  previewBanner?: React.ReactNode;
  /** Page chrome — when true, the sticky top bar + mobile cart bar render.
   *  Preview shells provide their own chrome and pass `false`. */
  showChrome?: boolean;
}

/**
 * The public booking flow. Same component the live `/book/[slug]` page
 * mounts and the dashboard preview mounts — there is no parallel
 * implementation. Differences between the two modes are limited to:
 *   - `onSubmit` (real POST vs simulated success)
 *   - `previewMode` (banners + Stripe disabled)
 *   - `showChrome` (sticky header + mobile bars on the page; suppressed
 *     inside a slideover that already provides its own chrome).
 */
export function PublicBookingFlow({
  slug,
  loading,
  error,
  businessName,
  brandColor,
  services,
  members,
  memberServiceMap,
  availability,
  locations,
  onSubmit,
  previewMode = false,
  previewBanner,
  showChrome = true,
}: PublicBookingFlowProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("browse");
  const [scrolled, setScrolled] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const cartSentinelRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsFormValues>(EMPTY_DETAILS);
  const [intakeAnswersByService, setIntakeAnswersByService] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [cardOnFile, setCardOnFile] = useState<{ customerId: string; setupIntentId: string } | null>(null);
  const [giftCard, setGiftCard] = useState<GiftCardCheck | null>(null);

  const setSlug = useBookingCart((s) => s.setSlug);
  const cartItems = useBookingCart((s) => s.items);
  const guests = useBookingCart((s) => s.guests);
  const addItem = useBookingCart((s) => s.addItem);
  const removeItem = useBookingCart((s) => s.removeItem);
  const updateItem = useBookingCart((s) => s.updateItem);
  const removeGuest = useBookingCart((s) => s.removeGuest);
  const clearCart = useBookingCart((s) => s.clear);

  const removeByServiceId = (serviceId: string) => {
    const target = cartItems.find((it) => it.serviceId === serviceId);
    if (target) removeItem(target.lineId);
  };

  // Bind cart to this slug. Switching slugs clears the cart (handled in store).
  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  // Auto-pick the only location so downstream code always has one to thread.
  useEffect(() => {
    if (locations.length === 1 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Morphing top bar — business name fades in once user scrolls past ~40px.
  useEffect(() => {
    if (!showChrome) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showChrome]);

  // When the customer picks a different location, drop any cart items whose
  // service isn't offered there. Pinned slot/time gets reset so the customer
  // re-picks against the new location's availability.
  useEffect(() => {
    if (!selectedLocationId || locations.length < 2) return;
    const allowedServiceIds = new Set(
      services
        .filter((s) => !s.locationIds?.length || s.locationIds.includes(selectedLocationId))
        .map((s) => s.id),
    );
    const stale = cartItems.filter((it) => !allowedServiceIds.has(it.serviceId));
    if (stale.length === 0) return;
    for (const it of stale) removeItem(it.lineId);
    setSelectedDate(null);
    setSelectedTime(null);
  }, [selectedLocationId, services, cartItems, removeItem, locations.length]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const visibleServices = useMemo(() => {
    if (!selectedLocationId || locations.length < 2) return services;
    return services.filter(
      (s) => !s.locationIds?.length || s.locationIds.includes(selectedLocationId),
    );
  }, [services, selectedLocationId, locations.length]);

  const sections = useMemo(() => {
    const map = new Map<string, PublicService[]>();
    for (const svc of visibleServices) {
      const cat = svc.category || "";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(svc);
    }
    const ordered = [...map.entries()].sort(([a], [b]) => {
      if (a === "" && b !== "") return 1;
      if (b === "" && a !== "") return -1;
      return a.localeCompare(b);
    });
    return ordered.map(([category, svcs]) => ({ category, services: svcs }));
  }, [visibleServices]);

  const categories = sections.map((s) => s.category);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const selectedIds = useMemo(() => new Set(cartItems.map((it) => it.serviceId)), [cartItems]);
  const enabledWeekdays = useMemo(
    () => new Set(availability.filter((s) => s.enabled).map((s) => s.day)),
    [availability]
  );
  const selectedServiceIds = useMemo(
    () => [...cartItems.map((item) => item.serviceId), ...guests.map((guest) => guest.serviceId)],
    [cartItems, guests],
  );

  const cartEnabledWeekdays = useMemo(() => {
    if (selectedServiceIds.length === 0) return enabledWeekdays;
    let allowed: number[] | null = null;
    for (const serviceId of selectedServiceIds) {
      const svc = serviceMap.get(serviceId);
      if (!svc) continue;
      const weekdays = svc.availableWeekdays;
      if (!weekdays || weekdays.length === 0) continue;
      if (allowed === null) {
        allowed = [...weekdays];
      } else {
        allowed = allowed.filter((d) => weekdays.includes(d));
      }
    }
    if (allowed === null) return enabledWeekdays;
    const allowedSet = new Set(allowed);
    const out = new Set<number>();
    for (const d of enabledWeekdays) {
      if (allowedSet.has(d)) out.add(d);
    }
    return out;
  }, [selectedServiceIds, serviceMap, enabledWeekdays]);

  const cartMinDate = useMemo<Date | undefined>(() => {
    if (selectedServiceIds.length === 0) return undefined;
    let maxNotice = 0;
    for (const serviceId of selectedServiceIds) {
      const svc = serviceMap.get(serviceId);
      const n = svc?.minNoticeHours;
      if (typeof n === "number" && n > maxNotice) maxNotice = n;
    }
    if (maxNotice <= 0) return undefined;
    const d = new Date();
    d.setHours(d.getHours() + maxNotice);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedServiceIds, serviceMap]);

  const cartMaxDate = useMemo<Date | undefined>(() => {
    if (selectedServiceIds.length === 0) return undefined;
    let minAdvance = Infinity;
    for (const serviceId of selectedServiceIds) {
      const svc = serviceMap.get(serviceId);
      const a = svc?.maxAdvanceDays;
      if (typeof a === "number" && a > 0 && a < minAdvance) minAdvance = a;
    }
    if (!Number.isFinite(minAdvance)) return undefined;
    const d = new Date();
    d.setDate(d.getDate() + minAdvance);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedServiceIds, serviceMap]);

  const editingItem = editingLineId ? cartItems.find((it) => it.lineId === editingLineId) ?? null : null;
  const editingService = editingItem ? serviceMap.get(editingItem.serviceId) ?? null : null;
  const eligibleMembers = useMemo(() => {
    if (!editingService) return [];
    const allowed = memberServiceMap[editingService.id];
    if (!allowed || allowed.length === 0) return members;
    const set = new Set(allowed);
    return members.filter((m) => set.has(m.id));
  }, [editingService, members, memberServiceMap]);

  const bookingStartAt = useMemo(
    () => (selectedDate && selectedTime ? `${selectedDate}T${selectedTime}:00` : null),
    [selectedDate, selectedTime],
  );

  const cartLines = useMemo(() => {
    return cartItems
      .map((item) => {
        const svc = serviceMap.get(item.serviceId);
        if (!svc) return null;
        const computed = computeLine(svc, {
          variantId: item.variantId,
          tierId: item.tierId,
          addonIds: item.addonIds,
          startAt: bookingStartAt,
        });
        return { item, service: svc, computed };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [cartItems, serviceMap, bookingStartAt]);

  const groupEligibleLines = useMemo(
    () => cartLines.filter((line) => line.service.allowGroupBooking),
    [cartLines],
  );
  const groupCap = groupEligibleLines.length > 0
    ? Math.min(...groupEligibleLines.map((line) => line.service.maxGroupSize ?? 4))
    : 1;
  const activeGuests = useMemo(
    () => (groupEligibleLines.length > 0 ? guests.slice(0, Math.max(0, groupCap - 1)) : []),
    [guests, groupCap, groupEligibleLines.length],
  );

  useEffect(() => {
    if (guests.length === 0) return;
    if (groupEligibleLines.length === 0) {
      guests.forEach((guest) => removeGuest(guest.id));
      return;
    }
    const maxGuests = Math.max(0, groupCap - 1);
    guests.slice(maxGuests).forEach((guest) => removeGuest(guest.id));
  }, [guests, groupEligibleLines.length, groupCap, removeGuest]);

  useEffect(() => {
    if (guests.length === 0 || services.length === 0) return;
    for (const guest of guests) {
      const service = serviceMap.get(guest.serviceId);
      const unavailableAtLocation =
        selectedLocationId &&
        service?.locationIds &&
        service.locationIds.length > 0 &&
        !service.locationIds.includes(selectedLocationId);
      if (!service || service.requiresPatchTest || unavailableAtLocation) {
        removeGuest(guest.id);
      }
    }
  }, [guests, services.length, serviceMap, selectedLocationId, removeGuest]);

  const guestLines = useMemo(() => {
    return activeGuests
      .map((g) => {
        const svc = serviceMap.get(g.serviceId);
        if (!svc) return null;
        const computed = computeLine(svc, {
          addonIds: g.addonIds,
          startAt: bookingStartAt,
        });
        return { guest: g, service: svc, computed };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [activeGuests, serviceMap, bookingStartAt]);

  const bookedLines = useMemo(
    () => [
      ...cartLines.map((line) => ({ service: line.service, computed: line.computed })),
      ...guestLines.map((line) => ({ service: line.service, computed: line.computed })),
    ],
    [cartLines, guestLines],
  );

  const primaryDuration = cartLines.reduce(
    (sum, l) => sum + l.computed.duration * l.item.qty,
    0,
  );
  const maxGuestDuration = guestLines.reduce(
    (m, l) => (l.computed.duration > m ? l.computed.duration : m),
    0,
  );
  const totalDuration = Math.max(primaryDuration, maxGuestDuration);

  const timePickerBasket = useMemo(() => {
    const items: Array<{
      serviceId: string;
      variantId?: string;
      extraDurationMinutes?: number;
      preferredMemberId?: string;
    }> = [];
    for (const line of cartLines) {
      const addons = (line.service.addons ?? []).filter((a) =>
        line.item.addonIds.includes(a.id),
      );
      const extra = addons.reduce((sum, a) => sum + (a.duration || 0), 0);
      for (let i = 0; i < line.item.qty; i += 1) {
        items.push({
          serviceId: line.service.id,
          variantId: line.item.variantId,
          extraDurationMinutes: extra > 0 ? extra : undefined,
          preferredMemberId: line.item.artistId,
        });
      }
    }
    return items;
  }, [cartLines]);

  // ── Step navigation ─────────────────────────────────────────────
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleContinue = async () => {
    if (step === "browse") {
      setStep("time");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === "time") {
      setStep("details");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step === "details") {
      await handleSubmit();
      return;
    }
  };

  const handleBack = () => {
    if (step === "time") setStep("browse");
    else if (step === "details") setStep("time");
    else if (typeof history !== "undefined") history.back();
  };

  const continueLabel: Record<Step, string> = {
    browse: "Pick a time",
    time: "Add details",
    details: submitting ? "Booking…" : previewMode ? "Confirm (preview)" : "Confirm booking",
    confirm: "Confirm",
  };

  // Card-on-file is gated off in preview mode — Stripe SetupIntent needs a
  // real Stripe customer the operator's preview doesn't have. The flow shows
  // the badge so the operator sees WHERE the step would appear, but the
  // submit gate is dropped.
  const needsCardOnFile = bookedLines.some((l) => l.service.requiresCardOnFile);
  const cardReady = previewMode || !needsCardOnFile || Boolean(cardOnFile);

  const policyDisclosure = useMemo(() => {
    const needsApproval = bookedLines.some((l) => l.service.requiresConfirmation);
    let maxCancelWindow = 0;
    let maxCancelFee = 0;
    let maxNoShowFee = 0;
    let minAutoCancel = Infinity;
    for (const l of bookedLines) {
      const s = l.service;
      if (s.cancellationWindowHours && s.cancellationWindowHours > maxCancelWindow) {
        maxCancelWindow = s.cancellationWindowHours;
      }
      if (s.cancellationFee && s.cancellationFee > maxCancelFee) {
        maxCancelFee = s.cancellationFee;
      }
      if (s.depositNoShowFee && s.depositNoShowFee > maxNoShowFee) {
        maxNoShowFee = s.depositNoShowFee;
      }
      if (s.depositAutoCancelHours && s.depositAutoCancelHours > 0 && s.depositAutoCancelHours < minAutoCancel) {
        minAutoCancel = s.depositAutoCancelHours;
      }
    }
    return {
      needsApproval,
      cancelWindowHours: maxCancelWindow > 0 ? maxCancelWindow : null,
      cancelFeePct: maxCancelFee > 0 ? maxCancelFee : null,
      noShowFeePct: maxNoShowFee > 0 ? maxNoShowFee : null,
      autoCancelHours: Number.isFinite(minAutoCancel) ? minAutoCancel : null,
    };
  }, [bookedLines]);
  const hasPolicyToShow =
    policyDisclosure.needsApproval ||
    policyDisclosure.cancelWindowHours != null ||
    policyDisclosure.cancelFeePct != null ||
    policyDisclosure.noShowFeePct != null ||
    policyDisclosure.autoCancelHours != null;

  const intakeServices = useMemo(() => {
    const seen = new Set<string>();
    const out: PublicService[] = [];
    for (const line of bookedLines) {
      if (seen.has(line.service.id)) continue;
      seen.add(line.service.id);
      if ((line.service.intakeQuestions ?? []).length > 0) out.push(line.service);
    }
    return out;
  }, [bookedLines]);

  const intakeRequiredOk = useMemo(
    () =>
      intakeServices.every((svc) => {
        const answers = intakeAnswersByService[svc.id] ?? {};
        return svc.intakeQuestions
          .filter((q) => q.required)
          .every((q) => (answers[q.id] ?? "").trim() !== "");
      }),
    [intakeServices, intakeAnswersByService],
  );

  const patchTestServices = useMemo(() => {
    const seen = new Set<string>();
    const out: PublicService[] = [];
    for (const line of bookedLines) {
      if (seen.has(line.service.id)) continue;
      seen.add(line.service.id);
      if (line.service.requiresPatchTest) out.push(line.service);
    }
    return out;
  }, [bookedLines]);

  const requireAddress = selectedLocation?.kind === "mobile";
  const locationGateOk = locations.length < 2 || Boolean(selectedLocationId);
  const continueDisabled =
    (step === "browse" && !locationGateOk) ||
    (step === "time" && !(selectedDate && selectedTime)) ||
    (step === "details" &&
      (!isDetailsValid(details, { requireAddress }) || submitting || !cardReady || !intakeRequiredOk));

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!slug || !selectedDate || !selectedTime) return;
    if (locations.length >= 2 && !selectedLocationId) {
      setSubmitError("Please choose a location before continuing.");
      return;
    }
    if (!isDetailsValid(details, { requireAddress })) return;
    if (!previewMode && needsCardOnFile && !cardOnFile) {
      setSubmitError("Please add a card on file before continuing.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const primaryItems = cartItems.map((it) => ({
        serviceId: it.serviceId,
        variantId: it.variantId,
        addonIds: it.addonIds,
        artistId: it.artistId,
        intakeAnswers: intakeAnswersByService[it.serviceId],
      }));
      const primaryAnchorIdx = 0;
      const guestItems = activeGuests.map((g) => ({
        serviceId: g.serviceId,
        addonIds: g.addonIds,
        artistId: g.artistId ?? undefined,
        guestName: g.name,
        guestOf: primaryAnchorIdx,
        intakeAnswers: intakeAnswersByService[g.serviceId],
      }));

      const result = await onSubmit({
        slug,
        clientName: details.name.trim(),
        clientEmail: details.email.trim(),
        clientPhone: details.phone.trim() || undefined,
        notes: details.notes.trim() || undefined,
        date: selectedDate,
        time: selectedTime,
        locationId: selectedLocationId || undefined,
        address:
          selectedLocation?.kind === "mobile"
            ? details.address?.trim() || undefined
            : undefined,
        stripeCustomerId: cardOnFile?.customerId,
        stripeSetupIntentId: cardOnFile?.setupIntentId,
        giftCardCode: giftCard?.code,
        items: [...primaryItems, ...guestItems],
      });

      if (!result.ok) {
        setSubmitError(result.error || "Couldn't confirm your booking. Please try again.");
        return;
      }

      const totalMins = totalDuration;
      const endTime = addMinutes(selectedTime, totalMins);
      const primarySubtotal = cartLines.reduce(
        (s, l) => s + l.computed.price * l.item.qty,
        0,
      );
      const guestSubtotal = guestLines.reduce(
        (s, l) => s + l.computed.price,
        0,
      );
      const total = primarySubtotal + guestSubtotal;

      const confirmationAddress =
        selectedLocation?.kind === "mobile"
          ? details.address?.trim() || undefined
          : selectedLocation?.address || undefined;
      const rebookAfterDays = bookedLines.reduce<number>((max, l) => {
        const v = l.service.rebookAfterDays;
        return typeof v === "number" && v > max ? v : max;
      }, 0);
      const primaryNames = cartLines.map((l) => l.service.name);
      const guestNames = guestLines.map(
        (gl) => `${gl.guest.name || "Guest"} (${gl.service.name})`,
      );
      setConfirmed({
        date: selectedDate,
        time: selectedTime,
        endTime,
        serviceNames: [...primaryNames, ...guestNames],
        total,
        durationMinutes: totalMins,
        businessName,
        locationName: selectedLocation?.name,
        address: confirmationAddress,
        rebookAfterDays: rebookAfterDays > 0 ? rebookAfterDays : undefined,
      });
      setStep("confirm");
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-card-bg border border-border-light rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-[15px] font-semibold text-foreground">Can&apos;t load this page</p>
          <p className="text-[13px] text-text-secondary mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const previewBannerNode =
    previewMode && (previewBanner ?? (
      <div className="flex items-start gap-2 mx-auto max-w-6xl mb-4 px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-[12px] text-amber-900">
        <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Preview mode.</span>{" "}
          Availability is live (your real bookings, blockers, resources count). Stripe
          card collection, the actual booking submit, and email/SMS sends are stubbed —
          nothing is created or charged.
        </p>
      </div>
    ));

  return (
    <div className={showChrome ? "min-h-screen bg-background pb-32 lg:pb-0" : ""}>
      {showChrome && (
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border-light">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="p-2 -ml-2 rounded-full text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <AnimatePresence mode="wait">
                {scrolled ? (
                  <motion.p
                    key="title"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="text-[14px] font-semibold text-foreground truncate"
                  >
                    {businessName}
                  </motion.p>
                ) : (
                  <motion.p
                    key={`step-${step}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] text-text-tertiary"
                  >
                    Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => typeof history !== "undefined" && history.back()}
              aria-label="Close"
              className="p-2 -mr-2 rounded-full text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
      )}

      {previewBannerNode && <div className="pt-3">{previewBannerNode}</div>}

      {step === "confirm" && confirmed ? (
        <main className="max-w-2xl mx-auto px-4 pt-8">
          {previewMode && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-900">
              <span className="font-semibold">Preview only —</span>{" "}
              no booking was actually created. The customer would now receive a
              confirmation email{needsCardOnFile ? " and the card on file would be saved" : ""}.
            </div>
          )}
          <Confirmation
            booking={confirmed}
            onBookAnother={() => {
              setConfirmed(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setDetails(EMPTY_DETAILS);
              setStep("browse");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </main>
      ) : (
        <main className="max-w-6xl mx-auto px-4 pt-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {businessName}
            </h1>
            <p className="text-[13px] text-text-secondary mt-1">
              Step {stepIndex + 1} of {STEPS.length} ·{" "}
              {step === "browse"
                ? "Pick the services you'd like to book."
                : step === "time"
                ? "Choose a date and time that works."
                : "Confirm your details."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 min-w-0">
              {step === "browse" && (
                loading ? (
                  <CatalogSkeleton />
                ) : (
                  <>
                    {locations.length >= 2 && (
                      <LocationPicker
                        locations={locations}
                        selectedId={selectedLocationId}
                        onSelect={setSelectedLocationId}
                      />
                    )}
                    <CategoryTabs categories={categories} scrollOffset={140} />
                    <div className="mt-4 space-y-10">
                      {sections.map(({ category, services: svcs }) => (
                        <section
                          key={category || "uncategorized"}
                          id={categoryAnchor(category)}
                          aria-labelledby={`${categoryAnchor(category)}-heading`}
                          className="scroll-mt-32"
                        >
                          <h2
                            id={`${categoryAnchor(category)}-heading`}
                            className="text-[16px] font-semibold text-foreground mb-3 tracking-tight"
                          >
                            {category || "Other"}
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {svcs.map((svc) => (
                              <ServiceCard
                                key={svc.id}
                                service={svc}
                                selected={selectedIds.has(svc.id)}
                                onAdd={() => addItem({ serviceId: svc.id, addonIds: [] })}
                                onRemove={() => removeByServiceId(svc.id)}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                      {sections.length === 0 && (
                        <div className="bg-card-bg border border-border-light rounded-2xl p-10 text-center">
                          <p className="text-[14px] text-text-tertiary">No services available yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                )
              )}

              {step === "time" && timePickerBasket.length > 0 && (
                <div className="bg-card-bg border border-border-light rounded-2xl p-5 sm:p-6">
                  <TimePicker
                    slug={slug}
                    basketItems={timePickerBasket}
                    durationMinutes={totalDuration}
                    enabledWeekdays={cartEnabledWeekdays}
                    minDate={cartMinDate}
                    maxDate={cartMaxDate}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    locationId={selectedLocationId ?? undefined}
                    onChange={({ date, time }) => {
                      setSelectedDate(date);
                      setSelectedTime(time);
                    }}
                  />
                </div>
              )}

              {step === "details" && (
                <div className="bg-card-bg border border-border-light rounded-2xl p-5 sm:p-6 space-y-5">
                  <DetailsForm
                    values={details}
                    onChange={setDetails}
                    requireAddress={requireAddress}
                  />

                  {patchTestServices.length > 0 && (
                    <div className="border-t border-border-light pt-5">
                      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                        Patch test required
                        {previewMode && (
                          <span className="ml-2 inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            preview · check is skipped
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-text-secondary">
                        {(() => {
                          const cats = Array.from(
                            new Set(
                              patchTestServices
                                .map((s) => s.patchTestCategory)
                                .filter((c): c is string => Boolean(c)),
                            ),
                          );
                          const catText =
                            cats.length === 1
                              ? `a ${cats[0]} patch test`
                              : cats.length > 1
                                ? `${cats.join(" / ")} patch tests`
                                : "a patch test";
                          return patchTestServices.length === 1
                            ? `${patchTestServices[0].name} requires ${catText} on file before your appointment.`
                            : `These services require ${catText} on file: ${patchTestServices
                                .map((s) => s.name)
                                .join(", ")}.`;
                        })()}
                        {(() => {
                          const validities = patchTestServices
                            .map((s) => s.patchTestValidityDays)
                            .filter((v): v is number => typeof v === "number" && v > 0);
                          const leads = patchTestServices
                            .map((s) => s.patchTestMinLeadHours)
                            .filter((v): v is number => typeof v === "number" && v > 0);
                          const validity = validities.length ? Math.min(...validities) : null;
                          const lead = leads.length ? Math.max(...leads) : null;
                          if (!validity && !lead) return null;
                          const parts: string[] = [];
                          if (validity) parts.push(`taken in the last ${validity} day${validity === 1 ? "" : "s"}`);
                          if (lead) parts.push(`at least ${lead} hour${lead === 1 ? "" : "s"} before your booking`);
                          return ` It must be ${parts.join(" and ")}.`;
                        })()}
                        {" "}If you don&apos;t have a recent test, we&apos;ll be in touch to arrange one.
                      </p>
                    </div>
                  )}

                  {intakeServices.map((svc) => (
                    <div key={svc.id} className="border-t border-border-light pt-5 space-y-3">
                      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
                        {intakeServices.length > 1 ? `${svc.name} — questions` : "A few questions"}
                      </p>
                      {svc.intakeQuestions
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((q) => {
                          const value = intakeAnswersByService[svc.id]?.[q.id] ?? "";
                          const setValue = (v: string) =>
                            setIntakeAnswersByService((prev) => ({
                              ...prev,
                              [svc.id]: { ...(prev[svc.id] ?? {}), [q.id]: v },
                            }));
                          const inputId = `iq-${svc.id}-${q.id}`;
                          return (
                            <div key={q.id}>
                              <label
                                htmlFor={inputId}
                                className="block text-[12px] font-semibold text-text-secondary mb-1.5"
                              >
                                {q.label}
                                {q.required ? (
                                  <span className="text-red-500 ml-0.5">*</span>
                                ) : (
                                  <span className="text-text-tertiary font-normal"> (optional)</span>
                                )}
                              </label>
                              {q.type === "longtext" ? (
                                <textarea
                                  id={inputId}
                                  rows={3}
                                  value={value}
                                  onChange={(e) => setValue(e.target.value)}
                                  className="w-full px-3 py-2 border border-border-light rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none"
                                />
                              ) : q.type === "select" ? (
                                <select
                                  id={inputId}
                                  value={value}
                                  onChange={(e) => setValue(e.target.value)}
                                  className="w-full px-3 py-2 border border-border-light rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-foreground/10 bg-white"
                                >
                                  <option value="">Select…</option>
                                  {(q.options ?? []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : q.type === "yesno" ? (
                                <div className="flex gap-2">
                                  {["Yes", "No"].map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setValue(opt)}
                                      className={`flex-1 py-2 px-3 rounded-lg text-[13px] font-medium border transition ${
                                        value === opt
                                          ? "bg-foreground text-white border-foreground"
                                          : "bg-white text-text-secondary border-border-light hover:border-border"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <input
                                  id={inputId}
                                  type={q.type === "date" ? "date" : q.type === "number" ? "number" : "text"}
                                  value={value}
                                  onChange={(e) => setValue(e.target.value)}
                                  className="w-full px-3 py-2 border border-border-light rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-foreground/10"
                                />
                              )}
                              {q.hint && (
                                <p className="text-[11px] text-text-tertiary mt-1">{q.hint}</p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ))}

                  {hasPolicyToShow && (
                    <div className="border-t border-border-light pt-5">
                      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        Booking policy
                      </p>
                      <ul className="text-[12px] text-text-secondary space-y-1.5 leading-snug">
                        {policyDisclosure.needsApproval && (
                          <li>
                            This booking will be <span className="font-medium text-foreground">pending until approved</span>.
                            You&apos;ll get a confirmation email once accepted.
                          </li>
                        )}
                        {policyDisclosure.cancelWindowHours != null && (
                          <li>
                            Cancel for free up to{" "}
                            <span className="font-medium text-foreground">
                              {policyDisclosure.cancelWindowHours}h
                            </span>{" "}
                            before the appointment.
                            {policyDisclosure.cancelFeePct != null && (
                              <>
                                {" "}Cancellations inside that window are charged{" "}
                                <span className="font-medium text-foreground">
                                  {policyDisclosure.cancelFeePct}%
                                </span>{" "}
                                of the service price.
                              </>
                            )}
                          </li>
                        )}
                        {policyDisclosure.noShowFeePct != null && (
                          <li>
                            No-show fee:{" "}
                            <span className="font-medium text-foreground">
                              {policyDisclosure.noShowFeePct}%
                            </span>{" "}
                            of the service price.
                          </li>
                        )}
                        {policyDisclosure.autoCancelHours != null && (
                          <li>
                            If a deposit isn&apos;t paid within{" "}
                            <span className="font-medium text-foreground">
                              {policyDisclosure.autoCancelHours}h
                            </span>
                            , the booking is automatically released.
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-border-light pt-5">
                    {previewMode ? (
                      <div className="rounded-lg bg-surface px-3 py-2 text-[12px] text-text-secondary">
                        <span className="font-medium text-foreground">Gift card</span> — skipped in preview. A
                        live customer would enter their code here and the balance would discount the
                        at-appointment total.
                      </div>
                    ) : (
                      <GiftCardField slug={slug} applied={giftCard} onApplied={setGiftCard} />
                    )}
                  </div>

                  {needsCardOnFile && (
                    <div className="border-t border-border-light pt-5">
                      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                        Card on file
                        {previewMode && (
                          <span className="ml-2 inline-block text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            preview · Stripe is stubbed
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-text-secondary mb-3">
                        Required for the services in your booking. Card isn&apos;t charged now —
                        only used for no-show or cancellation fees per the policy.
                      </p>
                      {previewMode ? (
                        <div className="rounded-lg border border-dashed border-border-light bg-surface/40 px-3 py-4 text-center">
                          <p className="text-[12px] text-text-tertiary">
                            Stripe SetupIntent would render here. Skipped in preview because Stripe
                            requires a real customer.
                          </p>
                        </div>
                      ) : isDetailsValid(details) ? (
                        <CardOnFileForm
                          slug={slug}
                          customerEmail={details.email.trim()}
                          customerName={details.name.trim()}
                          brandColor={brandColor}
                          onReady={(data) => setCardOnFile(data)}
                          onError={(msg) => setSubmitError(msg)}
                        />
                      ) : (
                        <p className="text-[12px] text-text-tertiary italic">
                          Enter your name and email above to add a card.
                        </p>
                      )}
                    </div>
                  )}

                  {submitError && (
                    <div className="text-[13px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden lg:block self-start">
              <div ref={cartSentinelRef} aria-hidden="true" />
              <CartPane
                serviceMap={serviceMap}
                memberMap={memberMap}
                memberServiceMap={memberServiceMap}
                members={members}
                businessName={businessName}
                onContinue={handleContinue}
                onEdit={(lineId) => setEditingLineId(lineId)}
                continueLabel={continueLabel[step]}
                continueDisabled={continueDisabled}
                giftCardBalance={giftCard?.balance ?? 0}
                location={locations.length >= 2 ? selectedLocation : null}
                startAt={bookingStartAt}
                className={showChrome ? "sticky top-24" : ""}
              />
            </div>
          </div>
        </main>
      )}

      {showChrome && step !== "confirm" && (
        <MobileCartBar serviceMap={serviceMap} onContinue={handleContinue} startAt={bookingStartAt} />
      )}

      {showChrome && step === "browse" && (
        <FloatingCartPill sentinelRef={cartSentinelRef} serviceMap={serviceMap} startAt={bookingStartAt} />
      )}

      <LineItemDrawer
        open={Boolean(editingItem && editingService)}
        onClose={() => setEditingLineId(null)}
        service={editingService}
        item={editingItem}
        eligibleMembers={eligibleMembers}
        startAt={bookingStartAt}
        onSave={(patch) => {
          if (editingItem) updateItem(editingItem.lineId, patch);
        }}
        onRemove={() => {
          if (editingItem) removeItem(editingItem.lineId);
        }}
      />
    </div>
  );
}

function addMinutes(time24: string, mins: number): string {
  const [h, m] = time24.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
