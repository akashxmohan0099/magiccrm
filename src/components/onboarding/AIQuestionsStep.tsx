"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

interface AIQuestion {
  question: string;
  module: string;
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

  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Gather chip selections for context
  const selectedChips = Object.entries(discoveryAnswers)
    .filter(([key, val]) => val === true && !key.startsWith("module:"))
    .map(([key]) => key);

  const persona = getPersonaConfig();

  // Fetch AI questions on mount
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
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions.slice(0, 3));
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

  const handleAnswer = useCallback((index: number, value: boolean) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  }, []);

  const allAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;

  const handleContinue = () => {
    // Apply AI question answers to module activation
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === true) {
        const q = questions[i];
        const mapping = MODULE_MAP[q.module];
        if (mapping) {
          setDiscoveryAnswer(`module:${mapping.moduleId}`, true);
          if (mapping.needsKey) {
            setNeed(mapping.needsKey as keyof import("@/types/onboarding").NeedsAssessment, true);
          }
        }
      }
    }
    nextStep();
  };

  // Skip if AI fails — don't block onboarding
  const handleSkip = () => {
    nextStep();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--logo-green)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mb-3" />
          <p className="text-[15px] text-text-secondary">Analyzing your business...</p>
          <p className="text-[13px] text-text-tertiary mt-1">Generating personalized questions</p>
        </motion.div>
      </div>
    );
  }

  // If AI failed, skip this step entirely
  if (error || questions.length === 0) {
    handleSkip();
    return null;
  }

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
        {/* Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">AI-Powered</span>
          </div>
          <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
            A few more things about {businessContext.businessName || "your business"}
          </h2>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto">
            Based on what you told us, we have a couple more questions.
          </p>
        </div>

        {/* Questions */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-lg space-y-4">
            <AnimatePresence>
              {questions.map((q, i) => {
                const answered = i in answers;
                const isYes = answers[i] === true;
                const isNo = answers[i] === false;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                    className={`p-5 rounded-2xl border transition-all ${
                      answered ? "bg-white border-border-light" : "bg-white/90 border-primary/20 shadow-sm"
                    }`}
                  >
                    <p className="text-[15px] font-medium text-foreground mb-3">{q.question}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAnswer(i, true)}
                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                          isYes
                            ? "bg-primary text-white"
                            : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleAnswer(i, false)}
                        className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                          isNo
                            ? "bg-foreground text-white"
                            : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={prevStep} className="px-6 py-3.5 rounded-2xl text-[14px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors">
              Back
            </button>
            <button
              onClick={allAnswered ? handleContinue : handleSkip}
              className={`flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
                allAnswered
                  ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
                  : "bg-foreground/80 text-white/80 cursor-pointer"
              }`}
            >
              {allAnswered ? "See my workspace" : "Skip"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
