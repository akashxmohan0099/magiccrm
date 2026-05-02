"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { COMPARISON_PERSONAS } from "@/app/landing-data";

export function ComparisonToggle({ viewportConfig }: { viewportConfig: { once: boolean; margin: string } }) {
  const [active, setActive] = useState(0);
  const persona = COMPARISON_PERSONAS[active];

  return (
    <>
      <div
        className="flex gap-2 mb-8 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none" }}
      >
        {COMPARISON_PERSONAS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              active === i
                ? "text-white shadow-md"
                : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
            }`}
            style={active === i ? { backgroundColor: p.accent } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:items-stretch">
        {/* Generic CRM */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border-light p-6 bg-card-bg min-h-[480px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Generic software</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Contacts", sublabel: "Generic contact database" },
              { label: "Deals", sublabel: "Sales pipeline you don\u2019t use" },
              { label: "Tasks", sublabel: "Project management you didn\u2019t ask for" },
              { label: "Invoicing", sublabel: "One-size-fits-all billing" },
              { label: "Settings", sublabel: "200 options to figure out yourself" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50">
                <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary/30" />
                <div>
                  <p className="text-sm font-medium text-text-secondary">{item.label}</p>
                  <p className="text-xs text-text-tertiary">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Magic CRM — persona-specific */}
        <AnimatePresence mode="wait">
          <motion.div
            key={persona.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 p-6 bg-card-bg relative overflow-hidden min-h-[480px]"
            style={{ borderColor: persona.accent + "33" }}
          >
            <div className="absolute top-0 left-0 right-0 h-24 opacity-[0.06]" style={{ background: `linear-gradient(to bottom, ${persona.accent}, transparent)` }} />
            <div className="relative flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.accent }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: persona.accent }}>Magic for a {persona.label}</span>
            </div>
            <div className="relative space-y-3">
              {persona.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: persona.accent + "08", borderColor: persona.accent + "18" }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: persona.accent }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[13px] font-medium" style={{ color: persona.accent }}>{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ── AI Chat Demo ──

