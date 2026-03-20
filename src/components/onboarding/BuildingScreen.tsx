"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const BUILD_STEPS = [
  "Reading your preferences",
  "Setting up your workspace",
  "Configuring modules",
  "Applying industry settings",
  "Building your dashboard",
  "Final touches",
];

export function BuildingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { businessContext, getIndustryConfig, featureSelections } = useOnboardingStore();

  const config = getIndustryConfig();
  const moduleCount = Object.values(featureSelections).filter(
    (features) => features.some((f) => f.selected)
  ).length;

  useEffect(() => {
    const stepDuration = 10000 / BUILD_STEPS.length;
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        return p + 0.8;
      });
    }, 80);

    const stepInterval = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= BUILD_STEPS.length - 1) { clearInterval(stepInterval); return s; }
        return s + 1;
      });
    }, stepDuration);

    const finishTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 11000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(finishTimer);
    };
  }, [router]);

  const businessName = businessContext.businessName;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-lg mx-auto text-center px-6">
        {/* Animated logo */}
        <motion.div
          className="w-16 h-16 mx-auto mb-12 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-7 h-7 bg-foreground rounded-lg"
            />
          </div>
        </motion.div>

        <h2 className="text-[32px] font-bold text-foreground mb-3 tracking-tight">
          {businessName
            ? `Building ${businessName}'s CRM`
            : "Building your CRM"}
        </h2>
        <p className="text-text-secondary text-[16px] mb-3 leading-relaxed">
          Assembling {moduleCount} module{moduleCount !== 1 ? "s" : ""}
          {config && config.id !== "generic" ? `, customized for ${config.label.toLowerCase()}` : ""}.
        </p>
        <p className="text-text-tertiary text-[14px] mb-12">
          This will only take a moment.
        </p>

        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.min(progress, 100)}%` }}
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
              className="text-[13px] text-text-tertiary font-medium"
            >
              {BUILD_STEPS[currentStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
