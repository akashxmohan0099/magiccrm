"use client";

import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight, Zap, Shield, Users,
  Check, Star, Wand2, Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const FEATURES = [
  {
    icon: Puzzle,
    title: "Built Around You",
    description: "Answer a few questions and get a CRM assembled specifically for your workflow. No bloat.",
  },
  {
    icon: Wand2,
    title: "AI Builder",
    description: "Need something custom? Describe it in plain English and we'll build it on the fly.",
  },
  {
    icon: Zap,
    title: "Ready in Minutes",
    description: "No complex setup wizards or week-long implementations. You're up and running fast.",
  },
  {
    icon: Users,
    title: "Unlimited Users",
    description: "Your whole team gets access. No per-seat pricing games.",
  },
  {
    icon: Shield,
    title: "Change Anytime",
    description: "Your CRM evolves with your business. Add, remove, or modify features whenever.",
  },
  {
    icon: Star,
    title: "Simple Pricing",
    description: "$50/month. Your custom CRM, two integrations included. No surprises.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FFE072] to-[#D4A017] rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-lg">Magic CRM</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/onboarding" className="text-[14px] text-text-secondary hover:text-foreground transition-colors font-medium">
            Log in
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Try for free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-full text-[13px] font-medium mb-8"
          >
            Built for small businesses that move fast
          </motion.div>

          <h1 className="text-[3.5rem] sm:text-[4rem] font-bold text-foreground mb-6 leading-[1.08]">
            A CRM built{" "}
            <span className="italic">exactly</span>{" "}
            for your business
          </h1>

          <p className="text-[18px] text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Answer a few questions about how you work. We assemble a custom CRM
            with only the features you actually need. Ready in minutes.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Build My CRM <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[13px] text-text-tertiary">
              Free to start &bull; $50/mo when you&apos;re ready
            </p>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="section-label mb-3">How it works</p>
            <h2 className="text-[2.5rem] font-bold text-foreground leading-tight">
              The CRM that actually<br />does stuff.
            </h2>
            <p className="text-text-secondary mt-4 max-w-lg mx-auto text-[16px]">
              Tell us what you need, we build it, you start working.
              No setup headaches.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Answer questions",
                description: "Quick yes/no questions about what your business does day-to-day. Takes 2 minutes.",
              },
              {
                step: "2",
                title: "We assemble it",
                description: "Your custom CRM is built from pre-made modules. Only what you need, nothing you don't.",
              },
              {
                step: "3",
                title: "Start working",
                description: "Land in your personalized dashboard. Add clients, send invoices, manage projects — right away.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-card-bg rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="text-brand font-bold text-[14px] mb-4">{item.step}</div>
                <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Features</p>
            <h2 className="text-[2.5rem] font-bold text-foreground leading-tight">
              Everything you need,<br />nothing you don&apos;t.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 bg-card-bg rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow"
              >
                <div className="w-10 h-10 bg-brand-light rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-surface">
        <div className="max-w-lg mx-auto px-6 text-center">
          <p className="section-label mb-3">Pricing</p>
          <h2 className="text-[2.5rem] font-bold text-foreground mb-3 leading-tight">
            Simple, honest pricing.
          </h2>
          <p className="text-text-secondary mb-10 text-[16px]">
            One plan. Everything you need. No per-user fees.
          </p>

          <div className="bg-card-bg rounded-2xl shadow-lg shadow-black/5 p-8">
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">$50</span>
              <span className="text-text-secondary text-lg">/month</span>
            </div>
            <ul className="space-y-3 text-left mb-8">
              {[
                "Your fully custom CRM",
                "Unlimited team members",
                "2 integrations included",
                "25 AI Builder credits",
                "All core modules",
                "Email & chat support",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground">
                  <Check className="w-4 h-4 text-brand flex-shrink-0" />
                  <span className="text-[14px]">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/onboarding">
              <Button size="lg" className="w-full">
                Start Building <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[12px] text-text-tertiary mt-3">
              Additional integrations from $10/mo. AI credits from $5 per 10.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[2.5rem] font-bold text-foreground mb-4 leading-tight">
            Ready to ditch the<br />bloated CRM?
          </h2>
          <p className="text-text-secondary mb-8 text-[16px]">
            Join small business owners who got a CRM that actually fits.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="px-10">
              Build My CRM Now <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#FFE072] to-[#D4A017] rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-foreground text-sm">Magic CRM</span>
          </div>
          <p className="text-[13px] text-text-tertiary">
            &copy; {new Date().getFullYear()} Magic CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
