"use client";

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface InlineDropdownOption {
  value: string;
  label: string;
  /** Optional Tailwind class for a colored dot (e.g. status pills). */
  dot?: string;
  /** Optional muted suffix shown after the label (e.g. "(legacy)"). */
  suffix?: string;
}

/** A trailing affordance like "Custom..." that runs a callback rather than
 *  saving a value. Renders below the options separated by a divider. */
export interface InlineDropdownAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
}

interface InlineDropdownProps {
  value: string;
  options: InlineDropdownOption[];
  onChange: (next: string) => void;
  /** Visible content shown in the cell when the dropdown is closed. */
  children: ReactNode;
  /** Optional empty-state option (e.g. "— Not set —"). */
  placeholder?: string;
  /** Aligns the menu's start edge with the trigger's left ("start") or right ("end"). */
  align?: "start" | "end";
  /** ARIA label for the trigger. */
  ariaLabel?: string;
  /** Class name applied to the trigger button (lets the caller style hover etc.). */
  triggerClassName?: string;
  /** Optional trailing action (e.g. "Custom..."). */
  actionItem?: InlineDropdownAction;
  /** Optional small heading shown above the options (e.g. "Services"). */
  menuHeading?: string;
}

/**
 * Click-to-edit inline dropdown. Looks like a styled menu that fits the
 * platform — not the native OS select. Renders the menu via a portal with
 * fixed positioning so it can escape table-cell overflow.
 *
 * The trigger stops click propagation so cells in clickable rows don't
 * also fire row-level handlers.
 */
export function InlineDropdown({
  value,
  options,
  onChange,
  children,
  placeholder,
  align = "start",
  ariaLabel,
  triggerClassName,
  actionItem,
  menuHeading,
}: InlineDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    minWidth: 220,
    maxHeight: 340,
  });

  // Position the menu relative to the trigger. Two passes:
  //   1. On open, place below using an estimated height (340 = the max-h cap)
  //      so the first paint is roughly correct.
  //   2. Once the menu mounts and we can measure its real height, flip above
  //      if there isn't room below — and clamp max-height to the available
  //      space so we never extend past the viewport.
  // Done in a layout effect so the menu paints in the right place before the
  // browser commits the frame (no flicker).
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const GAP = 6;
    const VIEWPORT_MARGIN = 8;
    const ESTIMATED_HEIGHT = 340;
    const measuredHeight = menuRef.current?.getBoundingClientRect().height ?? ESTIMATED_HEIGHT;

    const spaceBelow = window.innerHeight - r.bottom - VIEWPORT_MARGIN;
    const spaceAbove = r.top - VIEWPORT_MARGIN;
    // Flip above only when there's genuinely not enough room below AND there's
    // more room above. Avoids flipping for short menus that already fit.
    const placeAbove = measuredHeight + GAP > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, placeAbove ? spaceAbove - GAP : spaceBelow - GAP);

    setCoords({
      top: placeAbove
        ? Math.max(VIEWPORT_MARGIN, r.top - Math.min(measuredHeight, maxHeight) - GAP)
        : r.bottom + GAP,
      left: align === "end" ? r.right : r.left,
      minWidth: Math.max(r.width, 220),
      maxHeight,
    });
  }, [open, align]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={`inline-flex items-center gap-1 cursor-pointer ${triggerClassName ?? ""}`}
      >
        {children}
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: coords.top,
              left: align === "end" ? undefined : coords.left,
              right: align === "end" ? `calc(100vw - ${coords.left}px)` : undefined,
              minWidth: coords.minWidth,
              maxHeight: coords.maxHeight,
            }}
            className="z-[80] bg-card-bg border border-border-light rounded-2xl shadow-xl shadow-black/12 py-2 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {menuHeading && (
              <div className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                {menuHeading}
              </div>
            )}
            {placeholder !== undefined && (
              <DropdownItem
                selected={value === ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <span className="text-text-tertiary italic">{placeholder}</span>
              </DropdownItem>
            )}
            {options.map((opt) => (
              <DropdownItem
                key={opt.value}
                selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.dot && (
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                )}
                <span className="truncate">{opt.label}</span>
                {opt.suffix && (
                  <span className="text-text-tertiary text-[12px] ml-1">{opt.suffix}</span>
                )}
              </DropdownItem>
            ))}
            {actionItem && (
              <>
                <div className="my-1.5 mx-2 border-t border-border-light" />
                <button
                  type="button"
                  onClick={() => {
                    actionItem.onClick();
                    setOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[14px] flex items-center gap-2.5 text-primary hover:bg-primary/5 transition-colors cursor-pointer font-medium"
                >
                  <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    {actionItem.icon ?? <span className="text-[16px] leading-none">+</span>}
                  </span>
                  {actionItem.label}
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function DropdownItem({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 text-[14px] flex items-center gap-2.5 hover:bg-surface transition-colors cursor-pointer rounded-lg mx-1 ${
        selected ? "font-semibold text-foreground" : "text-text-secondary"
      }`}
    >
      <Check className={`w-4 h-4 flex-shrink-0 ${selected ? "opacity-100 text-primary" : "opacity-0"}`} />
      {children}
    </button>
  );
}
