"use client";

import { Info } from "lucide-react";

/**
 * Tiny info "ⓘ" with a hover tooltip. Use sparingly — only for fields whose
 * meaning isn't obvious from the label.
 *
 * Centered tooltips clip when the icon is near a drawer / panel edge, so the
 * tooltip is anchored to one side of the icon and extends inward:
 *   - `align="left"`  (default) — tooltip's left edge aligns with the icon,
 *                                 extends rightward. Use for icons in the
 *                                 left half of a container.
 *   - `align="right"` — tooltip's right edge aligns with the icon, extends
 *                       leftward. Use for icons in the right half.
 */
export function InfoHint({
  text,
  align = "left",
  className = "",
}: {
  text: string;
  align?: "left" | "right";
  className?: string;
}) {
  const anchor = align === "right" ? "right-0" : "left-0";
  return (
    <span className={`relative inline-flex items-center group align-middle ${className}`}>
      <Info className="w-3 h-3 text-text-tertiary cursor-help" aria-label={text} />
      <span
        role="tooltip"
        className={`pointer-events-none invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute bottom-full ${anchor} mb-1.5 px-2 py-1.5 bg-foreground text-surface text-[11px] leading-snug rounded shadow-md w-[200px] whitespace-normal text-left font-normal normal-case tracking-normal z-50 transition-opacity`}
      >
        {text}
      </span>
    </span>
  );
}
