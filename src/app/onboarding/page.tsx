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

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Compute effective step — skip signup if already authenticated
  // This avoids useEffect race conditions entirely
  let effectiveStep = step;
  if (step === 3 && !loading && user) {
    effectiveStep = 4; // Skip signup, go straight to chips
  }

  // Steps:
  // 0 = Welcome (public)
  // 1 = Industry/Persona (public)
  // 2 = Business Context (public)
  // 3 = Signup (if not authenticated — rendered as step 4 if already logged in)
  // 4 = Activity Chips (4 slides)
  // 5 = AI-generated personalized questions
  // 6 = Summary → Launch
  const renderStep = () => {
    if (effectiveStep === 0) return <WelcomeStep />;
    if (effectiveStep === 1) return <IndustryStep />;
    if (effectiveStep === 2) return <BusinessContextStep />;
    if (effectiveStep === 3) {
      if (loading) return <div className="min-h-screen bg-background" />;
      return <SignupStep />;
    }
    if (effectiveStep === 4) return <BubblesStep />;
    if (effectiveStep === 5) return <AIQuestionsStep />;
    return <SummaryStep />;
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <div key={effectiveStep}>
          {renderStep()}
        </div>
      </AnimatePresence>
    </div>
  );
}
