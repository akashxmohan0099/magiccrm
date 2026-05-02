"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import type { Suggestion } from "@/types/models";
import { useSuggestionsStore } from "@/store/suggestions";

interface Props {
  suggestions: Suggestion[];
  onAct: (suggestion: Suggestion) => void;
  /** Optional callback when the user clicks "open calendar" / "open clients" secondary actions. */
  onSecondary?: (suggestion: Suggestion) => void;
  /**
   * Override the empty-state copy. Defaults to the on-track variant; the
   * rail passes a "workspace-only" variant when scoped to a single staff
   * (suggestions are not generated in that mode).
   */
  emptyState?: { title: string; subtitle?: string };
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-primary",
  low: "bg-text-tertiary",
};

export function SuggestionsCard({ suggestions, onAct, onSecondary, emptyState }: Props) {
  const empty = emptyState ?? {
    title: "You're on top of things.",
    subtitle: "New suggestions will appear here as your week unfolds.",
  };

  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-4">
      <p className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase mb-3">
        Suggestions
      </p>

      {suggestions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[13px] text-text-secondary">{empty.title}</p>
          {empty.subtitle && (
            <p className="text-[12px] text-text-tertiary mt-0.5">{empty.subtitle}</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {suggestions.map((s) => (
            <li key={s.id}>
              <SuggestionItem
                suggestion={s}
                onAct={() => onAct(s)}
                onSecondary={onSecondary ? () => onSecondary(s) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SuggestionItem({
  suggestion,
  onAct,
  onSecondary,
}: {
  suggestion: Suggestion;
  onAct: () => void;
  onSecondary?: () => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const dismiss = useSuggestionsStore((s) => s.dismiss);
  const snooze = useSuggestionsStore((s) => s.snooze);

  const actLabel = primaryActionLabel(suggestion);
  const dot = PRIORITY_DOT[suggestion.priority] ?? "bg-text-tertiary";

  return (
    <div className="bg-surface border border-border-light rounded-lg p-3">
      <div className="flex items-start gap-2">
        <span
          className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground leading-snug">{suggestion.title}</p>
          <p className="text-[12px] text-text-secondary mt-0.5 leading-snug">{suggestion.body}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss suggestion"
          className="text-text-tertiary hover:text-foreground transition-colors p-0.5"
          onClick={() => dismiss(suggestion.triggerKey)}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWhyOpen((v) => !v)}
          className="inline-flex items-center gap-0.5 text-[11px] text-text-tertiary hover:text-foreground transition-colors"
        >
          Why?
          {whyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => snooze(suggestion.triggerKey, snoozeUntil(24))}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:text-foreground rounded transition-colors"
            title="Snooze 24 hours"
          >
            <Clock className="w-3 h-3" />
            Later
          </button>
          {onSecondary && suggestion.secondaryAction && (
            <button
              type="button"
              onClick={onSecondary}
              className="px-2 py-1 text-[11px] text-text-secondary hover:text-foreground rounded transition-colors"
            >
              {secondaryActionLabel(suggestion)}
            </button>
          )}
          <button
            type="button"
            onClick={onAct}
            className="px-3 py-1.5 text-[12px] font-medium text-white bg-foreground rounded-md hover:bg-foreground/90 transition-colors"
          >
            {actLabel}
          </button>
        </div>
      </div>

      {whyOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-border-light">
          <p className="text-[12px] text-text-secondary">{suggestion.reasonSummary}</p>
          {suggestion.reasonDetails && suggestion.reasonDetails.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {suggestion.reasonDetails.map((d, i) => (
                <li
                  key={i}
                  className="text-[11px] text-text-tertiary leading-snug pl-3 relative before:content-['•'] before:absolute before:left-0"
                >
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function primaryActionLabel(s: Suggestion): string {
  switch (s.primaryAction.kind) {
    case "send_message":
      return "Send";
    case "open_calendar":
      return "Open day";
    case "open_booking":
      return "Open booking";
    case "open_clients":
      return "Open list";
    case "collect_deposit":
      return "Collect deposit";
  }
}

function secondaryActionLabel(s: Suggestion): string {
  switch (s.secondaryAction?.kind) {
    case "open_calendar":
      return "View day";
    case "open_clients":
      return "View clients";
    case "open_booking":
      return "View booking";
    default:
      return "View";
  }
}

function snoozeUntil(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}
