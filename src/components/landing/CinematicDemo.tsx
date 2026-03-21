"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, MessageCircle, Calendar, Receipt, FolderKanban,
  Megaphone, Headphones, FileText, CreditCard, Zap, BarChart3,
  Package, UsersRound, SlidersHorizontal, Search, Check,
} from "lucide-react";

const MODULES = [
  { name: "Clients", icon: Users },
  { name: "Leads", icon: Inbox },
  { name: "Messages", icon: MessageCircle },
  { name: "Scheduling", icon: Calendar },
  { name: "Projects", icon: FolderKanban },
  { name: "Billing", icon: Receipt },
  { name: "Payments", icon: CreditCard },
  { name: "Documents", icon: FileText },
  { name: "Marketing", icon: Megaphone },
  { name: "Team", icon: UsersRound },
  { name: "Support", icon: Headphones },
  { name: "Automations", icon: Zap },
  { name: "Reporting", icon: BarChart3 },
  { name: "Products", icon: Package },
];

// ═══════════════════════════════════════════════════
// SECTION 1: Pick Your Modules
// ═══════════════════════════════════════════════════

const MODULE_SEQUENCE = ["Marketing", "Support", "Documents", "Team", "Products"];
const PICK_TICK_MS = 600;
const PICK_TOTAL = 22; // full cycle

export function ModulePickerDemo() {
  const [paused, setPaused] = useState(false);
  const [enabledSet, setEnabledSet] = useState<Set<string>>(() => new Set(MODULES.map((m) => m.name)));
  const autoIdx = useRef(0);

  // Auto-play: toggle one module every tick
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const name = MODULE_SEQUENCE[autoIdx.current % MODULE_SEQUENCE.length];
      setEnabledSet((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name); else next.add(name);
        return next;
      });
      autoIdx.current++;
    }, PICK_TICK_MS);
    return () => clearInterval(interval);
  }, [paused]);

  const toggleModule = (name: string) => {
    setPaused(true);
    setEnabledSet((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const activeCount = enabledSet.size;

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            Pick your modules.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto">
            Only turn on what you need. Every business gets a different combination.
          </p>
        </div>

        <div
          className="rounded-2xl border border-border-light overflow-hidden shadow-xl bg-white"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex" style={{ minHeight: 420 }}>
            {/* Left: Module checklist */}
            <div className="w-[340px] border-r border-border-light p-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-bold text-foreground">Your Modules</p>
                <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">{activeCount} of {MODULES.length}</span>
              </div>
              <div className="space-y-1">
                {MODULES.map((mod) => {
                  const isOn = enabledSet.has(mod.name);
                  return (
                    <motion.div
                      key={mod.name}
                      layout
                      onClick={() => toggleModule(mod.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer hover:bg-background ${
                        isOn ? "" : "opacity-40"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${
                        isOn ? "bg-primary border-primary" : "border-gray-300 bg-white"
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
              <div className="px-5 py-3 border-b border-border-light bg-white flex items-center gap-2">
                <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-foreground rounded-sm" /></div>
                <span className="text-[12px] font-bold text-foreground">Only what you need</span>
                {!paused && <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
              </div>
              <div className="flex-1 bg-white mx-4 my-4 rounded-xl border border-border-light overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-foreground rounded-sm" /></div>
                    <span className="text-[11px] font-bold text-foreground">Magic CRM</span>
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
    </section>
  );
}

// ═══════════════════════════════════════════════════
// SECTION 2: Customize Features
// ═══════════════════════════════════════════════════

// Module-specific data for the customize demo
const MODULE_DEMOS: Record<string, { features: string[]; desc: string; content: { type: string; data: Record<string, unknown>[] } }> = {
  Clients: { features: ["Tags & Categories", "Birthday Reminders", "Import / Export", "Merge Duplicates", "Bulk Actions", "Activity Timeline"], desc: "Profiles, tags, and full history",
    content: { type: "table", data: [{ name: "Sarah Mitchell", email: "sarah@email.com", status: "active" }, { name: "Jess Thompson", email: "jess@email.com", status: "active" }, { name: "Emma Roberts", email: "emma@email.com", status: "inactive" }, { name: "Tom Kennedy", email: "tom@email.com", status: "prospect" }] } },
  Leads: { features: ["Web Forms", "Lead Scoring", "Auto-Assign", "Follow-up Reminders", "Duplicate Detection", "Source Tracking"], desc: "Capture, track, and convert",
    content: { type: "kanban", data: [{ stage: "New", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", items: ["Sarah P."] }, { stage: "Proposal", items: ["James W."] }, { stage: "Won", items: ["Zoe R."] }] } },
  Messages: { features: ["Canned Responses", "Scheduled Send", "After-Hours Auto-Reply", "Bulk Messaging", "Template Variables"], desc: "Every conversation, one inbox",
    content: { type: "inbox", data: [{ name: "Sarah M.", channel: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", channel: "Instagram", msg: "Saturday availability?", time: "3hr" }] } },
  Scheduling: { features: ["Online Booking Page", "Automated Reminders", "Waitlist", "Booking Deposits", "Buffer Time", "No-Show Protection"], desc: "Schedule appointments and manage your calendar",
    content: { type: "appointments", data: [{ time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" }, { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" }, { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" }] } },
  Projects: { features: ["Expense Tracking", "Time Tracking", "Recurring Jobs", "Job Templates", "Client Approval"], desc: "Track work from start to finish",
    content: { type: "table", data: [{ name: "Kitchen renovation", email: "In Progress", status: "high" }, { name: "Bathroom refit", email: "Quoted", status: "medium" }, { name: "Garden lights", email: "Complete", status: "low" }] } },
  Billing: { features: ["Auto Tax", "Tipping", "Partial Payments", "Late Reminders", "Credit Notes", "Payment Links"], desc: "Quotes, invoices, and payments",
    content: { type: "table", data: [{ name: "INV-001 Sarah M.", email: "$175", status: "paid" }, { name: "INV-002 Jess T.", email: "$200", status: "sent" }, { name: "INV-003 Emma R.", email: "$95", status: "overdue" }] } },
  Payments: { features: ["Payment Method Tracking", "Outstanding Balances", "Payment Plans", "Aging Report", "Write-Off"], desc: "Track who paid and who didn't",
    content: { type: "table", data: [{ name: "Sarah Mitchell", email: "$175 — Card", status: "paid" }, { name: "Jess Thompson", email: "$200 — Pending", status: "sent" }] } },
  Documents: { features: ["Contract Templates", "E-Signatures", "Auto-Attach to Job", "Expiry Tracking", "Version History"], desc: "Contracts, files, and signatures",
    content: { type: "table", data: [{ name: "Service Agreement.pdf", email: "Contract", status: "signed" }, { name: "NDA — Tom K.pdf", email: "NDA", status: "pending" }] } },
  Marketing: { features: ["Email Sequences", "Audience Segmentation", "Review Collection", "Coupon Codes", "A/B Subject Lines"], desc: "Campaigns, promos, and reviews",
    content: { type: "table", data: [{ name: "Summer Promo", email: "Email Campaign", status: "sent" }, { name: "New Year Offer", email: "Email Campaign", status: "draft" }] } },
};

const CUSTOMIZE_TOTAL = 24;
const CUSTOMIZE_TICK_MS = 550;

export function FeatureCustomizeDemo() {
  const [paused, setPaused] = useState(false);
  const [activeModule, setActiveModule] = useState("Scheduling");
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});
  const autoFeatureIdx = useRef(0);

  // Initialize feature states when module changes
  useEffect(() => {
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const initial: Record<string, boolean> = {};
    demo.features.forEach((f, i) => { initial[f] = i < 2; });
    setFeatureStates(initial);
    autoFeatureIdx.current = 0;
  }, [activeModule]);

  // Auto-play: toggle one feature at a time from current state
  useEffect(() => {
    if (paused) return;
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const interval = setInterval(() => {
      const feature = demo.features[autoFeatureIdx.current % demo.features.length];
      setFeatureStates((prev) => ({ ...prev, [feature]: !prev[feature] }));
      autoFeatureIdx.current++;
    }, 2200);
    return () => clearInterval(interval);
  }, [paused, activeModule]);

  const toggleFeature = (name: string) => {
    setPaused(true);
    setFeatureStates((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const selectModule = (name: string) => {
    setPaused(true);
    setActiveModule(name);
  };

  const demo = MODULE_DEMOS[activeModule];
  const enabledCount = demo ? demo.features.filter((f) => featureStates[f]).length : 0;

  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            Then customize every detail.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto">
            Each module has toggleable features. Watch the page change in real time.
          </p>
        </div>

        <div
          className="rounded-2xl border border-border-light overflow-hidden shadow-2xl bg-background"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Browser chrome */}
          <div className="bg-white border-b border-border-light px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
            <div className="flex-1 flex justify-center"><div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">app.magiccrm.com</div></div>
            {!paused && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
          </div>

          <div className="flex" style={{ height: 440 }}>
            {/* Sidebar — clickable */}
            <div className="w-[170px] bg-white border-r border-border-light flex flex-col flex-shrink-0">
              <div className="px-3 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-foreground rounded-sm" /></div>
                  <span className="text-[10px] font-bold text-foreground">Magic CRM</span>
                </div>
              </div>
              <nav className="flex-1 px-2 py-2 overflow-y-auto">
                {MODULES.filter((m) => MODULE_DEMOS[m.name]).map((mod) => (
                  <div
                    key={mod.name}
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
              <div className="bg-white border-b border-border-light px-4 py-2 flex items-center justify-between flex-shrink-0">
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
                <div className="w-[220px] bg-white border-l border-border-light flex-shrink-0 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-[12px] font-bold text-foreground">Customize</p>
                    <p className="text-[9px] text-text-tertiary">{activeModule} features</p>
                  </div>
                  <div className="p-3 space-y-1">
                    {demo?.features.map((f) => {
                      const isOn = featureStates[f] ?? false;
                      return (
                        <div key={f} onClick={() => toggleFeature(f)} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all duration-300 cursor-pointer hover:bg-background ${isOn ? "bg-primary/5" : ""}`}>
                          <span className={`text-[10px] font-medium transition-colors duration-300 ${isOn ? "text-foreground" : "text-text-tertiary"}`}>{f}</span>
                          <div className={`w-7 h-[15px] rounded-full flex items-center px-0.5 transition-all duration-300 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                            <motion.div layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-[11px] h-[11px] bg-white rounded-full shadow-sm" />
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
    </section>
  );
}

// ── Reactive content renderer ──
function DemoContent({ module, features, data }: { module: string; features: Record<string, boolean>; data?: { type: string; data: Record<string, unknown>[] } }) {
  const f = (name: string) => features[name] ?? false;

  if (module === "Billing") {
    const invoices = [
      { num: "INV-001", client: "Sarah M.", amount: 175, status: "paid" },
      { num: "INV-002", client: "Jess T.", amount: 200, status: "sent" },
      { num: "INV-003", client: "Emma R.", amount: 95, status: "overdue" },
    ];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 60px ${f("Auto Tax") ? "50px " : ""}${f("Tipping") ? "40px " : ""}${f("Payment Links") ? "55px " : ""}55px` }}>
            <span>Invoice</span><span>Amount</span>
            {f("Auto Tax") && <span>Tax</span>}
            {f("Tipping") && <span>Tip</span>}
            {f("Payment Links") && <span>Link</span>}
            <span>Status</span>
          </motion.div>
          {invoices.map((inv) => (
            <motion.div layout key={inv.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 60px ${f("Auto Tax") ? "50px " : ""}${f("Tipping") ? "40px " : ""}${f("Payment Links") ? "55px " : ""}55px` }}>
              <span className="font-medium text-foreground">{inv.num} <span className="text-text-tertiary font-normal">{inv.client}</span></span>
              <span className="font-medium text-foreground">${inv.amount}</span>
              {f("Auto Tax") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-tertiary text-[9px]">+${(inv.amount * 0.1).toFixed(0)}</motion.span>}
              {f("Tipping") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary text-[9px]">+$5</motion.span>}
              {f("Payment Links") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-blue-500 underline">pay.link</motion.span>}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{inv.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Late Reminders") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">Reminder sent to Emma R. — 14 days overdue</div></motion.div>}
          {f("Partial Payments") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">Jess T. paid $100 of $200 — $100 remaining</div></motion.div>}
          {f("Credit Notes") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Credit note CN-001 issued to Sarah M. — $25</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Scheduling") {
    const appts = [{ time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" }, { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" }, { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" }];
    return (
      <div>
        <div className="space-y-1.5 mb-2">
          {appts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light">
              <div className={`w-1 h-5 rounded-full ${a.color}`} />
              <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
              <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
              {f("Booking Deposits") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-primary font-medium">$30 dep</motion.span>}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Waitlist") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">2 on waitlist for today</div></motion.div>}
          {f("Buffer Time") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="text-[10px] text-text-tertiary">15 min buffer between appointments</div></motion.div>}
          {f("No-Show Protection") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">Tom K. — 2 no-shows this month</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Clients") {
    const clients = [{ name: "Sarah Mitchell", email: "sarah@email.com", tags: ["VIP"], source: "Instagram", status: "active" }, { name: "Jess Thompson", email: "jess@email.com", tags: ["Regular"], source: "Referral", status: "active" }, { name: "Emma Roberts", email: "emma@email.com", tags: [], source: "Website", status: "inactive" }, { name: "Tom Kennedy", email: "tom@email.com", tags: ["New"], source: "Walk-in", status: "prospect" }];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `${f("Bulk Actions") ? "20px " : ""}1fr 1fr ${f("Tags & Categories") ? "65px " : ""}${f("Birthday Reminders") ? "55px " : ""}${f("Acquisition Source") ? "60px " : ""}50px` }}>
            {f("Bulk Actions") && <span></span>}
            <span>Name</span><span>Email</span>
            {f("Tags & Categories") && <span>Tags</span>}
            {f("Birthday Reminders") && <span>Birthday</span>}
            {f("Acquisition Source") && <span>Source</span>}
            <span>Status</span>
          </motion.div>
          {clients.map((c) => (
            <motion.div layout key={c.name} className="grid px-3 py-1.5 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `${f("Bulk Actions") ? "20px " : ""}1fr 1fr ${f("Tags & Categories") ? "65px " : ""}${f("Birthday Reminders") ? "55px " : ""}${f("Acquisition Source") ? "60px " : ""}50px` }}>
              {f("Bulk Actions") && <input type="checkbox" className="w-3 h-3 accent-primary" readOnly />}
              <span className="font-medium text-foreground truncate">{c.name}</span>
              <span className="text-text-tertiary truncate">{c.email}</span>
              {f("Tags & Categories") && <span>{c.tags.map(t => <span key={t} className="px-1 py-0.5 bg-primary/10 text-primary rounded text-[8px] mr-0.5">{t}</span>)}</span>}
              {f("Birthday Reminders") && <span className="text-[9px] text-text-tertiary">Mar 15</span>}
              {f("Acquisition Source") && <span className="text-[9px] text-text-tertiary">{c.source}</span>}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"}`}>{c.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Merge Duplicates") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">1 potential duplicate detected — Review</div></motion.div>}
          {f("Activity Timeline") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[10px] text-text-tertiary space-y-1"><div className="flex gap-2"><div className="w-1 h-1 bg-primary rounded-full mt-1.5" /><span>Sarah booked Lash Fill — 2hr ago</span></div><div className="flex gap-2"><div className="w-1 h-1 bg-primary rounded-full mt-1.5" /><span>Invoice #42 paid — Yesterday</span></div></div></motion.div>}
          {f("Import / Export") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-2"><span className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">Import CSV</span><span className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">Export</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Leads") {
    const stages = [{ stage: "New", color: "bg-blue-400", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", color: "bg-yellow-400", items: ["Sarah P."] }, { stage: "Proposal", color: "bg-purple-400", items: ["James W."] }, { stage: "Won", color: "bg-green-400", items: ["Zoe R."] }];
    return (
      <div>
        <AnimatePresence>{f("Web Forms") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary font-medium">Web form active — share your capture link</div></motion.div>}</AnimatePresence>
        <div className="grid grid-cols-4 gap-1.5">
          {stages.map((col) => (
            <div key={col.stage}>
              <div className="flex items-center gap-1 mb-1.5"><div className={`w-2 h-2 rounded-full ${col.color}`} /><span className="text-[9px] font-semibold text-text-tertiary uppercase">{col.stage}</span></div>
              {col.items.map((item) => (
                <div key={item} className="bg-white rounded-lg px-2 py-1.5 mb-1 border border-border-light">
                  <p className="text-[10px] font-medium text-foreground">{item}</p>
                  {f("Lead Scoring") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] px-1 py-0.5 bg-red-50 text-red-600 rounded inline-block mt-0.5">Hot</motion.span>}
                  {f("Source Tracking") && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] text-text-tertiary mt-0.5">via Instagram</motion.p>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Auto-Assign") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">Auto-assigning to: <span className="font-medium text-foreground">You</span></div></motion.div>}
          {f("Duplicate Detection") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[9px] text-yellow-800">Tom K. may be a duplicate of existing client</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Messages") {
    const convos = [{ name: "Sarah M.", ch: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", ch: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", ch: "IG", msg: "Saturday availability?", time: "3hr" }];
    return (
      <div>
        <div className="space-y-1.5">
          {convos.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light">
              <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold">{c.name[0]}</span></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-foreground">{c.name}</span><span className="text-[8px] px-1 bg-surface rounded text-text-tertiary">{c.ch}</span></div><p className="text-[10px] text-text-secondary truncate">{c.msg}</p></div>
              <span className="text-[9px] text-text-tertiary">{c.time}</span>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Canned Responses") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Thanks!", "On my way", "Confirmed"].map(r => <span key={r} className="px-2 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary">{r}</span>)}</div></motion.div>}
          {f("Scheduled Send") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">1 message scheduled for 9:00 AM tomorrow</div></motion.div>}
          {f("After-Hours Auto-Reply") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Auto-reply active outside business hours</div></motion.div>}
          {f("Bulk Messaging") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-foreground/5 rounded-lg text-[9px] text-foreground font-medium">Compose Bulk Message →</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Projects") {
    const jobs = [{ title: "Kitchen renovation", stage: "In Progress", cost: 2400 }, { title: "Bathroom refit", stage: "Quoted", cost: 850 }, { title: "Garden lights", stage: "Complete", cost: 1100 }];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Time Tracking") ? "50px " : ""}` }}>
            <span>Job</span><span>Stage</span>
            {f("Expense Tracking") && <span>Cost</span>}
            {f("Time Tracking") && <span>Hours</span>}
          </motion.div>
          {jobs.map((j) => (
            <motion.div layout key={j.title} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Time Tracking") ? "50px " : ""}` }}>
              <span className="font-medium text-foreground">{j.title}</span>
              <span className="text-text-secondary">{j.stage}</span>
              {f("Expense Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">${j.cost}</motion.span>}
              {f("Time Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">12h</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Recurring Jobs") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">1 recurring job: Garden maintenance (monthly)</div></motion.div>}
          {f("Job Templates") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Renovation", "Repair", "Install"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">{t}</span>)}</div></motion.div>}
          {f("Client Approval") && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Kitchen renovation — awaiting client sign-off</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  // Fallback for other modules — still uses the generic approach but with better visuals
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
