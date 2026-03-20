"use client";

import { useState } from "react";
import { Clock, DollarSign, Check } from "lucide-react";
import type { ServiceDefinition } from "@/types/industry-config";
import { useFeature } from "@/hooks/useFeature";

interface ServicePickerProps {
  services: ServiceDefinition[];
  onSelect: (service: ServiceDefinition) => void;
}

export function ServicePicker({ services, onSelect }: ServicePickerProps) {
  const multiEnabled = useFeature("bookings-calendar", "multi-service-booking");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group by category
  const groups: Record<string, ServiceDefinition[]> = {};
  for (const service of services) {
    const cat = service.category ?? "Services";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(service);
  }

  const handleClick = (service: ServiceDefinition) => {
    if (multiEnabled) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(service.id)) {
          next.delete(service.id);
        } else {
          next.add(service.id);
        }
        return next;
      });
      // Still call onSelect so the parent can react (e.g. update title/duration)
      onSelect(service);
    } else {
      onSelect(service);
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border-light p-3">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {multiEnabled ? "Select services (multiple)" : "Quick select a service"}
      </h4>
      <div className="space-y-3">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] text-text-tertiary font-medium mb-1.5">{category}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {items.map((service) => {
                const isSelected = multiEnabled && selectedIds.has(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleClick(service)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg border transition-all cursor-pointer group ${
                      isSelected
                        ? "border-primary bg-primary/[0.06]"
                        : "border-border-light bg-card-bg hover:bg-primary/[0.04] hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {multiEnabled && (
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border-light"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      <span className={`text-sm font-medium transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                        {service.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration}min
                      </span>
                      {service.price > 0 && (
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3" />
                          {service.price}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
