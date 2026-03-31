"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle, UserMinus, CalendarClock, Target, CalendarX, Trophy,
  X, Lightbulb, Check,
} from "lucide-react";
import { useNudges } from "@/hooks/useNudges";
import type { NudgeType } from "@/lib/nudge-engine";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertCircle,
  UserMinus,
  CalendarClock,
  Target,
  CalendarX,
  Trophy,
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "border-l-red-400 bg-red-500/5",
  2: "border-l-amber-400 bg-amber-500/5",
  3: "border-l-blue-400 bg-blue-500/5",
  5: "border-l-emerald-400 bg-emerald-500/5",
};

const ICON_BG: Record<number, string> = {
  1: "bg-red-500/10 text-red-500",
  2: "bg-amber-500/10 text-amber-600",
  3: "bg-blue-500/10 text-blue-500",
  5: "bg-emerald-500/10 text-emerald-600",
};

export function NudgeWidget() {
  const { nudges, dismiss } = useNudges();

  if (nudges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="text-xs text-text-tertiary mt-0.5">No actions needed right now.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-text-tertiary" />
        <span className="text-[11px] text-text-tertiary font-medium">Smart Nudges</span>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-bold">
          {nudges.length}
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {nudges.map((nudge) => {
            const Icon = ICONS[nudge.icon] || Lightbulb;
            const colorClass = PRIORITY_COLORS[nudge.priority] || PRIORITY_COLORS[3];
            const iconClass = ICON_BG[nudge.priority] || ICON_BG[3];

            return (
              <motion.div
                key={nudge.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border-l-[3px] ${colorClass}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground leading-tight">{nudge.title}</p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug">{nudge.description}</p>
                  {nudge.action && (
                    <div className="mt-1.5">
                      {nudge.action.onAction ? (
                        <button
                          onClick={() => {
                            nudge.action!.onAction!();
                            dismiss(nudge.id);
                          }}
                          className="text-[11px] font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                        >
                          {nudge.action.label}
                        </button>
                      ) : nudge.action.href ? (
                        <Link
                          href={nudge.action.href}
                          className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          {nudge.action.label}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => dismiss(nudge.id)}
                  className="p-1 text-text-tertiary hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
