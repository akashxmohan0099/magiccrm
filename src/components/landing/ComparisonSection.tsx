"use client";

import { motion } from "framer-motion";
import {
  Check, TrendingUp, Receipt, Users, Zap, BrainCircuit,
  Bot, ScrollText, ClipboardList, Camera, Crown, ListOrdered,
} from "lucide-react";
import {
  sectionHeadingVariants,
  sectionTransition,
  viewportConfig,
} from "@/app/landing-data";

const COMPARISON_ROWS = [
  { icon: Receipt,      feature: "Pricing model",   sub: "What you pay for",               magic: "Flat monthly", fresha: "Per staff", timely: "Per staff", magicTone: "win" as const, freshaTone: "loss" as const, timelyTone: "loss" as const },
  { icon: Users,        feature: "5-person salon",  sub: "Monthly cost, AUD",              magic: "A$59",         fresha: "A$165",     timely: "A$210",     magicTone: "win" as const, freshaTone: "loss" as const, timelyTone: "loss" as const },
  { icon: Zap,          feature: "Smart rebooking", sub: "AI nudges overdue clients",      magic: "check",        fresha: "cross",     timely: "cross",     magicTone: "win" as const, freshaTone: "loss" as const, timelyTone: "loss" as const },
  { icon: BrainCircuit, feature: "AI insights",     sub: "No-shows, gaps, revenue trends", magic: "check",        fresha: "cross",     timely: "cross",     magicTone: "win" as const, freshaTone: "loss" as const, timelyTone: "loss" as const },
  { icon: Bot,          feature: "AI assistant",    sub: "Chat that reads & writes data",  magic: "check",        fresha: "cross",     timely: "cross",     magicTone: "win" as const, freshaTone: "loss" as const, timelyTone: "loss" as const },
  { icon: Crown,        feature: "Memberships",     sub: "Session packs & auto-billing",   magic: "check",        fresha: "check",     timely: "cross",     magicTone: "win" as const, freshaTone: "neutral" as const, timelyTone: "loss" as const },
];

const MAGIC_ONLY = [
  { icon: ScrollText,     label: "Wedding proposals",     sub: "Branded quotes with e-signature" },
  { icon: ClipboardList,  label: "Treatment notes",       sub: "SOAP notes for clinical records" },
  { icon: Camera,         label: "Before & after photos", sub: "Capture proof of work in-app" },
  { icon: ListOrdered,    label: "Smart waitlist",        sub: "Auto-notify when spots open up" },
];

function renderCell(text: string, tone: "win" | "loss" | "neutral", isMagic: boolean) {
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
  if (text === "cross") {
    return (
      <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
        <span className="text-red-400 text-[14px] font-bold leading-none">✕</span>
      </div>
    );
  }
  return (
    <span
      className={`text-[12px] sm:text-[14px] text-center leading-tight font-semibold ${
        isMagic ? "text-primary" : tone === "loss" ? "text-red-500/80" : "text-text-secondary"
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
            Why switch from Fresha or Timely?
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

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5 }}
          className="relative bg-card-bg rounded-[20px] border border-border-light overflow-hidden shadow-[0_20px_50px_-20px_rgba(10,10,10,0.1),0_4px_14px_-6px_rgba(10,10,10,0.06)]"
        >
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

          {/* Rows */}
          {COMPARISON_ROWS.map((row, i) => {
            const RowIcon = row.icon;
            return (
              <div
                key={i}
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-border-light/70 last:border-b-0 transition-colors ${
                  i % 2 === 1 ? "bg-surface/30" : ""
                }`}
              >
                <div className="px-4 sm:px-7 py-4 sm:py-[18px] flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="hidden sm:flex w-9 h-9 rounded-[10px] bg-foreground/[0.04] border border-border-light items-center justify-center flex-shrink-0">
                    <RowIcon className="w-4 h-4 text-text-secondary" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] sm:text-[15px] font-semibold text-foreground leading-tight tracking-tight">{row.feature}</p>
                    {row.sub && <p className="text-[11px] sm:text-[12px] text-text-tertiary leading-snug mt-0.5">{row.sub}</p>}
                  </div>
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
            );
          })}

          {/* Footer stats — time + money saved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-primary/25 bg-gradient-to-br from-primary/[0.08] to-primary/[0.03]">
            <div className="px-6 sm:px-7 py-5 sm:py-6 flex items-center gap-4 border-b sm:border-b-0 sm:border-r border-primary/15">
              <div className="w-11 h-11 rounded-[12px] bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-primary" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10.5px] text-text-tertiary uppercase tracking-[0.14em] font-semibold mb-0.5">Admin time saved</p>
                <p className="text-[22px] sm:text-[24px] font-bold text-primary leading-tight tracking-tight">~6 hrs / week</p>
              </div>
            </div>
            <div className="px-6 sm:px-7 py-5 sm:py-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-[12px] bg-primary/15 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10.5px] text-text-tertiary uppercase tracking-[0.14em] font-semibold mb-0.5">Money saved</p>
                <p className="text-[22px] sm:text-[24px] font-bold text-primary leading-tight tracking-tight">A$150 / month</p>
              </div>
            </div>
          </div>
        </motion.div>
        <p className="text-[11px] text-text-tertiary text-center mt-3">
          Based on published pricing · 2026 · AUD
        </p>

        {/* Plus, only in Magic — clean label, no sparkles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-16 sm:mt-20"
        >
          <div className="flex items-center gap-4 mb-8 max-w-2xl mx-auto">
            <span className="flex-1 h-px bg-border-light" />
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em]">
              Only in Magic
            </p>
            <span className="flex-1 h-px bg-border-light" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MAGIC_ONLY.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                  className="group relative bg-card-bg border border-border-light rounded-[14px] p-4 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_10px_30px_-12px_rgba(124,254,157,0.25)] hover:-translate-y-0.5"
                >
                  <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
                  </div>
                  <p className="text-[14px] font-bold text-foreground leading-tight tracking-tight">{f.label}</p>
                  <p className="text-[12px] text-text-tertiary leading-snug mt-1">{f.sub}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
