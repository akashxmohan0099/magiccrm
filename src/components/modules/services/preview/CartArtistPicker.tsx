"use client";

import type { Service, TeamMember } from "@/types/models";

export function CartArtistPicker({
  service,
  artistId,
  activeMembers,
  getServiceMembers,
  onChange,
}: {
  service: Service;
  artistId: string | null;
  activeMembers: TeamMember[];
  getServiceMembers: (id: string) => string[];
  onChange: (artistId: string | null) => void;
}) {
  // Only members eligible for THIS service show in the picker.
  const assignedIds = getServiceMembers(service.id);
  const eligible =
    assignedIds.length === 0
      ? activeMembers
      : activeMembers.filter((m) => assignedIds.includes(m.id));
  const selected = artistId ? eligible.find((m) => m.id === artistId) : null;
  const label = selected ? selected.name : "Any stylist";

  return (
    <div className="mt-1.5 ml-2.5 pl-3 border-l border-border-light/70">
      <select
        value={artistId ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="text-[11px] text-text-secondary bg-transparent border-0 outline-none cursor-pointer hover:text-foreground appearance-none pr-3 -ml-0.5"
        aria-label={`Stylist for ${service.name}`}
      >
        <option value="">▾ Any stylist</option>
        {eligible.map((m) => (
          <option key={m.id} value={m.id}>
            ▾ {m.name}
          </option>
        ))}
      </select>
      <span className="sr-only">{label}</span>
    </div>
  );
}
