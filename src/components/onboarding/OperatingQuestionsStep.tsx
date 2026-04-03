"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, User, MapPin, Users, ShoppingBag } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import type { TeamSize } from "@/types/onboarding";

type OptionValue = string | boolean;

interface QuestionOption {
  value: OptionValue;
  label: string;
  description?: string;
}

interface Question {
  id: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  options: QuestionOption[];
  required: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: "teamSize",
    label: "How do you work?",
    subtitle: "This helps us set up the right scheduling and team features.",
    icon: User,
    required: true,
    options: [
      { value: "Just me", label: "Solo", description: "Just me, myself, and I" },
      { value: "2-5", label: "Small team", description: "2\u20135 people" },
      { value: "6-15", label: "Larger team", description: "6 or more" },
    ],
  },
  {
    id: "workLocation",
    label: "Where do you work?",
    subtitle: "We\u2019ll tailor your booking flow to match.",
    icon: MapPin,
    required: true,
    options: [
      { value: "fixed", label: "Fixed location", description: "Salon, studio, or clinic" },
      { value: "mobile", label: "Mobile", description: "I travel to clients" },
      { value: "both", label: "Both", description: "Studio + mobile" },
    ],
  },
  {
    id: "clientele",
    label: "Who are your clients?",
    subtitle: "Helps us set the right defaults for your forms and fields.",
    icon: Users,
    required: false,
    options: [
      { value: "women", label: "Mostly women" },
      { value: "men", label: "Mostly men" },
      { value: "everyone", label: "Everyone" },
    ],
  },
  {
    id: "sellProducts",
    label: "Do you sell retail products?",
    subtitle: "We can add a product catalog and inventory tracking.",
    icon: ShoppingBag,
    required: false,
    options: [
      { value: true, label: "Yes, I sell products" },
      { value: false, label: "No, services only" },
    ],
  },
];

export function OperatingQuestionsStep() {
  const {
    teamSize,
    setTeamSize,
    operatingModel,
    setOperatingModel,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const [currentQ, setCurrentQ] = useState(0);

  const answers: Record<string, OptionValue> = {
    teamSize: teamSize || "",
    workLocation: operatingModel.workLocation || "",
    clientele: operatingModel.clientele || "",
    sellProducts: operatingModel.sellProducts,
  };

  const setAnswer = (questionId: string, value: OptionValue) => {
    if (questionId === "teamSize") {
      setTeamSize(value as TeamSize);
    } else {
      setOperatingModel({ [questionId]: value });
    }

    // Auto-advance after a short pause
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((prev) => prev + 1);
      }
    }, 300);
  };

  const goBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else {
      prevStep();
    }
  };

  const canFinish = teamSize && operatingModel.workLocation;
  const isLast = currentQ === QUESTIONS.length - 1;
  const q = QUESTIONS[currentQ];
  const Icon = q.icon;
  const currentAnswer = answers[q.id];

  const handleContinue = () => {
    if (isLast) {
      nextStep();
    } else {
      setCurrentQ(currentQ + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6"
    >
      {/* Back */}
      <button
        onClick={goBack}
        className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentQ
                ? "w-8 bg-foreground"
                : i < currentQ
                  ? "w-1.5 bg-foreground/40"
                  : "w-1.5 bg-border-light"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="text-center mb-10"
        >
          <div className="w-12 h-12 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-5">
            <Icon className="w-5 h-5 text-text-secondary" />
          </div>
          <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
            {q.label}
          </h2>
          <p className="text-text-secondary text-[15px]">
            {q.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id + "-options"}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="space-y-2.5 mb-10"
        >
          {q.options.map((opt) => {
            const isSelected = currentAnswer === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => setAnswer(q.id, opt.value)}
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-sm"
                }`}
              >
                <div>
                  <p className={`text-[15px] font-semibold ${isSelected ? "text-background" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className={`text-[12px] mt-0.5 ${isSelected ? "text-background/60" : "text-text-tertiary"}`}>
                      {opt.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-5 h-5 bg-background/20 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <div className="w-2 h-2 bg-background rounded-full" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Skip / Continue */}
      <div className="flex items-center justify-between">
        {!q.required && (
          <button
            onClick={() => {
              if (isLast) nextStep();
              else setCurrentQ(currentQ + 1);
            }}
            className="text-[13px] text-text-tertiary hover:text-foreground font-medium cursor-pointer"
          >
            Skip
          </button>
        )}
        {q.required && <div />}

        <button
          onClick={handleContinue}
          disabled={q.required && !currentAnswer}
          className={`px-8 py-3 rounded-2xl text-[14px] font-semibold transition-all duration-200 flex items-center gap-2 ${
            !q.required || currentAnswer
              ? "bg-foreground text-background hover:opacity-90 cursor-pointer"
              : "bg-border-light text-text-tertiary cursor-not-allowed"
          }`}
        >
          {isLast ? "Continue" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
