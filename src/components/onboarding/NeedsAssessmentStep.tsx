"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { getPersonaQuestions, getIndustryFallbackQuestions } from "@/lib/persona-questions";

/**
 * Step 4: Discovery Questions
 *
 * Shows persona-specific yes/no questions one at a time.
 * Answers are stored in `discoveryAnswers` in the onboarding store.
 */
export function NeedsAssessmentStep() {
  const {
    selectedPersona,
    discoveryAnswers,
    setDiscoveryAnswer,
    nextStep,
    prevStep,
    businessContext,
    getPersonaConfig,
  } = useOnboardingStore();

  const selectedIndustry = useOnboardingStore((s) => s.selectedIndustry);
  const persona = getPersonaConfig();

  // Get the persona-specific questions (or fallback)
  const questions = useMemo(() => {
    if (selectedPersona) {
      return getPersonaQuestions(selectedPersona).questions;
    }
    const fallback = getIndustryFallbackQuestions(selectedIndustry);
    return fallback?.questions ?? getPersonaQuestions("hair-salon").questions;
  }, [selectedPersona, selectedIndustry]);

  const totalQuestions = questions.length;

  const [quizIndex, setQuizIndex] = useState(-1);
  const [direction, setDirection] = useState(1);

  const setNeed = useOnboardingStore((s) => s.setNeed);

  const handleAnswer = useCallback(
    (questionId: string, value: boolean) => {
      setDiscoveryAnswer(questionId, value);

      // Immediately activate/deactivate modules based on the answer
      const question = questions.find((q) => q.id === questionId);
      if (question?.needsKey) {
        setNeed(question.needsKey, value);
      }

      setDirection(1);
      setTimeout(() => {
        if (quizIndex < totalQuestions - 1) {
          setQuizIndex((prev) => prev + 1);
        } else {
          nextStep();
        }
      }, 200);
    },
    [quizIndex, totalQuestions, questions, setDiscoveryAnswer, setNeed, nextStep]
  );

  const handleBack = useCallback(() => {
    setDirection(-1);
    if (quizIndex <= 0) {
      prevStep();
    } else {
      setQuizIndex((prev) => prev - 1);
    }
  }, [quizIndex, prevStep]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (quizIndex < 0 || quizIndex >= totalQuestions) return;
      const q = questions[quizIndex];
      if (e.key === "y" || e.key === "Y") handleAnswer(q.id, true);
      else if (e.key === "n" || e.key === "N") handleAnswer(q.id, false);
      else if (e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quizIndex, totalQuestions, questions, handleAnswer, handleBack]);

  // Transition screen
  if (quizIndex === -1) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-8">
            <HelpCircle className="w-6 h-6 text-foreground" />
          </div>
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-4">
            {businessContext.businessName
              ? `Let\u2019s learn about ${businessContext.businessName}`
              : "A few quick questions"}
          </h2>
          <p className="text-[15px] text-text-tertiary mb-2 leading-relaxed">
            {persona
              ? `Tailored for ${persona.label.toLowerCase()} businesses.`
              : "We\u2019ll figure out exactly what you need."}
          </p>
          <p className="text-[14px] text-text-tertiary mb-12">
            {totalQuestions} quick yes/no questions
          </p>
          <button
            onClick={() => {
              setDirection(1);
              setQuizIndex(0);
            }}
            className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            Let&apos;s go
          </button>
        </motion.div>
      </div>
    );
  }

  // Question card
  const currentQ = questions[quizIndex];
  const currentValue = discoveryAnswers[currentQ.id];
  const isAnswered = currentQ.id in discoveryAnswers;
  const answeredCount = Object.keys(discoveryAnswers).filter((id) =>
    questions.some((q) => q.id === id)
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="pt-6 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-text-tertiary font-medium">
            {quizIndex + 1} of {totalQuestions}
          </span>
          <span className="text-[12px] text-text-tertiary">
            {answeredCount} answered
          </span>
        </div>
        <div className="w-full h-1 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((quizIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Centered question */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={quizIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.15 }}
            className="text-center w-full"
          >
            <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-3 leading-[1.2] max-w-md mx-auto">
              {currentQ.text}
            </h2>
            <p className="text-[15px] text-text-tertiary mb-14 max-w-sm mx-auto leading-relaxed">
              {currentQ.subtitle}
            </p>

            <div className="flex gap-4 max-w-xs mx-auto">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(currentQ.id, false)}
                className={`flex-1 py-5 rounded-2xl text-[17px] font-medium cursor-pointer transition-all duration-150 ${
                  isAnswered && currentValue === false
                    ? "bg-foreground text-white"
                    : "bg-surface border border-border-light hover:border-foreground/20"
                }`}
              >
                No
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(currentQ.id, true)}
                className={`flex-1 py-5 rounded-2xl text-[17px] font-medium cursor-pointer transition-all duration-150 ${
                  isAnswered && currentValue === true
                    ? "bg-foreground text-white"
                    : "bg-surface border border-border-light hover:border-foreground/20"
                }`}
              >
                Yes
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard hints */}
      <div className="pb-8 flex items-center justify-center gap-3 text-[12px] text-text-tertiary select-none">
        <span className="flex items-center gap-1.5">
          press
          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-surface border border-border-light text-[10px] font-mono text-text-secondary">
            Y
          </kbd>
          or
          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-surface border border-border-light text-[10px] font-mono text-text-secondary">
            N
          </kbd>
        </span>
        <span className="text-border-light">&middot;</span>
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 hover:text-text-secondary cursor-pointer transition-colors"
        >
          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-surface border border-border-light text-[10px] font-mono text-text-secondary">
            &larr;
          </kbd>
          back
        </button>
      </div>
    </div>
  );
}
