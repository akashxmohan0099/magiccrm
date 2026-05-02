"use client";

import { motion, useReducedMotion } from "framer-motion";

export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Stagger offset (seconds). Capped at 0.06s so the page never feels
   *  laggy — a long stagger trades polish for perceived load delay. */
  delay?: number;
}) {
  // Honor system "reduce motion" — the section just appears, no fade.
  const reduced = useReducedMotion();
  const cappedDelay = Math.min(delay, 0.06);
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: 0.18, delay: cappedDelay, ease: [0.25, 0.1, 0.25, 1] }
      }
      className="bg-card-bg border border-border-light rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-text-secondary" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}
