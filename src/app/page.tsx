"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, Check, Users, Receipt,
  Calendar, MessageCircle, FolderKanban, BarChart3,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const MODULES = [
  { icon: Users, name: "Client Database", desc: "Profiles, tags, and history" },
  { icon: MessageCircle, name: "Communication", desc: "Email, SMS, and social DMs" },
  { icon: Calendar, name: "Bookings", desc: "Online scheduling and reminders" },
  { icon: Receipt, name: "Invoicing", desc: "Quotes, invoices, and payments" },
  { icon: FolderKanban, name: "Projects", desc: "Tasks, deadlines, and stages" },
  { icon: BarChart3, name: "Reporting", desc: "Dashboards and export" },
];

const INDUSTRIES = [
  "Beauty & Wellness",
  "Trades & Construction",
  "Professional Services",
  "Health & Fitness",
  "Creative & Design",
  "Hospitality & Events",
  "Education & Coaching",
  "Retail & E-commerce",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-white rounded-sm" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">Magic CRM</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/onboarding" className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium">
            Log in
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface/50 to-background pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-30" style={{backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(var(--color-brand), 0.1) 0%, transparent 70%)'}} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-[3.25rem] sm:text-[3.75rem] font-bold text-foreground mb-6 leading-[1.08]">
            The CRM that fits<br />
            <span className="text-text-secondary">your business, not the other way around</span>
          </h1>

          <p className="text-[17px] text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
            Tell us what you do. We assemble a custom CRM with only the modules you need. No bloat, no week-long setup, no per-seat pricing.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Build my CRM <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] text-text-tertiary">
                Free to set up. $49/mo when you&apos;re ready.
              </p>
              <p className="text-[12px] text-text-tertiary flex items-center gap-2">
                <span className="flex -space-x-2">
                  {[1,2,3,4,5].map((i) => (
                    <span key={i} className="w-6 h-6 bg-brand rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm" />
                  ))}
                </span>
                Trusted by 1000+ businesses
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Industry tags */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-[13px] text-text-tertiary mb-4 font-medium">
            Built for
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((industry) => (
              <span
                key={industry}
                className="px-3.5 py-1.5 bg-surface border border-border-light rounded-full text-[12px] font-medium text-text-secondary"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-foreground text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-[2.25rem] font-bold leading-tight mb-3">
              Three steps. Your CRM.
            </h2>
            <p className="text-white/50 text-[15px]">
              No consultants. No migration headaches. No training videos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Pick your industry",
                description: "We pre-select modules and settings that match your type of business. Makeup artist? Plumber? Consultant? We know what you need.",
              },
              {
                num: "02",
                title: "Fine-tune it",
                description: "Toggle features on or off. Need invoicing but not bookings? Done. Want a lead pipeline but not marketing? Easy.",
              },
              {
                num: "03",
                title: "Start working",
                description: "Your dashboard is ready with only what you selected. Add clients, send invoices, manage projects. All from day one.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{item.num.replace(/\D/g, '')}</span>
                </div>
                <h3 className="font-semibold text-white text-[17px] mb-2">{item.title}</h3>
                <p className="text-[14px] text-white/50 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              12 modules. Pick what you need.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-md mx-auto">
              Every business gets a different combination. You only pay for one plan regardless.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODULES.map((mod, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 bg-card-bg border border-border-light rounded-xl hover:border-foreground/30 transition-all duration-300 group hover:shadow-sm hover:scale-105"
              >
                <mod.icon className="w-5 h-5 text-text-secondary mb-3 group-hover:text-foreground transition-colors" />
                <h3 className="font-semibold text-foreground text-[14px] mb-1">{mod.name}</h3>
                <p className="text-[12px] text-text-tertiary">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-[13px] text-text-tertiary mt-6">
            Plus: Leads & Pipeline, Marketing, Support, Documents, Payments, and Automations.
          </p>
        </div>
      </section>

      {/* Why not the others */}
      <section className="py-20 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Why not just use<br />HubSpot or Monday?
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-8">
                Because they weren&apos;t built for a 3-person landscaping crew or a solo makeup artist. You end up paying for 200 features and using 12.
              </p>
              <div className="space-y-4">
                {[
                  { title: "No per-seat pricing", desc: "Your whole team gets access. Add people without doing math." },
                  { title: "Only your features", desc: "No hidden tabs, no locked modules, no 'upgrade to unlock' walls." },
                  { title: "Changes in seconds", desc: "Need bookings next month? Toggle it on. Drop marketing? Toggle it off." },
                  { title: "Industry-aware defaults", desc: "A plumber and a photographer get completely different setups." },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-[14px]">{item.title}</p>
                      <p className="text-[13px] text-text-secondary">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div className="space-y-4">
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  I was paying $180/mo for a CRM I used 10% of. Magic CRM gave me exactly what I needed for my salon in under 5 minutes.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center">
                    <span className="text-[12px] font-bold text-foreground">SK</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Sarah K.</p>
                    <p className="text-[11px] text-text-tertiary">Hair salon owner, Melbourne</p>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  Finally a CRM that gets trades. Quote, invoice, track the job, done. No nonsense.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center">
                    <span className="text-[12px] font-bold text-foreground">MR</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Mike R.</p>
                    <p className="text-[11px] text-text-tertiary">Electrician, Gold Coast</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                  <p className="text-[24px] font-bold text-foreground">2min</p>
                  <p className="text-[11px] text-text-tertiary">Avg. setup time</p>
                </div>
                <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                  <p className="text-[24px] font-bold text-foreground">12</p>
                  <p className="text-[11px] text-text-tertiary">Modules available</p>
                </div>
                <div className="bg-card-bg rounded-xl border border-border-light p-4 text-center">
                  <p className="text-[24px] font-bold text-foreground">$49</p>
                  <p className="text-[11px] text-text-tertiary">Flat monthly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-md mx-auto px-6 text-center">
          <h2 className="text-[2.25rem] font-bold text-foreground mb-3 leading-tight">
            One plan. Everything included.
          </h2>
          <p className="text-text-secondary mb-10 text-[15px]">
            No tiers. No per-user fees. No feature gates.
          </p>

          <div className="bg-card-bg rounded-2xl border border-border-light p-8 text-left">
            <div className="mb-6">
              <span className="text-[40px] font-bold text-foreground">$49</span>
              <span className="text-text-secondary text-[15px]">/month</span>
            </div>
            <div className="space-y-3 mb-8">
              {[
                "Your fully custom CRM",
                "Unlimited team members",
                "2 integrations included",
                "25 AI Builder credits",
                "All modules you select",
                "Priority email support",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-foreground flex-shrink-0" />
                  <span className="text-[14px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding">
              <Button size="lg" className="w-full">
                Start building <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[11px] text-text-tertiary mt-3 text-center">
              Extra integrations from $10/mo. AI credits from $5 per 10.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-foreground">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[2rem] font-bold text-white mb-4 leading-tight">
            Stop paying for features you don&apos;t use.
          </h2>
          <p className="text-white/50 mb-8 text-[15px]">
            Build a CRM that actually fits your business in under 2 minutes.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="px-10 bg-white text-foreground hover:bg-white/90 shadow-none hover:shadow-none">
              Build my CRM <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
            </div>
            <span className="font-semibold text-foreground text-[13px]">Magic CRM</span>
          </div>
          <p className="text-[12px] text-text-tertiary">
            &copy; {new Date().getFullYear()} Magic CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
