"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES } from "@/types/onboarding";

const BUILD_STEPS = [
  "Analyzing your business needs",
  "Assembling custom modules",
  "Configuring workflows",
  "Setting up your dashboard",
  "Connecting integrations",
  "Applying your preferences",
  "Running final checks",
  "Almost there",
];

export function BuildingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { needs, businessContext, getIndustryConfig } = useOnboardingStore();

  const config = getIndustryConfig();
  const activeCategories = FEATURE_CATEGORIES.filter((cat) => needs[cat.id]);

  useEffect(() => {
    const stepDuration = 12000 / BUILD_STEPS.length;
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        return p + 1;
      });
    }, 120);

    const stepInterval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= BUILD_STEPS.length - 1) { clearInterval(stepInterval); return s; }
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
      <div className="max-w-md mx-auto text-center px-6">
        {/* Minimal animated indicator */}
        <motion.div
          className="w-16 h-16 mx-auto mb-10 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-foreground rounded-2xl flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-6 bg-white rounded-md"
            />
          </div>
        </motion.div>

        <h2 className="text-[24px] font-bold text-foreground mb-2 tracking-tight">
          Building {businessContext.businessName ? `${businessContext.businessName}'s` : "your"} CRM
        </h2>
        <p className="text-text-secondary text-[15px] mb-8">
          Assembling {activeCategories.length} modules
          {config ? ` for ${config.label.toLowerCase()}` : ""}
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-[13px] text-text-secondary font-medium"
          >
            {BUILD_STEPS[currentStep]}
          </motion.p>
        </AnimatePresence>

        {/* Module chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {activeCategories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: progress > (i / activeCategories.length) * 100 ? 1 : 0.3,
                scale: 1,
              }}
              transition={{ delay: i * 0.15 }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                progress > (i / activeCategories.length) * 100
                  ? "bg-foreground text-white"
                  : "bg-surface text-text-tertiary"
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
