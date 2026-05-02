"use client";

import { motion } from "framer-motion";
import { Plus, Check, Clock, Package } from "lucide-react";
import type { PublicService } from "./types";
import {
  displayCardPrice,
  displayCardDuration,
  formatDuration,
  formatPrice,
  isPromoActive,
} from "./helpers";

interface ServiceCardProps {
  service: PublicService;
  selected: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

/**
 * Service card. Whole card is the click target. Selection state replaces
 * the "+" with a filled checkmark and lifts the border to the primary color.
 * The +/✓ icon also animates with a small scale pulse for tactile feedback.
 */
export function ServiceCard({ service, selected, onAdd, onRemove }: ServiceCardProps) {
  const handleClick = () => (selected ? onRemove() : onAdd());
  const { price, isFrom } = displayCardPrice(service);
  const promoActive = isPromoActive(service);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className={`group w-full text-left bg-card-bg rounded-2xl border transition-all cursor-pointer overflow-hidden ${
        selected
          ? "border-primary shadow-sm"
          : "border-border-light hover:border-foreground/15 hover:shadow-sm"
      }`}
    >
      {service.imageUrl ? (
        // Plain <img>: services may sit on third-party CDNs without next/image
        // domain config, and the booking page is unauthenticated.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.imageUrl}
          alt=""
          loading="lazy"
          className="w-full h-32 sm:h-36 object-cover"
        />
      ) : null}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[15px] font-semibold text-foreground leading-tight">
                {service.name}
              </p>
              {service.isPackage ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                  <Package className="w-3 h-3" />
                  Package
                </span>
              ) : null}
              {promoActive && service.promoLabel ? (
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {service.promoLabel}
                </span>
              ) : null}
              {service.allowGroupBooking ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  +{(service.maxGroupSize ?? 4) - 1} guests
                </span>
              ) : null}
              {service.tags?.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface text-text-tertiary border border-border-light"
                >
                  {t}
                </span>
              ))}
            </div>

            {service.description ? (
              <p className="text-[12px] text-text-secondary mt-1.5 line-clamp-2">
                {service.description}
              </p>
            ) : null}

            {service.isPackage && service.packageInclusions.length > 0 ? (
              <p className="text-[11px] text-text-tertiary mt-1.5">
                Includes:{" "}
                {service.packageInclusions
                  .map((inc) => {
                    const label = inc.variantName
                      ? `${inc.serviceName} (${inc.variantName})`
                      : inc.serviceName;
                    return inc.quantity > 1 ? `${label} ×${inc.quantity}` : label;
                  })
                  .join(", ")}
              </p>
            ) : null}

            <div className="flex items-center gap-3 mt-1.5 text-[12px] text-text-tertiary">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(displayCardDuration(service))}
              </span>
              <span className="text-text-tertiary/60">·</span>
              {promoActive && service.promoPrice != null ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="line-through text-text-tertiary">
                    {formatPrice(price)}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatPrice(service.promoPrice)}
                  </span>
                </span>
              ) : (
                <span className="font-medium text-foreground">
                  {isFrom && <span className="text-text-tertiary mr-1">From</span>}
                  {formatPrice(price)}
                </span>
              )}
            </div>
          </div>

          <motion.span
            key={selected ? "on" : "off"}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
              selected
                ? "bg-primary text-white"
                : "bg-surface text-text-secondary group-hover:text-foreground"
            }`}
            aria-hidden="true"
          >
            {selected ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
          </motion.span>
        </div>
      </div>
    </button>
  );
}
