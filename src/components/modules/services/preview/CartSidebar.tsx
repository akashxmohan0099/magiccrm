"use client";

import { X } from "lucide-react";
import type { Service, ServiceAddon } from "@/types/models";

export function CartSidebar({
  items,
  totalPrice,
  totalDuration,
  primaryColor,
  onRemove,
  onContinue,
}: {
  items: {
    service: Service;
    variantId?: string;
    artistId?: string | null;
    addons: ServiceAddon[];
    price: number;
    basePrice: number;
    duration: number;
    baseDuration: number;
  }[];
  totalPrice: number;
  totalDuration: number;
  primaryColor: string;
  onRemove: (s: Service) => void;
  onContinue: () => void;
}) {
  const continueGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const durationLabel =
    hours > 0
      ? mins > 0
        ? `${hours}h ${mins}m`
        : `${hours}h`
      : `${mins} min`;

  return (
    <aside className="lg:sticky lg:top-4 self-start">
      <div className="bg-card-bg border border-border-light rounded-3xl overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.12)]">
        {/* Header — centered, with a small brand-tinted count chip */}
        <div className="px-5 pt-6 pb-4 text-center">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.12em]">
            Your booking
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
          >
            {items.length} {items.length === 1 ? "service" : "services"}
            <span className="opacity-50">·</span>
            <span className="tabular-nums">{durationLabel}</span>
          </div>
        </div>

        {/* Items */}
        <ul className="px-2 pb-2">
          {items.map((item) => {
            const variant = item.variantId
              ? item.service.variants?.find((v) => v.id === item.variantId)
              : null;
            return (
              <li
                key={item.service.id}
                className="group px-3 py-2.5 rounded-xl hover:bg-surface/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-text-tertiary tabular-nums">
                      {item.baseDuration} min · ${item.basePrice}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.service)}
                    className="p-1.5 rounded-full text-text-tertiary hover:text-foreground hover:bg-card-bg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {item.addons.length > 0 && (
                  <ul className="mt-1.5 ml-2.5 pl-3 border-l border-border-light space-y-0.5">
                    {item.addons.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-baseline justify-between gap-2 text-[11px]"
                      >
                        <span className="text-text-secondary truncate">+ {a.name}</span>
                        <span className="text-text-tertiary tabular-nums whitespace-nowrap">
                          +${a.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {/* Total — centered, bold, hero treatment */}
        <div className="px-5 py-5 border-t border-border-light text-center">
          <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.12em] mb-1">
            Total
          </p>
          <p className="text-[28px] font-bold text-foreground tabular-nums leading-none">
            ${totalPrice}
          </p>
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <button
            onClick={onContinue}
            className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)]"
            style={{ backgroundImage: continueGradient }}
          >
            Continue
          </button>
        </div>
      </div>
    </aside>
  );
}
