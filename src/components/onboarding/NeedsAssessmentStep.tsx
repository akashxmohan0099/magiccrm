"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Users,
  UserCheck, Inbox, MessageCircle, Calendar,
  Receipt, FolderKanban, Megaphone, Headphones, FileText,
  Check, RotateCcw, Sparkles,
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

const DEFAULT_SUBTITLES: Record<string, string> = {
  manageCustomers: "Contact details, notes, and history in one place.",
  receiveInquiries: "Capture and track incoming leads so none slip through the cracks.",
  communicateClients: "Email, SMS, social DMs unified in one inbox.",
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
    getIndustryConfig,
  } = useOnboardingStore();

  const config = getIndustryConfig();

  const [quizIndex, setQuizIndex] = useState(-1);
  const [direction, setDirection] = useState(1);

  const totalQuestions = NEEDS_QUESTIONS.length;
  const answeredYes = Object.values(needs).filter(Boolean).length;

  const getQuestionLabel = (key: keyof NeedsAssessment): string => {
    if (config?.questionOverrides?.[key]) {
      return config.questionOverrides[key].label;
    }
    return NEEDS_QUESTIONS.find((q) => q.key === key)?.label || "";
  };

  const getQuestionSubtitle = (key: keyof NeedsAssessment): string => {
    if (config?.questionOverrides?.[key]) {
      return config.questionOverrides[key].subtitle;
    }
    return DEFAULT_SUBTITLES[key] || "";
  };

  const hasSmartDefaults = useMemo(() => {
    if (!config?.smartDefaults) return false;
    return Object.values(config.smartDefaults).some(Boolean);
  }, [config]);

  const handleAnswer = useCallback(
    (key: keyof NeedsAssessment, value: boolean) => {
      setNeed(key, value);
      setDirection(1);
      setTimeout(() => {
        if (quizIndex < totalQuestions - 1) {
          setQuizIndex((prev) => prev + 1);
        } else {
          setQuizIndex(totalQuestions);
        }
      }, 200);
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

  const handleKeepDefaults = () => {
    setDirection(1);
    setQuizIndex(totalQuestions);
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
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── Intro screen ──
  if (quizIndex === -1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-lg mx-auto"
      >
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="text-center mb-8">
          <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-3">
            {config ? `What does your ${config.label.toLowerCase()} business need?` : "What does your business need?"}
          </h2>
          <p className="text-text-secondary text-[15px]">
            {hasSmartDefaults
              ? "We've pre-selected what most businesses like yours use. Review or customize."
              : `${totalQuestions} quick yes/no questions to figure out which tools to build for you.`}
          </p>
        </div>

        {hasSmartDefaults && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card-bg border border-border-light rounded-xl p-5 mb-6"
          >
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-3">
              Pre-selected for {config?.label}
            </p>
            <div className="space-y-2">
              {NEEDS_QUESTIONS.map((q) => {
                const isOn = needs[q.key];
                return (
                  <div key={q.key} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isOn ? "bg-foreground" : "bg-border-light"
                    }`}>
                      {isOn && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-[13px] ${isOn ? "text-foreground font-medium" : "text-text-tertiary"}`}>
                      {q.label.replace(/^Do you /, "").replace(/\?$/, "")}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {hasSmartDefaults ? (
            <>
              <Button size="lg" onClick={handleKeepDefaults} className="w-full">
                Looks good, continue <ArrowRight className="w-5 h-5" />
              </Button>
              <button
                onClick={() => { setDirection(1); setQuizIndex(0); }}
                className="w-full px-4 py-3 rounded-xl border border-border-light bg-card-bg hover:bg-surface transition-all cursor-pointer flex items-center justify-center gap-2 text-[13px] font-medium text-text-secondary hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Let me customize
              </button>
            </>
          ) : (
            <Button size="lg" onClick={() => { setDirection(1); setQuizIndex(0); }} className="w-full">
              Let&apos;s go <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Team size screen ──
  if (quizIndex === totalQuestions) {
    const hasAtLeastOne = Object.values(needs).some(Boolean);

    return (
      <motion.div
        key="team-size"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.25 }}
        className="max-w-lg mx-auto"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-text-secondary">Almost done</span>
            <span className="text-[12px] font-semibold text-foreground">{answeredYes} modules selected</span>
          </div>
          <div className="w-full h-1 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              initial={{ width: "90%" }}
              animate={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users className="w-7 h-7 text-foreground" />
          </div>
          <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
            How big is your team?
          </h2>
          <p className="text-text-secondary text-[15px]">
            This helps us configure the right collaboration features.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {TEAM_SIZE_OPTIONS.map((option, i) => (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setTeamSize(option)}
              className={`relative px-5 py-4 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                teamSize === option
                  ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                  : "bg-card-bg text-foreground border border-border-light hover:border-foreground/20"
              }`}
            >
              {option}
              {teamSize === option && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground rounded-full flex items-center justify-center border-2 border-background"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="bg-surface rounded-xl p-4 mb-8">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-2.5">Your selections</p>
          <div className="flex flex-wrap gap-1.5">
            {NEEDS_QUESTIONS.map((q) => (
              <span
                key={q.key}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  needs[q.key]
                    ? "bg-foreground text-white"
                    : "bg-background text-text-tertiary"
                }`}
              >
                {q.label.replace(/^Do you /, "").replace(/\?$/, "")}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button size="lg" onClick={handleFinish} disabled={!hasAtLeastOne} className="flex-1">
            Continue <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        {!hasAtLeastOne && (
          <p className="text-[11px] text-text-secondary mt-3 text-center">
            Select at least one module to continue
          </p>
        )}
      </motion.div>
    );
  }

  // ── Individual question card ──
  const currentQ = NEEDS_QUESTIONS[quizIndex];
  const IconComp = QUESTION_ICONS[currentQ.key] || Sparkles;
  const label = getQuestionLabel(currentQ.key);
  const subtitle = getQuestionSubtitle(currentQ.key);
  const currentValue = needs[currentQ.key];
  const progress = ((quizIndex + 1) / totalQuestions) * 100;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-text-secondary">
            Question {quizIndex + 1} of {totalQuestions}
          </span>
          <span className="text-[12px] font-semibold text-foreground">{answeredYes} selected</span>
        </div>
        <div className="w-full h-1 bg-border-light rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-center">
          {NEEDS_QUESTIONS.map((q, i) => (
            <button
              key={q.key}
              onClick={() => { setDirection(i > quizIndex ? 1 : -1); setQuizIndex(i); }}
              className={`transition-all cursor-pointer rounded-full ${
                i === quizIndex
                  ? "w-6 h-1.5 bg-foreground"
                  : needs[q.key]
                  ? "w-1.5 h-1.5 bg-foreground/40"
                  : i < quizIndex
                  ? "w-1.5 h-1.5 bg-border-light"
                  : "w-1.5 h-1.5 bg-border-light"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={quizIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.05, type: "spring", stiffness: 250, damping: 18 }}
            className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <IconComp className="w-7 h-7 text-foreground" />
          </motion.div>

          <h2 className="text-[20px] font-bold text-foreground tracking-tight mb-2 leading-snug">
            {label}
          </h2>
          <p className="text-[13px] text-text-secondary mb-10 leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>

          <div className="flex items-center gap-3 justify-center mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAnswer(currentQ.key, false)}
              className={`flex-1 py-4 px-6 rounded-xl text-[15px] font-semibold transition-all cursor-pointer min-h-[52px] ${
                currentValue === false
                  ? "bg-surface text-foreground border-2 border-foreground/10 shadow-sm"
                  : "bg-card-bg text-text-secondary border-2 border-border-light hover:border-foreground/10 hover:shadow-sm"
              }`}
            >
              No
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAnswer(currentQ.key, true)}
              className={`flex-1 py-4 px-6 rounded-xl text-[15px] font-semibold transition-all cursor-pointer min-h-[52px] ${
                currentValue === true
                  ? "bg-foreground text-white shadow-lg shadow-foreground/15 border-2 border-foreground"
                  : "bg-card-bg text-text-secondary border-2 border-border-light hover:border-foreground/20 hover:shadow-sm"
              }`}
            >
              Yes
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-surface"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {quizIndex < totalQuestions - 1 ? (
          <button
            onClick={() => { setDirection(1); setQuizIndex((prev) => prev + 1); }}
            className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-surface"
          >
            Skip <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <Button size="sm" onClick={() => { setDirection(1); setQuizIndex(totalQuestions); }}>
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
