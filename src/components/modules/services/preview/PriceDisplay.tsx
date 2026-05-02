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
  const { price, max, struckThrough } = displayPrice(service);
  // With a range, "From" is implied by the dash — a "From $X–$Y" reads as a
  // double-hedge. Drop the prefix when max is present.
  const showFrom = isFromPriced(service) && max == null;
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
      <span>
        ${price}
        {max != null && `–$${max}`}
      </span>
    </div>
  );
}
