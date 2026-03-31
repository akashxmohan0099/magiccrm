"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore, TOTAL_PROGRESS_STEPS } from "@/store/onboarding";
import { useHydration } from "@/hooks/useHydration";
import { AUTH_MEMBER_REFRESH_EVENT, useAuth } from "@/hooks/useAuth";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { SignupStep } from "@/components/onboarding/SignupStep";
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
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const selectedPersona = useOnboardingStore((s) => s.selectedPersona);
  const { user, workspaceId, loading } = useAuth();
  const hasRedirected = useRef(false);
  const [bootstrapFailed, setBootstrapFailed] = useState(false);

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

  // ── If step >= 3 but user is NOT authenticated, clamp back to step 2 ──
  useEffect(() => {
    if (!loading && !user && step >= 3) {
      useOnboardingStore.getState().setStep(2);
    }
  }, [loading, user, step]);

  // ── Auth advancement (step 2 → building) ───────────────────
  // When signup completes and workspace exists, start building.
  useEffect(() => {
    if (step === 2 && !loading && !!user && !!workspaceId) {
      const t = setTimeout(() => {
        const store = useOnboardingStore.getState();
        if (store.step === 2 && !store.isBuilding) {
          store.setIsBuilding(true);
        }
      }, 800);
      return () => clearTimeout(t);
    }
  }, [step, loading, user, workspaceId]);

  // ── Recovery: if a session exists but the workspace row hasn't shown up yet,
  // idempotently re-run bootstrap and ask auth consumers to refetch membership.
  // Retries up to 3 times with increasing delays before showing a fallback.
  useEffect(() => {
    if (step !== 2 || loading || !user || workspaceId) {
      setBootstrapFailed(false);
      return;
    }

    let cancelled = false;
    const RECOVERY_DELAYS = [1200, 2500, 4000];

    const tryBootstrap = async (attempt: number) => {
      if (cancelled || attempt >= RECOVERY_DELAYS.length) {
        if (!cancelled) setBootstrapFailed(true);
        return;
      }

      await new Promise((r) => setTimeout(r, RECOVERY_DELAYS[attempt]));
      if (cancelled) return;

      try {
        const res = await fetch("/api/auth/bootstrap-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceName: businessContext.businessName,
            industry: businessContext.industry,
            persona: selectedPersona,
          }),
        });

        if (cancelled) return;

        if (!res.ok) {
          const result = await res.json().catch(() => ({}));
          console.warn(`[onboarding] workspace bootstrap attempt ${attempt + 1} failed:`, result.error || res.statusText);
          return tryBootstrap(attempt + 1);
        }

        window.dispatchEvent(new Event(AUTH_MEMBER_REFRESH_EVENT));
      } catch (error) {
        if (cancelled) return;
        console.warn(`[onboarding] workspace bootstrap attempt ${attempt + 1} failed:`, error);
        return tryBootstrap(attempt + 1);
      }
    };

    void tryBootstrap(0);

    return () => { cancelled = true; };
  }, [
    businessContext.businessName,
    businessContext.industry,
    loading,
    selectedPersona,
    step,
    user,
    workspaceId,
  ]);

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

  // Steps: 0 = Welcome, 1 = Persona + Business Name, 2 = Signup
  const renderStep = () => {
    if (step === 0) return <WelcomeStep />;
    if (step === 1) return <IndustryStep />;
    if (step === 2) {
      if (!user) return <SignupStep />;
      if (bootstrapFailed && !workspaceId) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-sm text-center space-y-4 px-6">
              <h2 className="text-[22px] font-bold text-foreground">
                Workspace setup didn&apos;t complete
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                We couldn&apos;t finish creating your workspace. This is usually a temporary issue.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setBootstrapFailed(false)}
                  className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Try again
                </button>
                <a
                  href="/onboarding"
                  className="w-full py-3 text-sm text-text-tertiary hover:text-foreground transition-colors"
                >
                  Start fresh
                </a>
              </div>
            </div>
          </div>
        );
      }
      return (
        <OnboardingLoader
          title={workspaceId ? "Account created" : "Finishing your workspace setup"}
          subtitle={workspaceId ? "Setting up your workspace" : "This usually takes a few seconds"}
          step={2}
          totalSteps={2}
        />
      );
    }
    return null;
  };

  // Global progress: steps 1-2
  const showProgress = step >= 1 && step <= 2;
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
