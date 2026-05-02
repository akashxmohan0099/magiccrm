"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function PillOption({
  label,
  selected,
  onClick,
  index = 0,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  index?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1, scale: 1.005 }}
      whileTap={{ scale: 0.985 }}
      className={`w-full px-5 py-3.5 rounded-full cursor-pointer flex items-center justify-between gap-3 transition-colors duration-200 ${
        selected
          ? "bg-primary text-white shadow-[0_4px_16px_-4px] shadow-primary/30"
          : "bg-background border-2 border-border-light text-foreground hover:border-foreground/30 hover:shadow-sm"
      }`}
    >
      <span
        className={`text-[13px] ${
          selected ? "font-semibold" : "font-medium"
        }`}
      >
        {label}
      </span>
      <motion.div
        animate={{ scale: selected ? 1 : 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors duration-200 ${
          selected ? "bg-white/25" : "border-2 border-border-light"
        }`}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 18 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.span>
        )}
      </motion.div>
    </motion.button>
  );
}
