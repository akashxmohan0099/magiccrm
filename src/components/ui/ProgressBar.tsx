"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] font-medium text-text-secondary">
          Step {current} of {total}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-border-light">
            {i < current && (
              <motion.div
                className="h-full bg-foreground rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut", delay: i * 0.05 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
