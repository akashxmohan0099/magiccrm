"use client";

import { ArrowRight, Clock3, ReceiptText, X } from "lucide-react";
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
  const hours = Math.floor(totalDuration / 60);
  const mins = totalDuration % 60;
  const durationLabel =
    hours > 0
      ? mins > 0
        ? `${hours}h ${mins}m`
        : `${hours}h`
      : `${mins} min`;

  // Buffers don't change the customer-visible end time, but they DO block
  // the chair — surface that explicitly so the operator sees the slot the
  // scheduler will actually carve out.
  const bufferTotal = items.reduce(
    (s, it) =>
      s +
      (it.service.bufferBefore ?? 0) +
      (it.service.bufferAfter ?? 0),
    0,
  );
  const dueToday = items.reduce((sum, it) => {
    const s = it.service;
    if (s.depositType === "fixed") {
      return sum + Math.max(0, s.depositAmount);
    }
    if (s.depositType === "percentage") {
      const pct = Math.max(0, Math.min(100, s.depositAmount));
      return sum + Math.round(it.price * pct) / 100;
    }
    return sum;
  }, 0);

  return (
    <aside className="lg:sticky lg:top-5 self-start">
      <div
        className="bg-card-bg border rounded-2xl overflow-hidden shadow-[0_14px_34px_-28px_rgba(0,0,0,0.45)]"
        style={{ borderColor: `${primaryColor}24` }}
      >
        <div
          className="h-1"
          style={{ backgroundColor: primaryColor }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.14em]">
                Booking summary
              </p>
              <p className="mt-1 text-[15px] font-semibold text-foreground tracking-tight">
                {items.length} {items.length === 1 ? "service" : "services"} selected
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
              aria-hidden="true"
            >
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div
            className="mt-4 flex items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: `${primaryColor}0f` }}
          >
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
              <Clock3 className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              Estimated time
            </span>
            <span className="text-[12px] font-semibold text-foreground tabular-nums">
              {durationLabel}
            </span>
          </div>
          {bufferTotal > 0 && (
            <p className="text-[11px] text-text-tertiary mt-2 tabular-nums">
              + {bufferTotal}m chair buffer
            </p>
          )}
        </div>

        {/* Items */}
        <ul className="px-4 pb-4 space-y-2">
          {items.map((item) => {
            const variant = item.variantId
              ? item.service.variants?.find((v) => v.id === item.variantId)
              : null;
            return (
              <li
                key={item.service.id}
                className="group rounded-xl border border-border-light bg-surface/35 px-3 py-3 transition-colors hover:bg-surface/60"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-semibold"
                    style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                  >
                    {item.service.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-tertiary">
                      <span className="tabular-nums">{item.baseDuration} min</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">${item.basePrice}</span>
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground tabular-nums">
                    ${item.price}
                  </p>
                  <button
                    onClick={() => onRemove(item.service)}
                    className="p-1 -mr-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-card-bg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove"
                    aria-label={`Remove ${item.service.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {item.addons.length > 0 && (
                  <ul className="mt-2 ml-11 pl-3 border-l border-border-light space-y-1">
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

        {/* Footer */}
        <div className="border-t border-border-light bg-surface/30 px-5 py-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.12em]">
                Total
              </p>
              <p className="mt-1 text-[26px] font-bold text-foreground tabular-nums leading-none">
                ${totalPrice}
              </p>
            </div>
            {dueToday > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-medium text-text-tertiary">Due today</p>
                <p className="text-[13px] font-semibold text-foreground tabular-nums">
                  ${dueToday}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onContinue}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] shadow-[0_8px_18px_-12px_rgba(0,0,0,0.35)]"
            style={{ backgroundColor: primaryColor }}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
