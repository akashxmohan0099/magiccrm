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
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "var(--logo-green)" }}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-4" />
          <p className="text-[16px] font-medium text-foreground">Personalizing your experience...</p>
          <p className="text-[13px] text-text-tertiary mt-1.5">This takes a few seconds</p>
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 rounded-full mb-4">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">Personalized for {businessContext.businessName || "you"}</span>
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
