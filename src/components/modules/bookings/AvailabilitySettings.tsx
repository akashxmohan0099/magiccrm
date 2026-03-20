"use client";

import { useState, useEffect } from "react";
import { useBookingsStore } from "@/store/bookings";
import { AvailabilitySlot } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilitySettings() {
  const { availability, setAvailability } = useBookingsStore();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [saved, setSaved] = useState(false);
  const [bufferMinutes, setBufferMinutes] = useState("0");

  useEffect(() => {
    setSlots(availability.map((s) => ({ ...s })));
  }, [availability]);

  const updateSlot = (day: number, field: keyof AvailabilitySlot, value: string | boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  };

  const handleSave = () => {
    setAvailability(slots);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Sort by Monday-first display: 1,2,3,4,5,6,0
  const sortedSlots = [...slots].sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a.day) - order.indexOf(b.day);
  });

  return (
    <div className="mt-8 bg-card-bg rounded-xl border border-border-light p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Availability Settings</h3>
      <p className="text-xs text-text-secondary mb-5">
        Set your weekly availability to let clients know when you are open for bookings.
      </p>

      <div className="space-y-3">
        {sortedSlots.map((slot) => (
          <div
            key={slot.day}
            className="flex items-center gap-4 px-3 py-2.5 rounded-lg border border-border-light"
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => updateSlot(slot.day, "enabled", !slot.enabled)}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                slot.enabled ? "bg-foreground" : "bg-surface border border-border-light"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  slot.enabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>

            {/* Day name */}
            <span
              className={`text-sm font-medium w-24 ${
                slot.enabled ? "text-foreground" : "text-text-secondary"
              }`}
            >
              {DAY_NAMES[slot.day]}
            </span>

            {/* Time inputs */}
            <input
              type="time"
              value={slot.startTime}
              onChange={(e) => updateSlot(slot.day, "startTime", e.target.value)}
              disabled={!slot.enabled}
              className="px-2 py-1 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-40"
            />
            <span className="text-xs text-text-secondary">to</span>
            <input
              type="time"
              value={slot.endTime}
              onChange={(e) => updateSlot(slot.day, "endTime", e.target.value)}
              disabled={!slot.enabled}
              className="px-2 py-1 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-40"
            />
          </div>
        ))}
      </div>

      <FeatureSection moduleId="bookings-calendar" featureId="buffer-time" featureLabel="Buffer Time">
        <div className="mt-4">
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Buffer between appointments</label>
          <select value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} className="px-3 py-2 rounded-lg border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40">
            <option value="0">No buffer</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>
      </FeatureSection>

      <div className="flex items-center gap-3 mt-5">
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save Availability
        </Button>
        {saved && (
          <span className="text-xs text-foreground font-medium">Saved!</span>
        )}
      </div>
    </div>
  );
}
