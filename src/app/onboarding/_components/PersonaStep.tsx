"use client";

import { motion } from "framer-motion";
import { PERSONAS, type PersonaSlug } from "@/lib/onboarding-v2";

export function PersonaStep({
  selected,
  onSelect,
}: {
  selected: PersonaSlug | null;
  onSelect: (slug: PersonaSlug) => void;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        What do you do?
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Pick the one that fits best
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          const isSelected = selected === p.slug;
          return (
            <motion.button
              key={p.slug}
              onClick={() => onSelect(p.slug)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className={`text-left p-4 rounded-2xl border-2 cursor-pointer transition-colors duration-200 ${
                isSelected
                  ? "border-primary bg-primary/[0.06] shadow-[0_8px_24px_-8px] shadow-primary/25"
                  : "border-border-light bg-background hover:border-foreground/25 hover:shadow-md"
              }`}
            >
              <motion.div
                animate={isSelected ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200 ${
                  isSelected
                    ? "bg-primary text-white"
                    : `${p.iconBg} ${p.iconColor}`
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div className="text-[14px] font-semibold text-foreground">
                {p.label}
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {p.example}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
