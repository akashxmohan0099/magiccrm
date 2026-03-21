"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setTick((t) => (t + 1) % PICK_TOTAL), PICK_TICK_MS);
    return () => clearInterval(interval);
  }, [paused]);

  // Track manually toggled modules (when user interacts)
  const [manualToggles, setManualToggles] = useState<Record<string, boolean>>({});

  // Modules toggle off one by one, then back on (auto-play)
  const autoDisabled = useMemo(() => {
    const disabled = new Set<string>();
    MODULE_SEQUENCE.forEach((name, i) => {
      const offTick = 2 + i * 2;
      const onTick = 12 + i * 2;
      if (tick >= offTick && tick < onTick) disabled.add(name);
    });
    return disabled;
  }, [tick]);

  // When paused, use manual toggles; when auto-playing, use auto state
  const disabledModules = useMemo(() => {
    if (paused && Object.keys(manualToggles).length > 0) {
      const disabled = new Set<string>();
      MODULES.forEach((m) => { if (manualToggles[m.name] === false) disabled.add(m.name); });
      return disabled;
    }
    return autoDisabled;
  }, [paused, manualToggles, autoDisabled]);

  const toggleModule = (name: string) => {
    setPaused(true);
    const currentlyDisabled = disabledModules.has(name);
    setManualToggles((prev) => ({ ...prev, [name]: currentlyDisabled }));
  };

  const activeCount = MODULES.length - disabledModules.size;

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
                  const isOn = !disabledModules.has(mod.name);
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
                    {MODULES.filter((m) => !disabledModules.has(m.name)).map((mod) => (
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
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activeModule, setActiveModule] = useState("Scheduling");
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setTick((t) => (t + 1) % CUSTOMIZE_TOTAL), CUSTOMIZE_TICK_MS);
    return () => clearInterval(interval);
  }, [paused]);

  // Initialize feature states when module changes
  useEffect(() => {
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const initial: Record<string, boolean> = {};
    demo.features.forEach((f, i) => { initial[f] = i < 2; }); // first 2 on by default
    setFeatureStates(initial);
  }, [activeModule]);

  // Auto-toggle features during auto-play
  useEffect(() => {
    if (paused) return;
    const demo = MODULE_DEMOS[activeModule];
    if (!demo) return;
    const featureIdx = Math.floor(tick / 4) % demo.features.length;
    const feature = demo.features[featureIdx];
    if (feature && tick % 4 === 0) {
      setFeatureStates((prev) => ({ ...prev, [feature]: !prev[feature] }));
    }
  }, [tick, paused, activeModule]);

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

                      {/* Generic data rows */}
                      {demo?.content.type === "table" && (
                        <div className="border border-border-light rounded-xl overflow-hidden">
                          <div className="grid grid-cols-3 bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary">
                            <span>Name</span><span>Details</span><span>Status</span>
                          </div>
                          {(demo.content.data as { name: string; email: string; status: string }[]).map((row, i) => (
                            <div key={i} className="grid grid-cols-3 px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]">
                              <span className="font-medium text-foreground">{row.name}</span>
                              <span className="text-text-tertiary">{row.email}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium inline-block w-fit ${row.status === "active" || row.status === "paid" || row.status === "signed" ? "bg-emerald-50 text-emerald-700" : row.status === "overdue" ? "bg-red-50 text-red-600" : row.status === "inactive" || row.status === "draft" ? "bg-gray-100 text-gray-500" : "bg-yellow-50 text-yellow-700"}`}>{row.status}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {demo?.content.type === "appointments" && (
                        <div className="space-y-1.5">
                          {(demo.content.data as { time: string; name: string; color: string }[]).map((a, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light">
                              <div className={`w-1 h-5 rounded-full ${a.color}`} />
                              <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
                              <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {demo?.content.type === "kanban" && (
                        <div className="grid grid-cols-4 gap-1.5">
                          {(demo.content.data as { stage: string; items: string[] }[]).map((col) => (
                            <div key={col.stage}>
                              <p className="text-[9px] font-semibold text-text-tertiary uppercase mb-1.5">{col.stage}</p>
                              {col.items.map((item) => (
                                <div key={item} className="bg-white rounded-lg px-2 py-1.5 mb-1 border border-border-light text-[10px] font-medium text-foreground">{item}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {demo?.content.type === "inbox" && (
                        <div className="space-y-1.5">
                          {(demo.content.data as { name: string; channel: string; msg: string; time: string }[]).map((c, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light">
                              <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold">{c.name.split(" ").map(n => n[0]).join("")}</span></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-foreground">{c.name}</span><span className="text-[8px] px-1 bg-surface rounded text-text-tertiary">{c.channel}</span></div>
                                <p className="text-[10px] text-text-secondary truncate">{c.msg}</p>
                              </div>
                              <span className="text-[9px] text-text-tertiary">{c.time}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Feature-reactive elements */}
                      <div className="mt-3 space-y-1.5">
                        {demo?.features.filter((f) => featureStates[f]).map((f) => (
                          <AnimatePresence key={f}>
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="w-1 h-4 rounded-full bg-primary/30" />
                                <span className="text-[10px] font-medium text-foreground">{f}</span>
                                <span className="ml-auto text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
                              </div>
                            </motion.div>
                          </AnimatePresence>
                        ))}
                      </div>
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

// Legacy export for backward compat
export function CinematicDemo() {
  return (
    <>
      <ModulePickerDemo />
      <FeatureCustomizeDemo />
    </>
  );
}
