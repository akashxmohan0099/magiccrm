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
  const prevUserRef = useRef(user);

  // Detect when user FIRST becomes authenticated while on step 3
  // This handles both: fresh signup AND already-logged-in user
  useEffect(() => {
    const wasNull = prevUserRef.current === null || prevUserRef.current === undefined;
    const isNowAuth = !!user;
    prevUserRef.current = user;

    // Only advance if we're on step 3 and user just became authenticated
    // OR if user was already authenticated when we arrived at step 3
    if (step === 3 && !loading && isNowAuth) {
      // Wait a beat to ensure SignupStep's workspace creation finishes
      const t = setTimeout(() => {
        const currentStep = useOnboardingStore.getState().step;
        // Only advance if still on step 3 (SignupStep might have already advanced)
        if (currentStep === 3) {
          useOnboardingStore.getState().setStep(4);
        }
      }, wasNull ? 1500 : 50); // 1.5s after fresh signup (workspace creation), 50ms if already logged in
      return () => clearTimeout(t);
    }
  }, [step, loading, user]);

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Steps:
  // 0 = Welcome
  // 1 = Industry/Persona
  // 2 = Business Context
  // 3 = Signup
  // 4 = Activity Chips (4 slides)
  // 5 = AI Questions (2 categories)
  // 6 = Summary → Launch
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) {
      if (loading) return <div className="min-h-screen bg-background" />;
      if (!user) return <SignupStep />;
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
