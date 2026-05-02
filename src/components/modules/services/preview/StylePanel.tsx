"use client";

import { Check } from "lucide-react";
import { ColorField } from "@/components/ui/ColorField";
import { LogoUpload } from "@/components/ui/LogoUpload";
import { CoverImageUpload } from "@/components/ui/CoverImageUpload";
import {
  FontPairingPicker,
  type FontPairingId,
} from "@/components/ui/FontPairing";
import type { Layout } from "./types";

export function StylePanel({
  primaryColor,
  onPrimaryColorChange,
  logoUrl,
  onLogoUrlChange,
  coverImage,
  onCoverImageChange,
  fontPairing,
  onFontPairingChange,
  layout,
  onLayoutChange,
}: {
  primaryColor: string;
  onPrimaryColorChange: (hex: string) => void;
  logoUrl: string;
  onLogoUrlChange: (url: string) => void;
  coverImage: string;
  onCoverImageChange: (url: string) => void;
  fontPairing: string;
  onFontPairingChange: (id: FontPairingId) => void;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
}) {
  return (
    <div className="space-y-5">
      <ColorField
        label="Brand color"
        hint="Buttons, highlights, and selected states."
        value={primaryColor}
        onChange={onPrimaryColorChange}
      />

      <LogoUpload
        value={logoUrl}
        onChange={onLogoUrlChange}
        hint="Square image works best. Falls back to your business name initial."
      />

      <CoverImageUpload value={coverImage} onChange={onCoverImageChange} />

      <FontPairingPicker value={fontPairing} onChange={onFontPairingChange} />

      <div>
        <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          Layout
        </p>
        <div className="space-y-2">
          {(["classic", "compact", "grid"] as const).map((l) => {
            const selected = layout === l;
            return (
              <button
                key={l}
                onClick={() => onLayoutChange(l)}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border-light hover:border-foreground/20"
                }`}
              >
                <div className="w-14 flex-shrink-0">
                  <LayoutSwatch kind={l} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-foreground capitalize">{l}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {l === "classic" && "Image, info, price"}
                    {l === "compact" && "Tight list, no image"}
                    {l === "grid" && "Image-forward 2-col"}
                  </p>
                </div>
                {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LayoutSwatch({ kind }: { kind: Layout }) {
  if (kind === "compact") {
    return (
      <div className="h-12 bg-surface rounded space-y-1 p-1.5">
        <div className="h-1.5 bg-border-light rounded w-full" />
        <div className="h-1.5 bg-border-light rounded w-full" />
        <div className="h-1.5 bg-border-light rounded w-full" />
      </div>
    );
  }
  if (kind === "grid") {
    return (
      <div className="h-12 grid grid-cols-2 gap-1">
        <div className="bg-surface rounded" />
        <div className="bg-surface rounded" />
      </div>
    );
  }
  return (
    <div className="h-12 bg-surface rounded p-1.5 flex gap-1.5">
      <div className="w-6 h-full bg-border-light rounded" />
      <div className="flex-1 space-y-1 py-0.5">
        <div className="h-1.5 bg-border-light rounded w-3/4" />
        <div className="h-1 bg-border-light/60 rounded w-full" />
      </div>
    </div>
  );
}
