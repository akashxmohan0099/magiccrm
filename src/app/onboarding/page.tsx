"use client";

import { AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { BubblesStep } from "@/components/onboarding/BubblesStep";
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
  const { user, loading } = useAuth();

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Steps:
  // 0 = Welcome (public)
  // 1 = Industry/Persona (public)
  // 2 = Business Context (public)
  // 3 = Signup (if not authenticated)
  // 4 = Bubbles — tap what you do day-to-day
  // 5 = Summary → Launch
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;

    // Step 3: signup gate
    if (step === 3) {
      if (loading) return <div className="min-h-screen bg-background" />;
      if (!user) return <SignupStep />;
      useOnboardingStore.getState().nextStep();
      return null;
    }

    if (step === 4) return <BubblesStep />;
    return <SummaryStep />;
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <div key={step}>
          {renderStep()}
        </div>
      </AnimatePresence>
    </div>
  );
}
