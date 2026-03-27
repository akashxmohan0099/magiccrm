"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { TeamMember, AvailabilitySlot } from "@/types/models";
import { Button } from "@/components/ui/Button";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun display order

const DEFAULT_AVAILABILITY: AvailabilitySlot[] = [
  { day: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 5, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 6, startTime: "09:00", endTime: "12:00", enabled: false },
  { day: 0, startTime: "09:00", endTime: "12:00", enabled: false },
];

const inputCls =
  "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

function getSlots(member: TeamMember): AvailabilitySlot[] {
  if (member.availability && member.availability.length === 7) return member.availability;
  return DEFAULT_AVAILABILITY;
}

function MemberRow({
  member,
  workspaceId,
}: {
  member: TeamMember;
  workspaceId?: string;
}) {
  const { setMemberAvailability } = useTeamStore();
  const [expanded, setExpanded] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => getSlots(member));
  const [dirty, setDirty] = useState(false);

  const updateSlot = (day: number, patch: Partial<AvailabilitySlot>) => {
    setSlots((prev) => prev.map((s) => (s.day === day ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const save = () => {
    setMemberAvailability(member.id, slots, workspaceId);
    setDirty(false);
  };

  // Count active days for summary
  const activeDays = slots.filter((s) => s.enabled).length;

  return (
    <div className="border border-border-light rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface/50 hover:bg-surface transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-white">
              {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-[13px] font-medium text-foreground">{member.name}</span>
          <span className="text-[11px] text-text-tertiary ml-1">
            {activeDays} day{activeDays !== 1 ? "s" : ""} active
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-2 bg-card-bg">
          {DAY_ORDER.map((dayNum) => {
            const slot = slots.find((s) => s.day === dayNum)!;
            return (
              <div key={dayNum} className="flex items-center gap-2">
                <label className="w-10 text-xs font-medium text-text-secondary flex-shrink-0">
                  {DAY_NAMES[dayNum]}
                </label>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => updateSlot(dayNum, { enabled: !slot.enabled })}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    slot.enabled ? "bg-primary" : "bg-border-light"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      slot.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>

                {slot.enabled ? (
                  <>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(dayNum, { startTime: e.target.value })}
                      className={inputCls + " !w-[120px] !py-1.5 text-xs"}
                    />
                    <span className="text-[11px] text-text-tertiary">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(dayNum, { endTime: e.target.value })}
                      className={inputCls + " !w-[120px] !py-1.5 text-xs"}
                    />
                  </>
                ) : (
                  <span className="text-xs text-text-tertiary italic">Off</span>
                )}
              </div>
            );
          })}

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MemberAvailabilityPanel({ workspaceId }: { workspaceId?: string }) {
  const { members } = useTeamStore();

  if (members.length === 0) {
    return (
      <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
        <p className="text-[13px] text-text-tertiary text-center py-2">
          Add team members to set individual availability.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
      <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Member Availability
      </h3>
      <p className="text-[11px] text-text-tertiary mb-3">
        Set working hours per team member. Click a name to expand their schedule.
      </p>
      <div className="space-y-2">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} workspaceId={workspaceId} />
        ))}
      </div>
    </div>
  );
}
