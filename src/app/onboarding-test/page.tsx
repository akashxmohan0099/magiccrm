"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { BubblesStep } from "@/components/onboarding/BubblesStep";
import { SummaryStep } from "@/components/onboarding/SummaryStep";

/**
 * Onboarding Test Page
 *
 * Runs the full onboarding flow WITHOUT signup.
 * For testing personas, questions, and module assignment.
 * Resets onboarding state on mount so each visit is fresh.
 */
export default function OnboardingTestPage() {
  const hydrated = useHydration();

  // Reset onboarding state on mount for a fresh test each time
  useEffect(() => {
    if (hydrated) {
      const store = useOnboardingStore.getState();
      store.setStep(0);
      store.setSetupMethod("guided" as "guided" | "self-serve");
      store.setSelectedIndustry("");
      store.setSelectedPersona("");
      store.setBusinessContext({
        businessName: "",
        businessDescription: "",
        industry: "",
        industryOther: "",
        location: "",
      });
      store.setIsBuilding(false);
      store.setBuildComplete(false);
    }
  }, [hydrated]);

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return <TestContent />;
}

function TestContent() {
  const step = useOnboardingStore((s) => s.step);

  // Steps (no signup, no building screen):
  // 0 = Welcome
  // 1 = Industry/Persona
  // 2 = Business Context
  // 3 = Skipped (signup) — auto-advance
  // 4 = Activity Chips (3 slides)
  // 5 = Summary (shows result without launching)
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) {
      // Skip signup in test mode — auto-advance
      useOnboardingStore.getState().nextStep();
      return null;
    }
    if (step === 4) return <BubblesStep />;
    return <SummaryStep />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Test mode banner */}
      <div className="bg-amber-400 text-amber-900 text-center py-1.5 text-[12px] font-semibold">
        Test Mode — no account created, resets each visit
      </div>
      <div>
        <AnimatePresence mode="wait">
          <div key={step}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
