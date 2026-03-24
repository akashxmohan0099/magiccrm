"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { BubblesStep } from "@/components/onboarding/BubblesStep";
import { AIQuestionsStep } from "@/components/onboarding/AIQuestionsStep";
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
  const skipDone = useRef(false);

  // Skip signup step if already logged in — only once
  useEffect(() => {
    if (step === 3 && !loading && user && !skipDone.current) {
      skipDone.current = true;
      // Use setStep to jump directly to 4, not nextStep which could race
      useOnboardingStore.getState().setStep(4);
    }
  }, [step, loading, user]);

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Steps:
  // 0 = Welcome (public)
  // 1 = Industry/Persona (public)
  // 2 = Business Context (public)
  // 3 = Signup (if not authenticated)
  // 4 = Activity Chips (4 slides)
  // 5 = AI-generated personalized questions
  // 6 = Summary → Launch
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) {
      if (loading) return <div className="min-h-screen bg-background" />;
      if (!user) return <SignupStep />;
      // Waiting for useEffect to advance to step 4
      return <div className="min-h-screen bg-background" />;
    }
    if (step === 4) return <BubblesStep />;
    if (step === 5) return <AIQuestionsStep />;
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
