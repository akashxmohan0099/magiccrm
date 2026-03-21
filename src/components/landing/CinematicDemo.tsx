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

  // Modules toggle off one by one, then back on
  const disabledModules = useMemo(() => {
    const disabled = new Set<string>();
    MODULE_SEQUENCE.forEach((name, i) => {
      const offTick = 2 + i * 2;
      const onTick = 12 + i * 2;
      if (tick >= offTick && tick < onTick) disabled.add(name);
    });
    return disabled;
  }, [tick]);

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
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
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
                <span className="text-[12px] font-bold text-foreground">Your CRM Sidebar</span>
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

const BOOKING_FEATURES = ["Online Booking Page", "Automated Reminders", "Waitlist", "Booking Deposits", "Buffer Time", "No-Show Protection"];
const BOOKING_APPTS = [
  { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" },
  { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" },
  { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" },
];

const FEATURE_SEQUENCE = [
  { name: "Booking Deposits", tick: 3 },
  { name: "Waitlist", tick: 7 },
  { name: "No-Show Protection", tick: 11 },
  { name: "Buffer Time", tick: 15 },
];
const CUSTOMIZE_TOTAL = 24;
const CUSTOMIZE_TICK_MS = 550;

export function FeatureCustomizeDemo() {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setTick((t) => (t + 1) % CUSTOMIZE_TOTAL), CUSTOMIZE_TICK_MS);
    return () => clearInterval(interval);
  }, [paused]);

  const featureStates = useMemo(() => {
    const states: Record<string, boolean> = {
      "Online Booking Page": true,
      "Automated Reminders": true,
      "Waitlist": false,
      "Booking Deposits": false,
      "Buffer Time": false,
      "No-Show Protection": false,
    };
    FEATURE_SEQUENCE.forEach((f) => {
      if (tick >= f.tick && tick < f.tick + 8) states[f.name] = true;
    });
    return states;
  }, [tick]);

  const enabledCount = Object.values(featureStates).filter(Boolean).length;

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

          <div className="flex" style={{ height: 420 }}>
            {/* Sidebar */}
            <div className="w-[170px] bg-white border-r border-border-light flex flex-col flex-shrink-0">
              <div className="px-3 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-foreground rounded-sm" /></div>
                  <span className="text-[10px] font-bold text-foreground">Magic CRM</span>
                </div>
              </div>
              <nav className="flex-1 px-2 py-2 overflow-y-auto">
                {MODULES.slice(0, 9).map((mod) => (
                  <div key={mod.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] ${
                    mod.name === "Scheduling" ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary"
                  }`}>
                    {mod.name === "Scheduling" && <motion.div layoutId="active-bar" className="absolute left-0 w-[3px] h-3 bg-primary rounded-r-full" />}
                    <mod.icon className="w-3.5 h-3.5" /> {mod.name}
                  </div>
                ))}
              </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="bg-white border-b border-border-light px-4 py-2 flex items-center justify-between flex-shrink-0">
                <div className="px-3 py-1 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-40 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> Search...
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Customize <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-full">{enabledCount}/{BOOKING_FEATURES.length}</span>
                  </div>
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"><span className="text-[7px] font-bold text-white">M</span></div>
                </div>
              </div>

              {/* Page + Customize panel */}
              <div className="flex flex-1 overflow-hidden">
                {/* Scheduling page */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-bold text-foreground">Scheduling</h3>
                      <p className="text-[10px] text-text-tertiary">Schedule appointments and manage your calendar</p>
                    </div>
                    <div className="px-3 py-1.5 bg-foreground text-white rounded-xl text-[10px] font-semibold">+ New</div>
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1.5 mb-3">
                    {BOOKING_APPTS.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border-light">
                        <div className={`w-1 h-5 rounded-full ${a.color}`} />
                        <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
                        <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
                        <AnimatePresence>
                          {featureStates["Booking Deposits"] && (
                            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.3 }} className="text-[9px] text-primary font-medium">$30 dep</motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {featureStates["Waitlist"] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-2">
                        <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">2 on waitlist for today</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {featureStates["Buffer Time"] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-2">
                        <div className="text-[10px] text-text-tertiary">15 min buffer between appointments</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {featureStates["No-Show Protection"] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mb-2">
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">Tom K. — 2 no-shows this month</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Customize panel */}
                <div className="w-[220px] bg-white border-l border-border-light flex-shrink-0 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-border-light">
                    <p className="text-[12px] font-bold text-foreground">Customize</p>
                    <p className="text-[9px] text-text-tertiary">Scheduling features</p>
                  </div>
                  <div className="p-3 space-y-1">
                    {BOOKING_FEATURES.map((f) => {
                      const isOn = featureStates[f] ?? false;
                      return (
                        <div key={f} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all duration-300 ${isOn ? "bg-primary/5" : ""}`}>
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
