"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
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

/** Post height to parent window so the iframe can auto-resize. */
function postHeight() {
  if (typeof window === "undefined") return;
  try {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: "magic-embed-resize", height }, "*");
  } catch {
    // cross-origin parent — ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Step = "service" | "date" | "details" | "confirmation";

export default function EmbedBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const accentOverride = searchParams.get("accent"); // allow ?accent=FF6B35

  const containerRef = useRef<HTMLDivElement>(null);

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // ---- calendar state ----
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const effectiveBrandColor = accentOverride ? `#${accentOverride.replace("#", "")}` : brandColor;

  // ---- auto-resize: post height on every render ----
  useEffect(() => {
    postHeight();
  });

  // Also post height on step/content changes
  useEffect(() => {
    const timer = setTimeout(postHeight, 100);
    return () => clearTimeout(timer);
  }, [step, selectedDate, availableSlots, confirmation]);

  // ---- load workspace data ----
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
        setError("Failed to load booking page.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // ---- load available time slots ----
  useEffect(() => {
    if (!workspaceId || !selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }
    fetch(`/api/public/book/info?slug=${encodeURIComponent(slug)}&bookingsDate=${selectedDate}&serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((data) => setAvailableSlots(Array.isArray(data.availableSlots) ? data.availableSlots : []))
      .catch(() => setAvailableSlots([]));
  }, [workspaceId, selectedDate, selectedService, slug]);

  const enabledDays = useMemo(() => {
    return new Set(availability.filter((s) => s.enabled).map((s) => s.day));
  }, [availability]);

  // ---- handle submission ----
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!workspaceId || !selectedService || !selectedDate || !selectedTime) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch("/api/public/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            serviceId: selectedService.id,
            date: selectedDate,
            time: selectedTime,
            clientName: clientName.trim(),
            clientEmail: clientEmail.trim(),
            clientPhone: clientPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error || "Failed to create booking.");
          return;
        }

        // Notify parent window of successful booking
        try {
          window.parent.postMessage({ type: "magic-embed-booked", booking: data.booking }, "*");
        } catch { /* cross-origin */ }

        setConfirmation(data.booking);
        setStep("confirmation");
      } catch {
        setSubmitError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [workspaceId, slug, selectedService, selectedDate, selectedTime, clientName, clientEmail, clientPhone, notes]
  );

  // ---- calendar nav ----
  const goToPrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const goToNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };
  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth());

  // ---------------------------------------------------------------------------
  // Renders
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div ref={containerRef} className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error) {
    return (
      <div ref={containerRef} className="px-4 py-10">
        <div className="max-w-sm mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-foreground/[0.04] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-text-tertiary" />
          </div>
          <h2 className="text-[15px] font-bold text-foreground mb-1">
            Booking page not found
          </h2>
          <p className="text-[12px] text-text-secondary leading-relaxed">
            {error.includes("not found")
              ? "The slug in this embed doesn't match any active booking page. Set your booking page slug from Settings, then re-copy the embed code."
              : error}
          </p>
        </div>
      </div>
    );
  }

  // ---- Confirmation ----
  if (step === "confirmation" && confirmation) {
    return (
      <div ref={containerRef} className="px-4 py-8">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${effectiveBrandColor}20` }}>
            <CheckCircle2 className="w-7 h-7" style={{ color: effectiveBrandColor }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Booking Confirmed!</h2>
            <p className="text-xs text-gray-500 mt-1">{businessName}</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 text-left space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Service</p>
              <p className="text-sm font-medium text-gray-900">{confirmation.serviceName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date & Time</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDisplayDate(confirmation.date)} at {formatTime12h(confirmation.time)}
              </p>
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration</p>
                <p className="text-sm font-medium text-gray-900">{formatDuration(confirmation.duration)}</p>
              </div>
              {confirmation.price > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Price</p>
                  <p className="text-sm font-medium text-gray-900">{formatPrice(confirmation.price)}</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-300">Powered by Magic</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="px-2 py-4 sm:px-4">
      <div className="max-w-lg mx-auto">
        {/* Compact header */}
        <div className="text-center mb-5">
          <h1 className="text-base font-bold text-gray-900">{businessName}</h1>
          <p className="text-xs text-gray-500">Book an appointment</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {(["service", "date", "details"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  step === s
                    ? "text-white"
                    : (["service", "date", "details"] as Step[]).indexOf(step) > i
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
                style={step === s ? { backgroundColor: effectiveBrandColor } : undefined}
              >
                {(["service", "date", "details"] as Step[]).indexOf(step) > i ? "\u2713" : i + 1}
              </div>
              {i < 2 && <div className="w-6 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* ---- STEP 1: Service ---- */}
          {step === "service" && (
            <div className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Select a Service</h2>
              {services.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No services available.</p>
              ) : (
                <div className="space-y-1.5">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => { setSelectedService(svc); setSelectedDate(null); setSelectedTime(null); setStep("date"); }}
                      className={`w-full text-left px-3 py-3 rounded-lg border transition-all cursor-pointer ${
                        selectedService?.id === svc.id ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                              <Clock className="w-3 h-3" /> {formatDuration(svc.duration)}
                            </span>
                            {svc.price > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <DollarSign className="w-3 h-3" /> {formatPrice(svc.price)}
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

          {/* ---- STEP 2: Date & Time ---- */}
          {step === "date" && (
            <div className="p-4 sm:p-5">
              <button onClick={() => setStep("service")} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 mb-3 cursor-pointer">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>

              <h2 className="text-sm font-semibold text-gray-900 mb-1">Pick a Date & Time</h2>
              <p className="text-[11px] text-gray-500 mb-4">{selectedService?.name} &middot; {formatDuration(selectedService?.duration || 60)}</p>

              {/* Calendar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={goToPrevMonth} disabled={!canGoPrev} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-gray-900">
                    {new Date(calYear, calMonth).toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={goToNextMonth} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-[9px] font-semibold text-gray-400 uppercase py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`p-${i}`} />)}
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
                        onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                        className={`aspect-square rounded text-[11px] font-medium transition-all cursor-pointer ${
                          isDisabled ? "text-gray-300 cursor-not-allowed"
                            : isSelected ? "text-white" : isToday ? "bg-gray-100 text-gray-900 font-bold hover:bg-gray-200" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={isSelected ? { backgroundColor: effectiveBrandColor } : undefined}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {formatDisplayDate(selectedDate)}
                  </p>
                  {availableSlots.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">No times available.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`px-1.5 py-2 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                            selectedTime === slot ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                          }`}
                          style={selectedTime === slot ? { backgroundColor: effectiveBrandColor } : undefined}
                        >
                          {formatTime12h(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedDate && selectedTime && (
                <button
                  onClick={() => setStep("details")}
                  className="w-full mt-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition cursor-pointer"
                  style={{ backgroundColor: effectiveBrandColor }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* ---- STEP 3: Details ---- */}
          {step === "details" && (
            <div className="p-4 sm:p-5">
              <button onClick={() => setStep("date")} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 mb-3 cursor-pointer">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>

              <h2 className="text-sm font-semibold text-gray-900 mb-1">Your Details</h2>
              <p className="text-[11px] text-gray-500 mb-4">
                {selectedService?.name} &middot; {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedTime!)}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+61 400 123 456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything we should know..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition resize-none" />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-gray-900">{selectedService?.name}</p>
                  <p className="text-[11px] text-gray-600">
                    {formatDisplayDate(selectedDate!)} at {formatTime12h(selectedTime!)}
                    {" "}&middot; {formatDuration(selectedService?.duration || 60)}
                    {selectedService && selectedService.price > 0 && ` \u00b7 ${formatPrice(selectedService.price)}`}
                  </p>
                </div>

                {submitError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
                )}

                <button type="submit"
                  disabled={!clientName.trim() || !clientEmail.trim() || submitting}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: effectiveBrandColor }}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-4">
          Powered by <a href="https://usemagic.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">Magic</a>
        </p>
      </div>
    </div>
  );
}
