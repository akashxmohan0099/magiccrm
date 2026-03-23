"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, NeedsAssessment } from "@/types/onboarding";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

interface Chip {
  id: string;
  label: string;
  activates: string[];
  needsKeys: (keyof NeedsAssessment)[];
}

interface Slide {
  title: string;
  subtitle: string;
  chips: Chip[];
}

const SLIDES: Slide[] = [
  {
    title: "How do you work with clients?",
    subtitle: "Select all that apply",
    chips: [
      { id: "clients-book", label: "Clients book appointments with me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
      { id: "visit-clients", label: "I visit clients at their location", activates: ["bookings-calendar", "jobs-projects"], needsKeys: ["acceptBookings", "manageProjects"] },
      { id: "recurring", label: "I have repeat or regular clients", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"] },
      { id: "online-booking", label: "Clients should be able to book online", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"] },
    ],
  },
  {
    title: "How do you get paid?",
    subtitle: "Select all that apply",
    chips: [
      { id: "deposits", label: "I take deposits before starting", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
      { id: "proposals", label: "I send proposals or quotes first", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"] },
      { id: "track-time", label: "I bill by the hour or track time", activates: ["jobs-projects", "quotes-invoicing"], needsKeys: ["manageProjects", "sendInvoices"] },
      { id: "contracts", label: "I use contracts or terms of service", activates: ["documents"], needsKeys: [] },
    ],
  },
  {
    title: "How do you grow your business?",
    subtitle: "Select all that apply",
    chips: [
      { id: "social-clients", label: "Clients find me through social media", activates: ["marketing"], needsKeys: ["runMarketing"] },
      { id: "reviews-matter", label: "Online reviews are important for me", activates: ["marketing"], needsKeys: ["runMarketing"] },
      { id: "team", label: "I have employees or contractors", activates: ["team"], needsKeys: [] },
      { id: "referrals", label: "Most clients come from word of mouth", activates: ["marketing"], needsKeys: ["runMarketing"] },
    ],
  },
];

const ALL_CHIPS = SLIDES.flatMap(s => s.chips);

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const currentSlide = SLIDES[slideIndex];
  const isLast = slideIndex === SLIDES.length - 1;
  const progress = ((slideIndex + 1) / SLIDES.length) * 100;

  const toggle = useCallback((id: string) => {
    setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const handleNext = () => {
    if (isLast) {
      finalize();
    } else {
      setDirection(1);
      setSlideIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (slideIndex === 0) {
      prevStep();
    } else {
      setDirection(-1);
      setSlideIndex(i => i - 1);
    }
  };

  const finalize = () => {
    const mods = new Set<string>(), needs = new Set<keyof NeedsAssessment>();
    for (const chip of ALL_CHIPS) {
      if (selected.has(chip.id)) {
        chip.activates.forEach(m => mods.add(m));
        chip.needsKeys.forEach(n => needs.add(n));
      }
    }
    (["manageCustomers", "receiveInquiries", "communicateClients", "sendInvoices"] as const).forEach(n => needs.add(n));
    needs.forEach(n => setNeed(n, true));

    const M2N: Record<string, string> = { "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries", "communication": "communicateClients", "bookings-calendar": "acceptBookings", "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects", "marketing": "runMarketing" };
    const N2M = Object.fromEntries(Object.entries(M2N).map(([m, n]) => [n, m]));
    for (const cat of FEATURE_CATEGORIES) {
      const mid = N2M[cat.id];
      const all = cat.features.map(f => ({ ...f, selected: true }));
      setFeatureSelections(cat.id, all);
      if (mid) setFeatureSelections(mid, all);
    }

    const addons = getAddonModules(), ais = new Set(addons.map(m => m.id)), as2 = useAddonsStore.getState();
    mods.forEach(id => {
      if (ais.has(id)) {
        const d = addons.find(m => m.id === id);
        if (d && !as2.isAddonEnabled(id)) as2.enableAddon(id, d.name);
      }
    });

    nextStep();
  };

  const slideSelectedCount = currentSlide.chips.filter(c => selected.has(c.id)).length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 50, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.1, 0.95, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -40, 25, 0], y: [0, 25, -40, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Progress bar */}
        <div className="pt-6 px-6 lg:px-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <span className="text-[12px] text-text-tertiary font-medium tabular-nums">
              {slideIndex + 1}/{SLIDES.length}
            </span>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slideIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                  {currentSlide.title}
                </h2>
                <p className="text-[15px] text-text-secondary">
                  {currentSlide.subtitle}
                </p>
              </div>

              <div className="space-y-3">
                {currentSlide.chips.map((chip, i) => {
                  const on = selected.has(chip.id);
                  return (
                    <motion.button
                      key={chip.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggle(chip.id)}
                      className={`w-full flex items-center justify-between px-6 py-4.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                        on
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-white/90 border border-white/60 hover:border-primary/20 hover:shadow-md backdrop-blur-sm"
                      }`}
                    >
                      <span className={`text-[15px] font-medium ${on ? "text-white" : "text-foreground"}`}>
                        {chip.label}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-3 transition-all ${
                        on ? "bg-white/25" : "border-2 border-border-light"
                      }`}>
                        {on && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {slideSelectedCount === 0 && (
                <p className="text-center text-[13px] text-text-tertiary mt-4">
                  None of these? Just skip to the next one.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
            >
              {isLast ? "See my workspace" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
