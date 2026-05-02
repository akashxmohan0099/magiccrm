"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useAutomationsStore } from "@/store/automations";
import { useOnboardingDraftStore } from "@/store/onboarding-draft";
import { createClient } from "@/lib/supabase";
import posthog from "posthog-js";
import {
  getPersona,
  getStructuralQuestions,
  getSolutionsOptions,
  getMarketingOptions,
  getBillingOptions,
  getEngagementOptions,
  resolveEnabledAddons,
} from "@/lib/onboarding-v2";
import { STEPS } from "./_components/constants";
import { PersonaStep } from "./_components/PersonaStep";
import { StructuralStep } from "./_components/StructuralStep";
import { MultiSelectStep } from "./_components/MultiSelectStep";
import { SummaryStep } from "./_components/SummaryStep";
import { SignupStep } from "./_components/SignupStep";

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateSettings } = useSettingsStore();
  const { initDefaults } = useAutomationsStore();
  const { draft, setPersona, setStructure, toggleSelection, reset } =
    useOnboardingDraftStore();

  const initialStep = (() => {
    const raw = Number(searchParams.get("step"));
    if (!Number.isFinite(raw)) return 0;
    return Math.min(Math.max(0, Math.trunc(raw)), STEPS.length - 1);
  })();
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  const persona = getPersona(draft.persona);
  const structuralQuestions = useMemo(
    () => getStructuralQuestions(draft.persona),
    [draft.persona],
  );

  const canNext = (() => {
    if (step === 0) return !!draft.persona;
    if (step === 1) {
      return structuralQuestions.every((q) => !!draft.structure[q.id]);
    }
    if (step === 7) {
      return (
        email.includes("@") &&
        password.length >= 8 &&
        businessName.trim().length > 0
      );
    }
    return true;
  })();

  const skipAllowed = step >= 2 && step <= 5;
  // Progress bar only shows during the four multi-select steps. The
  // earlier persona/structure steps and the later summary/signup steps
  // get a clean empty top bar — questions just appear, no counter, no
  // tally pressure.
  const showProgress = step >= 2 && step <= 5;
  const multiProgress = showProgress ? ((step - 2 + 1) / 4) * 100 : 0;

  const handleComplete = async () => {
    if (!draft.persona) return;
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          workspaceName: businessName.trim() || `${persona?.label} Studio`,
          ownerName: businessName.trim() || email.split("@")[0] || "Owner",
        }),
      });
      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setError(signupData.error || "Failed to create account");
        setLoading(false);
        return;
      }

      if (signupData.requiresEmailConfirmation) {
        setNotice(
          signupData.message ||
            "Check your email to confirm your account, then sign in to finish setup.",
        );
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError("Account created but sign-in failed. Try logging in manually.");
        setLoading(false);
        return;
      }

      const workspaceId = signupData.workspaceId as string;
      const enabledAddons = resolveEnabledAddons(draft);

      updateSettings(
        {
          workspaceId,
          businessName: businessName.trim() || `${persona?.label} Studio`,
          contactEmail: email,
          persona: draft.persona,
          onboardingAnswers: {
            persona: draft.persona,
            structure: draft.structure,
            solutions: draft.solutions,
            marketing: draft.marketing,
            billing: draft.billing,
            engagement: draft.engagement,
          },
          enabledAddons,
          enabledFeatures: [],
          updatedAt: new Date().toISOString(),
        },
        workspaceId,
      );

      initDefaults(workspaceId);

      posthog.identify(email, { email, name: businessName || email });
      posthog.capture("onboarding_completed_v2", {
        workspace_id: workspaceId,
        persona: draft.persona,
        structure: draft.structure,
        solutions: draft.solutions,
        marketing: draft.marketing,
        billing: draft.billing,
        engagement: draft.engagement,
        enabled_addons: enabledAddons,
      });

      reset();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(16, 185, 129, 0.20), transparent 65%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(16, 185, 129, 0.14), transparent 65%), radial-gradient(ellipse 60% 40% at 0% 50%, rgba(16, 185, 129, 0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(16, 185, 129, 0.08), transparent 60%)",
        }}
      />
      <div className="relative max-w-2xl mx-auto px-4 py-6 min-h-screen flex flex-col">
        {/* Top bar: back arrow + (optional) progress bar. No step counter. */}
        <div className="flex items-center gap-4 mb-12 h-8">
          <motion.button
            onClick={() => {
              if (step === 0) return;
              setStep((c) => c - 1);
              setError("");
            }}
            disabled={step === 0}
            whileHover={step === 0 ? undefined : { x: -2 }}
            whileTap={step === 0 ? undefined : { scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-foreground/[0.04] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          {showProgress && (
            <div className="flex-1 h-1 rounded-full bg-foreground/10 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={false}
                animate={{ width: `${multiProgress}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          )}
        </div>

        {/* Step content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`w-full ${step === 6 ? "max-w-3xl" : "max-w-md"}`}
            >
              {step === 0 && (
                <PersonaStep
                  selected={draft.persona}
                  onSelect={(slug) => setPersona(slug)}
                />
              )}
              {step === 1 && (
                <StructuralStep
                  questions={structuralQuestions}
                  values={draft.structure}
                  onSelect={(key, value) => setStructure(key, value)}
                />
              )}
              {step === 2 && (
                <MultiSelectStep
                  title="What do you want Magic to handle?"
                  options={getSolutionsOptions(draft.persona)}
                  selectedIds={draft.solutions}
                  onToggle={(id) => toggleSelection("solutions", id)}
                />
              )}
              {step === 3 && (
                <MultiSelectStep
                  title="How do you reach out to clients?"
                  options={getMarketingOptions(draft.persona)}
                  selectedIds={draft.marketing}
                  onToggle={(id) => toggleSelection("marketing", id)}
                />
              )}
              {step === 4 && (
                <MultiSelectStep
                  title="How do you handle money?"
                  options={getBillingOptions(draft.persona)}
                  selectedIds={draft.billing}
                  onToggle={(id) => toggleSelection("billing", id)}
                />
              )}
              {step === 5 && (
                <MultiSelectStep
                  title="What keeps clients coming back?"
                  options={getEngagementOptions(draft.persona)}
                  selectedIds={draft.engagement}
                  onToggle={(id) => toggleSelection("engagement", id)}
                />
              )}
              {step === 6 && <SummaryStep />}
              {step === 7 && (
                <SignupStep
                  email={email}
                  password={password}
                  businessName={businessName}
                  onEmail={(v) => {
                    setEmail(v);
                    setError("");
                  }}
                  onPassword={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  onBusinessName={setBusinessName}
                  error={error}
                  notice={notice}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: Next + Skip */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-4">
          {step < STEPS.length - 1 ? (
            <motion.button
              onClick={() => setStep((c) => c + 1)}
              disabled={!canNext}
              whileHover={canNext ? { y: -2, scale: 1.02 } : undefined}
              whileTap={canNext ? { scale: 0.97 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="group flex items-center gap-2 px-12 py-3.5 rounded-full bg-foreground text-background text-[14px] font-semibold cursor-pointer hover:shadow-[0_8px_24px_-6px] hover:shadow-foreground/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Next
              <motion.span
                className="inline-flex"
                animate={{ x: 0 }}
                whileHover={{ x: 2 }}
              >
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleComplete}
              disabled={loading || !canNext}
              whileHover={loading || !canNext ? undefined : { y: -2, scale: 1.02 }}
              whileTap={loading || !canNext ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex items-center gap-2 px-12 py-3.5 rounded-full bg-primary text-white text-[14px] font-semibold cursor-pointer hover:shadow-[0_8px_24px_-6px] hover:shadow-primary/50 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Launch Dashboard
                </>
              )}
            </motion.button>
          )}
          {skipAllowed && (
            <button
              onClick={() => setStep((c) => Math.min(c + 1, STEPS.length - 1))}
              className="text-[12px] text-text-tertiary hover:text-foreground cursor-pointer"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reusable pill option ───────────────────────────────────────

