"use client";

import { useEffect } from "react";
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

  // Auto-skip signup step if user was already authenticated before reaching step 3
  // (e.g., they logged in separately and came back to onboarding)
  const shouldSkipSignup = step === 3 && !loading && user;
  useEffect(() => {
    if (shouldSkipSignup) {
      // Small delay to avoid race with SignupStep's own nextStep() call
      const t = setTimeout(() => {
        if (useOnboardingStore.getState().step === 3) {
          useOnboardingStore.getState().nextStep();
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [shouldSkipSignup]);

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Steps:
  // 0 = Welcome (public)
  // 1 = Industry/Persona (public)
  // 2 = Business Context (public)
  // 3 = Signup (if not authenticated — auto-skips if logged in)
  // 4 = Activity Chips (4 slides)
  // 5 = Summary → Launch
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) {
      if (loading) return <div className="min-h-screen bg-background" />;
      if (!user) return <SignupStep />;
      // useEffect above handles the auto-advance
      return <div className="min-h-screen bg-background" />;
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
