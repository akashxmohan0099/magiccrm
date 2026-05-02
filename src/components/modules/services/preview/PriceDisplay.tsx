"use client";

import type { Service } from "@/types/models";
import { displayPrice, isFromPriced } from "@/lib/services/price";

export function PriceDisplay({
  service,
  className = "",
}: {
  service: Service;
  className?: string;
}) {
  const { price, struckThrough } = displayPrice(service);
  const showFrom = isFromPriced(service);
  return (
    <div className={`flex items-baseline gap-1.5 tabular-nums whitespace-nowrap ${className}`}>
      {showFrom && (
        <span className="text-[10px] text-text-tertiary font-medium">From</span>
      )}
      {struckThrough != null && (
        <span className="text-[11px] text-text-tertiary font-medium line-through">
          ${struckThrough}
        </span>
      )}
      <span>${price}</span>
    </div>
  );
}
