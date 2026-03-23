"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, NeedsAssessment } from "@/types/onboarding";
import { getPersonaQuestions, getIndustryFallbackQuestions } from "@/lib/persona-questions";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

const MODULE_TO_NEED: Record<string, keyof NeedsAssessment> = {
  "client-database": "manageCustomers",
  "leads-pipeline": "receiveInquiries",
  "communication": "communicateClients",
  "bookings-calendar": "acceptBookings",
  "quotes-invoicing": "sendInvoices",
  "jobs-projects": "manageProjects",
  "marketing": "runMarketing",
};
const NEED_TO_MODULE: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_TO_NEED).map(([mod, need]) => [need, mod])
);

export function NeedsAssessmentStep() {
  const {
    selectedPersona,
    discoveryAnswers,
    setDiscoveryAnswer,
    setFeatureSelections,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const setNeed = useOnboardingStore((s) => s.setNeed);

  const questions = useMemo(() => {
    if (selectedPersona) return getPersonaQuestions(selectedPersona).questions;
    const fallback = getIndustryFallbackQuestions(selectedIndustry);
    return fallback?.questions ?? getPersonaQuestions("hair-salon").questions;
  }, [selectedPersona, selectedIndustry]);

  const totalQuestions = questions.length;
  const [quizIndex, setQuizIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // When all questions are done: enable ALL features for every module, then go to summary
  const finishQuestions = useCallback(() => {
    // Enable ALL sub-features for every FEATURE_CATEGORY (module gets everything)
    for (const cat of FEATURE_CATEGORIES) {
      const moduleId = NEED_TO_MODULE[cat.id];
      const allOn = cat.features.map((f) => ({
        id: f.id, label: f.label, description: f.description, selected: true,
      }));
      setFeatureSelections(cat.id, allOn);
      if (moduleId) setFeatureSelections(moduleId, allOn);
    }

    // Enable add-ons activated by discovery answers
    const answers = useOnboardingStore.getState().discoveryAnswers;
    const addonModules = getAddonModules();
    const addonIds = new Set(addonModules.map((m) => m.id));
    const addonsStore = useAddonsStore.getState();
    for (const q of questions) {
      if (answers[q.id] === true) {
        for (const modId of q.activatesModules) {
          if (addonIds.has(modId)) {
            const def = addonModules.find((m) => m.id === modId);
            if (def && !addonsStore.isAddonEnabled(modId)) {
              addonsStore.enableAddon(modId, def.name);
            }
          }
        }
      }
    }

    nextStep();
  }, [questions, setFeatureSelections, nextStep]);

  const handleAnswer = useCallback(
    (questionId: string, value: boolean) => {
      setDiscoveryAnswer(questionId, value);
      const question = questions.find((q) => q.id === questionId);
      if (question?.needsKey) setNeed(question.needsKey, value);

      setDirection(1);
      setTimeout(() => {
        if (quizIndex < totalQuestions - 1) {
          setQuizIndex((prev) => prev + 1);
        } else {
          finishQuestions();
        }
      }, 250);
    },
    [quizIndex, totalQuestions, questions, setDiscoveryAnswer, setNeed, finishQuestions]
  );

  const handleBack = useCallback(() => {
    setDirection(-1);
    if (quizIndex <= 0) prevStep();
    else setQuizIndex((prev) => prev - 1);
  }, [quizIndex, prevStep]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (quizIndex >= totalQuestions) return;
      const q = questions[quizIndex];
      if (e.key === "y" || e.key === "Y") handleAnswer(q.id, true);
      else if (e.key === "n" || e.key === "N") handleAnswer(q.id, false);
      else if (e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quizIndex, totalQuestions, questions, handleAnswer, handleBack]);

  const currentQ = questions[quizIndex];
  if (!currentQ) return null;

  const currentValue = discoveryAnswers[currentQ.id];
  const isAnswered = currentQ.id in discoveryAnswers;
  const progress = ((quizIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Progress bar — full width */}
      <div className="pt-6 px-6 lg:px-20">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[12px] text-text-tertiary font-medium tabular-nums">
            {quizIndex + 1}/{totalQuestions}
          </span>
        </div>
      </div>

      {/* Centered question */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={quizIndex}
            custom={direction}
            initial={{ opacity: 0, y: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction > 0 ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className="text-center w-full"
          >
            <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-4 leading-[1.2] max-w-xl mx-auto">
              {currentQ.text}
            </h2>
            <p className="text-[15px] text-text-tertiary mb-16 max-w-md mx-auto leading-relaxed">
              {currentQ.subtitle}
            </p>

            <div className="flex gap-4 max-w-md mx-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(currentQ.id, false)}
                className={`flex-1 py-4 rounded-2xl text-[16px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  isAnswered && currentValue === false
                    ? "bg-foreground text-white shadow-lg"
                    : "bg-card-bg border border-border-light hover:border-foreground/25 hover:shadow-md text-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(currentQ.id, true)}
                className={`flex-1 py-4 rounded-2xl text-[16px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  isAnswered && currentValue === true
                    ? "bg-primary text-foreground shadow-lg shadow-primary/20"
                    : "bg-card-bg border border-border-light hover:border-primary/40 hover:shadow-md text-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hints */}
      <div className="pb-8 flex items-center justify-center gap-4 text-[12px] text-text-tertiary select-none">
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-lg bg-card-bg border border-border-light text-[11px] font-mono text-text-secondary">Y</kbd>
          yes
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-lg bg-card-bg border border-border-light text-[11px] font-mono text-text-secondary">N</kbd>
          no
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-lg bg-card-bg border border-border-light text-[11px] font-mono text-text-secondary">&larr;</kbd>
          back
        </span>
      </div>
    </div>
  );
}
