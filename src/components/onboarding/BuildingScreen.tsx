"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES } from "@/types/onboarding";

const BUILD_STEPS = [
  "Analyzing your business needs...",
  "Assembling your custom modules...",
  "Configuring customer workflows...",
  "Setting up your dashboard...",
  "Connecting integrations...",
  "Applying your preferences...",
  "Running final checks...",
  "Almost there...",
];

export function BuildingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { needs } = useOnboardingStore();

  const activeCategories = FEATURE_CATEGORIES.filter((cat) => needs[cat.id]);

  useEffect(() => {
    const stepDuration = 12000 / BUILD_STEPS.length;
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return p + 1;
      });
    }, 120);

    const stepInterval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= BUILD_STEPS.length - 1) {
          clearInterval(stepInterval);
          return s;
        }
        return s + 1;
      });
    }, stepDuration);

    const finishTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 13000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center px-6">
        {/* Animated logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-8"
        >
          <div className="w-full h-full bg-gradient-to-br from-[#FFE072] to-[#F2A000] rounded-2xl flex items-center justify-center shadow-xl shadow-[#F2A000]/30">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-8 border-3 border-white rounded-lg"
            />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          Building Your CRM
        </h2>
        <p className="text-text-secondary mb-8">
          Assembling {activeCategories.length} modules for your business
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 bg-border-light rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FFE072] to-[#F2A000] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Current step text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-brand font-medium"
          >
            {BUILD_STEPS[currentStep]}
          </motion.p>
        </AnimatePresence>

        {/* Module chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {activeCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: progress > (i / activeCategories.length) * 100 ? 1 : 0.3,
                scale: 1,
              }}
              transition={{ delay: i * 0.2 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                progress > (i / activeCategories.length) * 100
                  ? "bg-brand-light text-brand"
                  : "bg-surface text-text-secondary"
              }`}
            >
              {cat.name}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
