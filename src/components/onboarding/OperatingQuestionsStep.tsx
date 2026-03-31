"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import type { TeamSize } from "@/types/onboarding";

type OptionValue = string | boolean;

interface QuestionOption {
  value: OptionValue;
  label: string;
}

interface Question {
  id: string;
  label: string;
  options: QuestionOption[];
}

const QUESTIONS: Question[] = [
  {
    id: "teamSize",
    label: "How do you work?",
    options: [
      { value: "Just me", label: "Solo" },
      { value: "2-5", label: "Small team (2-5)" },
      { value: "6-15", label: "Larger team (6+)" },
    ],
  },
  {
    id: "workLocation",
    label: "Where do you work?",
    options: [
      { value: "fixed", label: "Fixed location" },
      { value: "mobile", label: "Mobile — I travel to clients" },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: "clientele",
    label: "Your clientele?",
    options: [
      { value: "women", label: "Mostly women" },
      { value: "men", label: "Mostly men" },
      { value: "everyone", label: "Everyone" },
    ],
  },
  {
    id: "sellProducts",
    label: "Do you sell retail products?",
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
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
  };

  // Require at least team size and work location
  const canContinue = teamSize && operatingModel.workLocation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6"
    >
      <button
        onClick={prevStep}
        className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="text-center mb-10">
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
          A few quick questions
        </h2>
        <p className="text-text-secondary text-[15px]">
          This helps us set up the right features for how you operate.
        </p>
      </div>

      <div className="space-y-8 mb-10">
        {QUESTIONS.map((q, qi) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.06 }}
          >
            <p className="text-sm font-medium text-foreground mb-3">{q.label}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const isSelected = answers[q.id] === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => setAnswer(q.id, opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-card-bg border border-border-light text-text-secondary hover:border-foreground/20 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={nextStep}
        disabled={!canContinue}
        className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          canContinue
            ? "bg-foreground text-background hover:opacity-90 cursor-pointer shadow-lg"
            : "bg-border-light text-text-tertiary cursor-not-allowed"
        }`}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
