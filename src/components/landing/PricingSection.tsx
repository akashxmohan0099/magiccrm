"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  sectionHeadingVariants,
  sectionTransition,
  viewportConfig,
} from "@/app/landing-data";

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

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
          Flat pricing. No per-staff fees. Ever.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.1, ...sectionTransition }}
          className="text-text-secondary mb-8 text-[15px]"
        >
          14-day free trial on every plan. No credit card required.
        </motion.p>

        {/* Billing cycle toggle */}
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
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                billingCycle === "annual" ? "bg-primary text-white" : "bg-primary/15 text-primary"
              }`}
            >
              SAVE 20%
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              name: "Starter",
              monthly: 29,
              annual: 24,
              annualTotal: 288,
              desc: "For solo operators getting organised.",
              features: ["1 team member", "Clients, bookings, calendar", "Invoicing & payments", "Online booking page", "Email reminders"],
              highlighted: false,
            },
            {
              name: "Growth",
              monthly: 59,
              annual: 49,
              annualTotal: 588,
              desc: "For growing salons that need automation.",
              features: ["Up to 5 team members", "Everything in Starter", "Automations & workflows", "SMS reminders & campaigns", "Business Insights", "CSV import / export", "Embeddable booking widget"],
              highlighted: true,
            },
            {
              name: "Scale",
              monthly: 99,
              annual: 79,
              annualTotal: 948,
              desc: "For multi-location or high-volume businesses.",
              features: ["Unlimited team members", "Everything in Growth", "Client portal", "Proposals & e-signatures", "Memberships & packages", "Marketing campaigns", "Gift cards & loyalty", "Priority support"],
              highlighted: false,
            },
          ].map((tier, idx) => {
            const displayPrice = billingCycle === "annual" ? tier.annual : tier.monthly;
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className={`rounded-2xl border p-6 sm:p-7 text-left flex flex-col ${
                  tier.highlighted
                    ? "border-foreground/20 shadow-xl scale-[1.03] -translate-y-1 bg-card-bg relative"
                    : "border-border-light bg-card-bg"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-foreground text-background px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <div className="mb-1">
                  <h3 className="text-[15px] font-bold text-foreground">{tier.name}</h3>
                  <p className="text-[12px] text-text-secondary mt-0.5">{tier.desc}</p>
                </div>
                <div className="my-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-bold text-foreground tabular-nums">A${displayPrice}</span>
                    <span className="text-text-secondary text-[14px]">/month</span>
                  </div>
                  <p className="text-[12px] text-text-tertiary mt-1 h-4">
                    {billingCycle === "annual" ? `Billed A$${tier.annualTotal}/year` : "\u00A0"}
                  </p>
                </div>
                <div className="space-y-2.5 mb-6 flex-1">
                  {tier.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-[13px] text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/waitlist"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold tracking-[-0.01em] transition-all ${
                    tier.highlighted
                      ? "bg-foreground text-background hover:opacity-90 cta-glow"
                      : "bg-surface text-foreground hover:bg-foreground hover:text-background border border-border-light"
                  }`}
                >
                  Join the waitlist <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
        <p className="text-[12px] text-text-secondary mt-6 font-medium">
          A 5-person salon on Fresha: A$165/mo. On Timely: A$210/mo. On Magic: A$59/mo. All prices in AUD.
        </p>
        <p className="text-[11px] text-text-tertiary mt-2">
          All prices in AUD. {billingCycle === "annual" ? "Billed annually. Cancel anytime." : "Billed monthly. Switch to annual to save 20%."}
        </p>
      </div>
    </motion.section>
  );
}
