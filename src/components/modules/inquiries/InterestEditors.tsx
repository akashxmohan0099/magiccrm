"use client";

import { useState, useMemo } from "react";
import type { Inquiry } from "@/types/models";
import { useInquiriesStore } from "@/store/inquiries";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { InlineDropdown } from "@/components/ui/InlineDropdown";

// Inline-editable Interest cell — click to pick a service from a styled
// dropdown, or pick "Custom..." to type a one-off value. stopPropagation
// in the dropdown keeps the row's slide-over from opening when the user
// is just changing the value.
export function InlineInterestCell({ inquiry }: { inquiry: Inquiry }) {
  const services = useServicesStore((s) => s.services);
  const { updateInquiry } = useInquiriesStore();
  const { workspaceId } = useAuth();
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const options = useMemo(() => {
    // Show every service in the store. The Services page has no UI to
    // toggle `enabled`, and the DB column is nullable so legacy rows may
    // come back with null — filtering on it just hides services from
    // operators with no way to fix it.
    const all = [...services]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ value: s.name, label: s.name }));
    const current = inquiry.serviceInterest || "";
    const isCustom =
      current && !all.some((o) => o.value === current);
    return [
      ...all,
      ...(isCustom ? [{ value: current, label: current, suffix: "(custom)" }] : []),
    ];
  }, [services, inquiry.serviceInterest]);

  const save = (next: string) => {
    updateInquiry(
      inquiry.id,
      { serviceInterest: next || undefined },
      workspaceId || undefined,
    );
  };

  if (customMode) {
    return (
      <input
        autoFocus
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            save(customValue.trim());
            setCustomMode(false);
          } else if (e.key === "Escape") {
            setCustomMode(false);
          }
        }}
        onBlur={() => {
          if (customValue.trim()) save(customValue.trim());
          setCustomMode(false);
        }}
        placeholder="Type a custom interest…"
        className="w-full max-w-[220px] px-2 py-1 bg-card-bg border border-primary/40 rounded-md text-[13px] text-foreground outline-none focus:border-primary"
      />
    );
  }

  const display = inquiry.serviceInterest || inquiry.eventType || "—";

  return (
    <InlineDropdown
      ariaLabel="Edit interest"
      value={inquiry.serviceInterest || ""}
      options={options}
      placeholder="— Not set —"
      menuHeading={services.length > 0 ? "Services" : undefined}
      onChange={save}
      actionItem={{
        label: "Custom…",
        onClick: () => {
          setCustomValue(inquiry.serviceInterest && !options.some((o) => o.value === inquiry.serviceInterest) ? inquiry.serviceInterest : "");
          setCustomMode(true);
        },
      }}
      triggerClassName="rounded px-1 -mx-1 py-0.5 hover:bg-surface/60 transition-colors"
    >
      <span className="text-[13px] text-text-secondary">{display}</span>
    </InlineDropdown>
  );
}

// Interest row — editable services dropdown for the sidebar. Mirrors
// InlineInterestCell so the table and detail panel stay in sync.
export function InterestRow({ inquiry }: { inquiry: Inquiry }) {
  const services = useServicesStore((s) => s.services);
  const { updateInquiry } = useInquiriesStore();
  const { workspaceId } = useAuth();
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const options = useMemo(() => {
    const all = [...services]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ value: s.name, label: s.name }));
    const current = inquiry.serviceInterest || "";
    const isCustom = current && !all.some((o) => o.value === current);
    return [
      ...all,
      ...(isCustom ? [{ value: current, label: current, suffix: "(custom)" }] : []),
    ];
  }, [services, inquiry.serviceInterest]);

  const save = (next: string) => {
    updateInquiry(
      inquiry.id,
      { serviceInterest: next || undefined },
      workspaceId || undefined,
    );
  };

  const current = inquiry.serviceInterest || "";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-text-tertiary flex-shrink-0">Interest</span>
      {customMode ? (
        <input
          autoFocus
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              save(customValue.trim());
              setCustomMode(false);
            } else if (e.key === "Escape") {
              setCustomMode(false);
            }
          }}
          onBlur={() => {
            if (customValue.trim()) save(customValue.trim());
            setCustomMode(false);
          }}
          placeholder="Type a custom interest…"
          className="flex-1 max-w-[60%] px-2.5 py-1.5 bg-card-bg border border-primary/40 rounded-lg text-[13px] text-foreground outline-none focus:border-primary"
        />
      ) : (
        <InlineDropdown
          ariaLabel="Edit interest"
          align="end"
          value={current}
          options={options}
          placeholder="— Not set —"
          menuHeading={services.length > 0 ? "Services" : undefined}
          onChange={save}
          actionItem={{
            label: "Custom…",
            onClick: () => {
              setCustomValue(current && !options.some((o) => o.value === current) ? current : "");
              setCustomMode(true);
            },
          }}
          triggerClassName="px-2.5 py-1.5 bg-card-bg border border-border-light rounded-lg hover:border-foreground/30 transition-colors"
        >
          <span className="text-[13px] text-foreground">
            {current || <span className="text-text-tertiary italic">— Not set —</span>}
          </span>
        </InlineDropdown>
      )}
    </div>
  );
}
