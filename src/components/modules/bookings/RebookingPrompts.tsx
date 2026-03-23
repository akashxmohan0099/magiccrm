"use client";

import { useEffect } from "react";
import { CalendarPlus, Clock, X, Bell } from "lucide-react";
import { useRebookingStore } from "@/store/rebooking";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { Button } from "@/components/ui/Button";

function daysSince(dateStr: string): number {
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

function RebookingPromptsInner() {
  const { prompts, generatePrompts, snoozePrompt, dismissPrompt, markBooked } =
    useRebookingStore();

  useEffect(() => {
    generatePrompts();
  }, [generatePrompts]);

  const pending = prompts.filter((p) => p.status === "pending");

  if (pending.length === 0) return null;

  return (
    <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
          Rebooking Suggestions
        </h3>
        <span className="ml-1 px-1.5 py-0.5 text-[11px] font-medium bg-primary/10 text-primary rounded-full">
          {pending.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {pending.map((prompt) => {
          const days = daysSince(prompt.lastBookingDate);
          return (
            <div
              key={prompt.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border-light bg-surface hover:bg-surface/80 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">
                  {prompt.clientName}
                </p>
                <p className="text-[12px] text-text-secondary truncate">
                  {prompt.serviceName}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                    <Clock className="w-3 h-3" />
                    Last visit: {days} day{days !== 1 ? "s" : ""} ago
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    Suggested rebook:{" "}
                    {new Date(prompt.suggestedRebookDate + "T00:00:00").toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-3 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => markBooked(prompt.id)}
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                  Book Now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => snoozePrompt(prompt.id, 7)}
                >
                  Snooze 7d
                </Button>
                <button
                  type="button"
                  onClick={() => dismissPrompt(prompt.id)}
                  className="p-1.5 rounded-md text-text-tertiary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RebookingPrompts() {
  return (
    <FeatureSection
      moduleId="bookings-calendar"
      featureId="rebooking-prompts"
      featureLabel="Automated Rebooking"
    >
      <RebookingPromptsInner />
    </FeatureSection>
  );
}
