"use client";

import { AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { SetupMethodStep } from "@/components/onboarding/SetupMethodStep";
import { SelfServeStep } from "@/components/onboarding/SelfServeStep";
import { NeedsAssessmentStep } from "@/components/onboarding/NeedsAssessmentStep";
import { FeatureSelectionStep } from "@/components/onboarding/FeatureSelectionStep";
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
  const setupMethod = useOnboardingStore((s) => s.setupMethod);
  const isBuilding = useOnboardingStore((s) => s.isBuilding);

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Steps:
  // 0 = Welcome
  // 1 = Industry/Persona
  // 2 = Business Context
  // 3 = SetupMethodStep (fork: guided vs self-serve)
  // 4 = self-serve ? SelfServeStep : NeedsAssessmentStep (yes/no module questions)
  // 5 = self-serve ? SummaryStep : FeatureSelectionStep (toggle sub-features)
  // 6 = SummaryStep (guided only)
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) return <SetupMethodStep />;
    if (step === 4) return setupMethod === "self-serve" ? <SelfServeStep /> : <NeedsAssessmentStep />;
    if (step === 5) return setupMethod === "self-serve" ? <SummaryStep /> : <FeatureSelectionStep />;
    return <SummaryStep />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <div key={step}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
