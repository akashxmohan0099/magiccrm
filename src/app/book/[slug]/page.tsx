"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";

import { useBookingCart } from "@/store/booking-cart";
import { CategoryTabs } from "@/components/modules/bookings/public/CategoryTabs";
import { ServiceCard } from "@/components/modules/bookings/public/ServiceCard";
import { CartPane } from "@/components/modules/bookings/public/CartPane";
import { MobileCartBar } from "@/components/modules/bookings/public/MobileCartBar";
import { LineItemDrawer } from "@/components/modules/bookings/public/LineItemDrawer";
import { TimePicker } from "@/components/modules/bookings/public/TimePicker";
import { DetailsForm, isDetailsValid, type DetailsFormValues } from "@/components/modules/bookings/public/DetailsForm";
import { Confirmation, type ConfirmedBooking } from "@/components/modules/bookings/public/Confirmation";
import { CatalogSkeleton } from "@/components/modules/bookings/public/CatalogSkeleton";
import { FloatingCartPill } from "@/components/modules/bookings/public/FloatingCartPill";
import { CardOnFileForm } from "@/app/book/[slug]/CardOnFileForm";
import { GiftCardField, type GiftCardCheck } from "@/components/modules/bookings/public/GiftCardField";
import { LocationPicker } from "@/components/modules/bookings/public/LocationPicker";
import { categoryAnchor, computeLine } from "@/components/modules/bookings/public/helpers";
import type { PublicLocation, PublicMember, PublicService } from "@/components/modules/bookings/public/types";

type Step = "browse" | "time" | "details" | "confirm";
const STEPS: { key: Step; label: string }[] = [
  { key: "browse", label: "Services" },
  { key: "time", label: "Time" },
  { key: "details", label: "Details" },
  { key: "confirm", label: "Confirm" },
];

interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const EMPTY_DETAILS: DetailsFormValues = { name: "", email: "", phone: "", notes: "", address: "" };

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Business");
  const [brandColor, setBrandColor] = useState("#34D399");
  const [services, setServices] = useState<PublicService[]>([]);
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [memberServiceMap, setMemberServiceMap] = useState<Record<string, string[]>>({});
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [locations, setLocations] = useState<PublicLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("browse");
  const [scrolled, setScrolled] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const cartSentinelRef = useRef<HTMLDivElement>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsFormValues>(EMPTY_DETAILS);
  // Per-service intake answers, keyed by serviceId then questionId. Each
  // primary basket item POSTs its slice in the basket payload.
  const [intakeAnswersByService, setIntakeAnswersByService] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [cardOnFile, setCardOnFile] = useState<{ customerId: string; setupIntentId: string } | null>(null);
  const [giftCard, setGiftCard] = useState<GiftCardCheck | null>(null);

  const setSlug = useBookingCart((s) => s.setSlug);
  const cartItems = useBookingCart((s) => s.items);
  const friends = useBookingCart((s) => s.friends);
  const addItem = useBookingCart((s) => s.addItem);
  const removeItem = useBookingCart((s) => s.removeItem);
  const updateItem = useBookingCart((s) => s.updateItem);
  const clearCart = useBookingCart((s) => s.clear);

  const removeByServiceId = (serviceId: string) => {
    const target = cartItems.find((it) => it.serviceId === serviceId);
    if (target) removeItem(target.lineId);
  };

  // Bind cart to this slug. Switching slugs clears the cart (handled in store).
  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  // Fetch services + business info
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}`);
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Not found" }));
          setError(data.error || "Booking page not found.");
          return;
        }
        const data = await res.json();
        setBusinessName(data.businessName || "Business");
        setBrandColor(data.brandColor || "#34D399");
        setServices((data.services as PublicService[]) || []);
        setMembers((data.members as PublicMember[]) || []);
        setMemberServiceMap((data.memberServiceMap as Record<string, string[]>) || {});
        setAvailability((data.availability as AvailabilitySlot[]) || []);
        const locs = (data.locations as PublicLocation[]) || [];
        setLocations(locs);
        // Auto-select when there's only one location so the rest of the flow
        // always has a locationId to thread through. The picker UI stays
        // hidden in that case.
        if (locs.length === 1) setSelectedLocationId(locs[0].id);
      } catch {
        if (!cancelled) setError("Failed to load booking page. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // Morphing top bar — business name fades in once user scrolls past ~40px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Filter the catalog to services available at the selected location.
  // Empty / missing locationIds means "available at every location" — show it
  // unconditionally. When the workspace has a single location (or none) the
  // selectedLocationId is already auto-set and the predicate is a no-op for
  // the common single-location case.
  const visibleServices = useMemo(() => {
    if (!selectedLocationId || locations.length < 2) return services;
    return services.filter(
      (s) => !s.locationIds?.length || s.locationIds.includes(selectedLocationId),
    );
  }, [services, selectedLocationId, locations.length]);

  // Group services by category, preserving the order they arrived in.
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

  // When at least one cart service restricts itself to specific weekdays,
  // intersect that restriction with the workspace's open days. A booking
  // basket only resolves to a slot when EVERY service in it is bookable,
  // so we AND the per-service `availableWeekdays` arrays together.
  const cartEnabledWeekdays = useMemo(() => {
    if (cartItems.length === 0) return enabledWeekdays;
    let allowed: number[] | null = null;
    for (const item of cartItems) {
      const svc = serviceMap.get(item.serviceId);
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
  }, [cartItems, serviceMap, enabledWeekdays]);

  const editingItem = editingLineId ? cartItems.find((it) => it.lineId === editingLineId) ?? null : null;
  const editingService = editingItem ? serviceMap.get(editingItem.serviceId) ?? null : null;
  const eligibleMembers = useMemo(() => {
    if (!editingService) return [];
    const allowed = memberServiceMap[editingService.id];
    if (!allowed || allowed.length === 0) return members;
    const set = new Set(allowed);
    return members.filter((m) => set.has(m.id));
  }, [editingService, members, memberServiceMap]);

  // Cart-derived totals for time-picker sizing + payload assembly.
  const cartLines = useMemo(() => {
    return cartItems
      .map((item) => {
        const svc = serviceMap.get(item.serviceId);
        if (!svc) return null;
        const computed = computeLine(svc, {
          variantId: item.variantId,
          tierId: item.tierId,
          addonIds: item.addonIds,
        });
        return { item, service: svc, computed };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [cartItems, serviceMap]);

  const totalDuration = cartLines.reduce((sum, l) => sum + l.computed.duration * l.item.qty, 0);
  // Use the longest line item as the primary serviceId for the slot endpoint —
  // its availability rules are most restrictive; durationMinutes carries the
  // real cart-total window.
  const primaryServiceId = useMemo(() => {
    if (cartLines.length === 0) return null;
    const longest = cartLines.reduce((a, b) =>
      a.computed.duration >= b.computed.duration ? a : b
    );
    return longest.service.id;
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
    else history.back();
  };

  const continueLabel: Record<Step, string> = {
    browse: "Pick a time",
    time: "Add details",
    details: submitting ? "Booking…" : "Confirm booking",
    confirm: "Confirm",
  };

  // Any cart line that needs a card on file gates the Confirm CTA.
  const needsCardOnFile = cartLines.some((l) => l.service.requiresCardOnFile);
  const cardReady = !needsCardOnFile || Boolean(cardOnFile);

  // Unique services in the cart that have at least one intake question to
  // render. Used both to draw the section and to gate Confirm.
  const intakeServices = useMemo(() => {
    const seen = new Set<string>();
    const out: PublicService[] = [];
    for (const line of cartLines) {
      if (seen.has(line.service.id)) continue;
      seen.add(line.service.id);
      if ((line.service.intakeQuestions ?? []).length > 0) out.push(line.service);
    }
    return out;
  }, [cartLines]);

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

  // Cart services that need a patch test on file. We display a single
  // consent notice listing each affected service so the customer knows
  // they may be contacted to arrange a test before their appointment.
  const patchTestServices = useMemo(() => {
    const seen = new Set<string>();
    const out: PublicService[] = [];
    for (const line of cartLines) {
      if (seen.has(line.service.id)) continue;
      seen.add(line.service.id);
      if (line.service.requiresPatchTest) out.push(line.service);
    }
    return out;
  }, [cartLines]);

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
    if (needsCardOnFile && !cardOnFile) {
      setSubmitError("Please add a card on file before continuing.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Build basket payload — each cart line becomes a basket item.
      // Group bookings: each friend gets a parallel copy of every primary item,
      // with guestName + guestOf pointing back at the matching primary index.
      const primaryItems = cartItems.map((it) => ({
        serviceId: it.serviceId,
        variantId: it.variantId,
        addonIds: it.addonIds,
        artistId: it.artistId,
        intakeAnswers: intakeAnswersByService[it.serviceId],
      }));
      const guestItems = friends.flatMap((friendName) =>
        primaryItems.map((it, primaryIdx) => ({ ...it, guestName: friendName, guestOf: primaryIdx }))
      );
      const items = [...primaryItems, ...guestItems];

      const res = await fetch("/api/public/book/basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          clientName: details.name.trim(),
          clientEmail: details.email.trim(),
          clientPhone: details.phone.trim() || undefined,
          notes: details.notes.trim() || undefined,
          date: selectedDate,
          time: selectedTime,
          items,
          locationId: selectedLocationId || undefined,
          address: selectedLocation?.kind === "mobile" ? details.address?.trim() || undefined : undefined,
          stripeCustomerId: cardOnFile?.customerId,
          stripeSetupIntentId: cardOnFile?.setupIntentId,
          giftCardCode: giftCard?.code,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Couldn't confirm your booking. Please try again.");
        return;
      }

      // Compute end time + assemble confirmation card data.
      // Friends book parallel chairs, so the slot duration is per-person,
      // but the bill multiplies by the guest count.
      const totalMins = totalDuration;
      const endTime = addMinutes(selectedTime, totalMins);
      const perPerson = cartLines.reduce((s, l) => s + l.computed.price * l.item.qty, 0);
      const total = perPerson * (friends.length + 1);

      const confirmationAddress =
        selectedLocation?.kind === "mobile"
          ? details.address?.trim() || undefined
          : selectedLocation?.address || undefined;
      // Largest rebook cadence across booked services anchors the
      // "Plan your next visit" CTA. If no service has one configured,
      // Confirmation falls back to the plain "Book another" link.
      const rebookAfterDays = cartLines.reduce<number>((max, l) => {
        const v = l.service.rebookAfterDays;
        return typeof v === "number" && v > max ? v : max;
      }, 0);
      setConfirmed({
        date: selectedDate,
        time: selectedTime,
        endTime,
        serviceNames: cartLines.map((l) => l.service.name),
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card-bg border border-border-light rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-[15px] font-semibold text-foreground">Can&apos;t load this page</p>
          <p className="text-[13px] text-text-secondary mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-0">
      {/* Morphing top bar */}
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
            onClick={() => history.back()}
            aria-label="Close"
            className="p-2 -mr-2 rounded-full text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {step === "confirm" && confirmed ? (
        <main className="max-w-2xl mx-auto px-4 pt-8">
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
            {/* Main content varies by step */}
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

              {step === "time" && primaryServiceId && (
                <div className="bg-card-bg border border-border-light rounded-2xl p-5 sm:p-6">
                  <TimePicker
                    slug={slug}
                    primaryServiceId={primaryServiceId}
                    durationMinutes={totalDuration}
                    enabledWeekdays={cartEnabledWeekdays}
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
                      </p>
                      <p className="text-[12px] text-text-secondary">
                        {patchTestServices.length === 1
                          ? `${patchTestServices[0].name} requires a patch test on file before your appointment.`
                          : `These services require a patch test on file: ${patchTestServices
                              .map((s) => s.name)
                              .join(", ")}.`}
                        {(() => {
                          // Pull the strictest validity + lead time across
                          // affected services so the wording reflects the
                          // tightest rule.
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

                  <div className="border-t border-border-light pt-5">
                    <GiftCardField slug={slug} applied={giftCard} onApplied={setGiftCard} />
                  </div>

                  {needsCardOnFile && (
                    <div className="border-t border-border-light pt-5">
                      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                        Card on file
                      </p>
                      <p className="text-[12px] text-text-secondary mb-3">
                        Required for the services in your booking. Card isn&apos;t charged now —
                        only used for no-show or cancellation fees per the policy.
                      </p>
                      {isDetailsValid(details) ? (
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

            {/* Cart pane — desktop sticky right rail, all non-confirm steps */}
            <div className="hidden lg:block self-start">
              <div ref={cartSentinelRef} aria-hidden="true" />
              <CartPane
                serviceMap={serviceMap}
                memberMap={memberMap}
                businessName={businessName}
                onContinue={handleContinue}
                onEdit={(lineId) => setEditingLineId(lineId)}
                continueLabel={continueLabel[step]}
                continueDisabled={continueDisabled}
                giftCardBalance={giftCard?.balance ?? 0}
                location={locations.length >= 2 ? selectedLocation : null}
                className="sticky top-24"
              />
            </div>
          </div>
        </main>
      )}

      {/* Mobile sticky cart bar — hide on confirm */}
      {step !== "confirm" && (
        <MobileCartBar serviceMap={serviceMap} onContinue={handleContinue} />
      )}

      {/* Floating cart re-entry pill — desktop only, browse step only */}
      {step === "browse" && (
        <FloatingCartPill sentinelRef={cartSentinelRef} serviceMap={serviceMap} />
      )}

      {/* Per-line edit drawer */}
      <LineItemDrawer
        open={Boolean(editingItem && editingService)}
        onClose={() => setEditingLineId(null)}
        service={editingService}
        item={editingItem}
        eligibleMembers={eligibleMembers}
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
