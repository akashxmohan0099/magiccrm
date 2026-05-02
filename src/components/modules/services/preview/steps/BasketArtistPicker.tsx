"use client";

import { Users } from "lucide-react";
import type { Service, TeamMember } from "@/types/models";
import { CartArtistPicker } from "../CartArtistPicker";
import { nameColor } from "../helpers";

export function BasketArtistPicker({
  eligible,
  primaryColor,
  basketServices,
  activeMembers,
  getServiceMembers,
  perServiceMode,
  perServiceArtistIds,
  onTogglePerService,
  onChangeItemArtist,
  onPick,
  onContinuePerService,
  onBackToMenu,
}: {
  eligible: TeamMember[];
  primaryColor: string;
  basketServices: Service[];
  activeMembers: TeamMember[];
  getServiceMembers: (id: string) => string[];
  perServiceMode: boolean;
  perServiceArtistIds: Record<string, string | null>;
  onTogglePerService: () => void;
  onChangeItemArtist: (serviceId: string, artistId: string | null) => void;
  onPick: (m: TeamMember | null) => void;
  onContinuePerService: () => void;
  onBackToMenu: () => void;
}) {
  const basketSize = basketServices.length;
  const canPickPerService = basketSize >= 2;
  const continueGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`;

  // Per-service mode — one stylist row per cart item, with a Continue button.
  if (perServiceMode && canPickPerService) {
    return (
      <div className="space-y-2.5">
        <div className="bg-card-bg border border-border-light rounded-3xl p-5">
          <p className="text-[12px] text-text-tertiary text-center mb-4">
            Pick a stylist for each service
          </p>
          <ul className="space-y-3">
            {basketServices.map((svc) => (
              <li key={svc.id} className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {svc.name}
                </p>
                <CartArtistPicker
                  service={svc}
                  artistId={perServiceArtistIds[svc.id] ?? null}
                  activeMembers={activeMembers}
                  getServiceMembers={getServiceMembers}
                  onChange={(id) => onChangeItemArtist(svc.id, id)}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center pt-1">
          <button
            onClick={onTogglePerService}
            className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer underline underline-offset-2"
          >
            Use one stylist for everything
          </button>
        </div>
        <button
          onClick={onContinuePerService}
          className="w-full py-3 rounded-2xl text-[13px] font-semibold text-white cursor-pointer transition-all hover:opacity-90 hover:-translate-y-px shadow-[0_8px_20px_-8px_rgba(0,0,0,0.25)]"
          style={{ backgroundImage: continueGradient }}
        >
          Continue
        </button>
      </div>
    );
  }

  // Empty intersection — at least one service in the basket is restricted
  // to a set of artists that doesn't overlap with the others. Surface this
  // explicitly instead of silently leaving the user with no options.
  if (eligible.length === 0) {
    return (
      <div className="bg-card-bg border border-amber-200 rounded-3xl p-6 text-center space-y-3">
        <div
          className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: "#fef3c7" }}
        >
          <Users className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-foreground">No single artist can do all of these</h3>
          <p className="text-[13px] text-text-secondary mt-1.5 leading-snug max-w-md mx-auto">
            Pick a different stylist for each service, or remove a service to keep one artist on the booking.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            onClick={onTogglePerService}
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-white cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            Pick per service
          </button>
          <button
            onClick={onBackToMenu}
            className="px-5 py-2 rounded-full text-[13px] font-semibold text-foreground bg-surface hover:bg-card-bg border border-border-light cursor-pointer"
          >
            Back to services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={() => onPick(null)}
        className="w-full bg-card-bg border border-border-light rounded-2xl p-4 flex items-center gap-3 text-left hover:border-foreground/20 transition-colors cursor-pointer"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Users className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-foreground">No preference</p>
          <p className="text-[12px] text-text-tertiary">We&apos;ll match you with the next available artist</p>
        </div>
      </button>
      {eligible.map((m) => (
        <button
          key={m.id}
          onClick={() => onPick(m)}
          className="w-full bg-card-bg border border-border-light rounded-2xl p-4 flex items-center gap-3 text-left hover:border-foreground/20 transition-colors cursor-pointer"
        >
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatarUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold text-foreground/70"
              style={{ backgroundColor: nameColor(m.name) }}
            >
              {m.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-foreground">{m.name}</p>
            <p className="text-[12px] text-text-tertiary capitalize">{m.role}</p>
          </div>
        </button>
      ))}

      {canPickPerService && (
        <div className="text-center pt-2">
          <button
            onClick={onTogglePerService}
            className="text-[12px] font-medium text-text-secondary hover:text-foreground cursor-pointer underline underline-offset-2"
          >
            Different stylists for each service?
          </button>
        </div>
      )}
    </div>
  );
}
