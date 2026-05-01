"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { CardOnFileForm } from "./CardOnFileForm";
import {
  CheckCircle2,
  Loader2,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowLeft,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
  depositType?: "none" | "percentage" | "fixed";
  depositAmount?: number;
  rebookAfterDays?: number;
  allowGroupBooking?: boolean;
  maxGroupSize?: number;
  requiresCardOnFile?: boolean;
}

interface AvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface BookingConfirmation {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Step = "service" | "date" | "details" | "confirmation";

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();

  // ---- data loading state ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Business");
  const [brandColor, setBrandColor] = useState("#34D399");
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

  // ---- booking flow state ----
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  // Group booking — extra guest names attached to the same time slot.
  const [guestNames, setGuestNames] = useState<string[]>([]);
  // Card-on-file: when service requires it, capture before submit.
  const [cardOnFile, setCardOnFile] = useState<{ customerId: string; setupIntentId: string } | null>(null);
  // Gift card redemption — entered code + validated balance.
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardCheck, setGiftCardCheck] = useState<
    { status: "valid"; balance: number } | { status: "invalid"; reason: string } | null
  >(null);
  const [checkingGift, setCheckingGift] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // ---- calendar state ----
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // ---- load workspace data from slug ----
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Not found" }));
          setError(data.error || "Booking page not found.");
          return;
        }
        const data = await res.json();
        setWorkspaceId(data.workspaceId);
        setBusinessName(data.businessName || "Business");
        setBrandColor(data.brandColor || "#34D399");
        setServices(data.services || []);
        setAvailability(data.availability || []);
      } catch {
        setError("Failed to load booking page. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // ---- load available time slots for the selected date and service ----
  useEffect(() => {
    if (!workspaceId || !selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}&bookingsDate=${selectedDate}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableSlots(Array.isArray(data.availableSlots) ? data.availableSlots : []);
      })
      .catch(() => {
        setAvailableSlots([]);
      });
  }, [workspaceId, selectedDate, selectedService, slug]);

  // ---- determine which days are enabled ----
  const enabledDays = useMemo(() => {
    return new Set(availability.filter((s) => s.enabled).map((s) => s.day));
  }, [availability]);

  // ---- handle booking submission ----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!workspaceId || !selectedService || !selectedDate || !selectedTime) return;

      // Card-on-file gate: refuse to submit without a saved SetupIntent
      // when the service requires one. The error is reported in-form
      // rather than swallowed so the user knows to fill the card panel.
      if (selectedService.requiresCardOnFile && !cardOnFile) {
        setSubmitError("Please add a card on file before continuing.");
        return;
      }

      setSubmitting(true);
      setSubmitError(null);

      try {
        // Group bookings → basket endpoint. Each cleaned guest name becomes
        // a parallel item attached to the primary booking.
        const cleanGuests = guestNames.map((g) => g.trim()).filter(Boolean);
        const useBasket = cleanGuests.length > 0;
        const url = useBasket ? "/api/public/book/basket" : "/api/public/book";
        const body = useBasket
          ? {
              slug,
              clientName: clientName.trim(),
              clientEmail: clientEmail.trim(),
              clientPhone: clientPhone.trim() || undefined,
              notes: notes.trim() || undefined,
              date: selectedDate,
              time: selectedTime,
              items: [
                { serviceId: selectedService.id },
                ...cleanGuests.map((name) => ({
                  serviceId: selectedService.id,
                  guestName: name,
                  guestOf: 0,
                })),
              ],
              stripeCustomerId: cardOnFile?.customerId,
              stripeSetupIntentId: cardOnFile?.setupIntentId,
            }
          : {
              slug,
              serviceId: selectedService.id,
              date: selectedDate,
              time: selectedTime,
              clientName: clientName.trim(),
              clientEmail: clientEmail.trim(),
              clientPhone: clientPhone.trim() || undefined,
              notes: notes.trim() || undefined,
              stripeCustomerId: cardOnFile?.customerId,
              stripeSetupIntentId: cardOnFile?.setupIntentId,
              giftCardCode:
                giftCardCheck?.status === "valid"
                  ? giftCardCode.trim().toUpperCase()
                  : undefined,
            };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          setSubmitError(data.error || "Failed to create booking. Please try again.");
          return;
        }
        // Basket response uses `bookings[]`; normalize to the same shape the
        // confirmation step expects (single booking → use the first/lead).
        if (useBasket && Array.isArray(data.bookings) && data.bookings.length > 0) {
          data.booking = data.bookings[0];
        }

        posthog.capture("public_booking_submitted", {
          service_name: selectedService?.name,
          service_id: selectedService?.id,
          date: selectedDate,
          time: selectedTime,
          business_slug: slug,
        });

        // Redirect to Stripe deposit checkout when the service requires a
        // deposit. Single-service path always considers the selected service;
        // basket path defers to the server's `requiresDeposit` + `leadBookingId`
        // because guests under the lead don't get a separate deposit.
        const needsDeposit = useBasket
          ? !!data.requiresDeposit
          : selectedService.depositType !== "none" &&
            !!selectedService.depositAmount &&
            selectedService.depositAmount > 0;
        const depositBookingId = useBasket
          ? (data.leadBookingId as string | undefined)
          : data.booking?.id;
        const depositServiceId = useBasket
          ? (data.depositServiceId as string | undefined) ?? selectedService.id
          : selectedService.id;

        if (needsDeposit && depositBookingId) {
          try {
            const dRes = await fetch("/api/public/book/deposit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug,
                bookingId: depositBookingId,
                serviceId: depositServiceId,
                customerEmail: clientEmail.trim(),
                returnUrl: window.location.href,
              }),
            });
            const dData = await dRes.json();
            if (dRes.ok && dData.url) {
              window.location.href = dData.url;
              return;
            }
            // Deposit setup failed (e.g. workspace hasn't onboarded with
            // Stripe). Treat the booking as confirmed and surface a soft
            // notice rather than blocking the customer.
            console.warn("[book] deposit checkout skipped:", dData.error);
          } catch (err) {
            console.warn("[book] deposit checkout error:", err);
          }
        }

        setConfirmation(data.booking);
        setStep("confirmation");
      } catch {
        setSubmitError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, slug, selectedService, selectedDate, selectedTime, clientName, clientEmail, clientPhone, notes, guestNames, cardOnFile, giftCardCode, giftCardCheck]
  );

  // ---- calendar navigation ----
  const goToPrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth());

  // ---------------------------------------------------------------------------
  // Renders
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full bg-card-bg border border-border-light rounded-3xl p-10 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.06)]">
          <div className="w-14 h-14 rounded-2xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-text-tertiary" />
          </div>
          <h1 className="text-[20px] font-bold text-foreground mb-2">
            Booking unavailable
          </h1>
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {error.toLowerCase().includes("not found")
              ? "This booking link doesn't match an active page yet. Set your booking page slug from Settings → Booking, then try the link again."
              : error}
          </p>
        </div>
      </div>
    );
  }

  // ---- STEP 4: Confirmation ----
  if (step === "confirmation" && confirmation) {
    // Build Google Calendar link
    const calStart = `${confirmation.date.replace(/-/g, "")}T${confirmation.time.replace(":", "")}00`;
    const calEnd = `${confirmation.date.replace(/-/g, "")}T${confirmation.endTime.replace(":", "")}00`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(confirmation.serviceName + " at " + businessName)}&dates=${calStart}/${calEnd}&details=${encodeURIComponent("Booked via " + businessName)}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: brandColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Confirmed!</h1>
            <p className="text-sm text-gray-500 mt-1">{businessName}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</p>
              <p className="text-sm font-medium text-gray-900">{confirmation.serviceName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDisplayDate(confirmation.date)} at {formatTime12h(confirmation.time)}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</p>
                <p className="text-sm font-medium text-gray-900">{formatDuration(confirmation.duration)}</p>
              </div>
              {confirmation.price > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</p>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(confirmation.price)}</p>
                </div>
              )}
            </div>
          </div>
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
            style={{ backgroundColor: brandColor, color: "#fff" }}
          >
            <Calendar className="w-4 h-4" />
            Add to Google Calendar
          </a>
          {selectedService?.rebookAfterDays && selectedService.rebookAfterDays > 0 && (
            (() => {
              // Suggested next-visit date = appointment date + cadence.
              const suggested = new Date(confirmation.date);
              suggested.setDate(suggested.getDate() + selectedService.rebookAfterDays);
              const suggestedStr = suggested.toISOString().slice(0, 10);
              return (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
                    Book your next
                  </p>
                  <p className="text-[13px] text-gray-700 mb-3">
                    Most clients rebook this around <strong>{formatDisplayDate(suggestedStr)}</strong>. Lock it in now while it's fresh.
                  </p>
                  <button
                    onClick={() => {
                      // Reset the flow back to date-pick with the same service
                      // pre-selected and the suggested date pre-filled.
                      setStep("date");
                      setSelectedDate(suggestedStr);
                      setSelectedTime(null);
                      setConfirmation(null);
                    }}
                    className="text-[13px] font-medium px-3 py-2 rounded-lg cursor-pointer"
                    style={{ backgroundColor: brandColor, color: "#fff" }}
                  >
                    Pick a time on {formatDisplayDate(suggestedStr)}
                  </button>
                </div>
              );
            })()
          )}
          <p className="text-xs text-gray-400">
            A confirmation has been sent to {clientEmail}.
          </p>
          <p className="text-[11px] text-gray-300 mt-6">Powered by Magic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 py-6 sm:py-12">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ backgroundColor: brandColor }} className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{businessName}</h1>
          <p className="text-sm text-gray-500 mt-1">Book an appointment online</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["service", "date", "details"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "bg-gray-900 text-white"
                    : (["service", "date", "details"] as Step[]).indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {(["service", "date", "details"] as Step[]).indexOf(step) > i ? "\u2713" : i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-card-bg rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ---- STEP 1: Pick a Service ---- */}
          {step === "service" && (
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Select a Service</h2>
              <p className="text-xs text-gray-500 mb-5">Choose the service you would like to book.</p>

              {services.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No services available at this time.</p>
              ) : (
                <div className="space-y-2">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => {
                        setSelectedService(svc);
                        setSelectedDate(null);
                        setSelectedTime(null);
                        setStep("date");
                      }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedService?.id === svc.id
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                          : "border-gray-200 hover:border-gray-400 bg-card-bg"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDuration(svc.duration)}
                            </span>
                            {svc.price > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <DollarSign className="w-3 h-3" />
                                {formatPrice(svc.price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- STEP 2: Pick a Date & Time ---- */}
          {step === "date" && (
            <div className="p-6">
              <button
                onClick={() => setStep("service")}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to services
              </button>

              <h2 className="text-base font-semibold text-gray-900 mb-1">Pick a Date & Time</h2>
              <p className="text-xs text-gray-500 mb-5">
                {selectedService?.name} &middot; {formatDuration(selectedService?.duration || 60)}
              </p>

              {/* Calendar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={goToPrevMonth}
                    disabled={!canGoPrev}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(calYear, calMonth).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={goToNextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-[10px] font-semibold text-gray-400 uppercase py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                    <div key={`pad-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dateObj = new Date(calYear, calMonth, day);
                    const dateStr = formatDateStr(dateObj);
                    const dayOfWeek = dateObj.getDay();
                    const isEnabled = enabledDays.has(dayOfWeek);
                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === formatDateStr(today);
                    const isDisabled = isPast || !isEnabled;

                    return (
                      <button
                        key={day}
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedTime(null);
                        }}
                        className={`aspect-square rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isDisabled
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                              ? "bg-gray-900 text-white"
                              : isToday
                                ? "bg-gray-100 text-gray-900 font-bold hover:bg-gray-200"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Available times for {formatDisplayDate(selectedDate)}
                  </p>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No available times on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-2 py-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                            selectedTime === slot
                              ? "bg-gray-900 text-white border-gray-900"
                              : "bg-card-bg border-gray-200 text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          {formatTime12h(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Continue button */}
              {selectedDate && selectedTime && (
                <button
                  onClick={() => setStep("details")}
                  className="w-full mt-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition cursor-pointer"
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* ---- STEP 3: Enter Details ---- */}
          {step === "details" && (
            <div className="p-6">
              <button
                onClick={() => setStep("date")}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to date & time
              </button>

              <h2 className="text-base font-semibold text-gray-900 mb-1">Your Details</h2>
              <p className="text-xs text-gray-500 mb-5">
                {selectedService?.name} &middot; {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedTime!)}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="bp-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bp-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="bp-email" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="bp-email"
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="bp-phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    id="bp-phone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+61 400 123 456"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                  />
                </div>

                {/* Gift card */}
                {selectedService && selectedService.price > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Gift card <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={giftCardCode}
                        onChange={(e) => {
                          setGiftCardCode(e.target.value.toUpperCase());
                          setGiftCardCheck(null);
                        }}
                        placeholder="ABCD-EFGH-1234"
                        className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono uppercase tracking-wider text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                      />
                      <button
                        type="button"
                        disabled={!giftCardCode.trim() || checkingGift}
                        onClick={async () => {
                          setCheckingGift(true);
                          try {
                            const res = await fetch("/api/public/gift-cards/redeem", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                slug,
                                code: giftCardCode.trim().toUpperCase(),
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              setGiftCardCheck({
                                status: "invalid",
                                reason: data.error ?? "Invalid code",
                              });
                            } else {
                              setGiftCardCheck({
                                status: "valid",
                                balance: data.remainingBalance,
                              });
                            }
                          } catch {
                            setGiftCardCheck({ status: "invalid", reason: "Lookup failed" });
                          } finally {
                            setCheckingGift(false);
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-50 cursor-pointer"
                      >
                        {checkingGift ? "Checking…" : "Apply"}
                      </button>
                    </div>
                    {giftCardCheck?.status === "valid" && (
                      <p className="text-[11px] text-emerald-700 mt-1.5">
                        ✓ Card applied · ${giftCardCheck.balance.toFixed(2)} balance available
                      </p>
                    )}
                    {giftCardCheck?.status === "invalid" && (
                      <p className="text-[11px] text-red-600 mt-1.5">
                        {giftCardCheck.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Card on file */}
                {selectedService?.requiresCardOnFile && clientEmail.trim() && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Card on file <span className="text-red-500">*</span>
                    </label>
                    <CardOnFileForm
                      slug={slug as string}
                      customerEmail={clientEmail.trim()}
                      customerName={clientName.trim() || undefined}
                      brandColor={brandColor}
                      onReady={(d) => setCardOnFile(d)}
                      onError={(msg) => setSubmitError(msg)}
                    />
                  </div>
                )}

                {/* Guests (group booking) */}
                {selectedService?.allowGroupBooking && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Guests <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    {guestNames.map((name, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setGuestNames((g) =>
                              g.map((v, idx) => (idx === i ? e.target.value : v)),
                            )
                          }
                          placeholder={`Guest ${i + 1} name`}
                          className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setGuestNames((g) => g.filter((_, idx) => idx !== i))
                          }
                          className="px-3 py-2.5 text-xs text-gray-500 hover:text-red-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(() => {
                      const cap = selectedService.maxGroupSize ?? 4;
                      const canAdd = guestNames.length + 1 < cap;
                      if (!canAdd) {
                        return (
                          <p className="text-[11px] text-gray-400 mt-1">
                            Up to {cap - 1} additional guests.
                          </p>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => setGuestNames((g) => [...g, ""])}
                          className="text-xs text-gray-700 hover:text-gray-900 cursor-pointer underline"
                        >
                          + Add a guest
                        </button>
                      );
                    })()}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="bp-notes" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="bp-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything we should know..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Summary</p>
                  <p className="text-sm text-gray-900 font-medium">{selectedService?.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedTime!)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDuration(selectedService?.duration || 60)}
                    {selectedService && selectedService.price > 0 && ` \u00b7 ${formatPrice(selectedService.price)}`}
                  </p>
                </div>

                {/* Error */}
                {submitError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {submitError}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!clientName.trim() || !clientEmail.trim() || submitting}
                  className="w-full py-2.5 px-4 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-6">Powered by Magic</p>
      </div>
    </div>
  );
}
