"use client";

import { Building2, MapPin } from "lucide-react";
import type { PublicLocation } from "./types";

interface Props {
  locations: PublicLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Customer-facing location selector. Only mounted when the workspace has 2+
 * enabled locations — single-location workspaces silently auto-select.
 * Studio locations show their address; mobile locations show a "we travel
 * to you" hint instead.
 */
export function LocationPicker({ locations, selectedId, onSelect }: Props) {
  return (
    <div className="bg-card-bg border border-border-light rounded-2xl p-4 sm:p-5 mb-4">
      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">
        Where would you like your appointment?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {locations.map((loc) => {
          const Icon = loc.kind === "mobile" ? MapPin : Building2;
          const active = loc.id === selectedId;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelect(loc.id)}
              className={`flex items-start gap-3 px-3 py-3 rounded-xl text-left border transition cursor-pointer ${
                active
                  ? "bg-primary/5 border-primary"
                  : "bg-surface border-border-light hover:border-border"
              }`}
            >
              <div
                className={`mt-0.5 flex-none w-8 h-8 rounded-lg flex items-center justify-center ${
                  active ? "bg-primary text-white" : "bg-card-bg text-text-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {loc.name}
                </p>
                <p className="text-[12px] text-text-tertiary truncate">
                  {loc.kind === "mobile"
                    ? "We travel to you"
                    : loc.address || "Studio appointment"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
