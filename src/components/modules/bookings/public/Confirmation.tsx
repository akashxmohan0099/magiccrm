"use client";

import { CalendarPlus, CheckCircle2, MapPin, RotateCw } from "lucide-react";

export interface ConfirmedBooking {
  date: string;          // "2026-05-12"
  time: string;          // "14:00"
  endTime: string;       // "15:30"
  serviceNames: string[];
  total: number;
  durationMinutes: number;
  businessName: string;
  status?: "pending" | "confirmed";
  /** Free-text customer address (mobile bookings) — falls back to studio address. */
  address?: string;
  /** Location name to surface on the "Where" card. */
  locationName?: string;
  /**
   * Largest rebookAfterDays across booked services. When present, surface a
   * "Plan your next visit" CTA that primes the customer to rebook around
   * that anchor date.
   */
  rebookAfterDays?: number;
}

interface ConfirmationProps {
  booking: ConfirmedBooking;
  onBookAnother: () => void;
}

function fmtDateLong(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr} ${suffix}`;
}

/** "Plan your next visit (around 12 Jul)". Adds rebookAfterDays to the booked date. */
function fmtNextVisit(bookedDate: string, daysOut: number): string {
  const d = new Date(`${bookedDate}T12:00:00`);
  d.setDate(d.getDate() + daysOut);
  return `around ${d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`;
}

/** Build a Google Calendar event URL for the booking. */
function googleCalendarUrl(b: ConfirmedBooking): string {
  const start = `${b.date.replace(/-/g, "")}T${b.time.replace(":", "")}00`;
  const end = `${b.date.replace(/-/g, "")}T${b.endTime.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${b.serviceNames.join(", ")} at ${b.businessName}`,
    dates: `${start}/${end}`,
    details: `Booking with ${b.businessName}`,
    location: b.address || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Build an .ics file as a data URL — works for Apple Calendar / Outlook. */
function icsDataUrl(b: ConfirmedBooking): string {
  const dtStart = `${b.date.replace(/-/g, "")}T${b.time.replace(":", "")}00`;
  const dtEnd = `${b.date.replace(/-/g, "")}T${b.endTime.replace(":", "")}00`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${dtStart}-${b.businessName.replace(/\s+/g, "")}@magic`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${b.serviceNames.join(", ")} at ${b.businessName}`,
    `DESCRIPTION:Booking with ${b.businessName}`,
    b.address ? `LOCATION:${b.address}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export function Confirmation({ booking, onBookAnother }: ConfirmationProps) {
  const isPending = booking.status === "pending";
  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-primary" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          {isPending ? "Request received" : "You're booked"}
        </h2>
        <p className="text-[13px] text-text-secondary mt-1">
          {isPending
            ? "The business will confirm your appointment shortly."
            : "Confirmation sent to your email."}
        </p>
      </div>

      <div className="bg-surface rounded-xl p-5 space-y-3 mb-5">
        <div>
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">When</p>
          <p className="text-[15px] font-semibold text-foreground mt-0.5">
            {fmtDateLong(booking.date)}
          </p>
          <p className="text-[13px] text-text-secondary">
            {fmtTime12h(booking.time)} – {fmtTime12h(booking.endTime)}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Services</p>
          <p className="text-[14px] text-foreground mt-0.5">{booking.serviceNames.join(", ")}</p>
        </div>

        {(booking.address || booking.locationName) && (
          <div>
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Where</p>
            <div className="mt-0.5 flex items-start gap-1.5 text-[13px]">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-text-tertiary" />
              <div className="min-w-0">
                {booking.locationName && (
                  <p className="text-foreground font-medium">{booking.locationName}</p>
                )}
                {booking.address && (
                  <p className="text-text-secondary">{booking.address}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
        <a
          href={googleCalendarUrl(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-surface/70 rounded-xl text-[13px] font-medium text-foreground cursor-pointer transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Add to Google Calendar
        </a>
        <a
          href={icsDataUrl(booking)}
          download="booking.ics"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface hover:bg-surface/70 rounded-xl text-[13px] font-medium text-foreground cursor-pointer transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Apple / Outlook (.ics)
        </a>
      </div>

      {booking.rebookAfterDays && booking.rebookAfterDays > 0 ? (
        <button
          type="button"
          onClick={onBookAnother}
          className="w-full mb-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-[13px] font-semibold cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Plan your next visit
          <span className="font-normal opacity-80">
            ({fmtNextVisit(booking.date, booking.rebookAfterDays)})
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onBookAnother}
          className="w-full text-[13px] text-text-secondary hover:text-foreground cursor-pointer"
        >
          Book another appointment
        </button>
      )}
    </div>
  );
}
