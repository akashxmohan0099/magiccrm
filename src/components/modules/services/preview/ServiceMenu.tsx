"use client";

import { useMemo } from "react";
import type { Service, TeamMember } from "@/types/models";
import { useServicesStore } from "@/store/services";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { UNCATEGORIZED, slugify } from "./helpers";
import type { Layout } from "./types";
import {
  ServiceCardPreview,
  ServiceCardCompact,
  ServiceCardGrid,
} from "./ServiceCards";

export function ServiceMenu({
  services,
  getServiceMembers,
  members,
  primaryColor,
  layout,
  selectedIds,
  onToggle,
  headingClass = "",
}: {
  services: Service[];
  getServiceMembers: (id: string) => string[];
  members: TeamMember[];
  primaryColor: string;
  layout: Layout;
  selectedIds: string[];
  onToggle: (s: Service) => void;
  headingClass?: string;
}) {
  // Pull category rows from the store so the canonical name wins over the
  // legacy free-text fallback. Same lookup pattern as the catalog view.
  const storeCategories = useServicesStore((s) => s.categories);
  const grouped = useMemo(() => {
    const m = new Map<string, Service[]>();
    for (const s of services) {
      const cat = resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED;
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push(s);
    }
    return m;
  }, [services, storeCategories]);

  const containerClass =
    layout === "grid"
      ? "grid grid-cols-2 gap-3"
      : layout === "compact"
        ? "divide-y divide-border-light bg-card-bg border border-border-light rounded-2xl overflow-hidden"
        : "space-y-3";

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([cat, catServices]) => (
        <div key={cat} id={`cat-${slugify(cat)}`} style={{ scrollMarginTop: 16 }}>
          <h3 className={`text-[16px] font-bold text-foreground mb-3 tracking-tight flex items-center gap-2 ${headingClass}`}>
            <span
              className="w-1 h-4 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            {cat}
          </h3>
          <div className={containerClass}>
            {catServices.map((service) => {
              const assignedIds = getServiceMembers(service.id);
              const activeMembers = members.filter((m) => m.status !== "inactive");
              const isAnyone = assignedIds.length === 0;
              const providers = isAnyone
                ? activeMembers
                : activeMembers.filter((m) => assignedIds.includes(m.id));
              const selected = selectedIds.includes(service.id);
              const cardProps = {
                service,
                providers,
                isAnyone,
                primaryColor,
                selected,
                onToggle: () => onToggle(service),
                headingClass,
              };
              if (layout === "compact")
                return <ServiceCardCompact key={service.id} {...cardProps} />;
              if (layout === "grid")
                return <ServiceCardGrid key={service.id} {...cardProps} />;
              return <ServiceCardPreview key={service.id} {...cardProps} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
