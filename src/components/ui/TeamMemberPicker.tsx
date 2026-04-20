"use client";

import { useMemo } from "react";
import { useTeamStore } from "@/store/team";
import { FormField } from "@/components/ui/FormField";

interface TeamMemberPickerProps {
  value?: string;  // team member ID
  onChange: (memberId: string | undefined, memberName: string | undefined) => void;
  label?: string;
}

export function TeamMemberPicker({ value, onChange, label = "Assign to" }: TeamMemberPickerProps) {
  const { members } = useTeamStore();

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "inactive"),
    [members]
  );

  // Don't render if there are no team members
  if (activeMembers.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      onChange(undefined, undefined);
    } else {
      const member = activeMembers.find((m) => m.id === id);
      onChange(id, member?.name);
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case "owner": return "Owner";
      case "admin": return "Admin";
      default: return "Staff";
    }
  };

  return (
    <FormField label={label}>
      <div className="relative">
        <select
          value={value || ""}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 appearance-none"
        >
          <option value="">Unassigned</option>
          {activeMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({roleBadge(m.role)})
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {/* Show selected member info with initials */}
      {value && (() => {
        const member = activeMembers.find((m) => m.id === value);
        if (!member) return null;
        const initials = member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-xs text-text-secondary">
              {member.name}
              {member.role && <span className="text-text-tertiary"> &middot; {member.role}</span>}
            </span>
          </div>
        );
      })()}
    </FormField>
  );
}
