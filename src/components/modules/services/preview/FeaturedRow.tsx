"use client";

import type { Service, TeamMember } from "@/types/models";
import { ServiceCardPreview } from "./ServiceCards";

export function FeaturedRow({
  services,
  getServiceMembers,
  members,
  primaryColor,
  selectedIds,
  onToggle,
  headingClass = "",
}: {
  services: Service[];
  getServiceMembers: (id: string) => string[];
  members: TeamMember[];
  primaryColor: string;
  selectedIds: string[];
  onToggle: (s: Service) => void;
  headingClass?: string;
}) {
  if (services.length === 0) return null;
  return (
    <div className="mb-8">
      <h3
        className={`text-[16px] font-bold text-foreground mb-3 tracking-tight flex items-center gap-2 ${headingClass}`}
      >
        <span
          className="w-1 h-4 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
        Today&apos;s offers
      </h3>
      <div className="space-y-3">
        {services.map((service) => {
          const assignedIds = getServiceMembers(service.id);
          const activeMembers = members.filter((m) => m.status !== "inactive");
          const isAnyone = assignedIds.length === 0;
          const providers = isAnyone
            ? activeMembers
            : activeMembers.filter((m) => assignedIds.includes(m.id));
          const selected = selectedIds.includes(service.id);
          return (
            <ServiceCardPreview
              key={`featured-${service.id}`}
              service={service}
              providers={providers}
              isAnyone={isAnyone}
              primaryColor={primaryColor}
              selected={selected}
              onToggle={() => onToggle(service)}
              headingClass={headingClass}
              hidePromoLabel
            />
          );
        })}
      </div>
    </div>
  );
}
