"use client";

import { motion } from "framer-motion";

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
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
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
