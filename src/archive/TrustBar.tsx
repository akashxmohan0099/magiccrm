"use client";

// Archived: the little "trust bar" that sat under ScrollMechanic on the
// landing page with four signal pills (No per-staff fees, 14-day free
// trial, No booking commissions, Built for Australian beauty & wellness).
// Removed from the live page for now — kept here in case we want to
// reintroduce it elsewhere.

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { viewportConfig } from "../app/landing-data";

export function TrustBar() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportConfig}
      transition={{ duration: 0.5 }}
      className="pb-10 sm:pb-14"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
          {[
            "No per-staff fees",
            "14-day free trial",
            "No booking commissions",
            "Built for Australian beauty & wellness",
          ].map((signal, i) => (
            <motion.div
              key={signal}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-light rounded-full"
            >
              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[13px] font-medium text-foreground">{signal}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
