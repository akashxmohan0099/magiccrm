"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Clock, ExternalLink, Plus } from "lucide-react";

interface DayActionPopoverProps {
  open: boolean;
  date: string | null;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onOpenDay: () => void;
  onAddBooking: () => void;
  onCloseDay: () => void;
  onEditHours: () => void;
}

export function DayActionPopover({
  open,
  date,
  anchorRect,
  onClose,
  onOpenDay,
  onAddBooking,
  onCloseDay,
  onEditHours,
}: DayActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // Defer to next tick so the click that opened the popover doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener("mousedown", onDocClick), 0);
    document.addEventListener("keydown", onEsc);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!date || !anchorRect) return null;

  const label = formatDayLabel(date);
  // Position below the anchor; clamp both edges to the viewport so a click
  // on Saturday in the week view doesn't push the popover off-screen.
  const POPOVER_WIDTH = 240;
  const VIEWPORT_PADDING = 8;
  const top = anchorRect.bottom + 6;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : POPOVER_WIDTH;
  const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - POPOVER_WIDTH - VIEWPORT_PADDING);
  const left = Math.min(Math.max(VIEWPORT_PADDING, anchorRect.left), maxLeft);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12 }}
          role="menu"
          className="fixed z-[80] w-[240px] bg-card-bg border border-border-light rounded-xl shadow-xl shadow-black/8 overflow-hidden"
          style={{ top, left }}
        >
          <div className="px-3 py-2 border-b border-border-light">
            <p className="text-[12px] font-semibold text-foreground">{label}</p>
          </div>
          <div className="py-1">
            <Item icon={<ExternalLink className="w-3.5 h-3.5" />} onClick={onOpenDay}>
              Open day
            </Item>
            <Item icon={<Plus className="w-3.5 h-3.5" />} onClick={onAddBooking}>
              Add booking
            </Item>
            <Item icon={<Clock className="w-3.5 h-3.5" />} onClick={onEditHours}>
              Block off time
            </Item>
            <Item
              icon={<CalendarOff className="w-3.5 h-3.5" />}
              onClick={onCloseDay}
              variant="danger"
            >
              Close this day
            </Item>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Item({
  icon,
  onClick,
  children,
  variant = "default",
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors ${
        variant === "danger"
          ? "text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          : "text-foreground hover:bg-surface"
      }`}
    >
      <span className="text-text-tertiary">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}
