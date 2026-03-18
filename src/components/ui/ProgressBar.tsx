"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2.5">
        <span className="text-[13px] font-medium text-text-secondary">
          Step {current} of {total}
        </span>
        <span className="text-[13px] font-semibold text-brand">{percentage}%</span>
      </div>
      <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#FFE072] to-[#D4A017] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
