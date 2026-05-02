"use client";

import type { TeamMember } from "@/types/models";

export function ArtistChip({ member }: { member: TeamMember }) {
  const initial = (member.name || "?").charAt(0).toUpperCase();
  const hue = (() => {
    let h = 0;
    for (let i = 0; i < member.name.length; i++) h = (h * 31 + member.name.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  })();
  return (
    <div className="inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-surface border border-border-light">
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-5 h-5 rounded-full object-cover"
        />
      ) : (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-foreground/70"
          style={{ backgroundColor: `hsl(${hue} 60% 88%)` }}
        >
          {initial}
        </div>
      )}
      <span className="text-[11px] font-medium text-foreground">{member.name}</span>
    </div>
  );
}
