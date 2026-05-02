"use client";

import { Users, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { TeamMember } from "@/types/models";
import { useMoney } from "@/lib/format/money";

const smallInputClass =
  "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

/**
 * Team block — member assignment + per-staff price/duration overrides.
 *
 * State lives in the parent (ServiceDrawerFields) because saving needs to
 * round-trip overrides through `member_services`. We pass the slice down
 * so the JSX can stay co-located with the labels users actually read.
 */
export function TeamBlock({
  activeMembers,
  selectedMemberIds,
  setSelectedMemberIds,
  toggleMember,
  showOverridesSection,
  showStaffPrices,
  setShowStaffPrices,
  memberOverrides,
  setMemberOverrides,
  memberDurationOverrides,
  setMemberDurationOverrides,
}: {
  activeMembers: TeamMember[];
  selectedMemberIds: string[];
  setSelectedMemberIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleMember: (memberId: string) => void;
  showOverridesSection: boolean;
  showStaffPrices: boolean;
  setShowStaffPrices: React.Dispatch<React.SetStateAction<boolean>>;
  memberOverrides: Record<string, string>;
  setMemberOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  memberDurationOverrides: Record<string, string>;
  setMemberDurationOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const money = useMoney();

  if (activeMembers.length < 2) return null;

  return (
    <div className="pt-5 border-t border-border-light">
      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Team
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] font-medium text-foreground block mb-2">
            Provided by
          </label>
          <div
            className={`text-[12px] px-3 py-2 rounded-lg border mb-2 ${
              selectedMemberIds.length === 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-surface border-border-light text-text-secondary"
            }`}
          >
            {selectedMemberIds.length === 0 ? (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Anyone — any active team member
              </span>
            ) : (
              <span>
                {selectedMemberIds.length} member{selectedMemberIds.length === 1 ? "" : "s"} selected
                {" · "}
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds([])}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Reset to Anyone
                </button>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeMembers.map((m) => {
              const isAnyoneMode = selectedMemberIds.length === 0;
              const selected = isAnyoneMode || selectedMemberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                    selected
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {showOverridesSection && (
          <div className="pt-3 border-t border-border-light">
            <button
              type="button"
              onClick={() => setShowStaffPrices((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer"
            >
              {showStaffPrices ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Custom price &amp; duration per staff
              {(() => {
                const set =
                  Object.values(memberOverrides).filter((v) => v.trim()).length +
                  Object.values(memberDurationOverrides).filter((v) => v.trim()).length;
                return set > 0 ? (
                  <span className="text-[11px] text-text-tertiary">({set} set)</span>
                ) : null;
              })()}
            </button>
            {showStaffPrices && (
              <div className="mt-3">
                <p className="text-[11px] text-text-tertiary mb-3">
                  Override the base price or duration for a specific artist. Empty = inherit.
                </p>
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-0.5 mb-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                  <span>Artist</span>
                  <span>Price ({money.symbol()})</span>
                  <span>Duration (min)</span>
                </div>
                <div className="space-y-2">
                  {activeMembers
                    .filter((m) => selectedMemberIds.includes(m.id))
                    .map((m) => (
                      <div
                        key={m.id}
                        className="grid grid-cols-[1fr_100px_100px] gap-2 items-center"
                      >
                        <span className="text-[13px] text-foreground truncate">{m.name}</span>
                        <input
                          type="number"
                          min={0}
                          value={memberOverrides[m.id] ?? ""}
                          onChange={(e) =>
                            setMemberOverrides((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          placeholder="Base"
                          className={smallInputClass}
                        />
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={memberDurationOverrides[m.id] ?? ""}
                          onChange={(e) =>
                            setMemberDurationOverrides((prev) => ({
                              ...prev,
                              [m.id]: e.target.value,
                            }))
                          }
                          placeholder="Base"
                          className={smallInputClass}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
