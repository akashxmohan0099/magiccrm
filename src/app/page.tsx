"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Check, Star,
  Zap, Crown, Camera, FileInput,
  ClipboardList, Gift, UserCheck, Store, Lightbulb, Puzzle, Sparkles, NotebookPen,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CinematicDemo } from "@/components/landing/CinematicDemo";

// ── Shared animation variants ──

const sectionHeadingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sectionTransition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const viewportConfig = { once: false, margin: "-80px" as const };

const ctaPulseVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const testimonialVariants = {
  hidden: { opacity: 0, x: -40, rotate: -1 },
  visible: { opacity: 1, x: 0, rotate: 0 },
};

// ── Persona comparison data ──

const PERSONA_PREVIEWS = [
  {
    label: "Lash Tech",
    businessName: "Lash Lab Co",
    industry: "Beauty & Wellness",
    accent: "#EC4899",
    nav: ["Clients", "Services", "Appointments", "Receipts", "Leads"],
    activeNav: "Services",
    contentTitle: "Service Menu",
    items: [
      { name: "Classic Full Set", meta: "2hr", value: "$150" },
      { name: "Volume Full Set", meta: "2.5hr", value: "$200" },
      { name: "Lash Lift & Tint", meta: "1hr", value: "$80" },
      { name: "Lash Removal", meta: "30min", value: "$25" },
    ],
    fields: ["Allergies", "Skin Type", "Preferred Products"],
  },
  {
    label: "Electrician",
    businessName: "Spark Right Electrical",
    industry: "Trades & Construction",
    accent: "#3B82F6",
    nav: ["Clients", "Jobs", "Site Visits", "Invoices", "Quotes"],
    activeNav: "Jobs",
    contentTitle: "Active Jobs",
    items: [
      { name: "Kitchen rewire", meta: "Quoted", value: "$2,400", stageColor: "bg-blue-400" },
      { name: "Switchboard upgrade", meta: "Scheduled", value: "$850", stageColor: "bg-cyan-400" },
      { name: "Office fit-out", meta: "In Progress", value: "$6,200", stageColor: "bg-yellow-400" },
      { name: "Garden lights", meta: "Complete", value: "$1,100", stageColor: "bg-green-400" },
    ],
    fields: ["Job Site Address", "Property Type", "Access Notes"],
  },
  {
    label: "Life Coach",
    businessName: "Elevate Coaching",
    industry: "Education & Coaching",
    accent: "#10B981",
    nav: ["Clients", "Programs", "Sessions", "Invoices", "Leads"],
    activeNav: "Sessions",
    contentTitle: "Session Types",
    items: [
      { name: "Discovery Call", meta: "30min", value: "Free" },
      { name: "Coaching Session", meta: "1hr", value: "$200" },
      { name: "Group Coaching", meta: "1.5hr", value: "$80" },
      { name: "VIP Intensive", meta: "3hr", value: "$500" },
    ],
    fields: ["Company", "Role / Title", "Coaching Goals"],
  },
];

const INDUSTRIES = [
  "Beauty & Wellness", "Trades & Construction", "Professional Services",
  "Health & Fitness", "Creative & Design", "Hospitality & Events",
  "Education & Coaching", "Retail & E-commerce",
];

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(0);

  // Global scroll progress for the progress bar
  const { scrollYProgress } = useScroll();

  // Hero parallax — heading moves slower than scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 40]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7, 1], [1, 0.8, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.97]);

  return (
    <div className="min-h-screen bg-background grid-pattern noise-bg">
      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
        style={{
          scaleX: scrollYProgress,
          backgroundColor: "var(--primary)",
          willChange: "transform",
        }}
      />

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-3.5 h-3.5 bg-white rounded-sm" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">Magic</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium">
            Log in
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center relative overflow-hidden">

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale, willChange: "transform, opacity" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[13px] text-text-secondary font-medium mb-6"
          >
            Built for how you actually work
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[2.25rem] sm:text-[3.5rem] md:text-[4rem] font-bold mb-6 leading-[1.05]"
          >
            <span className="gradient-text">The software that fits</span><br />
            <span className="text-text-secondary">your business, not the other way around</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[15px] sm:text-[17px] text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Tell us what you do and we&apos;ll assemble a workspace with only the tools you need. One flat price, nothing you won&apos;t use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Build my workspace <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[13px] text-text-tertiary">
              Free to set up. $49/mo when you&apos;re ready.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar — removed, numbers mentioned elsewhere */}

      {/* Industry tags */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="pb-12 sm:pb-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5 }}
            className="text-center text-[13px] text-text-tertiary mb-4 font-medium"
          >
            Trusted across industries
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((industry, i) => (
              <motion.span
                key={industry}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                className="px-3.5 py-1.5 bg-surface border border-border-light rounded-full text-[12px] font-medium text-text-secondary"
              >
                {industry}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-[12px] text-text-tertiary mt-4 max-w-md mx-auto">
            Not built for one industry — built for anyone who wants to manage their business, their way.
          </p>
        </div>
      </motion.section>

      {/* Persona Comparison — side by side */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3"
            >
              Same platform. Your language.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              Your clients aren&apos;t &ldquo;contacts&rdquo;. Your work isn&apos;t &ldquo;deals&rdquo;.
              Magic adapts its vocabulary, fields, and workflows to match how you actually run your business.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONA_PREVIEWS.map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => setActivePersona(i)}
                className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 glow-border ${
                  activePersona === i
                    ? "border-foreground/20 shadow-xl scale-[1.03] -translate-y-1"
                    : "border-border-light hover:border-foreground/10 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: `2px solid ${persona.accent}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: persona.accent + "18" }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: persona.accent }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground leading-none">{persona.businessName}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{persona.industry}</p>
                  </div>
                </div>
                <div className="flex" style={{ minHeight: 195 }}>
                  <div className="w-[100px] border-r border-border-light p-1.5 flex flex-col gap-0.5">
                    {persona.nav.map((item) => (
                      <div key={item} className={`text-[11px] py-1.5 px-2 rounded-md ${item === persona.activeNav ? "bg-background font-semibold text-foreground shadow-sm" : "text-text-tertiary"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-3">
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">{persona.contentTitle}</p>
                    <div className="space-y-1.5">
                      {persona.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 bg-background rounded-lg px-2.5 py-1.5">
                          {"stageColor" in item && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.stageColor}`} />}
                          <span className="text-[11px] text-foreground font-medium flex-1 truncate">{item.name}</span>
                          <span className="text-[10px] text-text-tertiary">{item.meta}</span>
                          {"stageColor" in item
                            ? <span className="text-[10px] font-medium text-text-secondary">{item.value}</span>
                            : <span className="text-[11px] font-semibold text-foreground">{item.value}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2.5 border-t border-border-light">
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Client fields</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.fields.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 bg-background border border-border-light rounded-full text-text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Cinematic Demo — replaces module picker + customize sections */}
      <CinematicDemo />


      {/* Add-ons */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportConfig} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface border border-border-light rounded-full text-[11px] font-medium text-text-secondary mb-5">
              <Puzzle className="w-3 h-3" /> Install anytime
            </motion.div>
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-3"
            >
              And more add-ons when you&apos;re ready.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              One click from your sidebar. No setup, no downtime, no migration.
            </motion.p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            {/* Gift Cards */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-pink-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #EC4899, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10 mb-3"><Ticket className="w-5 h-5 text-pink-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Gift Cards</h3>
                <p className="text-[12px] text-text-secondary mt-1">Create, sell, and track digital gift vouchers. A revenue channel that markets itself.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ label: "GIFT-7X4K-M2NP", value: "$100.00", status: "Active" }, { label: "GIFT-R9BW-3CTL", value: "$25.00", status: "Partial" }, { label: "GIFT-5FHQ-8YJA", value: "$0.00", status: "Redeemed" }].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[11px] text-text-secondary font-mono">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{row.value}</span>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : row.status === "Partial" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.06 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-amber-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #F59E0B, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 mb-3"><Lightbulb className="w-5 h-5 text-amber-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">AI Insights</h3>
                <p className="text-[12px] text-text-secondary mt-1">Smart suggestions — overdue rebookings, revenue forecasts, and churn risk.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ text: "Sarah M. is 2 weeks overdue for her lash fill", color: "border-l-red-400", tag: "Action", tagColor: "bg-red-50 text-red-600" }, { text: "Tom K. opened your quote 3x but hasn\u2019t responded", color: "border-l-amber-400", tag: "Follow up", tagColor: "bg-amber-50 text-amber-700" }, { text: "Tuesday afternoons are consistently empty", color: "border-l-blue-400", tag: "Opportunity", tagColor: "bg-blue-50 text-blue-600" }].map((insight, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg bg-background/80 border-l-2 ${insight.color}`}>
                    <p className="text-[11px] text-foreground leading-snug">{insight.text}</p>
                    <span className={`text-[8px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${insight.tagColor}`}>{insight.tag}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Loyalty & Referrals */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.12 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-emerald-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #10B981, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 mb-3"><Gift className="w-5 h-5 text-emerald-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Loyalty & Referrals</h3>
                <p className="text-[12px] text-text-secondary mt-1">Points per visit, referral codes, and reward tiers for repeat clients.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Sarah M.", points: "420 pts", rank: "1" }, { name: "Emma R.", points: "310 pts", rank: "2" }, { name: "Jess T.", points: "185 pts", rank: "3" }].map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[10px] font-bold text-text-tertiary w-4">{m.rank}.</span>
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-white">{m.name.split(" ").map(n => n[0]).join("")}</span></div>
                    <span className="text-[11px] text-foreground font-medium flex-1">{m.name}</span>
                    <span className="text-[11px] font-bold text-emerald-600">{m.points}</span>
                  </div>
                ))}
                <div className="px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] text-emerald-700 font-medium">Referral code SARAH10 used 4 times this month</p></div>
              </div>
            </motion.div>

            {/* Memberships */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-purple-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #8B5CF6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 mb-3"><Crown className="w-5 h-5 text-purple-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Memberships</h3>
                <p className="text-[12px] text-text-secondary mt-1">Session packs, recurring plans, and member tracking with auto-billing.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ plan: "10-Session Pack", price: "$450", members: "8 active" }, { plan: "Monthly Unlimited", price: "$99/mo", members: "12 active" }].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.members}</p></div>
                    <span className="text-[13px] font-bold text-foreground">{p.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Win-Back */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-amber-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #F59E0B, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 mb-3"><UserCheck className="w-5 h-5 text-amber-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Win-Back</h3>
                <p className="text-[12px] text-text-secondary mt-1">Detect lapsed clients and auto-send re-engagement messages.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Sarah M.", days: "45 days inactive", status: "Contacted", sc: "bg-emerald-50 text-emerald-700" }, { name: "Tom K.", days: "62 days inactive", status: "Detected", sc: "bg-amber-50 text-amber-700" }].map((c) => (
                  <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Storefront */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-cyan-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #06B6D4, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 mb-3"><Store className="w-5 h-5 text-cyan-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Storefront</h3>
                <p className="text-[12px] text-text-secondary mt-1">A public page showcasing your services with pricing and booking links.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-lg bg-background/80 p-3">
                  <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold text-foreground">Your Business</p><span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">Live</span></div>
                  <p className="text-[9px] text-text-tertiary mb-2.5">yourbusiness.magic/book</p>
                  <div className="space-y-1.5">{["Lash Full Set — $150", "Brow Lamination — $65"].map((s) => (<div key={s} className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-white rounded border border-border-light"><span className="text-text-secondary">{s.split(" — ")[0]}</span><span className="font-bold text-foreground">{s.split(" — ")[1]}</span></div>))}</div>
                </div>
              </div>
            </motion.div>

            {/* Intake Forms */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-pink-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #EC4899, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10 mb-3"><FileInput className="w-5 h-5 text-pink-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Intake Forms</h3>
                <p className="text-[12px] text-text-secondary mt-1">Custom questionnaires with conditional logic for client intake.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-lg bg-background/80 p-3 space-y-2">
                  {["Full Name *", "Email *", "Any allergies?"].map((field) => (<div key={field}><p className="text-[9px] text-text-tertiary mb-0.5">{field}</p><div className="h-7 bg-white rounded-lg border border-border-light" /></div>))}
                  <div className="h-8 bg-foreground rounded-lg flex items-center justify-center text-[10px] text-white font-semibold">Submit</div>
                </div>
              </div>
            </motion.div>

            {/* Before & After */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #14B8A6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 mb-3"><Camera className="w-5 h-5 text-teal-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Before & After</h3>
                <p className="text-[12px] text-text-secondary mt-1">Capture proof of work with photos and digital checklists.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div><p className="text-[9px] text-text-tertiary mb-1.5 text-center font-medium">Before</p><div className="aspect-[4/3] bg-surface rounded-xl border border-border-light flex items-center justify-center"><Camera className="w-6 h-6 text-text-tertiary/20" /></div></div>
                  <div><p className="text-[9px] text-teal-600 mb-1.5 text-center font-medium">After</p><div className="aspect-[4/3] bg-teal-50/50 rounded-xl border border-teal-200/50 flex items-center justify-center"><Camera className="w-6 h-6 text-teal-300" /></div></div>
                </div>
              </div>
            </motion.div>

            {/* Treatment Notes */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-indigo-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #6366F1, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 mb-3"><ClipboardList className="w-5 h-5 text-indigo-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Treatment Notes</h3>
                <p className="text-[12px] text-text-secondary mt-1">Structured SOAP notes for clinical treatment records.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ letter: "S", label: "Subjective", text: "Patient reports lower back pain..." }, { letter: "O", label: "Objective", text: "ROM limited to 40° flexion..." }, { letter: "A", label: "Assessment", text: "Lumbar strain, improving..." }].map((n) => (
                  <div key={n.letter} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{n.letter}</span>
                    <div><p className="text-[10px] font-semibold text-foreground">{n.label}</p><p className="text-[9px] text-text-tertiary">{n.text}</p></div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notes & Docs */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.22 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-sky-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #0EA5E9, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/10 mb-3"><NotebookPen className="w-5 h-5 text-sky-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Notes & Docs</h3>
                <p className="text-[12px] text-text-secondary mt-1">Write notes, create docs, and share with your team. Simple formatting, no bloat.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-xl bg-background/80 overflow-hidden border border-border-light">
                  <div className="px-3 py-1.5 border-b border-border-light flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">B</span>
                    <span className="text-[10px] italic text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">I</span>
                    <span className="text-[10px] underline text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">U</span>
                    <div className="w-px h-3.5 bg-border-light mx-1" />
                    <span className="text-[9px] text-text-tertiary px-1">Aa</span>
                    <div className="w-3 h-3 rounded bg-foreground" />
                    <div className="w-px h-3.5 bg-border-light mx-1" />
                    <span className="text-[9px] text-text-tertiary">L</span>
                    <span className="text-[9px] text-text-tertiary">C</span>
                    <span className="text-[9px] text-text-tertiary">R</span>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[11px] font-bold text-foreground mb-1">Session notes — Sarah M.</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">Discussed goals for Q2. Wants to <span className="font-bold">increase bookings by 20%</span> and launch a referral program.</p>
                    <div className="flex items-center gap-1.5 mt-2"><span className="text-[8px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-medium">Linked: Sarah M.</span><span className="text-[8px] px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded font-medium">Pinned</span></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Class Timetable */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-violet-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #8B5CF6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 mb-3"><CalendarRange className="w-5 h-5 text-violet-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Class Timetable</h3>
                <p className="text-[12px] text-text-secondary mt-1">Visual weekly class schedule with capacity limits and check-in.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ day: "Mon 9:00", name: "Yoga Flow", cap: "6/12" }, { day: "Wed 6:00", name: "HIIT", cap: "10/15" }, { day: "Fri 10:00", name: "Pilates", cap: "8/10" }].map((cls) => (
                  <div key={cls.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-semibold">{cls.day}</span>
                      <span className="text-[11px] font-semibold text-foreground">{cls.name}</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-medium">{cls.cap}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vendors */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-orange-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #F97316, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 mb-3"><Building2 className="w-5 h-5 text-orange-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Vendors</h3>
                <p className="text-[12px] text-text-secondary mt-1">Track suppliers, vendor availability, contracts, and payments.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Bloom & Co", type: "Florist", stars: 5 }, { name: "DJ Marcus", type: "Entertainment", stars: 4 }, { name: "Sweet Table", type: "Caterer", stars: 5 }].map((v) => (
                  <div key={v.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{v.name}</p><p className="text-[9px] text-text-tertiary">{v.type}</p></div>
                    <div className="flex gap-0.5">{Array.from({ length: v.stars }).map((_, i) => (<Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />))}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Proposals */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-violet-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #7C3AED, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-600/10 mb-3"><ScrollText className="w-5 h-5 text-violet-600" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Proposals</h3>
                <p className="text-[12px] text-text-secondary mt-1">Branded proposal pages with interactive pricing and e-signature.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ id: "PROP-001", title: "Website Redesign", status: "Sent", amount: "$4,500", sc: "bg-blue-50 text-blue-600" }, { id: "PROP-002", title: "Brand Package", status: "Viewed", amount: "$2,800", sc: "bg-amber-50 text-amber-700" }, { id: "PROP-003", title: "Event Coverage", status: "Accepted", amount: "$3,200", sc: "bg-emerald-50 text-emerald-700" }].map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-text-tertiary">{p.id}</span>
                      <span className="text-[11px] font-semibold text-foreground">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.status}{p.status === "Accepted" ? " \u2713" : ""}</span>
                      <span className="text-[11px] font-bold text-foreground">{p.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waitlist */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.22 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #14B8A6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 mb-3"><ListOrdered className="w-5 h-5 text-teal-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Waitlist</h3>
                <p className="text-[12px] text-text-secondary mt-1">Manage walk-in queues and auto-notify clients when spots open up.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Emma R.", detail: "Lash Fill", status: "Waiting", sc: "bg-amber-50 text-amber-700" }, { name: "Tom K.", detail: "2:00 PM slot", status: "Notified \u2713", sc: "bg-blue-50 text-blue-600" }].map((w) => (
                  <div key={w.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{w.name}</p><p className="text-[9px] text-text-tertiary">{w.detail}</p></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${w.sc}`}>{w.status}</span>
                  </div>
                ))}
                <div className="px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100"><p className="text-[10px] text-teal-700 font-medium">Spot opened! Auto-notified 2 clients</p></div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Build Your Own */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] font-medium text-purple-700 mb-4">
                <Zap className="w-3 h-3" /> AI-Powered
              </div>
              <motion.h2
                variants={sectionHeadingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={sectionTransition}
                className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4"
              >
                Build your own<br />features with AI.
              </motion.h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Need something we don&apos;t have? Describe it in plain English and our AI builder creates a custom module — with its own data, views, and automations. Built on top of your existing data.
              </p>
              <div className="space-y-3">
                {[
                  { title: "Describe what you need", desc: "\"I need a warranty tracker for each job\"" },
                  { title: "AI builds it", desc: "Custom data model, views, and automations — in seconds" },
                  { title: "It lives in your sidebar", desc: "Uses your existing clients, jobs, and invoices" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-white">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{step.title}</p>
                      <p className="text-[12px] text-text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border-light">
                  <span className="text-[11px] text-text-tertiary">Powered by</span>
                  <div className="flex items-center gap-4">
                    <img src="/logos/claude.png" alt="Claude" className="h-4 opacity-60 hover:opacity-100 transition-opacity" />
                    <img src="/logos/openai.png" alt="OpenAI" className="h-4 opacity-60 hover:opacity-100 transition-opacity" />
                    <img src="/logos/kimi.svg" alt="Kimi" className="h-4 opacity-60 hover:opacity-100 transition-opacity rounded" />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-lg">
                <div className="px-5 py-3 border-b border-border-light flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-[13px] font-semibold text-foreground">AI Builder</span>
                  <span className="ml-auto text-[10px] bg-primary text-foreground px-2 py-0.5 rounded-full font-semibold">25 credits</span>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">Describe your feature</p>
                    <div className="px-4 py-3 bg-background border border-border-light rounded-xl text-[13px] text-text-secondary italic">
                      &ldquo;I need a warranty tracker that links to completed jobs, tracks expiry dates, and sends reminders before warranties expire&rdquo;
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-foreground rounded-xl flex items-center justify-center text-[12px] text-white font-semibold">Build Feature</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">What AI can build</p>
                    {["Custom data collections", "Table & kanban views", "Automated triggers", "Connected to your data"].map((c) => (
                      <div key={c} className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <Check className="w-3 h-3 text-primary" />{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-white"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3"
            >
              Three steps. Your workspace.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px]"
            >
              No consultants. No migration headaches. No training videos.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Pick your industry", description: "We pre-select modules and settings that match your type of business. Makeup artist? Plumber? Consultant? We know what you need." },
              { num: "2", title: "Fine-tune it", description: "Toggle features on or off. Need invoicing but not bookings? Done. Want a lead pipeline but not marketing? Easy." },
              { num: "3", title: "Start working", description: "Your dashboard is ready with only what you selected. Add clients, send invoices, manage projects. Add more modules anytime from the sidebar." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{item.num}</span>
                </div>
                <h3 className="font-semibold text-foreground text-[17px] mb-2">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why not the others */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <motion.h2
                variants={sectionHeadingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={sectionTransition}
                className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4"
              >
                Why not just use<br />HubSpot or Monday?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.1, ...sectionTransition }}
                className="text-text-secondary text-[15px] leading-relaxed mb-8"
              >
                Because they weren&apos;t built for a 3-person landscaping crew or a solo makeup artist. You end up paying for 200 features and using 12.
              </motion.p>
              <div className="space-y-4">
                {[
                  { title: "No per-seat pricing", desc: "Your whole team gets access. Add people without doing math." },
                  { title: "Only your features", desc: "No hidden tabs, no locked modules, no 'upgrade to unlock' walls." },
                  { title: "Everything is customizable", desc: "Every module adapts to your workflow. Turn features on or off as your business grows." },
                  { title: "Add-ons, one click each", desc: "Need gift cards next month? Click install. Need treatment notes? Click install." },
                  { title: "Industry-native vocabulary", desc: "A plumber sees Jobs and Quotes. A physio sees Patients and Treatment Plans." },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
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
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  I was paying $180/mo for software I used 10% of. Magic gave me exactly what I needed for my salon in under 5 minutes.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">SK</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Sarah K.</p>
                    <p className="text-[11px] text-text-tertiary">Hair salon owner, Melbourne</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ delay: 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  Finally a platform that gets trades. Quote, invoice, track the job, done. No nonsense. The add-ons are a bonus.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">MR</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Mike R.</p>
                    <p className="text-[11px] text-text-tertiary">Electrician, Gold Coast</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ delay: 0.16, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  The client portal and gift cards changed everything. My clients book themselves, pay online, and gift cards sell themselves around the holidays.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">JT</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Jess T.</p>
                    <p className="text-[11px] text-text-tertiary">Business coach, Sydney</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-white"
      >
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground mb-3 leading-tight"
          >
            One plan. Everything included.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-text-secondary mb-10 text-[15px]"
          >
            No tiers. No per-user fees. No feature gates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-card-bg rounded-2xl border border-border-light p-8 text-left"
          >
            <div className="mb-6">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200, damping: 12 }}
                className="text-[40px] font-bold text-foreground inline-block"
              >
                $49
              </motion.span>
              <span className="text-text-secondary text-[15px]">/month</span>
            </div>
            <div className="space-y-3 mb-8">
              {[
                "Only the tools you need — nothing else",
                "200+ toggleable features included",
                "Add-ons — install anytime",
                "Unlimited team members",
                "AI Builder — 25 credits",
                "Priority email support",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-[14px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <motion.div
              variants={ctaPulseVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              <Link href="/onboarding">
                <Button size="lg" className="w-full cta-glow">
                  Start building <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
            <p className="text-[11px] text-text-tertiary mt-3 text-center">
              Extra integrations from $10/mo. AI credits from $5 per 10.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-16 bg-foreground"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[1.5rem] sm:text-[2rem] font-bold text-white mb-4 leading-tight"
          >
            Stop paying for features you don&apos;t use.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-white/50 mb-8 text-[15px]"
          >
            Build a workspace that actually fits your business in under 2 minutes.
          </motion.p>
          <motion.div
            variants={ctaPulseVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <Link href="/onboarding">
              <Button size="lg" className="px-10 bg-primary text-foreground hover:bg-primary-hover shadow-none hover:shadow-none cta-glow">
                Build my workspace <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-border-light py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
            </div>
            <span className="font-semibold text-foreground text-[13px]">Magic</span>
          </div>
          <p className="text-[12px] text-text-tertiary">
            &copy; {new Date().getFullYear()} Magic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
