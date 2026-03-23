"use client";

import { useState } from "react";
import { Clock, DollarSign, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { ServiceDefinition, ServiceVariant } from "@/types/industry-config";
import { useFeature } from "@/hooks/useFeature";

interface ServicePickerProps {
  services: ServiceDefinition[];
  onSelect: (service: ServiceDefinition, variant?: ServiceVariant) => void;
}

export function ServicePicker({ services, onSelect }: ServicePickerProps) {
  const multiEnabled = useFeature("bookings-calendar", "multi-service-booking");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set());

  // Group by category
  const groups: Record<string, ServiceDefinition[]> = {};
  for (const service of services) {
    const cat = service.category ?? "Services";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(service);
  }

  const toggleExpanded = (serviceId: string) => {
    setExpandedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const handleClick = (service: ServiceDefinition, variant?: ServiceVariant) => {
    const selectionId = variant ? `${service.id}:${variant.id}` : service.id;

    if (multiEnabled) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(selectionId)) {
          next.delete(selectionId);
        } else {
          next.add(selectionId);
        }
        return next;
      });
    }

    onSelect(service, variant);
  };

  const hasVariants = (service: ServiceDefinition) =>
    service.variants && service.variants.length > 0;

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
                const expanded = expandedServiceIds.has(service.id);
                const serviceHasVariants = hasVariants(service);
                const isSelected = multiEnabled && selectedIds.has(service.id);

                return (
                  <div key={service.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (serviceHasVariants) {
                          toggleExpanded(service.id);
                        } else {
                          handleClick(service);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-left rounded-lg border transition-all cursor-pointer group ${
                        isSelected
                          ? "border-primary bg-primary/[0.06]"
                          : "border-border-light bg-card-bg hover:bg-primary/[0.04] hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {multiEnabled && !serviceHasVariants && (
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border-light"}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        )}
                        {serviceHasVariants && (
                          expanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
                            : <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
                        )}
                        <span className={`text-sm font-medium transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                          {service.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        {serviceHasVariants ? (
                          <span className="text-text-tertiary">
                            {service.variants!.length} option{service.variants!.length !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </button>

                    {/* Variant sub-options */}
                    {serviceHasVariants && expanded && (
                      <div className="ml-5 mt-1 space-y-1">
                        {service.variants!.map((variant) => {
                          const variantSelectionId = `${service.id}:${variant.id}`;
                          const isVarSelected = multiEnabled && selectedIds.has(variantSelectionId);

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleClick(service, variant)}
                              className={`flex items-center justify-between w-full px-3 py-1.5 text-left rounded-md border transition-all cursor-pointer group ${
                                isVarSelected
                                  ? "border-primary bg-primary/[0.06]"
                                  : "border-border-light bg-surface hover:bg-primary/[0.04] hover:border-primary/20"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {multiEnabled && (
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isVarSelected ? "bg-primary border-primary" : "border-border-light"}`}>
                                    {isVarSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                )}
                                <span className={`text-[13px] font-medium transition-colors ${isVarSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                                  {variant.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-text-secondary">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {variant.duration}min
                                </span>
                                {variant.price > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <DollarSign className="w-3 h-3" />
                                    {variant.price}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
