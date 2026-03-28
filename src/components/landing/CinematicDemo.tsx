"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import {
  Users, Inbox, MessageCircle, Calendar, Receipt, FolderKanban,
  Megaphone, Headphones, FileText, Zap, BarChart3,
  Package, UsersRound, SlidersHorizontal, Search, Check, Globe,
} from "lucide-react";

const MODULES = [
  { name: "Clients", icon: Users },
  { name: "Leads", icon: Inbox },
  { name: "Messages", icon: MessageCircle },
  { name: "Scheduling", icon: Calendar },
  { name: "Projects", icon: FolderKanban },
  { name: "Billing", icon: Receipt },
  { name: "Documents", icon: FileText },
  { name: "Products", icon: Package },
  { name: "Marketing", icon: Megaphone },
  { name: "Team", icon: UsersRound },
  { name: "Support", icon: Headphones },
  { name: "Client Portal", icon: Globe },
  { name: "Automations", icon: Zap },
  { name: "Reporting", icon: BarChart3 },
];

// ═══════════════════════════════════════════════════
// SECTION 1: Pick Your Modules
// ═══════════════════════════════════════════════════

// ── Persona presets for the module picker demo ──

const PERSONA_PRESETS = [
  { label: "Sarah", role: "Lash Tech", context: "Sarah does lash extensions and brow lamination. So she got Appointments (not generic bookings), a Service Menu (not a product catalog), and Receipts (not invoicing) \u2014 because that\u2019s how she works.", modules: ["Clients", "Inquiries", "Messages", "Appointments", "Receipts", "Services", "Marketing", "Automations", "Reporting"] },
  { label: "Tom", role: "Plumber", context: "Tom\u2019s clients call with emergencies. So he got Job Requests with urgency levels, Site Visits with property addresses, and a Job Board that tracks work from quote to sign-off.", modules: ["Customers", "Job Requests", "Messages", "Jobs", "Invoicing", "Documents", "Team", "Automations", "Reporting"] },
  { label: "Priya", role: "Consultant", context: "Priya runs a consulting practice. She got a prospect pipeline with Discovery Call stages, a Client Portal for deliverables, and monthly retainer billing.", modules: ["Clients", "Prospects", "Messages", "Sessions", "Projects", "Billing", "Documents", "Support", "Client Portal", "Automations", "Reporting"] },
  { label: "Jake", role: "Photographer", context: "Jake shoots weddings. He got Shoots with stages from Booked to Delivered, Wedding Inquiries with event dates and party size, and Photography Packages with day rates.", modules: ["Clients", "Inquiries", "Messages", "Sessions", "Shoots", "Invoicing", "Documents", "Packages", "Marketing", "Automations", "Reporting"] },
  { label: "Mia", role: "Gym Owner", context: "Mia runs a studio with trainers. She got Sessions with types (1-on-1, group, online), Programs instead of products, and a lead pipeline built for gyms.", modules: ["Clients", "Prospects", "Messages", "Sessions", "Payments", "Programs", "Marketing", "Team", "Automations", "Reporting"] },
];

const PERSONA_CYCLE_MS = 6000;

export function ModulePickerDemo() {
  const [paused, setPaused] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [enabledSet, setEnabledSet] = useState<Set<string>>(() => new Set(PERSONA_PRESETS[0].modules));
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [cursorPos, setCursorPos] = useState({ x: 160, y: 200 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume animation after 5s of no interaction
  const scheduleResume = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setPaused(false);
      setCursorVisible(true);
    }, 5000);
  }, []);

  // Auto-cycle through persona presets
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setActivePreset((prev) => {
        const next = (prev + 1) % PERSONA_PRESETS.length;
        setEnabledSet(new Set(PERSONA_PRESETS[next].modules));
        return next;
      });
    }, PERSONA_CYCLE_MS);
    return () => clearInterval(interval);
  }, [paused]);

  const selectPreset = (index: number) => {
    setPaused(true);
    setCursorVisible(false);
    setActivePreset(index);
    setEnabledSet(new Set(PERSONA_PRESETS[index].modules));
    scheduleResume();
  };

  const setModuleRef = useCallback((name: string) => (el: HTMLDivElement | null) => {
    moduleRefs.current[name] = el;
  }, []);

  // Cursor plays with unchecked modules — toggles one on, waits, toggles it off, moves to next
  useEffect(() => {
    if (paused) return;
    const getUnchecked = () => MODULES.map((m) => m.name).filter((n) => !enabledSet.has(n));
    let idx = 0;
    let phase: "move" | "click-on" | "pause" | "click-off" = "move";
    let currentTarget = "";

    const tick = () => {
      const unchecked = getUnchecked();
      if (unchecked.length === 0) return;

      if (phase === "move") {
        currentTarget = unchecked[idx % unchecked.length];
        const el = moduleRefs.current[currentTarget];
        const container = containerRef.current;
        if (el && container) {
          const cr = container.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          setCursorPos({ x: er.left - cr.left + 18, y: er.top - cr.top + er.height / 2 });
        }
        phase = "click-on";
      } else if (phase === "click-on") {
        setEnabledSet((prev) => new Set(prev).add(currentTarget));
        phase = "pause";
      } else if (phase === "pause") {
        phase = "click-off";
      } else if (phase === "click-off") {
        setEnabledSet((prev) => {
          const next = new Set(prev);
          next.delete(currentTarget);
          return next;
        });
        idx++;
        phase = "move";
      }
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [paused, enabledSet]);

  const toggleModule = (name: string) => {
    setPaused(true);
    setCursorVisible(false);
    setEnabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
    scheduleResume();
  };

  const activeCount = enabledSet.size;

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            See what you get.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto mb-6">
            Click a business type and see how their workspace looks. Same platform, completely different setup.
          </p>

          {/* Persona preset pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {PERSONA_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => selectPreset(i)}
                className={`px-4 py-2 rounded-full text-xs transition-all cursor-pointer ${
                  activePreset === i
                    ? "bg-foreground text-white shadow-md"
                    : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
                }`}
              >
                <span className="font-bold">{preset.role}</span>
                <span className={`ml-1.5 text-[10px] font-normal ${activePreset === i ? "text-white/50" : "text-text-tertiary"}`}>
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
        {/* Left hint — what's happening */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`pick-left-${activePreset}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="hidden xl:block absolute -left-52 top-12 w-44"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-white">{PERSONA_PRESETS[activePreset].label[0]}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{PERSONA_PRESETS[activePreset].label}</p>
                <p className="text-[11px] text-text-tertiary">{PERSONA_PRESETS[activePreset].role}</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {PERSONA_PRESETS[activePreset].context}
            </p>
            <p className="text-xs text-primary font-medium mt-2">
              {PERSONA_PRESETS[activePreset].modules.length} tools, shaped for {PERSONA_PRESETS[activePreset].role.toLowerCase()}s
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Right hint — what you can do */}
        <div className="hidden xl:block absolute -right-52 top-12 w-44">
          <p className="text-xs text-text-tertiary leading-relaxed mb-3">
            <span className="text-foreground font-semibold">Always flexible.</span> Turn any tool on or off at any time — your data stays safe.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-primary rounded-full" />
              <span className="text-xs text-text-secondary">On — shows in your sidebar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-border-light rounded-full" />
              <span className="text-xs text-text-secondary">Off — hidden, data preserved</span>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">$49/mo flat. All modules included. No per-feature fees.</p>
        </div>

        {/* Mobile fallback */}
        <div className="block md:hidden text-center py-8 px-4 bg-surface/50 rounded-2xl border border-border-light">
          <p className="text-sm text-text-secondary">Try the interactive demo on desktop for the full experience.</p>
        </div>

        <div
          ref={containerRef}
          className="relative rounded-2xl border border-border-light overflow-hidden shadow-xl bg-card-bg hidden md:block"
          onMouseEnter={() => { setPaused(true); setCursorVisible(false); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }}
          onMouseLeave={() => { setPaused(false); setCursorVisible(true); if (idleTimerRef.current) clearTimeout(idleTimerRef.current); }}
        >
          {/* Fake cursor */}
          {cursorVisible && !paused && (
            <motion.div
              className="absolute z-50 pointer-events-none"
              animate={{ x: cursorPos.x, y: cursorPos.y }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <MousePointer2 className="w-5 h-5 text-foreground fill-white" style={{ transform: "rotate(-2deg)" }} />
            </motion.div>
          )}

          <div className="flex" style={{ minHeight: 420 }}>
            {/* Left: Module checklist */}
            <div className="w-[340px] border-r border-border-light p-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-foreground">Your Modules</p>
                <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{activeCount} of {MODULES.length}</span>
              </div>
              <div className="space-y-1">
                {MODULES.map((mod) => {
                  const isOn = enabledSet.has(mod.name);
                  return (
                    <motion.div
                      key={mod.name}
                      ref={setModuleRef(mod.name)}
                      layout
                      onClick={() => toggleModule(mod.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer hover:bg-background ${
                        isOn ? "" : "opacity-40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                        isOn ? "bg-primary border-primary" : "border-gray-300 bg-card-bg"
                      }`}>
                        <AnimatePresence>
                          {isOn && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <mod.icon className={`w-4 h-4 transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary"}`} />
                      <span className={`text-[13px] font-medium transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary line-through"}`}>{mod.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live sidebar preview */}
            <div className="flex-1 bg-background flex flex-col">
              <div className="px-5 py-3 border-b border-border-light bg-card-bg flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                <span className="text-xs font-bold text-foreground">Only what you need</span>
                {!paused && <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
              </div>
              <div className="flex-1 bg-card-bg mx-4 my-4 rounded-xl border border-border-light overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                    <span className="text-[11px] font-bold text-foreground">Magic</span>
                  </div>
                </div>
                <nav className="px-2 py-2">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface text-[11px] font-medium text-foreground mb-0.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Dashboard
                  </div>
                  <AnimatePresence>
                    {MODULES.filter((m) => enabledSet.has(m.name)).map((mod) => (
                      <motion.div
                        key={mod.name}
                        initial={{ opacity: 0, x: -15, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        exit={{ opacity: 0, x: -15, height: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-text-secondary">
                          <mod.icon className="w-3.5 h-3.5" /> {mod.name}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </nav>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════
// SECTION 2: Customize Features
// ═══════════════════════════════════════════════════

// Module-specific data for the customize demo
const MODULE_DEMOS: Record<string, { features: string[]; desc: string; content: { type: string; data: Record<string, unknown>[] } }> = {
  Clients: { features: ["CSV Import", "Lifecycle Stages", "Follow-Up Reminders", "Birthday Alerts", "Custom Fields", "Referral Tracking"], desc: "Profiles, tags, and full client history",
    content: { type: "table", data: [{ name: "Sarah Mitchell", email: "sarah@email.com", status: "active" }, { name: "Jess Thompson", email: "jess@email.com", status: "active" }, { name: "Emma Roberts", email: "emma@email.com", status: "inactive" }, { name: "Tom Kennedy", email: "tom@email.com", status: "prospect" }] } },
  Leads: { features: ["Web Capture Forms", "Lead Scoring", "Custom Pipeline Stages", "Follow-Up Reminders", "Auto-Response", "Lead to Client Conversion"], desc: "Capture, score, and convert leads",
    content: { type: "kanban", data: [{ stage: "New", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", items: ["Sarah P."] }, { stage: "Proposal", items: ["James W."] }, { stage: "Won", items: ["Zoe R."] }] } },
  Messages: { features: ["Email", "SMS", "Instagram DMs", "WhatsApp", "Bulk Messaging", "After-Hours Auto-Reply"], desc: "Every channel, one inbox",
    content: { type: "inbox", data: [{ name: "Sarah M.", channel: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", channel: "Instagram", msg: "Saturday availability?", time: "3hr" }] } },
  Scheduling: { features: ["Online Booking Page", "Walk-In Queue", "Rebooking Prompts", "Booking Deposits", "No-Show Protection", "Satisfaction Rating"], desc: "Bookings, calendar, and reminders",
    content: { type: "appointments", data: [{ time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" }, { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" }, { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" }] } },
  Projects: { features: ["Billable Rate Tracking", "Expense Tracking", "Client Approval", "Profitability Summary", "Job Templates", "Recurring Jobs"], desc: "Tasks, time tracking, and deadlines",
    content: { type: "table", data: [{ name: "Kitchen renovation", email: "In Progress", status: "high" }, { name: "Bathroom refit", email: "Quoted", status: "medium" }, { name: "Garden lights", email: "Complete", status: "low" }] } },
  Billing: { features: ["Invoices", "Quotes", "Proposals", "Milestone Billing", "Payment Plans", "Aging Report"], desc: "Quotes, invoices, proposals — all in one",
    content: { type: "table", data: [{ name: "INV-001 Sarah M.", email: "$175", status: "paid" }, { name: "INV-002 Jess T.", email: "$200", status: "sent" }, { name: "PROP-001 Tom K.", email: "$4,500", status: "viewed" }] } },
  Documents: { features: ["Contract Templates", "E-Signatures", "Version History", "Expiry Tracking", "Auto-Attach to Job", "Document Tags"], desc: "Contracts, files, and signatures",
    content: { type: "table", data: [{ name: "Service Agreement.pdf", email: "Contract", status: "signed" }, { name: "NDA — Tom K.pdf", email: "NDA", status: "pending" }] } },
  Marketing: { features: ["Email Sequences", "Social Scheduling", "Review Collection", "Coupon Codes", "Audience Segmentation", "Referral Program"], desc: "Campaigns, sequences, and reviews",
    content: { type: "table", data: [{ name: "Summer Promo", email: "Email Campaign", status: "sent" }, { name: "New Year Offer", email: "Email Campaign", status: "draft" }] } },
  Team: { features: ["Module Access Control", "Role Templates", "Workload View", "Shift Scheduling", "Performance Dashboard", "Team Discussions"], desc: "Staff, roles, and assignments",
    content: { type: "table", data: [{ name: "You", email: "Owner", status: "online" }, { name: "Alex K.", email: "Stylist", status: "online" }, { name: "Mia L.", email: "Junior", status: "offline" }] } },
  Support: { features: ["Auto-Responses", "Satisfaction Ratings", "Knowledge Base", "SLA Tracking", "Ticket to Job Conversion", "Priority Levels"], desc: "Track and resolve client requests",
    content: { type: "table", data: [{ name: "TK-001", email: "Booking issue", status: "open" }, { name: "TK-002", email: "Invoice query", status: "resolved" }] } },
  Automations: { features: ["Recurring Task Templates", "Email Automations", "Conditional Logic", "Trigger Rules", "Activity Triggers", "Automation Log"], desc: "Automate repetitive work",
    content: { type: "table", data: [{ name: "Welcome email", email: "New client added", status: "active" }, { name: "Follow-up", email: "No booking 30d", status: "active" }] } },
  Reporting: { features: ["Revenue Breakdown", "Client Retention", "Lead Conversion", "Tax Summary", "Profit & Loss", "Goal Tracking"], desc: "Dashboards and business insights",
    content: { type: "table", data: [{ name: "Revenue", email: "$4,280", status: "+12%" }, { name: "Clients", email: "47", status: "+3" }] } },
  Products: { features: ["Duration Variants", "Service Add-Ons", "Cost Margins", "Inventory Tracking", "Bundles", "Allergen Info"], desc: "Your service and product catalog",
    content: { type: "table", data: [{ name: "Classic Full Set", email: "$150", status: "active" }, { name: "Volume Full Set", email: "$200", status: "active" }] } },
  "Client Portal": { features: ["View Bookings", "Pay Invoices", "Track Job Progress", "Shared Documents", "Messages", "Custom Branding"], desc: "Self-service hub for your clients",
    content: { type: "table", data: [{ name: "Upcoming Bookings", email: "2 appointments", status: "active" }, { name: "Outstanding Invoices", email: "$175 due", status: "sent" }] } },
};

// ── Module info cards (shown outside the demo frame) ──

const MODULE_INFO: Record<string, { headline: string; detail: string; stat?: string; statLabel?: string }> = {
  Clients: { headline: "Customize how you track clients", detail: "From follow-up reminders and birthday alerts to lifecycle stages and referral tracking — choose what matters to your business. Add your own custom fields too." },
  Leads: { headline: "Your pipeline, your rules", detail: "From lead scoring and auto-response to custom pipeline stages — configure how leads flow through your business. Every step is yours to define." },
  Messages: { headline: "Pick your channels, set your rules", detail: "From email and SMS to Instagram DMs and WhatsApp — turn on the channels you use. Add bulk messaging, canned responses, and auto-replies as you need them." },
  Scheduling: { headline: "Bookings built around your workflow", detail: "From online booking pages and deposits to walk-in queues and rebooking prompts — every scheduling feature is a toggle. Turn on what fits your business." },
  Projects: { headline: "Track work your way", detail: "From billable rate tracking and expense logging to client approval gates and profitability summaries — build the project workflow that matches how you actually work." },
  Billing: { headline: "Invoices, quotes, and proposals — unified", detail: "Three tools in one module. From milestone billing and payment plans to branded proposals with e-signature — everything your billing needs, toggled on when you need it." },
  Documents: { headline: "Contracts and files, simplified", detail: "From contract templates with merge fields to e-signatures and expiry alerts — manage your documents without leaving your workspace. Auto-attach to jobs as you go." },
  Marketing: { headline: "Grow without extra tools", detail: "From email sequences and social scheduling to review collection and referral programs — your marketing stack lives inside your workspace. No extra subscriptions." },
  Team: { headline: "Everyone sees only what they need", detail: "From module-level access control to role templates and performance dashboards — set up your team so everyone has exactly the tools they need, nothing more." },
  Support: { headline: "Help desk that converts", detail: "From auto-responses and SLA tracking to knowledge base and ticket-to-job conversion — handle client issues and turn them into billable work." },
  Automations: { headline: "Automate the repetitive stuff", detail: "From trigger rules and email automations to recurring task templates — set up once and let your workspace handle the follow-ups, reminders, and status updates." },
  Reporting: { headline: "See what matters, skip what doesn\u2019t", detail: "From revenue breakdown and client retention to tax summaries and profit & loss — choose the dashboards that help you make decisions. Skip the noise." },
  Products: { headline: "Your catalog, pre-loaded", detail: "From duration variants and service add-ons to cost margins and allergen info — your service catalog comes pre-loaded for your industry. Customize from there." },
  "Client Portal": { headline: "Let clients help themselves", detail: "From viewing bookings and paying invoices to tracking job progress — give clients a branded self-service hub. Choose exactly what they can see and do." },
};

// Left-side info: what the module does (points from sidebar)
const MODULE_LEFT_INFO: Record<string, { title: string; points: string[] }> = {
  Clients: { title: "Client Database", points: ["Full contact profiles", "Service history & notes", "Tags, segments, lifecycle stages", "CSV import with smart mapping"] },
  Leads: { title: "Lead Pipeline", points: ["Capture from web, social, referrals", "Visual pipeline with custom stages", "Auto-score & prioritize leads", "One-click convert to client"] },
  Messages: { title: "Unified Inbox", points: ["Email, SMS, Instagram, WhatsApp", "Canned responses & templates", "Schedule messages in advance", "Auto-reply outside hours"] },
  Scheduling: { title: "Booking System", points: ["Online booking page", "Walk-in queue management", "Deposits & no-show protection", "Auto rebooking reminders"] },
  Projects: { title: "Job Tracking", points: ["Task lists with checklists", "Time tracking with billable rates", "Expense logging per job", "Client approval at each stage"] },
  Billing: { title: "Billing Hub", points: ["Invoices with status tracking", "Quotes with version history", "Branded proposals with e-sign", "Milestone & deposit billing"] },
  Documents: { title: "Document Manager", points: ["Contract templates with merge fields", "E-signatures built in", "Auto-attach to jobs", "Expiry alerts & version history"] },
  Marketing: { title: "Marketing Suite", points: ["Email sequences & campaigns", "Social media scheduling", "Review collection automation", "Coupon codes & referral program"] },
  Team: { title: "Team Management", points: ["Module-level access control", "Role templates per industry", "Workload & performance views", "Internal discussion threads"] },
  Support: { title: "Help Desk", points: ["Ticket tracking with SLA timers", "Auto-responses & routing", "Knowledge base for self-service", "Convert tickets to billable jobs"] },
  Automations: { title: "Workflow Engine", points: ["If-this-then-that triggers", "Email automation flows", "Recurring task templates", "Activity-based actions"] },
  Reporting: { title: "Business Insights", points: ["Revenue & profit dashboards", "Client retention tracking", "Lead conversion reports", "Tax summary & P&L"] },
  Products: { title: "Service Catalog", points: ["Services with duration variants", "Add-on upsell options", "Cost margins & stock tracking", "Pre-loaded per industry"] },
  "Client Portal": { title: "Client Portal", points: ["Branded self-service hub", "View & manage bookings", "Pay invoices online", "Track job progress"] },
};

const CUSTOMIZE_TICK_MS = 3500;

export function FeatureCustomizeDemo() {
  const [paused, setPaused] = useState(false);
  const [activeModule, setActiveModule] = useState("Scheduling");
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});
  const autoFeatureIdx = useRef(0);
  const containerRef2 = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [cursorPos2, setCursorPos2] = useState({ x: 700, y: 200 });
  const [cursorVisible2, setCursorVisible2] = useState(true);
  const idleTimerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleResume2 = useCallback(() => {
    if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current);
    idleTimerRef2.current = setTimeout(() => {
      setPaused(false);
      setCursorVisible2(true);
    }, 5000);
  }, []);

  const setFeatureRef = useCallback((name: string) => (el: HTMLDivElement | null) => {
    featureRefs.current[name] = el;
  }, []);

  // Initialize feature states when module changes
  useEffect(() => {
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const initial: Record<string, boolean> = {};
    demo.features.forEach((f, i) => { initial[f] = i < 2; });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFeatureStates(initial);
    autoFeatureIdx.current = 0;
  }, [activeModule]);

  // Auto-play: move cursor to toggle, then click
  useEffect(() => {
    if (paused) return;
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    let clickTimeout: NodeJS.Timeout;

    const tick = () => {
      const feature = demo.features[autoFeatureIdx.current % demo.features.length];
      const el = featureRefs.current[feature];
      const container = containerRef2.current;
      if (el && container) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // Move to the toggle switch area (right side)
        setCursorPos2({
          x: elRect.right - containerRect.left - 14,
          y: elRect.top - containerRect.top + elRect.height / 2,
        });
      }
      clickTimeout = setTimeout(() => {
        setFeatureStates((prev) => ({ ...prev, [feature]: !prev[feature] }));
        autoFeatureIdx.current++;
      }, 600);
    };

    tick();
    const interval = setInterval(tick, CUSTOMIZE_TICK_MS);
    return () => { clearInterval(interval); clearTimeout(clickTimeout); };
  }, [paused, activeModule]);

  const toggleFeature = (name: string) => {
    setPaused(true);
    setCursorVisible2(false);
    setFeatureStates((prev) => ({ ...prev, [name]: !prev[name] }));
    scheduleResume2();
  };

  const selectModule = (name: string) => {
    setPaused(true);
    setCursorVisible2(false);
    setActiveModule(name);
    scheduleResume2();
  };

  const demo = MODULE_DEMOS[activeModule];
  const enabledCount = demo ? demo.features.filter((f) => featureStates[f]).length : 0;

  const info = MODULE_INFO[activeModule];
  const leftInfo = MODULE_LEFT_INFO[activeModule];
  // Track the active sidebar item's position via DOM measurement
  const sidebarNavRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [leftCardTop, setLeftCardTop] = useState(150);

  useEffect(() => {
    const el = sidebarNavRefs.current[activeModule];
    const container = containerRef2.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setLeftCardTop(elRect.top - containerRect.top + elRect.height / 2 - 40);
    }
  }, [activeModule]);

  return (
    <section className="py-12 sm:py-20 bg-card-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            Every tool is set up for how you work.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto">
            Every field, every feature, every workflow — set up based on what you told us. Nothing you didn&apos;t ask for.
          </p>
        </div>

        <div className="relative">
        {/* Floating info card — LEFT side (about the module) */}
        {leftInfo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${activeModule}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0, top: leftCardTop }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, top: { type: "spring", stiffness: 200, damping: 25 } }}
              className="hidden xl:block absolute -left-60 w-52"
              style={{ top: leftCardTop }}
            >
              <div className="bg-card-bg rounded-2xl border border-border-light shadow-lg p-5">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-2">{leftInfo.title}</p>
                <ul className="space-y-1.5">
                  {leftInfo.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-[11px] text-text-secondary leading-snug">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-3 h-3 bg-card-bg border-r border-t border-border-light rotate-45 absolute -right-1.5 top-8" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Floating info card — RIGHT side (about customization) */}
        {info && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${activeModule}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="hidden xl:block absolute -right-60 top-20 w-52"
            >
              <div className="bg-card-bg rounded-2xl border border-border-light shadow-lg p-5">
                <h4 className="text-[13px] font-bold text-foreground leading-snug mb-2">{info.headline}</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">{info.detail}</p>
              </div>
              <div className="w-3 h-3 bg-card-bg border-l border-b border-border-light rotate-45 absolute -left-1.5 top-8" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Mobile fallback */}
        <div className="block md:hidden text-center py-8 px-4 bg-surface/50 rounded-2xl border border-border-light">
          <p className="text-sm text-text-secondary">Try the interactive demo on desktop for the full experience.</p>
        </div>

        <div
          ref={containerRef2}
          className="relative rounded-2xl border border-border-light overflow-hidden shadow-2xl bg-background hidden md:block"
          onMouseEnter={() => { setPaused(true); setCursorVisible2(false); if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current); }}
          onMouseLeave={() => { setPaused(false); setCursorVisible2(true); if (idleTimerRef2.current) clearTimeout(idleTimerRef2.current); }}
        >
          {/* Fake cursor */}
          {cursorVisible2 && !paused && (
            <motion.div
              className="absolute z-50 pointer-events-none"
              animate={{ x: cursorPos2.x, y: cursorPos2.y }}
              transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
            >
              <MousePointer2 className="w-5 h-5 text-foreground fill-white" style={{ transform: "rotate(-2deg)" }} />
            </motion.div>
          )}
          {/* Browser chrome */}
          <div className="bg-card-bg border-b border-border-light px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
            <div className="flex-1 flex justify-center"><div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">app.usemagic.com</div></div>
            {!paused && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
          </div>

          <div className="flex" style={{ height: 440 }}>
            {/* Sidebar — clickable */}
            <div className="w-[170px] bg-card-bg border-r border-border-light flex flex-col flex-shrink-0">
              <div className="px-3 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{backgroundColor:"var(--logo-green)"}}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div>
                  <span className="text-[10px] font-bold text-foreground">Magic</span>
                </div>
              </div>
              <nav className="flex-1 px-2 py-2 overflow-y-auto">
                {MODULES.filter((m) => MODULE_DEMOS[m.name]).map((mod) => (
                  <div
                    key={mod.name}
                    ref={(el) => { sidebarNavRefs.current[mod.name] = el; }}
                    onClick={() => selectModule(mod.name)}
                    className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors ${
                      mod.name === activeModule ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary hover:text-foreground hover:bg-background"
                    }`}
                  >
                    {mod.name === activeModule && (
                      <motion.div layoutId="demo-active-bar" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3 bg-primary rounded-r-full" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                    )}
                    <mod.icon className="w-3.5 h-3.5" /> {mod.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main content — dynamic based on active module */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="bg-card-bg border-b border-border-light px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="px-3 py-1 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-40 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Search...
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Customize <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-full">{enabledCount}/{demo?.features.length ?? 0}</span>
                  </div>
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"><span className="text-[7px] font-bold text-white">M</span></div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Module page content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-[15px] font-bold text-foreground">{activeModule}</h3>
                          <p className="text-[10px] text-text-tertiary">{demo?.desc}</p>
                        </div>
                        <div className="px-3 py-1.5 bg-foreground text-white rounded-xl text-[10px] font-semibold">+ New</div>
                      </div>

                      {/* Module-specific reactive content */}
                      <DemoContent module={activeModule} features={featureStates} data={demo?.content} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Customize panel — dynamic */}
                <div className="w-[220px] bg-card-bg border-l border-border-light flex-shrink-0 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-xs font-bold text-foreground">Customize</p>
                    <p className="text-[9px] text-text-tertiary">{activeModule} features</p>
                  </div>
                  <div className="p-3 space-y-1">
                    {demo?.features.map((f) => {
                      const isOn = featureStates[f] ?? false;
                      return (
                        <div key={f} ref={setFeatureRef(f)} onClick={() => toggleFeature(f)} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all duration-300 cursor-pointer hover:bg-background ${isOn ? "bg-primary/5" : ""}`}>
                          <span className={`text-[10px] font-medium transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary"}`}>{f}</span>
                          <div className={`w-7 h-[15px] rounded-full flex items-center px-0.5 transition-all duration-300 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                            <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-[11px] h-[11px] bg-card-bg rounded-full shadow-sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-[13px] text-text-tertiary mt-6 max-w-lg mx-auto leading-relaxed">
          This is a preview of how the platform works — representing a fraction of the 200+ features available. Your actual workspace will be tailored to your industry and business needs.
        </p>
      </div>
    </section>
  );
}

// ── Reactive content renderer ──
function DemoContent({ module, features, data }: { module: string; features: Record<string, boolean>; data?: { type: string; data: Record<string, unknown>[] } }) {
  const f = (name: string) => features[name] ?? false;

  // Billing tab state
  const billingTabs = useMemo(() => {
    if (module !== "Billing") return [];
    const tabs: string[] = [];
    if (f("Invoices")) tabs.push("Invoices");
    if (f("Quotes")) tabs.push("Quotes");
    if (f("Proposals")) tabs.push("Proposals");
    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, features]);

  const [demoTab, setDemoTab] = useState("Invoices");

  // Auto-switch to a valid tab when tabs change
  useEffect(() => {
    if (module !== "Billing") return;
    if (billingTabs.length > 0 && !billingTabs.includes(demoTab)) {
      setDemoTab(billingTabs[0]);
    }
    // When a new tab appears, auto-select it to show the change
    if (billingTabs.length > 0) {
      const lastAdded = billingTabs[billingTabs.length - 1];
      if (lastAdded !== "Invoices") setDemoTab(lastAdded);
    }
  }, [billingTabs, module, demoTab]);

  if (module === "Billing") {
    const invoices = [
      { num: "INV-001", client: "Sarah M.", amount: 175, status: "paid", aging: "Current" },
      { num: "INV-002", client: "Jess T.", amount: 200, status: "sent", aging: "30 days" },
      { num: "INV-003", client: "Emma R.", amount: 95, status: "overdue", aging: "60 days" },
    ];
    const quotes = [
      { num: "QT-001", client: "Tom K.", amount: 4500, status: "pending" },
      { num: "QT-002", client: "Lisa M.", amount: 1200, status: "accepted" },
    ];
    const proposals = [
      { num: "PROP-001", client: "James W.", amount: 8500, status: "Sent" },
      { num: "PROP-002", client: "Zoe R.", amount: 3200, status: "Viewed" },
      { num: "PROP-003", client: "Sarah M.", amount: 6000, status: "Accepted" },
    ];

    const nothingOn = billingTabs.length === 0;

    return (
      <div>
        {/* Tab pills */}
        {billingTabs.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            <AnimatePresence>
              {billingTabs.map((tab) => (
                <motion.button
                  key={tab}
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setDemoTab(tab)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    demoTab === tab ? "bg-foreground text-white" : "bg-background border border-border-light text-text-secondary hover:text-foreground"
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {nothingOn && (
          <div className="py-8 text-center text-[11px] text-text-tertiary">Turn on Invoices, Quotes, or Proposals to see billing content.</div>
        )}

        {/* Invoices tab */}
        <AnimatePresence mode="wait">
          {demoTab === "Invoices" && f("Invoices") && (
            <motion.div key="invoices-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 60px ${f("Aging Report") ? "55px " : ""}${f("Payment Plans") ? "70px " : ""}55px` }}>
                  <span>Invoice</span><span>Amount</span>
                  {f("Aging Report") && <span>Aging</span>}
                  {f("Payment Plans") && <span>Plan</span>}
                  <span>Status</span>
                </motion.div>
                {invoices.map((inv, idx) => (
                  <motion.div layout key={inv.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 60px ${f("Aging Report") ? "55px " : ""}${f("Payment Plans") ? "70px " : ""}55px` }}>
                    <div>
                      <span className="font-medium text-foreground">{inv.num} <span className="text-text-tertiary font-normal">{inv.client}</span></span>
                      {f("Milestone Billing") && idx === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "75%" }} /></div>
                          <span className="text-[8px] text-emerald-600 font-medium">3/4 milestones</span>
                        </motion.div>
                      )}
                    </div>
                    <span className="font-medium text-foreground">${inv.amount}</span>
                    {f("Aging Report") && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded font-medium w-fit ${inv.aging === "Current" ? "bg-emerald-50 text-emerald-700" : inv.aging === "30 days" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>{inv.aging}</motion.span>
                    )}
                    {f("Payment Plans") && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-primary font-medium">{idx === 1 ? "2 of 4" : "—"}</motion.span>
                    )}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{inv.status}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quotes tab */}
          {demoTab === "Quotes" && f("Quotes") && (
            <motion.div key="quotes-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: "1fr 70px 55px" }}>
                  <span>Quote</span><span>Amount</span><span>Status</span>
                </div>
                {quotes.map((qt) => (
                  <div key={qt.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: "1fr 70px 55px" }}>
                    <span className="font-medium text-foreground">{qt.num} <span className="text-text-tertiary font-normal">{qt.client}</span></span>
                    <span className="font-medium text-foreground">${qt.amount.toLocaleString()}</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${qt.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{qt.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Proposals tab */}
          {demoTab === "Proposals" && f("Proposals") && (
            <motion.div key="proposals-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: "1fr 70px 60px" }}>
                  <span>Proposal</span><span>Value</span><span>Status</span>
                </div>
                {proposals.map((p) => (
                  <div key={p.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: "1fr 70px 60px" }}>
                    <span className="font-medium text-foreground">{p.num} <span className="text-text-tertiary font-normal">{p.client}</span></span>
                    <span className="font-medium text-foreground">${p.amount.toLocaleString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium w-fit ${p.status === "Accepted" ? "bg-emerald-50 text-emerald-700" : p.status === "Viewed" ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-700"}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Scheduling") {
    const appts = [
      { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400", done: true },
      { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400", done: false },
      { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400", done: false },
    ];
    return (
      <div>
        {f("Online Booking Page") && (
          <motion.div key="Online Booking Page" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 rounded-lg border border-primary/15 overflow-hidden">
            <div className="px-3 py-1.5 bg-primary/5 flex items-center justify-between">
              <span className="text-[10px] text-primary font-medium">Public booking page</span>
              <span className="text-[8px] text-primary/50 bg-primary/10 px-1.5 py-0.5 rounded">Live</span>
            </div>
            <div className="px-3 py-2 bg-card-bg text-[9px] space-y-1">
              <div className="flex items-center justify-between"><span className="text-text-secondary">yourname.magic/book</span><span className="text-primary font-medium underline">Copy link</span></div>
              <div className="flex gap-1">{["Lash Fill — $80", "Volume Set — $200"].map(s => <span key={s} className="px-1.5 py-0.5 bg-background border border-border-light rounded text-[8px] text-text-tertiary">{s}</span>)}</div>
            </div>
          </motion.div>
        )}
        <div className="space-y-1.5 mb-2">
          {appts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg border border-border-light">
              <div className={`w-1 h-5 rounded-full ${a.color}`} />
              <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
              <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
              {f("Booking Deposits") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">$30 dep</motion.span>}
              {f("Satisfaction Rating") && a.done && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-yellow-500">&#9733;&#9733;&#9733;&#9733;&#9733;</motion.span>}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Walk-In Queue") && (
            <motion.div key="Walk-In Queue" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-purple-800">Walk-ins</span>
                  <span className="text-[8px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">3 waiting</span>
                </div>
                <div className="space-y-1">
                  {["Amy L. — 12min", "David R. — 5min", "Nina S. — 1min"].map((w) => (
                    <div key={w} className="flex items-center gap-2 text-[9px] text-purple-700">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />{w}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {f("Rebooking Prompts") && (
            <motion.div key="Rebooking Prompts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><Calendar className="w-3 h-3 text-blue-600" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-blue-800">Rebooking reminder</p>
                  <p className="text-[9px] text-blue-600">Sarah M. hasn&#39;t rebooked in 4 weeks — send prompt?</p>
                </div>
                <span className="text-[8px] px-2 py-1 bg-blue-600 text-white rounded-lg font-medium">Send</span>
              </div>
            </motion.div>
          )}
          {f("No-Show Protection") && (
            <motion.div key="No-Show Protection" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[10px]">!</span></div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-red-700">No-show warning</p>
                  <p className="text-[9px] text-red-600">Tom K. — 2 no-shows this month. Deposit required for next booking.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Clients") {
    const clients = [
      { name: "Sarah Mitchell", email: "sarah@email.com", stage: "VIP", status: "active", reminder: "Follow up Fri" },
      { name: "Jess Thompson", email: "jess@email.com", stage: "Active", status: "active", reminder: "" },
      { name: "Emma Roberts", email: "emma@email.com", stage: "At Risk", status: "inactive", reminder: "Overdue 7d" },
      { name: "Tom Kennedy", email: "tom@email.com", stage: "New", status: "prospect", reminder: "Call today" },
    ];
    return (
      <div>
        {/* Header row with optional Import button */}
        <AnimatePresence>
          {f("CSV Import") && (
            <motion.div key="CSV Import" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="flex items-center justify-end gap-1.5">
                <span className="px-2.5 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary font-medium cursor-pointer hover:bg-surface">Import CSV</span>
                <span className="px-2.5 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary font-medium cursor-pointer hover:bg-surface">Export</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr ${f("Custom Fields") ? "70px " : ""}${f("Lifecycle Stages") ? "55px " : ""}${f("Follow-Up Reminders") ? "70px " : ""}50px` }}>
            <span>Client</span>
            {f("Custom Fields") && <span>Company</span>}
            {f("Lifecycle Stages") && <span>Stage</span>}
            {f("Follow-Up Reminders") && <span>Follow-Up</span>}
            <span>Status</span>
          </motion.div>
          {clients.map((c) => (
            <motion.div layout key={c.name} className="grid px-3 py-1.5 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr ${f("Custom Fields") ? "70px " : ""}${f("Lifecycle Stages") ? "55px " : ""}${f("Follow-Up Reminders") ? "70px " : ""}50px` }}>
              <div className="min-w-0">
                <span className="font-medium text-foreground truncate block">{c.name}</span>
                <span className="text-[9px] text-text-tertiary">{c.email}</span>
              </div>
              {f("Custom Fields") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary truncate">{c.name === "Sarah Mitchell" ? "Bloom Co." : c.name === "Tom Kennedy" ? "TK Media" : "—"}</motion.span>}
              {f("Lifecycle Stages") && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium w-fit ${
                  c.stage === "VIP" ? "bg-purple-50 text-purple-700" : c.stage === "Active" ? "bg-emerald-50 text-emerald-700" : c.stage === "At Risk" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                }`}>{c.stage}</motion.span>
              )}
              {f("Follow-Up Reminders") && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
                  c.reminder ? (c.reminder.includes("Overdue") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600") : "text-text-tertiary"
                }`}>{c.reminder || "—"}</motion.span>
              )}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"}`}>{c.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Birthday Alerts") && <motion.div key="Birthday Alerts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-[10px] text-pink-700">Sarah Mitchell&#39;s birthday is in 3 days — send a greeting?</div></motion.div>}
          {f("Referral Tracking") && <motion.div key="Referral Tracking" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Tom Kennedy referred by <span className="font-medium text-foreground">Sarah Mitchell</span> — 2 referrals this month</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Leads") {
    const stages = [{ stage: "New", color: "bg-blue-400", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", color: "bg-yellow-400", items: ["Sarah P."] }, { stage: "Proposal", color: "bg-purple-400", items: ["James W."] }, { stage: "Won", color: "bg-green-400", items: ["Zoe R."] }];
    return (
      <div>
        <AnimatePresence>{f("Web Capture Forms") && <motion.div key="Web Capture Forms" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary font-medium">Web form active — share your capture link</div></motion.div>}</AnimatePresence>
        <div className="grid grid-cols-4 gap-1.5">
          {stages.map((col) => (
            <div key={col.stage}>
              <div className="flex items-center gap-1 mb-1.5"><div className={`w-2 h-2 rounded-full ${col.color}`} /><span className="text-[9px] font-semibold text-text-tertiary uppercase">{col.stage}</span></div>
              {col.items.map((item, idx) => (
                <div key={item} className="bg-card-bg rounded-lg px-2 py-1.5 mb-1 border border-border-light">
                  <p className="text-[10px] font-medium text-foreground">{item}</p>
                  {f("Lead Scoring") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-0.5"><div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${col.stage === "Won" ? "bg-emerald-400" : col.stage === "Proposal" ? "bg-purple-400" : idx === 0 ? "bg-red-400" : "bg-yellow-400"}`} style={{ width: `${col.stage === "Won" ? 95 : col.stage === "Proposal" ? 72 : idx === 0 ? 85 : 40}%` }} /></div><span className={`text-[7px] font-bold ${col.stage === "Won" ? "text-emerald-600" : col.stage === "Proposal" ? "text-purple-600" : idx === 0 ? "text-red-600" : "text-yellow-600"}`}>{col.stage === "Won" ? 95 : col.stage === "Proposal" ? 72 : idx === 0 ? 85 : 40}</span></motion.div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Custom Pipeline Stages") && <motion.div key="Custom Pipeline Stages" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["+ Add Stage", "Rename", "Reorder"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">{t}</span>)}</div></motion.div>}
          {f("Follow-Up Reminders") && <motion.div key="Follow-Up Reminders" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">2 follow-ups due today — Lisa M. (new), Sarah P. (contacted)</div></motion.div>}
          {f("Auto-Response") && <motion.div key="Auto-Response" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">Auto-response active: sending welcome message to new leads</div></motion.div>}
          {f("Lead to Client Conversion") && <motion.div key="Lead to Client Conversion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[9px] text-emerald-700">Zoe R. won — <span className="font-medium underline">Convert to client</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Messages") {
    const convos = [{ name: "Sarah M.", ch: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", ch: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", ch: "Instagram", msg: "Saturday availability?", time: "3hr" }];
    const channelMap: Record<string, string[]> = { Email: ["Email"], SMS: ["SMS"], "Instagram DMs": ["Instagram"], WhatsApp: ["WhatsApp"] };
    const activeChannels = Object.entries(channelMap).filter(([feat]) => f(feat)).flatMap(([, chs]) => chs);
    const filteredConvos = activeChannels.length > 0 ? convos.filter(c => activeChannels.includes(c.ch)) : convos;

    return (
      <div>
        {/* Channel filter pills */}
        {activeChannels.length > 0 && (
          <div className="flex gap-1 mb-2">
            {activeChannels.map(ch => (
              <span key={ch} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-medium">{ch}</span>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {filteredConvos.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg border border-border-light">
              <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold">{c.name[0]}</span></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-foreground">{c.name}</span><span className="text-[8px] px-1 bg-surface rounded text-text-tertiary">{c.ch}</span></div><p className="text-[10px] text-text-secondary truncate">{c.msg}</p></div>
              <span className="text-[9px] text-text-tertiary">{c.time}</span>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Bulk Messaging") && <motion.div key="Bulk Messaging" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-foreground/5 rounded-lg text-[9px] text-foreground font-medium">Compose Bulk Message →</div></motion.div>}
          {f("After-Hours Auto-Reply") && <motion.div key="After-Hours Auto-Reply" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Auto-reply active outside business hours</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Projects") {
    const jobs = [{ title: "Kitchen renovation", stage: "In Progress", cost: 2400 }, { title: "Bathroom refit", stage: "Quoted", cost: 850 }, { title: "Garden lights", stage: "Complete", cost: 1100 }];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Billable Rate Tracking") ? "50px " : ""}` }}>
            <span>Job</span><span>Stage</span>
            {f("Expense Tracking") && <span>Cost</span>}
            {f("Billable Rate Tracking") && <span>Rate</span>}
          </motion.div>
          {jobs.map((j) => (
            <motion.div layout key={j.title} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Billable Rate Tracking") ? "50px " : ""}` }}>
              <span className="font-medium text-foreground">{j.title}</span>
              <span className="text-text-secondary">{j.stage}</span>
              {f("Expense Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">${j.cost}</motion.span>}
              {f("Billable Rate Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">$85/hr</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Recurring Jobs") && <motion.div key="Recurring Jobs" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">1 recurring job: Garden maintenance (monthly)</div></motion.div>}
          {f("Job Templates") && <motion.div key="Job Templates" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Renovation", "Repair", "Install"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">{t}</span>)}</div></motion.div>}
          {f("Client Approval") && <motion.div key="Client Approval" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Kitchen renovation — awaiting client sign-off</div></motion.div>}
          {f("Profitability Summary") && <motion.div key="Profitability Summary" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">Total profit: <span className="font-bold">$1,850</span> across 3 jobs (42% margin)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Documents") {
    const docs = [
      { name: "Service Agreement", type: "Contract", status: "signed", job: "Lash Full Set", expiry: "Dec 2026", version: "v2" },
      { name: "NDA — Tom K.", type: "NDA", status: "pending", job: "Kitchen rewire", expiry: "Jun 2026", version: "v1" },
      { name: "Consent Form", type: "Form", status: "signed", job: "Volume Set", expiry: null as string | null, version: "v3" },
    ];
    return (
      <div>
        {f("Contract Templates") && <motion.div key="Contract Templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3">{["Service Agreement", "NDA", "Consent Form"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">+ {t}</span>)}</motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 50px ${f("E-Signatures") ? "50px " : ""}${f("Auto-Attach to Job") ? "70px " : ""}${f("Expiry Tracking") ? "55px " : ""}${f("Version History") ? "30px " : ""}` }}>
            <span>Document</span><span>Type</span>
            {f("E-Signatures") && <span>Signed</span>}
            {f("Auto-Attach to Job") && <span>Linked Job</span>}
            {f("Expiry Tracking") && <span>Expires</span>}
            {f("Version History") && <span>Ver</span>}
          </motion.div>
          {docs.map((d) => (
            <motion.div layout key={d.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 50px ${f("E-Signatures") ? "50px " : ""}${f("Auto-Attach to Job") ? "70px " : ""}${f("Expiry Tracking") ? "55px " : ""}${f("Version History") ? "30px " : ""}` }}>
              <span className="font-medium text-foreground truncate">{d.name}</span>
              <span className="text-text-tertiary">{d.type}</span>
              {f("E-Signatures") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1 py-0.5 rounded font-medium w-fit ${d.status === "signed" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{d.status === "signed" ? "Signed" : "Awaiting"}</motion.span>}
              {f("Auto-Attach to Job") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-blue-500 truncate">{d.job}</motion.span>}
              {f("Expiry Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary">{d.expiry || "—"}</motion.span>}
              {f("Version History") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary">{d.version}</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Document Tags") && <motion.div key="Document Tags" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Legal", "Client-facing", "Internal"].map(t => <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-medium">{t}</span>)}</div></motion.div>}
          {f("Expiry Tracking") && <motion.div key="Expiry Tracking" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">NDA — Tom K. expires in 3 months — <span className="font-medium underline">Renew</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Marketing") {
    const campaigns = [
      { name: "Summer Promo", type: "Email", status: "sent", segment: "VIP Clients" },
      { name: "New Year Offer", type: "Email", status: "draft", segment: "All Clients" },
      { name: "Rebooking Nudge", type: "SMS", status: "scheduled", segment: "Inactive 30d" },
    ];
    return (
      <div>
        {f("Audience Segmentation") && <motion.div key="Audience Segmentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3 flex-wrap">{["All Clients", "VIP", "Inactive 30d", "New This Month"].map(s => <span key={s} className="px-2 py-1 bg-background border border-border-light rounded-full text-[9px] text-text-secondary">{s}</span>)}</motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 40px ${f("Audience Segmentation") ? "70px " : ""}50px` }}>
            <span>Campaign</span><span>Type</span>
            {f("Audience Segmentation") && <span>Segment</span>}
            <span>Status</span>
          </motion.div>
          {campaigns.map((c) => (
            <motion.div layout key={c.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 40px ${f("Audience Segmentation") ? "70px " : ""}50px` }}>
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="text-text-tertiary">{c.type}</span>
              {f("Audience Segmentation") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-primary truncate">{c.segment}</motion.span>}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${c.status === "sent" ? "bg-emerald-50 text-emerald-700" : c.status === "scheduled" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Email Sequences") && <motion.div key="Email Sequences" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary">Active sequence: &quot;Welcome Series&quot; — 3 emails, 42 recipients enrolled</div></motion.div>}
          {f("Social Scheduling") && <motion.div key="Social Scheduling" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">3 posts scheduled this week — Instagram, Facebook</div></motion.div>}
          {f("Review Collection") && <motion.div key="Review Collection" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">5 review requests sent this week — 2 reviews collected</div></motion.div>}
          {f("Coupon Codes") && <motion.div key="Coupon Codes" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Active coupon: <span className="font-medium text-foreground">SUMMER20</span> (20% off) — used 8 times</div></motion.div>}
          {f("Referral Program") && <motion.div key="Referral Program" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">Referral program: 4 active referrers — 7 new clients this month</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Team") {
    const members = [
      { name: "You", role: "Owner", status: "online", tasks: 8, modules: ["All"], perf: { jobs: 24, revenue: "$3.2k" }, comments: 5 },
      { name: "Alex K.", role: "Stylist", status: "online", tasks: 5, modules: ["Clients", "Scheduling", "Billing"], perf: { jobs: 18, revenue: "$2.1k" }, comments: 3 },
      { name: "Mia L.", role: "Junior", status: "offline", tasks: 3, modules: ["Scheduling"], perf: { jobs: 9, revenue: "$0.8k" }, comments: 1 },
    ];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr ${f("Role Templates") ? "60px " : "55px "}${f("Module Access Control") ? "85px " : ""}${f("Performance Dashboard") ? "70px " : ""}${f("Team Discussions") ? "35px " : ""}50px` }}>
            <span>Member</span>
            <span>{f("Role Templates") ? "Role" : "Role"}</span>
            {f("Module Access Control") && <span>Access</span>}
            {f("Performance Dashboard") && <span>Stats</span>}
            {f("Team Discussions") && <span></span>}
            <span>Status</span>
          </motion.div>
          {members.map((m) => (
            <motion.div layout key={m.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr ${f("Role Templates") ? "60px " : "55px "}${f("Module Access Control") ? "85px " : ""}${f("Performance Dashboard") ? "70px " : ""}${f("Team Discussions") ? "35px " : ""}50px` }}>
              <span className="font-medium text-foreground">{m.name}</span>
              {f("Role Templates") ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium w-fit ${
                  m.role === "Owner" ? "bg-purple-50 text-purple-700" : m.role === "Stylist" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>{m.role}</motion.span>
              ) : (
                <span className="text-text-tertiary">{m.role}</span>
              )}
              {f("Module Access Control") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-0.5 flex-wrap">
                  {m.modules.slice(0, 3).map(mod => (
                    <span key={mod} className="text-[7px] px-1 py-0.5 bg-primary/10 text-primary rounded">{mod}</span>
                  ))}
                </motion.div>
              )}
              {f("Performance Dashboard") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  <span className="text-[8px] text-text-secondary">{m.perf.jobs} jobs</span>
                  <span className="text-[8px] text-emerald-600 font-medium">{m.perf.revenue}</span>
                </motion.div>
              )}
              {f("Team Discussions") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5">
                  <MessageCircle className="w-3 h-3 text-text-tertiary" />
                  <span className="text-[8px] text-text-tertiary">{m.comments}</span>
                </motion.div>
              )}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${m.status === "online" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Workload View") && <motion.div key="Workload View" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
            <div className="px-3 py-2 bg-surface rounded-xl space-y-1.5">
              <p className="text-[9px] font-semibold text-text-secondary">Workload</p>
              {members.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-[9px] text-foreground w-12 font-medium">{m.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(m.tasks / 8) * 100}%` }} /></div>
                  <span className="text-[8px] text-text-tertiary">{m.tasks} tasks</span>
                </div>
              ))}
            </div>
          </motion.div>}
          {f("Shift Scheduling") && <motion.div key="Shift Scheduling" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">Today: You (9AM-5PM), Alex K. (10AM-6PM), Mia L. (off)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Support") {
    const tickets = [
      { id: "TK-001", client: "Sarah M.", subject: "Booking issue", priority: "High", status: "open", rating: 0 },
      { id: "TK-002", client: "Tom K.", subject: "Invoice query", priority: "Medium", status: "resolved", rating: 5 },
      { id: "TK-003", client: "Emma R.", subject: "Login problem", priority: "Low", status: "open", rating: 0 },
    ];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `45px 1fr ${f("Priority Levels") ? "50px " : ""}${f("Satisfaction Ratings") ? "45px " : ""}${f("SLA Tracking") ? "50px " : ""}50px` }}>
            <span>Ticket</span><span>Subject</span>
            {f("Priority Levels") && <span>Priority</span>}
            {f("Satisfaction Ratings") && <span>CSAT</span>}
            {f("SLA Tracking") && <span>SLA</span>}
            <span>Status</span>
          </motion.div>
          {tickets.map((t) => (
            <motion.div layout key={t.id} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `45px 1fr ${f("Priority Levels") ? "50px " : ""}${f("Satisfaction Ratings") ? "45px " : ""}${f("SLA Tracking") ? "50px " : ""}50px` }}>
              <span className="text-text-tertiary">{t.id}</span>
              <div><span className="font-medium text-foreground">{t.subject}</span><p className="text-[9px] text-text-tertiary">{t.client}</p></div>
              {f("Priority Levels") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1 py-0.5 rounded font-medium w-fit ${t.priority === "High" ? "bg-red-50 text-red-600" : t.priority === "Medium" ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{t.priority}</motion.span>}
              {f("Satisfaction Ratings") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-yellow-500">{t.rating > 0 ? "\u2605".repeat(Math.min(t.rating, 5)) : "\u2014"}</motion.span>}
              {f("SLA Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1 py-0.5 rounded font-medium ${t.status === "open" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{t.status === "open" ? "2hr left" : "Met"}</motion.span>}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${t.status === "open" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-700"}`}>{t.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Auto-Responses") && <motion.div key="Auto-Responses" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">Auto-response sent to Emma R. — &quot;We&#39;ll get back to you within 2 hours&quot;</div></motion.div>}
          {f("Knowledge Base") && <motion.div key="Knowledge Base" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Suggested article: <span className="font-medium text-foreground underline">How to reschedule a booking</span> — matched to TK-001</div></motion.div>}
          {f("Ticket to Job Conversion") && <motion.div key="Ticket to Job Conversion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">TK-001 — <span className="font-medium underline">Convert to job</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Automations") {
    const rules = [
      { name: "Welcome email", trigger: "New client added", action: "Send welcome email", status: "active" },
      { name: "Follow-up reminder", trigger: "No booking in 30 days", action: "Send SMS reminder", status: "active" },
      { name: "Invoice overdue", trigger: "Invoice unpaid 7 days", action: "Send payment reminder", status: "paused" },
    ];
    return (
      <div>
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.name} className="px-3 py-2.5 rounded-xl bg-card-bg border border-border-light">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-foreground">{r.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span>
              </div>
              {f("Trigger Rules") && <motion.div key="Trigger Rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">WHEN</span><span className="text-[9px] text-text-secondary">{r.trigger}</span></motion.div>}
              {f("Conditional Logic") && <motion.div key="Conditional Logic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">IF</span><span className="text-[9px] text-text-secondary">Client has no upcoming booking</span></motion.div>}
              {f("Email Automations") && <motion.div key="Email Automations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">SEND</span><span className="text-[9px] text-text-secondary">{r.action}</span></motion.div>}
              {f("Activity Triggers") && <motion.div key="Activity Triggers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5"><span className="text-[8px] px-1 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">LOG</span><span className="text-[9px] text-text-secondary">Record activity in client timeline</span></motion.div>}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Recurring Task Templates") && <motion.div key="Recurring Task Templates" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">3 recurring templates: Weekly cleanup, Monthly report, Quarterly review</div></motion.div>}
          {f("Automation Log") && <motion.div key="Automation Log" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[10px] text-text-tertiary space-y-1"><div className="flex gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5" /><span>Welcome email sent to Tom K. — 2hr ago</span></div><div className="flex gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5" /><span>Follow-up SMS sent to Lisa M. — 5hr ago</span></div></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Reporting") {
    return (
      <div>
        {f("Revenue Breakdown") && <motion.div key="Revenue Breakdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3">{["Overview", "Revenue", "Clients"].map((t, i) => <span key={t} className={`px-2 py-1 rounded text-[9px] font-medium ${i === 0 ? "bg-foreground text-white" : "bg-background border border-border-light text-text-secondary"}`}>{t}</span>)}</motion.div>}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[{ label: "Revenue", value: "$4,280", change: "+12%" }, { label: "Clients", value: "47", change: "+3" }, { label: "Bookings", value: "84", change: "+8%" }].map((stat) => (
            <div key={stat.label} className="px-3 py-2.5 rounded-xl bg-card-bg border border-border-light">
              <p className="text-[9px] text-text-tertiary">{stat.label}</p>
              <p className="text-[15px] font-bold text-foreground">{stat.value}</p>
              {f("Lead Conversion") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-emerald-600 font-medium">{stat.change}</motion.span>}
            </div>
          ))}
        </div>
        {f("Goal Tracking") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mb-3">
            {[{ goal: "Monthly revenue", current: 4280, target: 5000, prefix: "$" }, { goal: "New clients", current: 12, target: 15, prefix: "" }].map((g) => (
              <div key={g.goal} className="px-3 py-2 rounded-lg bg-card-bg border border-border-light">
                <div className="flex justify-between mb-1"><span className="text-[10px] text-foreground font-medium">{g.goal}</span><span className="text-[9px] text-text-tertiary">{g.prefix}{g.current} / {g.prefix}{g.target}</span></div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(g.current / g.target) * 100}%` }} /></div>
              </div>
            ))}
          </motion.div>
        )}
        {f("Client Retention") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-3 rounded-xl bg-card-bg border border-border-light mb-3">
            <p className="text-[10px] font-medium text-foreground mb-2">Retention — Last 7 days</p>
            <div className="flex items-end gap-1 h-14">
              {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}><div className="w-full bg-primary rounded-t" style={{ height: "40%" }} /></div>
              ))}
            </div>
            <div className="flex justify-between mt-1">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="text-[8px] text-text-tertiary flex-1 text-center">{d}</span>)}</div>
          </motion.div>
        )}
        <AnimatePresence>
          {f("Tax Summary") && <motion.div key="Tax Summary" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Tax collected this quarter: <span className="font-bold text-foreground">$1,284</span> — <span className="underline">Export for accountant</span></div></motion.div>}
          {f("Profit & Loss") && <motion.div key="Profit & Loss" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">Net profit this month: <span className="font-bold">$2,840</span> (66% margin)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Products") {
    const products = [
      { name: "Classic Full Set", price: 150, category: "Lashes", stock: null as number | null },
      { name: "Volume Full Set", price: 200, category: "Lashes", stock: null as number | null },
      { name: "Brow Lamination", price: 65, category: "Brows", stock: 12 },
      { name: "Lash Glue (retail)", price: 25, category: "Retail", stock: 8 },
    ];
    return (
      <div>
        {f("Duration Variants") && <motion.div key="Duration Variants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3">{["All", "Services", "Retail"].map((c, i) => <span key={c} className={`px-2 py-1 rounded-full text-[9px] font-medium ${i === 0 ? "bg-foreground text-white" : "bg-background border border-border-light text-text-secondary"}`}>{c}</span>)}</motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 50px ${f("Service Add-Ons") ? "55px " : ""}${f("Cost Margins") ? "50px " : ""}${f("Inventory Tracking") ? "40px " : ""}${f("Bundles") ? "50px " : ""}` }}>
            <span>Product</span><span>Price</span>
            {f("Service Add-Ons") && <span>Add-On</span>}
            {f("Cost Margins") && <span>Margin</span>}
            {f("Inventory Tracking") && <span>Stock</span>}
            {f("Bundles") && <span>Bundle</span>}
          </motion.div>
          {products.map((p) => (
            <motion.div layout key={p.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 50px ${f("Service Add-Ons") ? "55px " : ""}${f("Cost Margins") ? "50px " : ""}${f("Inventory Tracking") ? "40px " : ""}${f("Bundles") ? "50px " : ""}` }}>
              <span className="font-medium text-foreground truncate">{p.name}</span>
              <span className="font-medium text-foreground">${p.price}</span>
              {f("Service Add-Ons") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-primary">{p.category === "Lashes" ? "+$20" : "—"}</motion.span>}
              {f("Cost Margins") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-emerald-600 font-medium">{p.price > 100 ? "72%" : p.price > 50 ? "65%" : "58%"}</motion.span>}
              {f("Inventory Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[9px] ${p.stock !== null && p.stock < 10 ? "text-red-500 font-medium" : "text-text-tertiary"}`}>{p.stock !== null ? p.stock : "\u221E"}</motion.span>}
              {f("Bundles") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-text-tertiary">{p.category === "Lashes" ? "In bundle" : "\u2014"}</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Allergen Info") && <motion.div key="Allergen Info" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">Allergen notice: Lash Glue contains cyanoacrylate — flag for sensitive clients</div></motion.div>}
          {f("Bundles") && <motion.div key="Bundles" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary">Bundle: &quot;Lash Starter Kit&quot; — Classic + Volume for $300 (save $50)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Client Portal") {
    return (
      <div>
        {f("Custom Branding") && <motion.div key="Custom Branding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg"><div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}><div className="w-2 h-2 bg-card-bg rounded-sm" /></div><span className="text-[10px] text-primary font-medium">Your brand colors and logo applied to portal</span></motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: "1fr 80px 50px" }}>
            <span>Section</span><span>Details</span><span>Status</span>
          </div>
          {[
            { name: "Upcoming Bookings", detail: "2 appointments", status: "active", feature: "View Bookings" },
            { name: "Outstanding Invoices", detail: "$175 due", status: "sent", feature: "Pay Invoices" },
            { name: "Job Progress", detail: "Kitchen reno", status: "active", feature: "Track Job Progress" },
            { name: "Documents", detail: "3 files shared", status: "active", feature: "Shared Documents" },
            { name: "Messages", detail: "1 unread", status: "active", feature: "Messages" },
          ].filter(row => f(row.feature)).map((row) => (
            <div key={row.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]" style={{ gridTemplateColumns: "1fr 80px 50px" }}>
              <span className="font-medium text-foreground">{row.name}</span>
              <span className="text-text-tertiary">{row.detail}</span>
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${row.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{row.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for other modules
  if (!data) return null;
  const rows = data.data as { name: string; email: string; status: string }[];
  const activeFeatures = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
  return (
    <div>
      <div className="border border-border-light rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary"><span>Name</span><span>Details</span><span>Status</span></div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]">
            <span className="font-medium text-foreground">{row.name}</span><span className="text-text-tertiary">{row.email}</span>
            <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${row.status === "paid" || row.status === "signed" || row.status === "active" ? "bg-emerald-50 text-emerald-700" : row.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{row.status}</span>
          </div>
        ))}
      </div>
      {activeFeatures.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{activeFeatures.map(af => <span key={af} className="text-[8px] px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-primary">{af}</span>)}</div>}
    </div>
  );
}

// Legacy export for backward compat
export function CinematicDemo() {
  return (
    <>
      <ModulePickerDemo />
      <FeatureCustomizeDemo />
    </>
  );
}
