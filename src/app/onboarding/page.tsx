"use client";

import { AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { NeedsAssessmentStep } from "@/components/onboarding/NeedsAssessmentStep";
import { FeatureCustomizationStep } from "@/components/onboarding/FeatureCustomizationStep";
import { SummaryStep } from "@/components/onboarding/SummaryStep";
import { BuildingScreen } from "@/components/onboarding/BuildingScreen";

export default function OnboardingPage() {
  const hydrated = useHydration();

  if (!hydrated) {
    return <div className="min-h-screen bg-background" />;
  }

  return <OnboardingContent />;
}

function OnboardingContent() {
  const step = useOnboardingStore((s) => s.step);
  const isBuilding = useOnboardingStore((s) => s.isBuilding);

  if (isBuilding) {
    return <BuildingScreen />;
  }

  const getProgressStep = () => {
    if (step <= 0) return 0;
    if (step === 1) return 1;
    if (step === 2) return 2;
    return 3;
  };

  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <BusinessContextStep />;
    if (step === 2) return <NeedsAssessmentStep />;
    if (step === 3) return <FeatureCustomizationStep />;
    return <SummaryStep />;
  };

  const progressStep = getProgressStep();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {progressStep > 0 && (
          <div className="mb-10">
            <ProgressBar current={progressStep} total={3} />
          </div>
        )}
        <AnimatePresence mode="wait">
          <div key={step}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
