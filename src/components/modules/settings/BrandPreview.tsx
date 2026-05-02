"use client";

import { Sparkles } from "lucide-react";
import { getContrastColor } from "./general-helpers";

export function BrandPreview({ brandColor }: { brandColor: string }) {
  const contrastColor = getContrastColor(brandColor);

  return (
    <div className="border border-border-light rounded-xl p-5 bg-surface/50">
      <p className="text-xs font-medium text-text-tertiary mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Live preview
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className="px-5 py-2 rounded-full text-xs font-semibold transition-colors"
            style={{ backgroundColor: brandColor, color: contrastColor }}
          >
            Send Invoice
          </span>
          <span
            className="px-5 py-2 rounded-full text-xs font-semibold border transition-colors"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            View Details
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: brandColor + "18", color: brandColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
            Active
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: brandColor + "18", color: brandColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
            Confirmed
          </span>
        </div>
        <p className="text-sm font-bold tracking-tight" style={{ color: brandColor }}>
          Dashboard Heading
        </p>
      </div>
    </div>
  );
}
