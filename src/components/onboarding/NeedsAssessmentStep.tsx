"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Check,
  UserCheck,
  Inbox,
  MessageCircle,
  Calendar,
  Receipt,
  FolderKanban,
  Megaphone,
  Headphones,
  FileText,
} from "lucide-react";
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
  receiveInquiries: "Capture and track incoming leads.",
  communicateClients: "Email, SMS, and social DMs in one inbox.",
  acceptBookings: "Let clients book without the back-and-forth.",
  sendInvoices: "Professional quotes and invoices in seconds.",
  manageProjects: "Track jobs, tasks, and deadlines.",
  runMarketing: "Campaigns, reviews, and audience growth.",
  handleSupport: "Log and resolve support requests.",
  manageDocuments: "Contracts, e-signatures, and file sharing.",
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
    getPersonaConfig,
    businessContext,
  } = useOnboardingStore();

  const config = getIndustryConfig();
  const persona = getPersonaConfig();
  const totalQuestions = NEEDS_QUESTIONS.length;

  const [quizIndex, setQuizIndex] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [answered, setAnswered] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    Object.entries(needs).forEach(([key, value]) => {
      if (value) initial.add(key);
    });
    return initial;
  });

  const getQuestionLabel = (key: keyof NeedsAssessment): string => {
    if (persona?.questionOverrides?.[key]) return persona.questionOverrides[key].label;
    if (config?.questionOverrides?.[key]) return config.questionOverrides[key].label;
    return NEEDS_QUESTIONS.find((q) => q.key === key)?.label || "";
  };

  const getQuestionSubtitle = (key: keyof NeedsAssessment): string => {
    if (persona?.questionOverrides?.[key]) return persona.questionOverrides[key].subtitle;
    if (config?.questionOverrides?.[key]) return config.questionOverrides[key].subtitle;
    return DEFAULT_SUBTITLES[key] || "";
  };

  const handleAnswer = useCallback(
    (key: keyof NeedsAssessment, value: boolean) => {
      setNeed(key, value);
      setAnswered((prev) => new Set(prev).add(key));
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

  const handleBack = useCallback(() => {
    setDirection(-1);
    if (quizIndex <= 0) {
      prevStep();
    } else {
      setQuizIndex((prev) => prev - 1);
    }
  }, [quizIndex, prevStep]);

  const handleFinish = () => {
    FEATURE_CATEGORIES.forEach((cat) => {
      if (needs[cat.id]) {
        setFeatureSelections(cat.id, [...cat.features]);
      }
    });
    nextStep();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (quizIndex < 0 || quizIndex >= totalQuestions) return;
      const key = NEEDS_QUESTIONS[quizIndex].key;
      if (e.key === "y" || e.key === "Y") handleAnswer(key, true);
      else if (e.key === "n" || e.key === "N") handleAnswer(key, false);
      else if (e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quizIndex, totalQuestions, handleAnswer, handleBack]);

  // ── Transition screen ──
  if (quizIndex === -1) {
    const contextParts: string[] = [];
    if (persona) contextParts.push(`a ${persona.label.toLowerCase()}`);
    else if (config && config.id !== "other") contextParts.push(`in ${config.label.toLowerCase()}`);
    if (businessContext.location) contextParts.push(`based in ${businessContext.location}`);

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-4">
            {businessContext.businessName
              ? `Got it, ${businessContext.businessName}`
              : "Got it"}
          </h2>
          {contextParts.length > 0 && (
            <p className="text-[16px] text-text-secondary mb-2 leading-relaxed">
              You&apos;re {contextParts.join(", ")}.
            </p>
          )}
          <p className="text-[15px] text-text-tertiary mb-12">
            Next: {totalQuestions} quick questions to build your toolkit.
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

  // ── Team size screen ──
  if (quizIndex === totalQuestions) {
    const hasAtLeastOne = Object.values(needs).some(Boolean);
    const answeredYes = Object.values(needs).filter(Boolean).length;

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-md mx-auto">
        <div className="pt-6 flex justify-center">
          <div className="flex items-center gap-1.5">
            {NEEDS_QUESTIONS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
            ))}
            <div className="w-6 h-1.5 rounded-full bg-foreground" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="text-center w-full"
          >
            <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-6 h-6 text-foreground" />
            </div>
            <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-2">
              How big is your team?
            </h2>
            <p className="text-text-secondary text-[15px] mb-10">
              {answeredYes} module{answeredYes !== 1 ? "s" : ""} selected so far.
            </p>

            <div className="space-y-2 max-w-xs mx-auto mb-10">
              {TEAM_SIZE_OPTIONS.map((option, i) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setTeamSize(option)}
                  className={`w-full px-5 py-4 rounded-2xl text-[16px] font-medium transition-all duration-150 cursor-pointer text-left flex items-center justify-between ${
                    teamSize === option
                      ? "bg-foreground text-white"
                      : "bg-white border border-border-light hover:border-foreground/20"
                  }`}
                >
                  {option}
                  {teamSize === option && <Check className="w-4 h-4" />}
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={!teamSize || !hasAtLeastOne}
              className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Continue
            </button>
            {!hasAtLeastOne && (
              <p className="text-[12px] text-text-tertiary mt-4">
                Go back and answer yes to at least one question
              </p>
            )}
          </motion.div>
        </div>

        <div className="pb-6 flex justify-center">
          <button
            onClick={handleBack}
            className="text-[12px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> back
          </button>
        </div>
      </div>
    );
  }

  // ── Question card ──
  const currentQ = NEEDS_QUESTIONS[quizIndex];
  const IconComp = QUESTION_ICONS[currentQ.key];
  const label = getQuestionLabel(currentQ.key);
  const subtitle = getQuestionSubtitle(currentQ.key);
  const currentValue = needs[currentQ.key];
  const isAnswered = answered.has(currentQ.key);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-lg mx-auto">
      {/* Progress dots */}
      <div className="pt-6 flex justify-center">
        <div className="flex items-center gap-1.5">
          {NEEDS_QUESTIONS.map((q, i) => (
            <div
              key={q.key}
              className={`rounded-full transition-all duration-200 ${
                i === quizIndex
                  ? "w-6 h-1.5 bg-foreground"
                  : answered.has(q.key)
                  ? "w-1.5 h-1.5 bg-foreground/25"
                  : "w-1.5 h-1.5 bg-border-light"
              }`}
            />
          ))}
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
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-8">
              {IconComp && <IconComp className="w-7 h-7 text-foreground" />}
            </div>

            <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-3 leading-[1.2] max-w-md mx-auto">
              {label}
            </h2>
            <p className="text-[15px] text-text-tertiary mb-14 max-w-sm mx-auto leading-relaxed">
              {subtitle}
            </p>

            <div className="flex gap-4 max-w-xs mx-auto">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(currentQ.key, false)}
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
                onClick={() => handleAnswer(currentQ.key, true)}
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
        <span className="text-border-light">·</span>
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 hover:text-text-secondary cursor-pointer transition-colors"
        >
          <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md bg-surface border border-border-light text-[10px] font-mono text-text-secondary">
            ←
          </kbd>
          back
        </button>
      </div>
    </div>
  );
}
