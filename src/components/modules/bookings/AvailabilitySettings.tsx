"use client";

import { useState, useEffect, useMemo } from "react";
import { useTeamStore } from "@/store/team";
import { useSettingsStore } from "@/store/settings";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

interface WorkingHoursSlot {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

export function AvailabilitySettings() {
  const { members, updateMember } = useTeamStore();
  const { settings, updateSettings } = useSettingsStore();
  const { workspaceId } = useAuth();

  // Use workspace-level working hours as default. useMemo so the empty
  // fallback object doesn't get a new identity on every render — that
  // would invalidate the useEffect deps below and re-sync slots constantly.
  const workspaceHours = useMemo(
    () => settings?.workingHours ?? {},
    [settings?.workingHours],
  );

  // Find the current user (owner) to edit their working hours
  const currentMember = useMemo(() => {
    return members.find((m) => m.role === "owner") ?? members[0];
  }, [members]);

  const [slots, setSlots] = useState<WorkingHoursSlot[]>([]);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState<"workspace" | "member">(
    currentMember ? "member" : "workspace"
  );

  useEffect(() => {
    const hours = editMode === "member" && currentMember
      ? currentMember.workingHours
      : workspaceHours;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(
      DAY_KEYS.map((day) => ({
        day,
        enabled: !!hours[day],
        start: hours[day]?.start ?? "09:00",
        end: hours[day]?.end ?? "17:00",
      }))
    );
  }, [currentMember, workspaceHours, editMode]);

  const updateSlot = (day: string, field: keyof WorkingHoursSlot, value: string | boolean) => {
    setSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
    setSaved(false);
  };

  const handleSave = () => {
    const newHours: Record<string, { start: string; end: string }> = {};
    for (const slot of slots) {
      if (slot.enabled) {
        newHours[slot.day] = { start: slot.start, end: slot.end };
      }
    }

    if (editMode === "member" && currentMember) {
      updateMember(currentMember.id, { workingHours: newHours }, workspaceId ?? undefined);
    } else {
      updateSettings({ workingHours: newHours }, workspaceId ?? undefined);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-8 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">Availability Settings</h3>
        {currentMember && (
          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border-light">
            <button
              onClick={() => setEditMode("workspace")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                editMode === "workspace"
                  ? "bg-card-bg text-foreground shadow-sm"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setEditMode("member")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                editMode === "member"
                  ? "bg-card-bg text-foreground shadow-sm"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              {currentMember.name || "My Hours"}
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-text-secondary mb-5">
        {editMode === "workspace"
          ? "Set your default weekly availability for the workspace."
          : `Set working hours for ${currentMember?.name || "yourself"}.`}
      </p>

      <div className="space-y-3">
        {slots.map((slot) => (
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
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-card-bg shadow transition-transform ${
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
              {DAY_LABELS[slot.day]}
            </span>

            {/* Time inputs */}
            <input
              type="time"
              value={slot.start}
              onChange={(e) => updateSlot(slot.day, "start", e.target.value)}
              disabled={!slot.enabled}
              className="px-2 py-1 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-40"
            />
            <span className="text-xs text-text-secondary">to</span>
            <input
              type="time"
              value={slot.end}
              onChange={(e) => updateSlot(slot.day, "end", e.target.value)}
              disabled={!slot.enabled}
              className="px-2 py-1 rounded-md border border-border-light bg-surface text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/40 disabled:opacity-40"
            />
          </div>
        ))}
      </div>

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
