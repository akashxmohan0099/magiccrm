"use client";

import type { TeamMember } from "@/types/models";

export function MemberAvatar({ member, ring = true }: { member: TeamMember; ring?: boolean }) {
  const initial = (member.name || "?").trim().charAt(0).toUpperCase();
  const hue = (() => {
    let h = 0;
    for (let i = 0; i < member.name.length; i++) h = (h * 31 + member.name.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  })();
  const ringClass = ring ? "ring-2 ring-card-bg" : "";
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt={member.name}
        title={member.name}
        className={`w-6 h-6 rounded-full object-cover ${ringClass}`}
      />
    );
  }
  return (
    <div
      title={member.name}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-foreground/80 ${ringClass}`}
      style={{ backgroundColor: `hsl(${hue} 60% 88%)` }}
    >
      {initial}
    </div>
  );
}

export function MemberAvatarStack({
  members,
  isAnyone,
  max = 3,
}: {
  members: TeamMember[];
  isAnyone: boolean;
  max?: number;
}) {
  if (members.length === 0) return null;
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  return (
    <div
      className="flex items-center"
      title={
        isAnyone
          ? `Anyone (${members.length})`
          : members.map((m) => m.name).join(", ")
      }
    >
      <div className="flex -space-x-1.5">
        {visible.map((m) => (
          <MemberAvatar key={m.id} member={m} />
        ))}
        {overflow > 0 && (
          <div className="w-6 h-6 rounded-full ring-2 ring-card-bg bg-surface flex items-center justify-center text-[10px] font-semibold text-text-secondary">
            +{overflow}
          </div>
        )}
      </div>
      {isAnyone && (
        <span className="ml-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
          Any
        </span>
      )}
    </div>
  );
}
