"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Clock } from "lucide-react";
import { useBookingsStore } from "@/store/bookings";
import { Button } from "@/components/ui/Button";

const MOCK_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

export function BookingPagePreview() {
  const { availability } = useBookingsStore();
  const [copied, setCopied] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const enabledDays = availability.filter((s) => s.enabled).length;

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Booking Page Preview</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Preview how your public booking page will look to clients.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy booking link
            </>
          )}
        </Button>
      </div>

      {/* Mock Booking Page Card */}
      <div className="border border-border-light rounded-xl bg-surface p-6 max-w-md mx-auto">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
            <ExternalLink className="w-5 h-5 text-foreground" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Your Business Name</h4>
          <p className="text-xs text-text-secondary mt-1">
            {enabledDays} day{enabledDays !== 1 ? "s" : ""} available for booking
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Available Time Slots
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MOCK_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selectedSlot === slot
                    ? "bg-foreground text-white border-foreground"
                    : "bg-card-bg border-border-light text-foreground hover:border-foreground"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!selectedSlot}
          className="w-full py-2.5 rounded-lg bg-foreground text-white text-sm font-medium disabled:opacity-40 transition-opacity cursor-pointer"
        >
          Book Appointment
        </button>

        <p className="text-[10px] text-text-secondary text-center mt-3">
          Powered by MAGIC CRM
        </p>
      </div>
    </div>
  );
}
