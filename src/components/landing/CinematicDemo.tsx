"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Inbox, MessageCircle, Calendar, Receipt, FolderKanban,
  Megaphone, Headphones, FileText, CreditCard, Zap, BarChart3,
  Package, UsersRound, SlidersHorizontal, Search,
} from "lucide-react";

// ── Module data ──
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

const BOOKING_FEATURES = ["Online Booking Page", "Automated Reminders", "Waitlist", "Booking Deposits", "Buffer Time", "No-Show Protection"];
const BOOKING_APPTS = [
  { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" },
  { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" },
  { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" },
];

// Modules that get removed during Act 1
const REMOVALS = [
  { name: "Marketing", tick: 2 },
  { name: "Support", tick: 4 },
  { name: "Documents", tick: 6 },
  { name: "Team", tick: 8 },
  { name: "Products", tick: 10 },
];

// Feature toggles during Act 3
const FEATURE_TOGGLES = [
  { name: "Waitlist", tick: 20 },
  { name: "Booking Deposits", tick: 23 },
  { name: "No-Show Protection", tick: 26 },
  { name: "Buffer Time", tick: 29 },
];

const TOTAL_TICKS = 34;
const TICK_MS = 500;

const CAPTIONS = [
  { tick: 0, text: "Toggle modules on or off. Your sidebar updates instantly." },
  { tick: 12, text: "Click into any module to see its page." },
  { tick: 16, text: "Toggle features. Watch the page change in real time." },
];

export function CinematicDemo() {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % TOTAL_TICKS);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [paused]);

  // Derived state
  const sidebarModules = useMemo(() => {
    return MODULES.filter((m) => !REMOVALS.some((r) => r.name === m.name && tick >= r.tick && tick < r.tick + 10));
  }, [tick]);

  const activeModule = tick >= 12 ? "Scheduling" : null;
  const showPanel = tick >= 16;

  const featureStates = useMemo(() => {
    const states: Record<string, boolean> = {};
    BOOKING_FEATURES.forEach((f) => { states[f] = true; });
    // Initially all ON, then during Act 1 some are OFF, Act 3 toggles them ON
    if (tick >= 16) {
      // Start with these OFF, toggle them ON during Act 3
      FEATURE_TOGGLES.forEach((ft) => {
        states[ft.name] = tick >= ft.tick;
      });
    }
    return states;
  }, [tick]);

  const caption = useMemo(() => {
    let current = CAPTIONS[0].text;
    for (const c of CAPTIONS) {
      if (tick >= c.tick) current = c.text;
    }
    return current;
  }, [tick]);

  const moduleCount = sidebarModules.length;

  return (
    <section className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
            See how it works.
          </h2>
          <p className="text-text-secondary text-[15px] max-w-md mx-auto">
            Watch your CRM come together in seconds. Hover to pause, click to explore.
          </p>
        </div>

        {/* Full app mockup */}
        <div
          className="rounded-2xl border border-border-light overflow-hidden shadow-2xl bg-background"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Browser chrome */}
          <div className="bg-white border-b border-border-light px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">app.magiccrm.com</div>
            </div>
            {!paused && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot" /><span className="text-[9px] text-text-tertiary">Live</span></div>}
            {paused && <span className="text-[9px] text-text-tertiary">Paused — hover off to resume</span>}
          </div>

          <div className="flex" style={{ height: 460 }}>
            {/* Sidebar */}
            <div className="w-[180px] bg-white border-r border-border-light flex flex-col flex-shrink-0">
              <div className="px-4 py-3 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-foreground rounded-sm" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground">Magic CRM</span>
                </div>
              </div>
              <nav className="flex-1 px-2 py-2 overflow-y-auto">
                <div className="space-y-0.5">
                  {/* Dashboard — always visible */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${
                    !activeModule ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary"
                  }`}>
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </div>

                  {/* Module items */}
                  <AnimatePresence>
                    {sidebarModules.map((mod) => {
                      const isActive = activeModule === mod.name;
                      return (
                        <motion.div
                          key={mod.name}
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: "auto" }}
                          exit={{ opacity: 0, x: -20, height: 0 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                            isActive ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary"
                          }`}>
                            {isActive && (
                              <motion.div
                                layoutId="demo-active"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3.5 bg-primary rounded-r-full"
                              />
                            )}
                            <mod.icon className="w-3.5 h-3.5" />
                            <span>{mod.name}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </nav>
              <div className="px-3 py-2 border-t border-border-light">
                <p className="text-[10px] text-text-tertiary text-center">{moduleCount} modules</p>
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top bar */}
              <div className="bg-white border-b border-border-light px-5 py-2.5 flex items-center justify-between flex-shrink-0">
                <div className="px-3 py-1.5 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-44 flex items-center gap-2">
                  <Search className="w-3 h-3" /> Search...
                </div>
                <div className="flex items-center gap-2">
                  {showPanel && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-2.5 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3 h-3" /> Customize
                    </motion.div>
                  )}
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">M</span>
                  </div>
                </div>
              </div>

              {/* Content + Panel */}
              <div className="flex flex-1 overflow-hidden">
                {/* Page content */}
                <div className="flex-1 p-5 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {!activeModule ? (
                      /* Dashboard overview */
                      <motion.div
                        key="dashboard"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-[16px] font-bold text-foreground mb-1">Dashboard</h3>
                        <p className="text-[11px] text-text-tertiary mb-4">Good morning</p>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[{ label: "Clients", value: "24" }, { label: "Today", value: "3" }, { label: "Revenue", value: "$2,400" }].map((s) => (
                            <div key={s.label} className="bg-white rounded-xl border border-border-light p-3 text-center">
                              <p className="text-[18px] font-bold text-foreground">{s.value}</p>
                              <p className="text-[10px] text-text-tertiary">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          {["Sarah booked Lash Fill", "Invoice #42 paid", "New inquiry from Tom"].map((a, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-border-light">
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              <span className="text-[10px] text-text-secondary">{a}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      /* Scheduling page */
                      <motion.div
                        key="scheduling"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-[16px] font-bold text-foreground">Scheduling</h3>
                            <p className="text-[11px] text-text-tertiary">Schedule appointments and manage your calendar</p>
                          </div>
                          <div className="px-3 py-1.5 bg-foreground text-white rounded-xl text-[11px] font-semibold">+ New</div>
                        </div>

                        {/* Appointments */}
                        <div className="space-y-1.5 mb-3">
                          {BOOKING_APPTS.map((a, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-border-light">
                              <div className={`w-1 h-6 rounded-full ${a.color}`} />
                              <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
                              <span className="text-[11px] font-medium text-foreground flex-1">{a.name}</span>
                              <AnimatePresence>
                                {featureStates["Booking Deposits"] && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="text-[9px] text-primary font-medium"
                                  >
                                    $30 dep
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>

                        {/* Feature-reactive elements */}
                        <AnimatePresence>
                          {featureStates["Waitlist"] && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                              <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">2 on waitlist for today</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {featureStates["Buffer Time"] && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                              <div className="text-[10px] text-text-tertiary">15 min buffer between appointments</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {featureStates["No-Show Protection"] && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">Tom K. — 2 no-shows this month</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Customize panel */}
                <AnimatePresence>
                  {showPanel && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 240, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                      className="bg-white border-l border-border-light flex-shrink-0 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-border-light">
                        <p className="text-[12px] font-bold text-foreground">Customize</p>
                        <p className="text-[9px] text-text-tertiary">Scheduling features</p>
                      </div>
                      <div className="p-3 space-y-1">
                        {BOOKING_FEATURES.map((f) => {
                          const isOn = featureStates[f] ?? true;
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="text-center mt-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-[13px] text-text-secondary"
            >
              {caption}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
