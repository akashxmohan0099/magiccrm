"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore, TOTAL_PROGRESS_STEPS } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { SignupStep } from "@/components/onboarding/SignupStep";
import { BubblesStep } from "@/components/onboarding/BubblesStep";
import { AIQuestionsStep } from "@/components/onboarding/AIQuestionsStep";
import { ConfigureStep } from "@/components/onboarding/ConfigureStep";
import { SummaryStep } from "@/components/onboarding/SummaryStep";
import { BuildingScreen } from "@/components/onboarding/BuildingScreen";
import { OnboardingLoader } from "@/components/onboarding/OnboardingLoader";

export default function OnboardingPage() {
  const hydrated = useHydration();

  if (!hydrated) {
    return (
      <OnboardingLoader
        title="Getting things ready"
        subtitle="Loading your progress"
      />
    );
  }

  return <OnboardingContent />;
}

function OnboardingContent() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step);
  const isBuilding = useOnboardingStore((s) => s.isBuilding);
  const buildComplete = useOnboardingStore((s) => s.buildComplete);
  const { user, workspaceId, loading } = useAuth();
  const hasRedirected = useRef(false);

  // ── If onboarding was already completed, skip to dashboard ──
  // Uses buildComplete flag OR (authenticated + workspace exists + pre-auth step)
  // because workspace is created at step 3 but onboarding continues to step 7.
  useEffect(() => {
    if (loading || hasRedirected.current) return;

    // Case 1: buildComplete flag is set — user finished the full flow
    if (user && buildComplete) {
      hasRedirected.current = true;
      const store = useOnboardingStore.getState();
      if (store.isBuilding) store.setIsBuilding(false);
      router.replace("/dashboard");
      return;
    }

    // Case 2: User is authenticated and has a workspace but localStorage was
    // reset (migration, cleared, new device). They're at a pre-auth step (0-2)
    // which means onboarding state is stale. Send them to the dashboard.
    if (user && workspaceId && step <= 2) {
      hasRedirected.current = true;
      router.replace("/dashboard");
      return;
    }
  }, [loading, user, workspaceId, buildComplete, step, router]);

  // ── Scroll to top on every step change ──
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ── If step >= 4 but user is NOT authenticated, clamp back to step 3 ──
  useEffect(() => {
    if (!loading && !user && step >= 4) {
      useOnboardingStore.getState().setStep(3);
    }
  }, [loading, user, step]);

  // ── Auth advancement (step 3 → 4) ───────────────────────────
  // When user becomes authenticated at step 3, advance to step 4.
  // 800ms delay gives time for the "Account created" loader to feel intentional.
  useEffect(() => {
    if (step === 3 && !loading && !!user) {
      const t = setTimeout(() => {
        const currentStep = useOnboardingStore.getState().step;
        if (currentStep === 3) {
          useOnboardingStore.getState().setStep(4);
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [step, loading, user]);

  // ── Safety valve: isBuilding stuck + already completed → go to dashboard ──
  if (isBuilding && !loading && user && buildComplete) {
    useOnboardingStore.getState().setIsBuilding(false);
    router.replace("/dashboard");
    return (
      <OnboardingLoader
        title="Your workspace is ready"
        subtitle="Taking you to your dashboard"
      />
    );
  }

  if (isBuilding) {
    return <BuildingScreen />;
  }

  // Don't render steps while auth is loading or redirecting
  if (loading || hasRedirected.current) {
    return (
      <OnboardingLoader
        title="Getting things ready"
        subtitle="Checking your account"
      />
    );
  }

  // Steps:
  // 0 = Welcome
  // 1 = Industry/Persona
  // 2 = Business Context
  // 3 = Signup
  // 4 = Activity Chips (4 slides)
  // 5 = AI Questions (2 categories)
  // 6 = Configure (deep-dive sub-features)
  // 7 = Summary → Launch
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) return <BusinessContextStep />;
    if (step === 3) {
      if (!user) return <SignupStep />;
      return (
        <OnboardingLoader
          title="Account created"
          subtitle="Now let's learn how you work"
          step={3}
          totalSteps={7}
        />
      );
    }
    if (step === 4) return <BubblesStep />;
    if (step === 5) return <AIQuestionsStep />;
    if (step === 6) return <ConfigureStep />;
    return <SummaryStep />;
  };

  // Global progress: steps 1-7
  const showProgress = step >= 1 && step <= 7;
  const progress = Math.min((step / (TOTAL_PROGRESS_STEPS - 1)) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border-light/50">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
