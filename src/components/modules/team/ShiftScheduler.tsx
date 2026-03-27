"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { TeamShift } from "@/types/models";
import { Button } from "@/components/ui/Button";

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NUMBERS = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 through Sun=0

const MEMBER_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

const inputCls =
  "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return mStr === "00" ? `${h12}${suffix}` : `${h12}:${mStr}${suffix}`;
}

interface AddShiftPopoverProps {
  memberId: string;
  memberName: string;
  dayOfWeek: number;
  workspaceId?: string;
  onClose: () => void;
}

function AddShiftPopover({
  memberId,
  memberName,
  dayOfWeek,
  workspaceId,
  onClose,
}: AddShiftPopoverProps) {
  const { addShift } = useTeamStore();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  const handleSave = () => {
    if (startTime >= endTime) return;
    addShift({ memberId, memberName, dayOfWeek, startTime, endTime }, workspaceId);
    onClose();
  };

  return (
    <div className="absolute z-20 top-full left-0 mt-1 bg-card-bg border border-border-light rounded-xl shadow-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-foreground">Add Shift</span>
        <button type="button" onClick={onClose} className="text-text-tertiary hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-text-tertiary">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputCls + " !py-1.5 text-xs"}
          />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputCls + " !py-1.5 text-xs"}
          />
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} className="w-full">
          <Check className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

interface EditShiftPopoverProps {
  shift: TeamShift;
  workspaceId?: string;
  onClose: () => void;
}

function EditShiftPopover({ shift, workspaceId, onClose }: EditShiftPopoverProps) {
  const { updateShift, deleteShift } = useTeamStore();
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);

  const handleSave = () => {
    if (startTime >= endTime) return;
    updateShift(shift.id, { startTime, endTime }, workspaceId);
    onClose();
  };

  const handleDelete = () => {
    deleteShift(shift.id, workspaceId);
    onClose();
  };

  return (
    <div className="absolute z-20 top-full left-0 mt-1 bg-card-bg border border-border-light rounded-xl shadow-lg p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-foreground">Edit Shift</span>
        <button type="button" onClick={onClose} className="text-text-tertiary hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-text-tertiary">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputCls + " !py-1.5 text-xs"}
          />
        </div>
        <div>
          <label className="text-[10px] text-text-tertiary">End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputCls + " !py-1.5 text-xs"}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">
            <Check className="w-3.5 h-3.5" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ShiftScheduler({ workspaceId }: { workspaceId?: string }) {
  const { members, shifts } = useTeamStore();
  const [addingCell, setAddingCell] = useState<string | null>(null); // "memberId-day"
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Build color map per member
  const memberColorMap = new Map<string, string>();
  members.forEach((m, idx) => {
    memberColorMap.set(m.id, MEMBER_COLORS[idx % MEMBER_COLORS.length]);
  });

  const getShiftsForCell = (memberId: string, dayOfWeek: number): TeamShift[] => {
    return shifts.filter((s) => s.memberId === memberId && s.dayOfWeek === dayOfWeek);
  };

  if (members.length === 0) {
    return (
      <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
        <p className="text-[13px] text-text-tertiary text-center py-2">
          Add team members to start scheduling shifts.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">
          Shift Planner
        </h3>
        <span className="text-[11px] text-text-tertiary">This week</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-medium text-text-tertiary pb-2 pr-2 w-[100px]">
                Member
              </th>
              {DAY_NAMES_SHORT.map((d) => (
                <th key={d} className="text-center text-[11px] font-medium text-text-tertiary pb-2 px-1">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-border-light/50">
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">{member.name[0]}</span>
                    </div>
                    <span className="text-xs text-foreground truncate max-w-[80px]">
                      {member.name.split(" ")[0]}
                    </span>
                  </div>
                </td>
                {DAY_NUMBERS.map((dayNum, dayIdx) => {
                  const cellKey = `${member.id}-${dayNum}`;
                  const cellShifts = getShiftsForCell(member.id, dayNum);
                  const colorCls = memberColorMap.get(member.id) || MEMBER_COLORS[0];
                  const isAdding = addingCell === cellKey;

                  return (
                    <td key={dayIdx} className="py-2 px-1 align-top">
                      <div className="relative min-h-[44px]">
                        {cellShifts.length > 0 ? (
                          <div className="space-y-1">
                            {cellShifts.map((shift) => {
                              const isEditing = editingShiftId === shift.id;
                              return (
                                <div key={shift.id} className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingShiftId(isEditing ? null : shift.id)
                                    }
                                    className={`w-full text-[10px] font-medium px-1.5 py-1 rounded-lg border ${colorCls} hover:opacity-80 transition-opacity text-center`}
                                  >
                                    {formatTime12(shift.startTime)}-{formatTime12(shift.endTime)}
                                  </button>
                                  {isEditing && (
                                    <EditShiftPopover
                                      shift={shift}
                                      workspaceId={workspaceId}
                                      onClose={() => setEditingShiftId(null)}
                                    />
                                  )}
                                </div>
                              );
                            })}
                            {/* Small add button below existing shifts */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setAddingCell(isAdding ? null : cellKey)}
                                className="w-full flex items-center justify-center py-0.5 text-text-tertiary hover:text-primary transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {isAdding && (
                                <AddShiftPopover
                                  memberId={member.id}
                                  memberName={member.name}
                                  dayOfWeek={dayNum}
                                  workspaceId={workspaceId}
                                  onClose={() => setAddingCell(null)}
                                />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setAddingCell(isAdding ? null : cellKey)}
                              className="w-full h-[44px] bg-surface/50 rounded-lg border border-border-light/50 flex items-center justify-center text-text-tertiary hover:text-primary hover:border-primary/30 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {isAdding && (
                              <AddShiftPopover
                                memberId={member.id}
                                memberName={member.name}
                                dayOfWeek={dayNum}
                                workspaceId={workspaceId}
                                onClose={() => setAddingCell(null)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-text-tertiary mt-2">
        Click <Plus className="w-3 h-3 inline" /> to add a shift, or click an existing shift to edit or remove it.
      </p>
    </div>
  );
}
