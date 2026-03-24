"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

interface AIQuestion {
  question: string;
  module: string;
}

interface AICategory {
  title: string;
  subtitle: string;
  questions: AIQuestion[];
}

const MODULE_MAP: Record<string, { needsKey?: string; moduleId: string }> = {
  scheduling: { needsKey: "acceptBookings", moduleId: "bookings-calendar" },
  projects: { needsKey: "manageProjects", moduleId: "jobs-projects" },
  billing: { needsKey: "sendInvoices", moduleId: "quotes-invoicing" },
  marketing: { needsKey: "runMarketing", moduleId: "marketing" },
  team: { moduleId: "team" },
  automations: { moduleId: "automations" },
  reporting: { moduleId: "reporting" },
  products: { moduleId: "products" },
  documents: { moduleId: "documents" },
  communication: { needsKey: "communicateClients", moduleId: "communication" },
};

export function AIQuestionsStep() {
  const { nextStep, prevStep, businessContext, selectedIndustry, selectedPersona, discoveryAnswers } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setDiscoveryAnswer = useOnboardingStore((s) => s.setDiscoveryAnswer);
  const getPersonaConfig = useOnboardingStore((s) => s.getPersonaConfig);

  const [categories, setCategories] = useState<AICategory[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const selectedChips = Object.entries(discoveryAnswers)
    .filter(([key, val]) => val === true && !key.startsWith("module:"))
    .map(([key]) => key);

  const persona = getPersonaConfig();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/onboarding/ai-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: selectedIndustry,
            persona: persona?.label || selectedPersona,
            businessName: businessContext.businessName,
            businessDescription: businessContext.businessDescription,
            location: businessContext.location,
            selectedChips,
          }),
        });

        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories.slice(0, 2));
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = useCallback((qKey: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [qKey]: value }));
  }, []);

  const currentCat = categories[catIndex];
  const isLastCat = catIndex === categories.length - 1;

  // Count answered in current category
  const currentCatAnswered = currentCat
    ? currentCat.questions.filter((_, i) => `${catIndex}-${i}` in answers).length
    : 0;

  const handleNext = () => {
    if (isLastCat) {
      finalize();
    } else {
      setDirection(1);
      setCatIndex(i => i + 1);
    }
  };

  const handleBack = () => {
    if (catIndex === 0) {
      prevStep();
    } else {
      setDirection(-1);
      setCatIndex(i => i - 1);
    }
  };

  const finalize = () => {
    for (const cat of categories) {
      for (let i = 0; i < cat.questions.length; i++) {
        const key = `${categories.indexOf(cat)}-${i}`;
        if (answers[key] === true) {
          const q = cat.questions[i];
          const mapping = MODULE_MAP[q.module];
          if (mapping) {
            setDiscoveryAnswer(`module:${mapping.moduleId}`, true);
            if (mapping.needsKey) {
              setNeed(mapping.needsKey as keyof import("@/types/onboarding").NeedsAssessment, true);
            }
          }
        }
      }
    }
    nextStep();
  };

  const handleSkip = () => nextStep();

  if (loading) {
    const steps = [
      { label: "Reading your business profile", delay: 0 },
      { label: "Analyzing your workflow", delay: 0.8 },
      { label: "Finding what you might be missing", delay: 1.6 },
      { label: "Generating personalized questions", delay: 2.4 },
    ];

    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 40%, #F5F3FF 70%, #FAFAFA 100%)" }}>
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", filter: "blur(50px)" }} />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10 max-w-sm mx-auto px-6">
          {/* Pulsing logo */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ backgroundColor: "var(--logo-green)", boxShadow: "0 0 40px rgba(124,254,157,0.3)" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>

          <h3 className="text-[20px] font-bold text-foreground mb-2">
            Personalizing for {businessContext.businessName || "you"}
          </h3>
          <p className="text-[14px] text-text-tertiary mb-8">
            Our AI is analyzing your business to ask the right questions
          </p>

          {/* Animated progress steps */}
          <div className="space-y-3 text-left">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: s.delay, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: s.delay + 0.2, type: "spring", stiffness: 300 }}
                  className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: s.delay + 0.5 }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                </motion.div>
                <span className="text-[13px] text-text-secondary">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error || categories.length === 0) {
    handleSkip();
    return null;
  }

  const progress = ((catIndex + 1) / categories.length) * 100;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 40, -25, 0], y: [0, -25, 35, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -35, 20, 0], y: [0, 20, -35, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Progress bar */}
        <div className="pt-6 px-6 lg:px-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[11px] text-primary font-semibold">AI</span>
            </div>
          </div>
        </div>

        {/* Category slide */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={catIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg"
            >
              {/* Category header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[12px] font-medium text-text-tertiary">Personalized for {businessContext.businessName || "you"}</span>
                </div>
                <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1.5">
                  {currentCat.title}
                </h2>
                <p className="text-[14px] text-text-secondary">
                  {currentCat.subtitle}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {currentCat.questions.map((q, i) => {
                  const key = `${catIndex}-${i}`;
                  const isYes = answers[key] === true;
                  const isNo = answers[key] === false;
                  const isAnswered = key in answers;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAnswered ? "bg-white/80 border-border-light" : "bg-white border-primary/15 shadow-sm"
                      }`}
                    >
                      <p className="text-[15px] font-medium text-foreground mb-3">{q.question}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnswer(key, true)}
                          className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                            isYes ? "bg-primary text-white shadow-sm" : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleAnswer(key, false)}
                          className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                            isNo ? "bg-foreground text-white" : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Subtle progression message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-[12px] text-text-tertiary mt-5"
              >
                {currentCatAnswered === 0
                  ? "These are tailored to your business — answer what feels right"
                  : currentCatAnswered < currentCat.questions.length
                  ? `${currentCat.questions.length - currentCatAnswered} more to go`
                  : isLastCat ? "All done — let\u2019s see your workspace" : "Nice — one more category"}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={handleSkip} className="px-5 py-3.5 rounded-2xl text-[13px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors">
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
            >
              {isLastCat ? "See my workspace" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
