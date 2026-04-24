"use client";

// Archived: the "Three clicks. You're running." section from the landing
// page. Superseded by the horizontal slider inside ScrollMechanic which
// now carries the same narrative (pick your specialty → workspace
// assembles → you're live). Kept here for reference / potential reuse.

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Check, Crown, Sparkles, Scissors, Paintbrush, Eye, Droplets,
  Flower2, HandMetal, Users, Calendar, Receipt, MessageCircle, Inbox,
  BarChart3, Bell, Clock, ScrollText, ClipboardList,
} from "lucide-react";
import {
  sectionHeadingVariants, sectionTransition, viewportConfig,
} from "../app/landing-data";

const JOURNEY_PERSONAS = [
  { icon: Scissors, label: "Hair", accent: "#8B5CF6" },
  { icon: Eye, label: "Lash", accent: "#EC4899" },
  { icon: Paintbrush, label: "MUA", accent: "#F59E0B" },
  { icon: HandMetal, label: "Nails", accent: "#10B981" },
  { icon: Flower2, label: "Spa", accent: "#6366F1" },
  { icon: Droplets, label: "Skin", accent: "#06B6D4" },
];

// Per-persona module sets for scene 2
const PERSONA_MODULES: Record<number, { icon: typeof Users; label: string }[]> = {
  0: [{ icon: Users, label: "Clients" }, { icon: Calendar, label: "Appointments" }, { icon: Receipt, label: "Receipts" }, { icon: Inbox, label: "Inquiries" }, { icon: MessageCircle, label: "Messages" }, { icon: BarChart3, label: "Reporting" }],
  1: [{ icon: Users, label: "Clients" }, { icon: Calendar, label: "Appointments" }, { icon: Receipt, label: "Receipts" }, { icon: Sparkles, label: "Aftercare" }, { icon: MessageCircle, label: "Messages" }, { icon: BarChart3, label: "Reporting" }],
  2: [{ icon: Users, label: "Clients" }, { icon: Inbox, label: "Inquiries" }, { icon: Calendar, label: "Bookings" }, { icon: Receipt, label: "Invoicing" }, { icon: ScrollText, label: "Proposals" }, { icon: BarChart3, label: "Reporting" }],
  3: [{ icon: Users, label: "Clients" }, { icon: Calendar, label: "Appointments" }, { icon: Receipt, label: "Receipts" }, { icon: MessageCircle, label: "Messages" }, { icon: Sparkles, label: "Aftercare" }, { icon: BarChart3, label: "Reporting" }],
  4: [{ icon: Users, label: "Clients" }, { icon: Calendar, label: "Schedule" }, { icon: Receipt, label: "Receipts" }, { icon: Crown, label: "Memberships" }, { icon: Users, label: "Team" }, { icon: BarChart3, label: "Reporting" }],
  5: [{ icon: Users, label: "Clients" }, { icon: Calendar, label: "Appointments" }, { icon: Receipt, label: "Invoicing" }, { icon: ClipboardList, label: "SOAP Notes" }, { icon: MessageCircle, label: "Messages" }, { icon: BarChart3, label: "Reporting" }],
};

// Per-persona calendar + notification for scene 3
const PERSONA_CALENDAR: Record<number, { slots: { time: string; name: string; service: string; color: string }[]; notif: { name: string; service: string } }> = {
  0: { slots: [{ time: "9:00", name: "Sarah M.", service: "Balayage Touch-up", color: "#8B5CF6" }, { time: "11:30", name: "Emma R.", service: "Cut & Blowdry", color: "#EC4899" }, { time: "2:00", name: "", service: "", color: "" }], notif: { name: "Olivia C.", service: "Colour & Cut" } },
  1: { slots: [{ time: "9:00", name: "Sarah M.", service: "Lash Full Set", color: "#EC4899" }, { time: "11:30", name: "Emma R.", service: "Brow Lamination", color: "#8B5CF6" }, { time: "2:00", name: "", service: "", color: "" }], notif: { name: "Jess T.", service: "Lash Lift" } },
  2: { slots: [{ time: "10:00", name: "Jessica & Ryan", service: "Bridal Trial", color: "#F59E0B" }, { time: "1:00", name: "Sophie L.", service: "Editorial Shoot", color: "#EC4899" }, { time: "4:00", name: "", service: "", color: "" }], notif: { name: "Anna K.", service: "Wedding Makeup" } },
  3: { slots: [{ time: "9:30", name: "Megan T.", service: "Gel Full Set", color: "#10B981" }, { time: "11:00", name: "Lily P.", service: "Nail Art", color: "#EC4899" }, { time: "1:30", name: "", service: "", color: "" }], notif: { name: "Chloe R.", service: "Gel Manicure" } },
  4: { slots: [{ time: "9:00", name: "David K.", service: "Deep Tissue 90min", color: "#6366F1" }, { time: "11:00", name: "Sarah M.", service: "Facial", color: "#EC4899" }, { time: "2:00", name: "", service: "", color: "" }], notif: { name: "Tom H.", service: "Hot Stone Massage" } },
  5: { slots: [{ time: "10:00", name: "Rachel W.", service: "LED + Microderm", color: "#06B6D4" }, { time: "12:30", name: "Amy L.", service: "Hydrafacial", color: "#8B5CF6" }, { time: "3:00", name: "", service: "", color: "" }], notif: { name: "Nina S.", service: "Chemical Peel" } },
};

export function BuildJourney() {
  const [selectedPersona, setSelectedPersona] = useState(-1);
  const [buildPhase, setBuildPhase] = useState(0); // 0=waiting, 1=building, 2=live
  const [activeStep, setActiveStep] = useState(0);
  const [buildKey, setBuildKey] = useState(0); // forces re-mount of animated modules
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);
  const buildTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Kick off the build sequence for a given persona index
  const runBuildSequence = useCallback((_personaIdx: number, isInitial: boolean) => {
    // Clear any running timers
    buildTimers.current.forEach(clearTimeout);
    buildTimers.current = [];

    // Reset scenes 2 & 3
    setBuildPhase(0);
    setActiveStep((s) => Math.max(s, 1));
    setBuildKey((k) => k + 1);

    const delay = isInitial ? 1300 : 400;
    buildTimers.current.push(
      setTimeout(() => { setActiveStep(2); setBuildPhase(1); }, delay),
      setTimeout(() => setBuildPhase(2), delay + 1200),
      setTimeout(() => setActiveStep(3), delay + 2200),
    );
  }, []);

  const handleSelectPersona = (i: number) => {
    setSelectedPersona(i);
    setActiveStep(1);
    runBuildSequence(i, false);
  };

  // Auto-play the journey when section scrolls into view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayed.current) {
          hasPlayed.current = true;
          buildTimers.current.push(
            setTimeout(() => setActiveStep(1), 400),
            setTimeout(() => {
              setSelectedPersona(1); // "Lash" lights up
              runBuildSequence(1, true);
            }, 900),
          );
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      buildTimers.current.forEach(clearTimeout);
    };
  }, [runBuildSequence]);

  // Resolve current persona data (fallback to Lash if none selected)
  const pIdx = selectedPersona >= 0 ? selectedPersona : 1;
  const modules = PERSONA_MODULES[pIdx];
  const calendar = PERSONA_CALENDAR[pIdx];

  return (
    <section ref={sectionRef} className="py-20 sm:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface border border-border-light rounded-full text-[11px] font-medium text-text-secondary mb-5"
          >
            <Zap className="w-3 h-3" /> 60-second setup
          </motion.div>
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[1.75rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-3"
          >
            Three clicks. You&apos;re running.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-text-secondary text-[15px] max-w-md mx-auto"
          >
            Pick your specialty, get a workspace with your services, client cards, and booking page — ready in 60 seconds.
          </motion.p>
        </div>

        {/* Three visual scenes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-[140px] left-[16.67%] right-[16.67%] z-0">
            <div className="h-px bg-border-light w-full relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 via-violet-400 to-emerald-400"
                initial={{ width: "0%" }}
                animate={{ width: activeStep >= 3 ? "100%" : activeStep >= 2 ? "50%" : "0%" }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
          </div>

          {/* ── Scene 1: Pick Your Specialty ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Visual */}
            <div className="w-full max-w-[280px] mb-6">
              <div className="bg-card-bg rounded-2xl border border-border-light p-5 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-pink-500/[0.03] to-transparent" />
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-4 relative">What do you do?</p>
                <div className="grid grid-cols-3 gap-2.5 relative">
                  {JOURNEY_PERSONAS.map((p, i) => {
                    const Icon = p.icon;
                    const isSelected = selectedPersona === i;
                    return (
                      <motion.button
                        key={p.label}
                        type="button"
                        aria-pressed={isSelected}
                        animate={isSelected ? {
                          scale: [1, 1.1, 1.05],
                          transition: { duration: 0.4 },
                        } : {}}
                        className={`relative appearance-none border-0 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-white shadow-lg dark:bg-card-bg"
                            : activeStep >= 1 && !isSelected && selectedPersona >= 0
                              ? "bg-surface/50 opacity-40"
                              : "bg-surface/50 hover:bg-surface"
                        }`}
                        style={isSelected ? { outline: `2px solid ${p.accent}`, outlineOffset: "-2px", boxShadow: `0 4px 20px ${p.accent}25` } : undefined}
                        onClick={() => handleSelectPersona(i)}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300"
                          style={{ backgroundColor: isSelected ? p.accent + "18" : undefined }}
                        >
                          <Icon
                            className="w-4 h-4 transition-colors duration-300"
                            style={{ color: isSelected ? p.accent : "var(--text-tertiary)" }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold transition-colors duration-300 ${isSelected ? "text-foreground" : "text-text-tertiary"}`}>
                          {p.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: p.accent }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Label */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-3 text-[13px] font-bold transition-all duration-500 ${
                activeStep >= 1 ? "bg-foreground text-background scale-110" : "bg-surface text-text-tertiary border border-border-light"
              }`}>1</div>
              <h3 className="text-[17px] font-bold text-foreground mb-1.5">Pick your specialty</h3>
              <p className="text-[13px] text-text-secondary max-w-[220px] mx-auto">
                Lash tech, hairstylist, or MUA — one tap and we know exactly what you need.
              </p>
            </div>
          </motion.div>

          {/* ── Scene 2: Workspace Builds Itself ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Visual */}
            <div className="w-full max-w-[280px] mb-6">
              <div className="bg-card-bg rounded-2xl border border-border-light shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.03] to-transparent" />
                {/* Mini sidebar mockup */}
                <div className="flex relative" style={{ minHeight: 220 }}>
                  <div className="w-[80px] border-r border-border-light p-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 px-1.5 py-1 mb-2">
                      <div className="w-4 h-4 rounded-md" style={{ backgroundColor: (JOURNEY_PERSONAS[pIdx]?.accent ?? "#8B5CF6") + "30" }} />
                      <div className="h-2 w-8 bg-foreground/10 rounded" />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div key={buildKey} className="flex flex-col gap-1">
                        {modules.map((mod, i) => {
                          const Icon = mod.icon;
                          return (
                            <motion.div
                              key={mod.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={buildPhase >= 1 ? {
                                opacity: 1,
                                x: 0,
                                transition: { delay: i * 0.08, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
                              } : { opacity: 0, x: -20 }}
                              className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg"
                              style={i === 0 && buildPhase >= 2 ? { backgroundColor: (JOURNEY_PERSONAS[pIdx]?.accent ?? "#8B5CF6") + "15" } : undefined}
                            >
                              <Icon className="w-3 h-3 text-text-tertiary flex-shrink-0" />
                              <span className="text-[9px] font-medium text-text-secondary truncate">{mod.label}</span>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 p-3">
                    <AnimatePresence>
                      {buildPhase >= 2 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-2.5 w-14 bg-foreground/10 rounded" />
                            <div className="h-5 w-12 bg-foreground rounded-md" />
                          </div>
                          {[1, 2, 3].map((row) => (
                            <div key={row} className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-surface" />
                              <div className="flex-1">
                                <div className="h-2 w-full bg-surface rounded mb-1" />
                                <div className="h-1.5 w-2/3 bg-surface/60 rounded" />
                              </div>
                              <div className="h-4 w-10 bg-emerald-100 rounded-full" />
                            </div>
                          ))}
                        </motion.div>
                      )}
                      {buildPhase < 2 && buildPhase >= 1 && (
                        <motion.div
                          className="flex flex-col items-center justify-center h-full pt-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full mb-3"
                          />
                          <p className="text-[10px] text-text-tertiary font-medium">Building...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
            {/* Label */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-3 text-[13px] font-bold transition-all duration-500 ${
                activeStep >= 2 ? "bg-foreground text-background scale-110" : "bg-surface text-text-tertiary border border-border-light"
              }`}>2</div>
              <h3 className="text-[17px] font-bold text-foreground mb-1.5">Workspace assembles</h3>
              <p className="text-[13px] text-text-secondary max-w-[220px] mx-auto">
                Service menus, client cards, aftercare flows — configured to match how you actually work.
              </p>
            </div>
          </motion.div>

          {/* ── Scene 3: You're Live ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Visual */}
            <div className="w-full max-w-[280px] mb-6">
              <div className="bg-card-bg rounded-2xl border border-border-light p-5 shadow-sm relative overflow-hidden" style={{ minHeight: 220 }}>
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.03] to-transparent" />
                {/* Mini calendar + notification */}
                <AnimatePresence mode="wait">
                  <motion.div key={`cal-${buildKey}`} className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Today</p>
                      <span className="text-[10px] font-medium text-text-tertiary">April 4</span>
                    </div>
                    {/* Time slots */}
                    <div className="space-y-1.5 mb-3">
                      {calendar.slots.map((slot) => (
                        <div key={slot.time} className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono text-text-tertiary w-8 flex-shrink-0">{slot.time}</span>
                          {slot.name ? (
                            <div
                              className="flex-1 px-2.5 py-2 rounded-lg border-l-2"
                              style={{ backgroundColor: slot.color + "08", borderColor: slot.color }}
                            >
                              <p className="text-[11px] font-semibold text-foreground">{slot.name}</p>
                              <p className="text-[9px] text-text-tertiary">{slot.service}</p>
                            </div>
                          ) : (
                            <div className="flex-1 px-2.5 py-2 rounded-lg border border-dashed border-border-light">
                              <p className="text-[10px] text-text-tertiary">Available</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Notification toast */}
                    <AnimatePresence>
                      {activeStep >= 3 && (
                        <motion.div
                          key={`notif-${buildKey}`}
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                          className="bg-foreground text-background rounded-xl px-3.5 py-3 shadow-xl"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: JOURNEY_PERSONAS[pIdx]?.accent ?? "#10B981" }}>
                              <Bell className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold">New booking!</p>
                              <p className="text-[10px] opacity-70">{calendar.notif.name} booked {calendar.notif.service}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Clock className="w-2.5 h-2.5 opacity-50" />
                                <span className="text-[9px] opacity-50">11:47 PM — while you were closed</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            {/* Label */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-3 text-[13px] font-bold transition-all duration-500 ${
                activeStep >= 3 ? "bg-foreground text-background scale-110" : "bg-surface text-text-tertiary border border-border-light"
              }`}>3</div>
              <h3 className="text-[17px] font-bold text-foreground mb-1.5">You&apos;re live</h3>
              <p className="text-[13px] text-text-secondary max-w-[220px] mx-auto">
                Share your link on Instagram. Clients book themselves. You get paid.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
