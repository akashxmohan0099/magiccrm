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

export default function OnboardingTestPage() {
  const hydrated = useHydration();

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

  // Auto-skip signup step in test mode
  useEffect(() => {
    if (step === 3) {
      useOnboardingStore.getState().nextStep();
    }
  }, [step]);

  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) return <div className="min-h-screen bg-background" />;
    if (step === 4) return <BubblesStep />;
    return <SummaryStep />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-amber-400 text-amber-900 text-center py-1.5 text-[12px] font-semibold">
        Test Mode — no account created, resets each visit
      </div>
      <AnimatePresence mode="wait">
        <div key={step}>
          {renderStep()}
        </div>
      </AnimatePresence>
    </div>
  );
}
