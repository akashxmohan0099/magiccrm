"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Users, Receipt, Calendar, MessageCircle,
  FolderKanban, BarChart3, Star, Inbox, Megaphone, Headphones,
  FileText, CreditCard, Zap, Package, Crown, Camera, FileInput,
  ClipboardList, Gift, UserCheck, Store, Globe, Lightbulb, Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

// ── Core modules with key sub-features ──

const CORE_MODULES = [
  { icon: Users, name: "Clients", desc: "Profiles, tags, and full history", subs: ["Follow-up Reminders", "Birthday Alerts", "Import / Export", "Merge Duplicates"] },
  { icon: Inbox, name: "Leads & Pipeline", desc: "Capture, track, and convert", subs: ["Web Forms", "Auto-Assign", "Follow-up Reminders"] },
  { icon: MessageCircle, name: "Communication", desc: "Email, SMS, social — one inbox", subs: ["Canned Responses", "Scheduled Send", "After-Hours Auto-Reply"] },
  { icon: Calendar, name: "Bookings", desc: "Online scheduling with reminders", subs: ["Waitlist", "Deposits", "Buffer Time", "No-Show Protection"] },
  { icon: Receipt, name: "Invoicing", desc: "Quotes, invoices, and payments", subs: ["Tipping", "Partial Payments", "Auto Tax", "Late Reminders"] },
  { icon: FolderKanban, name: "Jobs & Projects", desc: "Tasks, stages, and deadlines", subs: ["Expense Tracking", "Time Tracking", "Recurring Jobs"] },
  { icon: Megaphone, name: "Marketing", desc: "Campaigns, promos, and reviews", subs: ["Email Sequences", "Social Scheduling", "Coupons"] },
  { icon: Headphones, name: "Support", desc: "Track and resolve requests", subs: ["Auto-Responses", "Satisfaction Ratings", "Knowledge Base"] },
  { icon: FileText, name: "Documents", desc: "Contracts, files, and signatures", subs: ["Templates", "E-Signatures"] },
  { icon: CreditCard, name: "Payments", desc: "Track who paid and who didn't", subs: ["Overdue Reminders", "Refund Tracking"] },
  { icon: Zap, name: "Automations", desc: "Let your CRM do the boring stuff", subs: ["Triggers", "Email Automations", "Scheduled Tasks"] },
  { icon: BarChart3, name: "Reporting", desc: "Dashboards and insights", subs: ["Export Reports", "Goal Tracking", "Custom Dashboards"] },
  { icon: Package, name: "Products", desc: "Your service and product catalog", subs: ["Categories", "Stock Tracking"] },
  { icon: Users, name: "Team", desc: "Manage staff, roles, and permissions", subs: ["Activity Log", "Workload View"] },
];

// ── Add-on modules ──

const ADDONS = [
  { icon: Globe, name: "Client Portal", desc: "Self-service hub for clients to view bookings, pay invoices, and message you.", tags: ["Self-Rebooking", "Secure Messaging", "Invoice Payments"] },
  { icon: Crown, name: "Memberships", desc: "Session packs, recurring plans, and member tracking with auto-billing.", tags: ["Session Credits", "Auto-Billing", "Freeze / Pause"] },
  { icon: Gift, name: "Loyalty & Referrals", desc: "Points per visit, referral codes, and reward tiers for repeat clients.", tags: ["Points System", "Punch Cards", "Referral Codes"] },
  { icon: UserCheck, name: "Win-Back", desc: "Detect lapsed clients and auto-send re-engagement messages.", tags: ["Lapsed Detection", "Auto-Send", "Discount Offers"] },
  { icon: Lightbulb, name: "AI Insights", desc: "Smart suggestions like overdue rebookings, revenue forecasts, and churn risk.", tags: ["Rebooking Alerts", "Revenue Forecast", "Weekly Digest"] },
  { icon: Store, name: "Storefront", desc: "A public page showcasing your services with pricing and booking links.", tags: ["Photo Gallery", "Reviews Display", "Business Info"] },
  { icon: FileInput, name: "Intake Forms", desc: "Custom questionnaires with conditional logic for client intake.", tags: ["Auto-Send", "E-Signature", "Pre-Fill"] },
  { icon: Camera, name: "Before & After", desc: "Capture proof of work with photos and digital checklists.", tags: ["Side-by-Side View", "Client Consent", "Share to Storefront"] },
  { icon: ClipboardList, name: "Treatment Notes", desc: "Structured SOAP notes for clinical treatment records.", tags: ["Note Templates", "Auto-Link Booking", "Practitioner Filter"] },
];

const INDUSTRIES = [
  "Beauty & Wellness", "Trades & Construction", "Professional Services",
  "Health & Fitness", "Creative & Design", "Hospitality & Events",
  "Education & Coaching", "Retail & E-commerce",
];

// ── Attachment showcase data ──

const ATTACHMENT_EXAMPLE = {
  module: "Bookings & Calendar",
  icon: Calendar,
  core: "Online booking page, automated reminders, availability management",
  attachments: [
    { name: "Waitlist", desc: "Clients queue for full slots", on: true },
    { name: "Deposits", desc: "Require payment at booking", on: true },
    { name: "Buffer Time", desc: "Padding between appointments", on: false },
    { name: "No-Show Fees", desc: "Charge repeat no-showers", on: false },
    { name: "Recurring", desc: "Repeat bookings on a schedule", on: true },
    { name: "Google Cal Sync", desc: "Two-way calendar sync", on: false },
  ],
};

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(0);
  const [attachmentToggles, setAttachmentToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(ATTACHMENT_EXAMPLE.attachments.map((a) => [a.name, a.on]))
  );
  const [expandedModule, setExpandedModule] = useState<string | null>(CORE_MODULES[0].name);
  const [selectedAddon, setSelectedAddon] = useState<number>(0);
  const [moduleAutoCycle, setModuleAutoCycle] = useState(true);
  const [moduleProgress, setModuleProgress] = useState(0);
  const moduleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleAttachment = (name: string) => {
    setAttachmentToggles((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const enabledAttachmentCount = Object.values(attachmentToggles).filter(Boolean).length;

  // Auto-cycle through modules
  useEffect(() => {
    if (!moduleAutoCycle) return;
    setModuleProgress(0);

    const progressInterval = setInterval(() => {
      setModuleProgress((p) => Math.min(p + 2, 100));
    }, 80);

    moduleTimerRef.current = setTimeout(() => {
      setExpandedModule((prev) => {
        const idx = CORE_MODULES.findIndex((m) => m.name === prev);
        return CORE_MODULES[(idx + 1) % CORE_MODULES.length].name;
      });
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      if (moduleTimerRef.current) clearTimeout(moduleTimerRef.current);
    };
  }, [expandedModule, moduleAutoCycle]);

  const selectModule = useCallback((name: string) => {
    setModuleAutoCycle(false);
    setExpandedModule(name);
  }, []);

  // Auto-toggle demo for attachment showcase
  useEffect(() => {
    const interval = setInterval(() => {
      const names = ATTACHMENT_EXAMPLE.attachments.map((a) => a.name);
      const randomName = names[Math.floor(Math.random() * names.length)];
      setAttachmentToggles((prev) => ({ ...prev, [randomName]: !prev[randomName] }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface/50 to-background pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <h1 className="text-[2rem] sm:text-[3.25rem] md:text-[3.75rem] font-bold text-foreground mb-6 leading-[1.08]">
            The CRM that fits<br />
            <span className="text-text-secondary">your business, not the other way around</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            23 modules. 207 toggleable features. One flat price. Tell us what you do and we&apos;ll assemble a CRM with only what you need.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Build my CRM <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[13px] text-text-tertiary">
              Free to set up. $49/mo when you&apos;re ready.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { num: "23", label: "Modules" },
              { num: "207", label: "Toggleable features" },
              { num: "43", label: "Personas supported" },
              { num: "$49", label: "Flat monthly" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-card-bg rounded-xl border border-border-light p-4 text-center"
              >
                <p className="text-[28px] sm:text-[32px] font-bold text-foreground leading-none">{stat.num}</p>
                <p className="text-[11px] text-text-tertiary mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry tags */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[13px] text-text-tertiary mb-4 font-medium">Built for</p>
          <div className="flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((industry) => (
              <span key={industry} className="px-3.5 py-1.5 bg-surface border border-border-light rounded-full text-[12px] font-medium text-text-secondary">
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Persona Comparison — side by side */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Same platform. Your language.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Your clients aren&apos;t &ldquo;contacts&rdquo;. Your work isn&apos;t &ldquo;deals&rdquo;.
              Magic CRM adapts its vocabulary, fields, and workflows to match how you actually run your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONA_PREVIEWS.map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                onClick={() => setActivePersona(i)}
                className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
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
      </section>

      {/* Core Modules — Visual Showcases */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              14 core modules, each with toggleable sub-features. Here&apos;s what they actually look like inside.
            </p>
          </div>

          {/* Interactive module selector with auto-cycle */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CORE_MODULES.map((mod) => {
              const isActive = expandedModule === mod.name;
              return (
                <button
                  key={mod.name}
                  onClick={() => selectModule(mod.name)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer overflow-hidden ${
                    isActive
                      ? "bg-foreground text-white shadow-sm"
                      : "bg-white text-text-secondary hover:text-foreground border border-border-light hover:border-foreground/15 hover:shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  {isActive && moduleAutoCycle && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] bg-white/40"
                      style={{ width: `${moduleProgress}%` }}
                    />
                  )}
                  <mod.icon className="w-3.5 h-3.5" />
                  {mod.name}
                </button>
              );
            })}
          </div>

          {/* Selected module detail */}
          <AnimatePresence mode="wait">
            {expandedModule && (() => {
              const mod = CORE_MODULES.find(m => m.name === expandedModule);
              if (!mod) return null;
              return (
                <motion.div
                  key={expandedModule}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl mx-auto mb-8"
                >
                  <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border-light flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <mod.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[16px] font-semibold text-foreground">{mod.name}</p>
                        <p className="text-[12px] text-text-tertiary">{mod.desc}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Toggleable features</p>
                      <div className="grid grid-cols-2 gap-2">
                        {mod.subs.map((sub) => (
                          <div key={sub} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border-light">
                            <div className="w-8 h-[18px] rounded-full bg-primary flex items-center justify-end px-0.5">
                              <div className="w-[14px] h-[14px] bg-white rounded-full shadow-sm" />
                            </div>
                            <span className="text-[12px] font-medium text-foreground">{sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4" style={{ display: expandedModule ? "none" : undefined }}>
            {/* Bookings preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-500" /></div>
                  <div><p className="text-[14px] font-semibold text-foreground">Bookings & Calendar</p><p className="text-[11px] text-text-tertiary">Online scheduling with reminders</p></div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} className="text-[10px] text-text-tertiary text-center font-medium">{d}</div>)}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} className={`text-[11px] text-center py-1 rounded-md ${
                      [4,5,11,12,18,19,25,26].includes(i) ? "text-text-tertiary" :
                      [7,14,21].includes(i) ? "bg-primary/15 text-foreground font-semibold" :
                      [8,15].includes(i) ? "bg-blue-50 text-blue-600 font-medium" :
                      "text-foreground"
                    }`}>{i + 1}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {[
                    { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" },
                    { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" },
                    { time: "2:00 PM", name: "Emma — Brow Lamination", color: "bg-blue-400" },
                  ].map((appt, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/50">
                      <div className={`w-1.5 h-6 rounded-full ${appt.color}`} />
                      <span className="text-[11px] text-text-tertiary w-16">{appt.time}</span>
                      <span className="text-[11px] text-foreground font-medium">{appt.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Online Booking Page", "Waitlist", "Deposits", "Buffer Time", "Reminders"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Pipeline preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Inbox className="w-4 h-4 text-purple-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Leads & Pipeline</p><p className="text-[11px] text-text-tertiary">Capture, track, and convert</p></div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { stage: "New", color: "bg-blue-400", items: ["Lisa M.", "Tom K."] },
                    { stage: "Contacted", color: "bg-yellow-400", items: ["Sarah P."] },
                    { stage: "Proposal", color: "bg-purple-400", items: ["James W.", "Mia L."] },
                    { stage: "Won", color: "bg-green-400", items: ["Zoe R."] },
                  ].map((col, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-2 h-2 rounded-full ${col.color}`} />
                        <span className="text-[10px] font-semibold text-text-tertiary uppercase">{col.stage}</span>
                      </div>
                      <div className="space-y-1.5">
                        {col.items.map((name, j) => (
                          <div key={j} className="bg-surface/70 rounded-lg px-2 py-1.5 text-[11px] text-foreground font-medium">{name}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Web Forms", "Follow-Ups", "Auto-Assign"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Invoicing preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><Receipt className="w-4 h-4 text-emerald-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Quotes & Invoicing</p><p className="text-[11px] text-text-tertiary">Quote the job, send the invoice, get paid</p></div>
              </div>
              <div className="p-4">
                <div className="bg-surface/30 rounded-xl p-3 border border-border-light">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">INV-0042</p>
                      <p className="text-[10px] text-text-tertiary">Sarah Mitchell</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">Pending</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {[
                      { item: "Classic Full Set", qty: "1", price: "$150" },
                      { item: "Lash Removal", qty: "1", price: "$25" },
                    ].map((line, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-text-secondary">{line.item} x{line.qty}</span>
                        <span className="text-foreground font-medium">{line.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border-light pt-2 flex justify-between">
                    <span className="text-[12px] font-semibold text-foreground">Total</span>
                    <span className="text-[14px] font-bold text-foreground">$175.00</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Quote Builder", "Templates", "Tipping", "Partial Payments", "Auto Tax"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Communication preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center"><MessageCircle className="w-4 h-4 text-orange-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Communication</p><p className="text-[11px] text-text-tertiary">Every conversation, one inbox</p></div>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: "Sarah M.", channel: "SMS", msg: "Hi! Can I reschedule my Thursday appt?", time: "2m ago", unread: true },
                  { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice, paid!", time: "1hr ago", unread: false },
                  { name: "Emma R.", channel: "Instagram", msg: "Do you have availability this Sat?", time: "3hr ago", unread: true },
                  { name: "Tom K.", channel: "WhatsApp", msg: "Sent you the before photos", time: "Yesterday", unread: false },
                ].map((conv, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${conv.unread ? "bg-primary/5" : "bg-surface/30"}`}>
                    <div className="w-7 h-7 bg-surface rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-foreground">{conv.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-foreground">{conv.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface text-text-tertiary">{conv.channel}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">{conv.msg}</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary flex-shrink-0">{conv.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Email", "SMS", "Instagram", "WhatsApp", "Canned Responses", "Scheduled Send"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Attachment showcase */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Every module goes deeper.
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Each module has toggleable features you can snap on or off. Like attachments on a tool — keep it simple, or kit it out.
              </p>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Need a waitlist for your salon? Toggle it on. Want deposit protection for no-shows? One switch. Don&apos;t need Google Calendar sync? Leave it off.
              </p>
              <p className="text-[14px] font-semibold text-foreground">
                207 toggleable features across 23 modules — you pick exactly what shows up.
              </p>
            </div>

            {/* Visual: Module with toggle switches */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card-bg rounded-2xl border border-border-light overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ATTACHMENT_EXAMPLE.icon className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{ATTACHMENT_EXAMPLE.module}</p>
                    <p className="text-[11px] text-text-tertiary">{ATTACHMENT_EXAMPLE.core}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {enabledAttachmentCount}/{ATTACHMENT_EXAMPLE.attachments.length} on
                </span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Try toggling — this is how it works inside the app</p>
                {ATTACHMENT_EXAMPLE.attachments.map((att, i) => {
                  const isOn = attachmentToggles[att.name] ?? att.on;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => toggleAttachment(att.name)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all ${isOn ? "bg-primary/5 border border-primary/15" : "bg-surface/50 hover:bg-surface"}`}
                    >
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{att.name}</p>
                        <p className="text-[11px] text-text-tertiary">{att.desc}</p>
                      </div>
                      <div className={`w-10 h-[22px] rounded-full flex items-center px-0.5 transition-all duration-200 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                        <motion.div layout className="w-[18px] h-[18px] bg-white rounded-full shadow-sm" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Add-ons — Visual Showcases */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              9 add-ons when you&apos;re ready for more.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Start simple. Add power later. One click from your sidebar — no setup, no downtime.
            </p>
          </div>

          {/* Hero add-ons with visual previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Client Portal preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #3B82F6" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/10"><Globe className="w-3.5 h-3.5 text-blue-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">Client Portal</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Your client sees</p>
                {[
                  { label: "Upcoming Bookings", value: "2 appointments" },
                  { label: "Outstanding Invoices", value: "$175.00 due" },
                  { label: "Shared Documents", value: "3 files" },
                  { label: "Messages", value: "1 unread" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-surface/50">
                    <span className="text-[11px] text-text-secondary">{row.label}</span>
                    <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Insights preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #F59E0B" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-500/10"><Lightbulb className="w-3.5 h-3.5 text-yellow-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">AI Insights</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">This week</p>
                {[
                  { text: "Sarah M. is 2 weeks overdue for her lash fill", border: "border-l-red-400", priority: "Action" },
                  { text: "Tom K. opened your quote 3x but hasn't responded", border: "border-l-yellow-400", priority: "Follow up" },
                  { text: "Tuesday afternoons are consistently empty", border: "border-l-blue-400", priority: "Opportunity" },
                ].map((insight, i) => (
                  <div key={i} className={`px-2.5 py-2 rounded-lg bg-surface/50 border-l-2 ${insight.border}`}>
                    <p className="text-[11px] text-foreground leading-snug">{insight.text}</p>
                    <span className="text-[9px] text-text-tertiary font-medium uppercase mt-0.5">{insight.priority}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Loyalty preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #10B981" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10"><Gift className="w-3.5 h-3.5 text-emerald-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">Loyalty & Referrals</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Top members</p>
                {[
                  { name: "Sarah M.", points: "420 pts", rank: "1" },
                  { name: "Emma R.", points: "310 pts", rank: "2" },
                  { name: "Jess T.", points: "185 pts", rank: "3" },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-surface/50">
                    <span className="text-[10px] font-bold text-text-tertiary w-4">{member.rank}.</span>
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">{member.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <span className="text-[11px] text-foreground font-medium flex-1">{member.name}</span>
                    <span className="text-[11px] font-semibold text-primary">{member.points}</span>
                  </div>
                ))}
                <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-primary font-medium">Referral code SARAH10 used 4 times this month</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Remaining add-ons — expandable grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ADDONS.filter(a => !["Client Portal", "AI Insights", "Loyalty & Referrals"].includes(a.name)).map((addon, i) => {
              const isExpanded = selectedAddon === i + 100;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedAddon(isExpanded ? -1 : i + 100)}
                  className={`bg-card-bg border rounded-xl cursor-pointer transition-all ${
                    isExpanded ? "border-primary/30 col-span-2 sm:col-span-2 p-4" : "border-border-light p-3 hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <addon.icon className={`w-4 h-4 flex-shrink-0 ${isExpanded ? "text-primary" : "text-text-secondary"}`} />
                    <span className="text-[12px] font-medium text-foreground truncate">{addon.name}</span>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-[11px] text-text-secondary mt-2 mb-2 leading-relaxed">{addon.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {addon.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-primary font-medium">{tag}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Three steps. Your CRM.
            </h2>
            <p className="text-text-secondary text-[15px]">No consultants. No migration headaches. No training videos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Pick your industry", description: "We pre-select modules and settings that match your type of business. Makeup artist? Plumber? Consultant? We know what you need." },
              { num: "2", title: "Fine-tune it", description: "Toggle features on or off. Need invoicing but not bookings? Done. Want a lead pipeline but not marketing? Easy." },
              { num: "3", title: "Start working", description: "Your dashboard is ready with only what you selected. Add clients, send invoices, manage projects. Add more modules anytime from the sidebar." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{item.num}</span>
                </div>
                <h3 className="font-semibold text-foreground text-[17px] mb-2">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not the others */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Why not just use<br />HubSpot or Monday?
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-8">
                Because they weren&apos;t built for a 3-person landscaping crew or a solo makeup artist. You end up paying for 200 features and using 12.
              </p>
              <div className="space-y-4">
                {[
                  { title: "No per-seat pricing", desc: "Your whole team gets access. Add people without doing math." },
                  { title: "Only your features", desc: "No hidden tabs, no locked modules, no 'upgrade to unlock' walls." },
                  { title: "207 features, all toggleable", desc: "Every feature is a switch. Flip it on when you need it, off when you don't." },
                  { title: "9 add-ons, one click each", desc: "Need a client portal next month? Click install. Need SOAP notes? Click install." },
                  { title: "Industry-native vocabulary", desc: "A plumber sees Jobs and Quotes. A physio sees Patients and Treatment Plans." },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
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
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  I was paying $180/mo for a CRM I used 10% of. Magic CRM gave me exactly what I needed for my salon in under 5 minutes.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">SK</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Sarah K.</p>
                    <p className="text-[11px] text-text-tertiary">Hair salon owner, Melbourne</p>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  Finally a CRM that gets trades. Quote, invoice, track the job, done. No nonsense. The add-ons are a bonus.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">MR</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Mike R.</p>
                    <p className="text-[11px] text-text-tertiary">Electrician, Gold Coast</p>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  The client portal made my coaching practice feel so professional. Clients love being able to see their sessions and pay from one place.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">JT</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Jess T.</p>
                    <p className="text-[11px] text-text-tertiary">Business coach, Sydney</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground mb-3 leading-tight">
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
                "23 modules — pick what you need",
                "207 toggleable features included",
                "9 add-ons — install anytime",
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
      <section className="py-12 sm:py-16 bg-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[1.5rem] sm:text-[2rem] font-bold text-white mb-4 leading-tight">
            Stop paying for features you don&apos;t use.
          </h2>
          <p className="text-white/50 mb-8 text-[15px]">
            Build a CRM that actually fits your business in under 2 minutes.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="px-10 bg-primary text-foreground hover:bg-primary-hover shadow-none hover:shadow-none">
              Build my CRM <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
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
