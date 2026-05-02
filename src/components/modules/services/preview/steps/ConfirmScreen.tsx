"use client";

import { Check, Calendar as CalendarIcon } from "lucide-react";
import type { Service, ServiceAddon, TeamMember } from "@/types/models";
import type { FlowState } from "../types";
import { chainItems, formatDate, minutesToHHMM } from "../helpers";

export function ConfirmScreen({
  items,
  totalPrice,
  totalDuration,
  flow,
  businessName,
  primaryColor,
  members,
  onReset,
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
  flow: FlowState;
  businessName: string;
  primaryColor: string;
  members: TeamMember[];
  onReset: () => void;
}) {
  if (items.length === 0) return null;
  // Any service in the basket flagged "requires confirmation" puts the
  // whole booking into pending state. The PRD §5.1 calls this out — the
  // copy and tone need to match what actually happened on the back end.
  const needsApproval = items.some((i) => i.service.requiresConfirmation);
  return (
    <div className="text-center py-6 space-y-5">
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{
          backgroundColor: needsApproval ? "#fef3c7" : `${primaryColor}20`,
          boxShadow: needsApproval ? "0 0 0 4px #fef3c780" : `0 0 0 4px ${primaryColor}1a`,
        }}
      >
        <Check
          className="w-8 h-8"
          style={{ color: needsApproval ? "#b45309" : primaryColor }}
        />
      </div>
      <div>
        <h3 className="text-[20px] font-bold text-foreground">
          {needsApproval ? "Request received" : "You're booked!"}
        </h3>
        <p className="text-[13px] text-text-secondary mt-1">
          {needsApproval
            ? `${businessName} will confirm your booking shortly. We'll email ${flow.email || "you"} as soon as it's approved.`
            : `A confirmation has been sent to ${flow.email || "your email"}.`}
        </p>
      </div>

      <div className="bg-card-bg border border-border-light rounded-2xl p-5 text-left space-y-3 max-w-md mx-auto">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary mb-1.5">
            {items.length === 1 ? "Service" : "Services"}
          </p>
          <ul className="space-y-2">
            {chainItems(items, flow.time).map(({ item, startAt }) => {
              const variant = item.variantId
                ? item.service.variants?.find((v) => v.id === item.variantId)
                : null;
              const artist = item.artistId
                ? members.find((m) => m.id === item.artistId)
                : null;
              const showArtist = flow.useArtistPerService;
              return (
                <li key={item.service.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-foreground truncate">
                      {showArtist && startAt !== null && (
                        <span className="text-text-tertiary font-normal tabular-nums mr-1.5">
                          {minutesToHHMM(startAt)}
                        </span>
                      )}
                      {item.service.name}
                      {variant && (
                        <span className="text-text-tertiary font-normal"> · {variant.name}</span>
                      )}
                    </span>
                    <span className="text-[12px] text-text-tertiary tabular-nums whitespace-nowrap">
                      {item.baseDuration} min · ${item.basePrice}
                    </span>
                  </div>
                  {showArtist && (
                    <p className="text-[11.5px] text-text-tertiary mt-0.5">
                      with {artist?.name ?? "any stylist"}
                    </p>
                  )}
                  {item.addons.length > 0 && (
                    <ul className="mt-1 ml-2 pl-3 border-l border-border-light space-y-0.5">
                      {item.addons.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-baseline justify-between gap-3 text-[12px]"
                        >
                          <span className="text-text-secondary truncate">+ {a.name}</span>
                          <span className="text-text-tertiary tabular-nums whitespace-nowrap">
                            {a.duration} min · +${a.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-light">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">When</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.date ? formatDate(flow.date) : "—"}
            </p>
            <p className="text-[12px] text-text-secondary tabular-nums">
              {flow.time} · {totalDuration} min
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">With</p>
            <p className="text-[14px] font-semibold text-foreground">
              {flow.artist?.name ?? "Any artist"}
            </p>
            <p className="text-[12px] text-text-secondary">{businessName}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border-light">
          <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Total</p>
          <p className="text-[16px] font-bold text-foreground tabular-nums">${totalPrice}</p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="text-[13px] font-medium text-text-secondary hover:text-foreground cursor-pointer flex items-center gap-1.5 mx-auto"
      >
        <CalendarIcon className="w-3.5 h-3.5" /> Book another
      </button>
    </div>
  );
}
