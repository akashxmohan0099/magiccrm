"use client";

import { Clock, DollarSign } from "lucide-react";
import type { ServiceDefinition } from "@/types/industry-config";

interface ServicePickerProps {
  services: ServiceDefinition[];
  onSelect: (service: ServiceDefinition) => void;
}

export function ServicePicker({ services, onSelect }: ServicePickerProps) {
  // Group by category
  const groups: Record<string, ServiceDefinition[]> = {};
  for (const service of services) {
    const cat = service.category ?? "Services";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(service);
  }

  return (
    <div className="bg-surface rounded-lg border border-border-light p-3">
      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
        Quick select a service
      </h4>
      <div className="space-y-3">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] text-text-tertiary font-medium mb-1.5">{category}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {items.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onSelect(service)}
                  className="flex items-center justify-between w-full px-3 py-2 text-left rounded-lg border border-border-light bg-card-bg hover:bg-primary/[0.04] hover:border-primary/20 transition-all cursor-pointer group"
                >
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {service.name}
                  </span>
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
