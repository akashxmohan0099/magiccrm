"use client";

import { motion } from "framer-motion";

interface ToggleCardProps {
  label: string;
  description?: string;
  active: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}

export function ToggleCard({ label, description, active, onToggle, icon }: ToggleCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        active
          ? "border-foreground/20 bg-surface shadow-sm"
          : "border-border-light bg-card-bg hover:border-border-light"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <motion.div
            className={`p-2 rounded-lg transition-colors ${
              active ? "bg-foreground/10 text-foreground" : "bg-surface text-text-secondary"
            }`}
            animate={{ scale: active ? 1.05 : 1 }}
          >
            {icon}
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`font-medium tracking-tight text-foreground`}>
              {label}
            </span>
            <div
              className={`w-11 h-6 rounded-full transition-all duration-200 flex items-center ${
                active ? "bg-foreground justify-end" : "bg-border-light justify-start"
              }`}
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5"
              />
            </div>
          </div>
          {description && (
            <p className="text-[13px] text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
