"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Card wrapper with a clickable header. Optional inline action (e.g. a checkbox)
// stays clickable without toggling the section.
export function Section({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
      <div className="flex items-center px-4 py-3 gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          )}
          <span className="text-[13px] font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="text-[11px] font-medium text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
          {subtitle && !open && (
            <span className="text-[12px] text-text-tertiary truncate">· {subtitle}</span>
          )}
        </button>
        {action && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border-light bg-surface/30">
          {children}
        </div>
      )}
    </div>
  );
}
