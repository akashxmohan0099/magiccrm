"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Users, Sparkles,
  UserCheck, Inbox, MessageCircle, Calendar,
  Receipt, FolderKanban, Megaphone, Headphones, FileText,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import {
  NeedsAssessment,
  NEEDS_QUESTIONS,
  TEAM_SIZE_OPTIONS,
  FEATURE_CATEGORIES,
} from "@/types/onboarding";

const QUESTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  manageCustomers: UserCheck,
  receiveInquiries: Inbox,
  communicateClients: MessageCircle,
  acceptBookings: Calendar,
  sendInvoices: Receipt,
  manageProjects: FolderKanban,
  runMarketing: Megaphone,
  handleSupport: Headphones,
  manageDocuments: FileText,
};

const QUESTION_SUBTITLES: Record<string, string> = {
  manageCustomers: "Contact details, notes, and history — all in one place.",
  receiveInquiries: "Capture and track incoming leads so none slip through the cracks.",
  communicateClients: "Email, SMS, social DMs — unified in one inbox.",
  acceptBookings: "Let clients book appointments without the back-and-forth.",
  sendInvoices: "Create professional quotes and invoices in seconds.",
  manageProjects: "Track jobs, tasks, and deadlines from start to finish.",
  runMarketing: "Run campaigns, collect reviews, and grow your audience.",
  handleSupport: "Log and resolve support requests to keep clients happy.",
  manageDocuments: "Store contracts, get e-signatures, and share files securely.",
};

export function NeedsAssessmentStep() {
  const {
    needs,
    setNeed,
    teamSize,
    setTeamSize,
    nextStep,
    prevStep,
    setFeatureSelections,
  } = useOnboardingStore();

  // Quiz state: -1 = intro, 0-8 = questions, 9 = team size
  const [quizIndex, setQuizIndex] = useState(-1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const totalQuestions = NEEDS_QUESTIONS.length;
  const answeredYes = Object.values(needs).filter(Boolean).length;

  const handleAnswer = useCallback(
    (key: keyof NeedsAssessment, value: boolean) => {
      setNeed(key, value);
      setDirection(1);
      // Auto-advance after a brief pause so the user sees their selection
      setTimeout(() => {
        if (quizIndex < totalQuestions - 1) {
          setQuizIndex((prev) => prev + 1);
        } else {
          setQuizIndex(totalQuestions); // go to team size
        }
      }, 250);
    },
    [quizIndex, totalQuestions, setNeed]
  );

  const handleBack = () => {
    setDirection(-1);
    if (quizIndex <= -1) {
      prevStep();
    } else {
      setQuizIndex((prev) => prev - 1);
    }
  };

  const handleNeedAll = () => {
    NEEDS_QUESTIONS.forEach((q) => setNeed(q.key, true));
    setDirection(1);
    setQuizIndex(totalQuestions); // jump to team size
  };

  const handleFinish = () => {
    FEATURE_CATEGORIES.forEach((cat) => {
      if (needs[cat.id]) {
        setFeatureSelections(cat.id, [...cat.features]);
      }
    });
    nextStep();
  };

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.97,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.97,
    }),
  };

  // Intro screen
  if (quizIndex === -1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-lg mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-gradient-to-br from-[#FFE072] to-[#D4A017] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#F2A000]/20"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-foreground tracking-tight mb-3"
        >
          What does your business need?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-text-secondary mb-10 leading-relaxed"
        >
          We&apos;ll ask {totalQuestions} quick yes/no questions to figure out exactly
          which tools to build for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button size="lg" onClick={() => { setDirection(1); setQuizIndex(0); }} className="w-full">
            Let&apos;s go <ArrowRight className="w-5 h-5" />
          </Button>

          <button
            onClick={handleNeedAll}
            className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-brand/30 bg-brand-light/30 hover:bg-brand-light hover:border-brand/50 transition-all cursor-pointer flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-brand">I need all of it</span>
          </button>

          <button
            onClick={prevStep}
            className="text-sm text-text-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Back
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Team size screen (after all questions)
  if (quizIndex === totalQuestions) {
    const hasAtLeastOne = Object.values(needs).some(Boolean);

    return (
      <motion.div
        key="team-size"
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -80 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="max-w-lg mx-auto"
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Almost done</span>
            <span className="text-xs font-semibold text-brand">{answeredYes} selected</span>
          </div>
          <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFE072] to-[#D4A017] rounded-full"
              initial={{ width: "90%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-5"
          >
            <Users className="w-7 h-7 text-brand" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
            One more thing
          </h2>
          <p className="text-text-secondary">
            Are you working solo or with a team?
          </p>
        </div>

        {/* Team size options */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {TEAM_SIZE_OPTIONS.map((option, i) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setTeamSize(option)}
              className={`relative px-5 py-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                teamSize === option
                  ? "bg-brand text-white shadow-lg shadow-brand/20 scale-[1.02]"
                  : "bg-card-bg text-foreground border border-border-warm hover:border-brand/30 hover:bg-brand-light/30"
              }`}
            >
              {option}
              {teamSize === option && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand rounded-full flex items-center justify-center border-2 border-card-bg"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Summary of answers */}
        <div className="bg-surface/50 rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-text-secondary mb-3">Your selections</p>
          <div className="flex flex-wrap gap-2">
            {NEEDS_QUESTIONS.map((q) => (
              <span
                key={q.key}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  needs[q.key]
                    ? "bg-brand-light text-brand"
                    : "bg-background text-text-secondary"
                }`}
              >
                {needs[q.key] ? "Yes" : "No"}: {q.label.replace(/^Do you /, "").replace(/\?$/, "")}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            size="lg"
            onClick={handleFinish}
            disabled={!hasAtLeastOne}
            className="flex-1"
          >
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        {!hasAtLeastOne && (
          <p className="text-xs text-text-secondary mt-3 text-center">
            Answer &ldquo;Yes&rdquo; to at least one question to continue
          </p>
        )}
      </motion.div>
    );
  }

  // ── Individual question card ──────────────────────
  const currentQ = NEEDS_QUESTIONS[quizIndex];
  const IconComp = QUESTION_ICONS[currentQ.key] || Sparkles;
  const subtitle = QUESTION_SUBTITLES[currentQ.key] || "";
  const currentValue = needs[currentQ.key];
  const progress = ((quizIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">
            Question {quizIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold text-brand">
            {answeredYes} selected
          </span>
        </div>
        <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FFE072] to-[#D4A017] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 mt-3 justify-center">
          {NEEDS_QUESTIONS.map((q, i) => (
            <button
              key={q.key}
              onClick={() => { setDirection(i > quizIndex ? 1 : -1); setQuizIndex(i); }}
              className={`transition-all cursor-pointer rounded-full ${
                i === quizIndex
                  ? "w-6 h-2 bg-brand"
                  : needs[q.key]
                  ? "w-2 h-2 bg-brand/40"
                  : i < quizIndex
                  ? "w-2 h-2 bg-border-warm"
                  : "w-2 h-2 bg-border-light"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question card with AnimatePresence */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={quizIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 250, damping: 15 }}
            className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <IconComp className="w-8 h-8 text-brand" />
          </motion.div>

          {/* Question text */}
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-2 leading-snug">
            {currentQ.label}
          </h2>
          <p className="text-sm text-text-secondary mb-10 leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>

          {/* Yes / No buttons */}
          <div className="flex items-center gap-4 justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAnswer(currentQ.key, false)}
              className={`flex-1 max-w-[160px] py-4 rounded-2xl text-base font-semibold transition-all cursor-pointer ${
                currentValue === false
                  ? "bg-surface text-foreground border-2 border-foreground/10 shadow-sm"
                  : "bg-card-bg text-text-secondary border-2 border-border-warm hover:border-foreground/10"
              }`}
            >
              No
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAnswer(currentQ.key, true)}
              className={`flex-1 max-w-[160px] py-4 rounded-2xl text-base font-semibold transition-all cursor-pointer ${
                currentValue === true
                  ? "bg-brand text-white shadow-lg shadow-brand/25"
                  : "bg-card-bg text-text-secondary border-2 border-border-warm hover:border-brand/30 hover:bg-brand-light/30"
              }`}
            >
              Yes
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-surface"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {quizIndex < totalQuestions - 1 ? (
          <button
            onClick={() => { setDirection(1); setQuizIndex((prev) => prev + 1); }}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-foreground transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-surface"
          >
            Skip
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <Button
            size="sm"
            onClick={() => { setDirection(1); setQuizIndex(totalQuestions); }}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
