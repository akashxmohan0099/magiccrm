"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import {
  sectionHeadingVariants,
  sectionTransition,
  viewportConfig,
} from "@/app/landing-data";
import { useWaitlistModal } from "./waitlistStore";

type Tier = {
  name: string;
  monthly: number;
  annual: number;
  annualTotal: number;
  desc: string;
  features: ReactNode[];
  highlighted?: boolean;
};

// Emphasises the leading word/number in a feature bullet — pattern from
// Linear, Stripe, Supabase. Reads "Up to 5 team members" with the "5"
// carrying the weight.
function emphasize(lead: string, rest: string): ReactNode {
  return (
    <>
      <span className="font-semibold text-foreground">{lead}</span>{" "}
      <span className="text-text-secondary">{rest}</span>
    </>
  );
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: 29,
    annual: 24,
    annualTotal: 288,
    desc: "For solo operators getting organised.",
    features: [
      emphasize("1", "team member"),
      "Clients, bookings, calendar",
      "Payments — invoices & quotes",
      "Online booking page",
      "Email reminders",
    ],
  },
  {
    name: "Growth",
    monthly: 59,
    annual: 49,
    annualTotal: 588,
    desc: "For growing salons that need automation.",
    features: [
      emphasize("Up to 5", "team members"),
      "Everything in Starter, plus:",
      "Automations & workflows",
      "SMS reminders & campaigns",
      "Analytics dashboard",
      "CSV import / export",
      "Embeddable booking widget",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    monthly: 99,
    annual: 79,
    annualTotal: 948,
    desc: "For multi-location or high-volume businesses.",
    features: [
      emphasize("Unlimited", "team members"),
      "Everything in Growth, plus:",
      "Client portal",
      "Proposals & e-signatures",
      "Memberships & packages",
      "Marketing campaigns",
      "Gift cards & loyalty",
      "Priority support",
    ],
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const openWaitlist = useWaitlistModal((s) => s.open);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportConfig}
      transition={{ duration: 0.5 }}
      className="py-12 sm:py-20 bg-card-bg"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          variants={sectionHeadingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={sectionTransition}
          className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground mb-3 leading-tight"
        >
          Pricing.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.1, ...sectionTransition }}
          className="text-text-secondary mb-8 text-[15px]"
        >
          Three tiers. Pick one, grow into the next. That&apos;s it.
        </motion.p>

        {/* Billing cycle toggle — SAVE 20% nudge only shown on Monthly */}
        <div className="inline-flex items-center p-1 bg-surface border border-border-light rounded-full mb-10">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-foreground text-background"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-foreground text-background"
                : "text-text-secondary hover:text-foreground"
            }`}
          >
            Annual
            {billingCycle !== "annual" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                SAVE 20%
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {TIERS.map((tier, idx) => {
            const displayPrice = billingCycle === "annual" ? tier.annual : tier.monthly;
            const annualSavings = tier.monthly * 12 - tier.annualTotal;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className={`relative rounded-2xl border p-6 sm:p-7 text-left flex flex-col ${
                  tier.highlighted
                    ? "border-primary/40 bg-primary/[0.025]"
                    : "border-border-light bg-card-bg"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-[15px] font-bold text-foreground">{tier.name}</h3>
                  {tier.highlighted && (
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-text-secondary leading-snug">{tier.desc}</p>

                <div className="mt-5 mb-5">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[32px] sm:text-[36px] font-bold text-foreground tabular-nums leading-none">
                      A${displayPrice}
                    </span>
                    <span className="text-text-secondary text-[13px]">/ month</span>
                    {billingCycle === "annual" && (
                      <span className="text-[12px] text-text-tertiary line-through tabular-nums ml-1">
                        A${tier.monthly}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-4 flex items-center gap-2">
                    {billingCycle === "annual" ? (
                      <>
                        <span className="text-[11.5px] text-text-tertiary">
                          A${tier.annualTotal} billed yearly
                        </span>
                        <span className="text-[10.5px] font-semibold text-primary bg-primary/12 px-1.5 py-0.5 rounded-full">
                          Save A${annualSavings}/yr
                        </span>
                      </>
                    ) : (
                      <span className="text-[11.5px] text-text-tertiary">Billed monthly</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f, i) => {
                    const isDivider =
                      typeof f === "string" && f.startsWith("Everything in");
                    if (isDivider) {
                      return (
                        <p
                          key={i}
                          className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary font-semibold pt-1.5 pb-0.5"
                        >
                          {f}
                        </p>
                      );
                    }
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check
                          className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-[3px]"
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] text-foreground leading-snug">{f}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={openWaitlist}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold tracking-[-0.01em] transition-all ${
                    tier.highlighted
                      ? "bg-foreground text-background hover:opacity-90 cta-glow"
                      : "bg-surface text-foreground hover:bg-foreground hover:text-background border border-border-light"
                  }`}
                >
                  Join the waitlist <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Trust strip — universal inclusions (truthful, no usage claims) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-text-tertiary">
          {[
            "Unlimited clients",
            "iOS & Android apps",
            "Australian support",
            "Cancel anytime",
          ].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-primary" strokeWidth={3} />
              {item}
            </span>
          ))}
        </div>

        {/* Multi-location / enterprise callout */}
        <div className="mt-10 inline-flex items-center gap-2 text-[13px] text-text-secondary">
          <span>Running 5+ locations or need a custom plan?</span>
          <button
            type="button"
            onClick={openWaitlist}
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            Talk to us →
          </button>
        </div>

        <p className="text-[11px] text-text-tertiary mt-6">All prices in AUD.</p>
      </div>
    </motion.section>
  );
}
