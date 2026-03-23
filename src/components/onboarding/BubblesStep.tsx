"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, NeedsAssessment } from "@/types/onboarding";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

// ── Screen 1: High-signal activity chips ──────────────────────────
interface Chip {
  id: string;
  label: string;
  icon: string;
  activates: string[];
  needsKeys: (keyof NeedsAssessment)[];
  // Which follow-up questions to show if selected
  followUp?: string;
}

const CHIPS: Chip[] = [
  { id: "clients-book", label: "Clients book appointments with me", icon: "", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], followUp: "booking-style" },
  { id: "visit-clients", label: "I visit clients at their location", icon: "", activates: ["bookings-calendar", "jobs-projects"], needsKeys: ["acceptBookings", "manageProjects"] },
  { id: "deposits", label: "I take deposits or upfront payments", icon: "", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices"] },
  { id: "proposals", label: "I send proposals or quotes before starting", icon: "", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
  { id: "track-time", label: "I bill by the hour or track time", icon: "", activates: ["jobs-projects"], needsKeys: ["manageProjects"] },
  { id: "recurring", label: "I have recurring or repeat clients", icon: "", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"] },
  { id: "team", label: "I have employees or contractors", icon: "", activates: ["team"], needsKeys: [], followUp: "team-size" },
  { id: "social-clients", label: "Clients find me through social media", icon: "", activates: ["marketing"], needsKeys: ["runMarketing"], followUp: "marketing-channels" },
  { id: "reviews-matter", label: "Online reviews are important for me", icon: "", activates: ["marketing"], needsKeys: ["runMarketing"] },
  { id: "contracts", label: "I use contracts or terms of service", icon: "", activates: ["documents"], needsKeys: [] },
];

// ── Screen 2: Conditional follow-ups ──────────────────────────────
interface FollowUp {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

const FOLLOW_UPS: Record<string, FollowUp> = {
  "booking-style": {
    id: "booking-style",
    question: "How do clients book with you?",
    options: [
      { label: "They book online", value: "online" },
      { label: "I manage it manually", value: "manual" },
      { label: "Both", value: "both" },
    ],
  },
  "project-style": {
    id: "project-style",
    question: "What kind of projects do you run?",
    options: [
      { label: "One-off jobs", value: "one-off" },
      { label: "Ongoing retainers", value: "retainer" },
      { label: "Mix of both", value: "mixed" },
    ],
  },
  "billing-style": {
    id: "billing-style",
    question: "How do you usually bill?",
    options: [
      { label: "Fixed price quotes", value: "fixed" },
      { label: "Hourly / time-based", value: "hourly" },
      { label: "Deposits + final invoice", value: "deposits" },
      { label: "Recurring / subscriptions", value: "recurring" },
    ],
  },
  "marketing-channels": {
    id: "marketing-channels",
    question: "Where do you find most clients?",
    options: [
      { label: "Word of mouth", value: "referral" },
      { label: "Social media", value: "social" },
      { label: "Google / SEO", value: "search" },
      { label: "Paid ads", value: "ads" },
    ],
  },
  "team-size": {
    id: "team-size",
    question: "How big is your team?",
    options: [
      { label: "2-5 people", value: "2-5" },
      { label: "6-15 people", value: "6-15" },
      { label: "16+ people", value: "16+" },
    ],
  },
};

export function BubblesStep() {
  const { nextStep, prevStep, setTeamSize } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [screen, setScreen] = useState<"chips" | "followups">("chips");
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  // Which follow-ups are needed based on selections
  const neededFollowUps = CHIPS
    .filter(c => selectedChips.has(c.id) && c.followUp)
    .map(c => FOLLOW_UPS[c.followUp!])
    .filter(Boolean);

  const allFollowUpsAnswered = neededFollowUps.every(fu => followUpAnswers[fu.id]);

  const toggleChip = useCallback((id: string) => {
    setSelectedChips(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleChipsContinue = () => {
    if (neededFollowUps.length > 0) {
      setScreen("followups");
    } else {
      finalize();
    }
  };

  const finalize = () => {
    // Set needs
    const mods = new Set<string>(), needs = new Set<keyof NeedsAssessment>();
    for (const chip of CHIPS) {
      if (selectedChips.has(chip.id)) {
        chip.activates.forEach(m => mods.add(m));
        chip.needsKeys.forEach(n => needs.add(n));
      }
    }
    // Always-on
    (["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"] as const).forEach(n => needs.add(n));
    needs.forEach(n => setNeed(n, true));

    // Apply follow-up data
    if (followUpAnswers["team-size"]) {
      const sizeMap: Record<string, "2-5" | "6-15" | "16+"> = { "2-5": "2-5", "6-15": "6-15", "16+": "16+" };
      setTeamSize(sizeMap[followUpAnswers["team-size"]] || "2-5");
    }

    // Enable all features for all categories
    const M2N: Record<string, string> = { "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries", "communication": "communicateClients", "bookings-calendar": "acceptBookings", "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects", "marketing": "runMarketing" };
    const N2M = Object.fromEntries(Object.entries(M2N).map(([m, n]) => [n, m]));
    for (const cat of FEATURE_CATEGORIES) {
      const mid = N2M[cat.id];
      const all = cat.features.map(f => ({ ...f, selected: true }));
      setFeatureSelections(cat.id, all);
      if (mid) setFeatureSelections(mid, all);
    }

    // Enable add-ons
    const addons = getAddonModules(), ais = new Set(addons.map(m => m.id)), as2 = useAddonsStore.getState();
    mods.forEach(id => {
      if (ais.has(id)) {
        const d = addons.find(m => m.id === id);
        if (d && !as2.isAddonEnabled(id)) as2.enableAddon(id, d.name);
      }
    });

    nextStep();
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 50, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.95, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -40, 25, 0], y: [0, 25, -40, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [-40, 60, -30, -40], y: [10, -40, 30, 10] }} transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 60%)", filter: "blur(50px)" }} />
      </div>

      <AnimatePresence mode="wait">
        {screen === "chips" ? (
          <motion.div key="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                What do you do day-to-day?
              </h2>
              <p className="text-[15px] text-text-secondary max-w-md mx-auto">
                Pick everything that applies. This takes 10 seconds.
              </p>
            </div>

            {/* Chips grid */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {CHIPS.map((chip, i) => {
                  const on = selectedChips.has(chip.id);
                  return (
                    <motion.button
                      key={chip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 18 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleChip(chip.id)}
                      className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                        on
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white/90 border border-border-light hover:border-primary/30 hover:shadow-md"
                      }`}
                    >
                      {on && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 bg-white/25 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      <span className={`text-[14px] font-semibold leading-tight ${on ? "text-white" : "text-foreground"}`}>
                        {chip.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4">
              <div className="max-w-lg mx-auto flex gap-3">
                <button onClick={prevStep} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors">
                  Back
                </button>
                <button
                  onClick={handleChipsContinue}
                  disabled={selectedChips.size < 2}
                  className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
                    selectedChips.size >= 2 ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg" : "bg-foreground/15 text-text-tertiary cursor-not-allowed"
                  }`}
                >
                  {selectedChips.size < 2 ? `Pick at least ${2 - selectedChips.size} more` : "Continue"}
                  {selectedChips.size >= 2 && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="followups" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="relative z-10 h-full flex flex-col">
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                A couple more details
              </h2>
              <p className="text-[15px] text-text-secondary">
                This helps us get the setup right.
              </p>
            </div>

            {/* Follow-up questions */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="max-w-md w-full space-y-8">
                {neededFollowUps.map((fu, fi) => (
                  <motion.div
                    key={fu.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: fi * 0.1 }}
                  >
                    <p className="text-[16px] font-semibold text-foreground mb-3">{fu.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {fu.options.map(opt => {
                        const isSelected = followUpAnswers[fu.id] === opt.value;
                        return (
                          <motion.button
                            key={opt.value}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFollowUpAnswers(prev => ({ ...prev, [fu.id]: opt.value }))}
                            className={`px-5 py-3 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary text-white shadow-md"
                                : "bg-white border border-border-light hover:border-primary/30 text-foreground"
                            }`}
                          >
                            {opt.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4">
              <div className="max-w-md mx-auto flex gap-3">
                <button onClick={() => setScreen("chips")} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={finalize}
                  disabled={!allFollowUpsAnswered}
                  className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
                    allFollowUpsAnswered ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg" : "bg-foreground/15 text-text-tertiary cursor-not-allowed"
                  }`}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
