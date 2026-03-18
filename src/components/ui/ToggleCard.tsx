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
      whileTap={{ scale: 0.99 }}
      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
        active
          ? "border-brand bg-brand-light shadow-sm"
          : "border-border-warm bg-card-bg hover:border-[#D4CDB8]"
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`p-2 rounded-lg ${
              active ? "bg-[#FFF0CC] text-brand" : "bg-surface text-text-secondary"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`font-medium tracking-tight ${active ? "text-foreground" : "text-foreground"}`}>
              {label}
            </span>
            <div
              className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center ${
                active ? "bg-brand justify-end" : "bg-border-warm justify-start"
              }`}
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5"
              />
            </div>
          </div>
          {description && (
            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
