"use client";

import { useState } from "react";
import { Clock, Users, ChevronDown, ChevronRight } from "lucide-react";
import type { Service, TeamMember } from "@/types/models";
import { isPromoActive } from "@/lib/services/price";
import { PriceDisplay } from "./PriceDisplay";
import { AddPill } from "./AddPill";
import { ArtistChip } from "./ArtistChip";

// Default expanded card — image, description, providers reveal on click.
export function ServiceCardPreview({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
  hidePromoLabel = false,
}: {
  service: Service;
  providers: TeamMember[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
  hidePromoLabel?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initial = service.name.charAt(0).toUpperCase();
  const canExpand = !!service.description || providers.length > 0;

  return (
    <div
      onClick={canExpand ? () => setExpanded((v) => !v) : undefined}
      role={canExpand ? "button" : undefined}
      tabIndex={canExpand ? 0 : undefined}
      onKeyDown={(e) => {
        if (canExpand && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      className={`bg-card-bg border border-border-light rounded-3xl overflow-hidden transition-all shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.12)] ${
        canExpand ? "cursor-pointer" : ""
      } ${selected ? "" : "hover:border-foreground/20"}`}
      style={
        selected
          ? {
              boxShadow: `0 0 0 1.5px ${primaryColor}, 0 8px 24px -10px ${primaryColor}33`,
              backgroundImage: `linear-gradient(180deg, ${primaryColor}08 0%, transparent 60%)`,
            }
          : undefined
      }
    >
      <div className="p-4 flex items-center gap-4">
        {service.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}08 100%)`,
            }}
          >
            <span
              className={`text-[28px] font-light tracking-tight ${headingClass}`}
              style={{ color: `${primaryColor}` }}
            >
              {initial}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-[15px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
            {!hidePromoLabel && service.promoLabel && isPromoActive(service) && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {service.promoLabel}
              </span>
            )}
            {service.requiresConfirmation && (
              <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                By approval
              </span>
            )}
          </div>
          {service.description && !expanded && (
            <p className="text-[12px] text-text-secondary line-clamp-2 mb-1.5">{service.description}</p>
          )}
          <div className="flex items-center gap-3 text-[12px] text-text-tertiary">
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="w-3 h-3" /> {service.duration} min
            </span>
            {providers.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isAnyone ? "Any artist" : providers.length === 1 ? providers[0].name : `${providers.length} artists`}
              </span>
            )}
            {canExpand && (
              <span className="ml-auto text-text-tertiary" aria-hidden>
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <PriceDisplay service={service} className="text-[16px] font-bold text-foreground" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="cursor-pointer"
          >
            <AddPill selected={selected} primaryColor={primaryColor} />
          </button>
        </div>
      </div>

      {expanded && canExpand && (
        <div
          className="px-4 pb-4 pt-1 border-t border-border-light/60 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {service.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-3 mt-3">
              {service.description}
            </p>
          )}
          {providers.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-[0.1em] mb-2">
                {isAnyone
                  ? "Available with any of"
                  : `Available with ${providers.length === 1 ? "" : `${providers.length} `}artist${providers.length === 1 ? "" : "s"}`}
              </p>
              <div className="flex flex-wrap gap-2">
                {providers.map((m) => (
                  <ArtistChip key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact variant — single line per service, used in the dense layout option.
export function ServiceCardCompact({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
}: {
  service: Service;
  providers: { id: string; name: string }[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer ${
        selected ? "" : "hover:bg-surface/40"
      }`}
      style={selected ? { backgroundColor: `${primaryColor}10` } : undefined}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
        <div className="flex items-center gap-3 text-[12px] text-text-tertiary mt-0.5">
          <span className="tabular-nums flex items-center gap-1">
            <Clock className="w-3 h-3" /> {service.duration} min
          </span>
          {providers.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {isAnyone ? "Any" : providers.length === 1 ? providers[0].name : `${providers.length}`}
            </span>
          )}
        </div>
      </div>
      <PriceDisplay service={service} className="text-[14px] font-bold text-foreground flex-shrink-0" />
      <AddPill selected={selected} primaryColor={primaryColor} />
    </button>
  );
}

// Grid variant — square tile with image, used in the gallery layout option.
export function ServiceCardGrid({
  service,
  providers,
  isAnyone,
  primaryColor,
  selected,
  onToggle,
  headingClass = "",
}: {
  service: Service;
  providers: { id: string; name: string }[];
  isAnyone: boolean;
  primaryColor: string;
  selected: boolean;
  onToggle: () => void;
  headingClass?: string;
}) {
  const initial = service.name.charAt(0).toUpperCase();
  return (
    <button
      onClick={onToggle}
      className={`bg-card-bg border rounded-3xl overflow-hidden text-left transition-all cursor-pointer flex flex-col shadow-[0_4px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.12)] ${
        selected ? "border-2" : "border-border-light hover:border-foreground/20"
      }`}
      style={selected ? { borderColor: primaryColor } : undefined}
    >
      {service.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.imageUrl}
          alt={service.name}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div
          className="w-full aspect-square flex items-center justify-center text-4xl font-bold text-foreground/50"
          style={{
            backgroundImage: `linear-gradient(135deg, ${primaryColor}30 0%, ${primaryColor}10 100%)`,
          }}
        >
          {initial}
        </div>
      )}
      <div className="p-3 flex-1 flex flex-col">
        <p className={`text-[14px] font-semibold text-foreground truncate ${headingClass}`}>{service.name}</p>
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary mt-0.5">
          <span className="tabular-nums">{service.duration}min</span>
          <span>·</span>
          <span>
            {isAnyone ? "Any" : providers.length === 1 ? providers[0].name : `${providers.length}`}
          </span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <PriceDisplay service={service} className="text-[15px] font-bold text-foreground" />
          <AddPill selected={selected} primaryColor={primaryColor} />
        </div>
      </div>
    </button>
  );
}
