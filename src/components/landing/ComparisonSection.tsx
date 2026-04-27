"use client";

import { motion } from "framer-motion";
import {
  Check, Receipt, Sparkles, Crown, Star,
} from "lucide-react";
import {
  sectionHeadingVariants,
  sectionTransition,
  viewportConfig,
} from "@/app/landing-data";

type Cell = "check" | "dash" | string;
type Tone = "win" | "loss" | "neutral";
type Row = {
  feature: string;
  sub?: string;
  magic: Cell;
  fresha: Cell;
  timely: Cell;
  magicTone: Tone;
  freshaTone: Tone;
  timelyTone: Tone;
};
type Section = {
  label: string;
  icon: typeof Receipt;
  rows: Row[];
};

const COMPARISON_SECTIONS: Section[] = [
  {
    label: "Pricing",
    icon: Receipt,
    rows: [
      { feature: "Pricing model",  sub: "What you pay for",    magic: "Flat monthly", fresha: "Per staff", timely: "Per staff", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "5-person salon", sub: "Monthly cost, AUD",   magic: "A$59",         fresha: "A$165",     timely: "A$210",     magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
    ],
  },
  {
    label: "AI & automation",
    icon: Sparkles,
    rows: [
      { feature: "Smart rebooking", sub: "AI nudges overdue clients",      magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "AI insights",     sub: "No-shows, gaps, revenue trends", magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "AI assistant",    sub: "Chat that reads & writes data",  magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
    ],
  },
  {
    label: "Essentials",
    icon: Crown,
    rows: [
      { feature: "Memberships", sub: "Session packs & auto-billing", magic: "check", fresha: "check", timely: "dash", magicTone: "win", freshaTone: "neutral", timelyTone: "loss" },
    ],
  },
  {
    label: "Only on Magic",
    icon: Star,
    rows: [
      { feature: "Wedding proposals",     sub: "Branded quotes with e-signature", magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "Treatment notes",       sub: "SOAP notes for clinical records", magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "Before & after photos", sub: "Capture proof of work in-app",    magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
      { feature: "Smart waitlist",        sub: "Auto-notify when spots open up",  magic: "check", fresha: "dash", timely: "dash", magicTone: "win", freshaTone: "loss", timelyTone: "loss" },
    ],
  },
];

function renderCell(text: Cell, tone: Tone, isMagic: boolean) {
  if (text === "check") {
    return isMagic ? (
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_-2px_rgba(124,254,157,0.6)]">
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </div>
    ) : (
      <div className="w-7 h-7 rounded-full bg-text-tertiary/12 flex items-center justify-center">
        <Check className="w-4 h-4 text-text-secondary/70" strokeWidth={2.5} />
      </div>
    );
  }
  if (text === "dash") {
    return (
      <span className="text-text-tertiary/60 text-[18px] leading-none font-light select-none">
        —
      </span>
    );
  }
  return (
    <span
      className={`text-[12px] sm:text-[14px] text-center leading-tight font-semibold ${
        isMagic ? "text-primary" : tone === "loss" ? "text-text-secondary" : "text-text-secondary"
      }`}
    >
      {text}
    </span>
  );
}

export function ComparisonSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportConfig}
      transition={{ duration: 0.5 }}
      className="py-16 sm:py-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[2rem] sm:text-[2.75rem] font-bold text-foreground leading-[1.08] mb-4 tracking-tight"
          >
            More reasons to switch.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-text-secondary text-[15px] sm:text-[16px] leading-relaxed"
          >
            Flat pricing, no per-staff fees, and AI that actually helps you rebook.
          </motion.p>
        </div>

        {/* Comparison table — horizontal scroll on mobile so all 4 columns
            stay readable instead of crushing below usable width. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5 }}
          className="relative bg-card-bg rounded-[20px] border border-border-light overflow-hidden shadow-[0_20px_50px_-20px_rgba(10,10,10,0.1),0_4px_14px_-6px_rgba(10,10,10,0.06)]"
        >
        <div className="overflow-x-auto [scrollbar-width:thin]">
        <div className="min-w-[560px]">
          {/* Column headers */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-border-light">
            <div className="px-4 sm:px-7 py-5 sm:py-6 flex items-end">
              <p className="text-[10px] sm:text-[11px] text-text-tertiary uppercase tracking-[0.12em] font-semibold">Feature</p>
            </div>
            <div className="relative bg-primary/[0.06] px-2 sm:px-5 py-5 sm:py-6 text-center">
              {/* Soft column highlight top accent */}
              <span className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[5px] flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
                  <div className="w-1.5 h-1.5 bg-card-bg rounded-[2px]" />
                </div>
                <span className="text-[13px] sm:text-[15px] font-bold text-primary tracking-tight">Magic</span>
              </div>
            </div>
            <div className="px-2 sm:px-5 py-5 sm:py-6 text-center">
              <span className="text-[12px] sm:text-[14px] font-semibold text-text-secondary">Fresha</span>
            </div>
            <div className="px-2 sm:px-5 py-5 sm:py-6 text-center">
              <span className="text-[12px] sm:text-[14px] font-semibold text-text-secondary">Timely</span>
            </div>
          </div>

          {/* Sectioned rows */}
          {COMPARISON_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isHighlight = section.label === "Only on Magic";
            return (
              <div key={section.label}>
                {/* Section header — spans full width */}
                <div
                  className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-border-light/70 ${
                    isHighlight ? "bg-primary/[0.05]" : "bg-surface/50"
                  }`}
                >
                  <div className="px-4 sm:px-7 py-2.5 sm:py-3 flex items-center gap-2">
                    <SectionIcon
                      className={`w-[13px] h-[13px] ${isHighlight ? "text-primary" : "text-text-tertiary"}`}
                      strokeWidth={2.2}
                    />
                    <span
                      className={`text-[10.5px] uppercase tracking-[0.14em] font-bold ${
                        isHighlight ? "text-primary" : "text-text-tertiary"
                      }`}
                    >
                      {section.label}
                    </span>
                  </div>
                  <div className="bg-primary/[0.06]" />
                  <div />
                  <div />
                </div>

                {/* Section rows */}
                {section.rows.map((row) => (
                  <div
                    key={row.feature}
                    className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-border-light/70"
                  >
                    <div className="px-4 sm:px-7 py-4 sm:py-[18px] min-w-0">
                      <p className="text-[13.5px] sm:text-[15px] font-semibold text-foreground leading-tight tracking-tight">
                        {row.feature}
                      </p>
                      {row.sub && (
                        <p className="text-[11px] sm:text-[12px] text-text-tertiary leading-snug mt-0.5">
                          {row.sub}
                        </p>
                      )}
                    </div>
                    <div className="px-1.5 sm:px-5 py-4 sm:py-[18px] bg-primary/[0.06] flex items-center justify-center min-w-0">
                      {renderCell(row.magic, row.magicTone, true)}
                    </div>
                    <div className="px-1.5 sm:px-5 py-4 sm:py-[18px] flex items-center justify-center min-w-0">
                      {renderCell(row.fresha, row.freshaTone, false)}
                    </div>
                    <div className="px-1.5 sm:px-5 py-4 sm:py-[18px] flex items-center justify-center min-w-0">
                      {renderCell(row.timely, row.timelyTone, false)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        </div>
        </motion.div>
        <p className="text-[11px] text-text-tertiary text-center mt-3">
          Based on published pricing · 2026 · AUD
        </p>
      </div>
    </motion.section>
  );
}
