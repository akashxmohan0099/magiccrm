"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { getLocalFollowUps } from "@/lib/local-followup-questions";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";
import { OnboardingLoader } from "@/components/onboarding/OnboardingLoader";

interface AIQuestion {
  question: string;
  module: string;
}

interface Category {
  title: string;
  subtitle: string;
  questions: AIQuestion[];
  isLocal?: boolean;
}

// Maps AI module keys → store module IDs and optional needs keys.
// billing and communication are excluded — they're always-on and never asked about.
const MODULE_MAP: Record<string, { needsKey?: string; moduleId: string }> = {
  scheduling: { needsKey: "acceptBookings", moduleId: "bookings-calendar" },
  projects: { needsKey: "manageProjects", moduleId: "jobs-projects" },
  marketing: { needsKey: "runMarketing", moduleId: "marketing" },
  team: { moduleId: "team" },
  automations: { moduleId: "automations" },
  reporting: { moduleId: "reporting" },
  products: { moduleId: "products" },
  "client-portal": { moduleId: "client-portal" },
  documents: { moduleId: "documents" },
  waitlist: { moduleId: "waitlist-manager" },
  proposals: { moduleId: "proposals" },
};

// Map chip IDs → readable labels for the AI prompt.
// Includes both base chips and industry-specific additions.
const CHIP_LABELS: Record<string, string> = {
  // Base chips
  "clients-book": "Clients book appointments or sessions",
  "walk-ins": "Clients walk in or call directly",
  "online-booking": "I want an online booking page",
  "inquiries": "Clients request quotes or send project briefs",
  "referrals": "Most clients come from referrals",
  "at-my-place": "Clients visit my location",
  "visit-clients": "I travel to the client",
  "group-classes": "I run group classes or workshops",
  "projects": "I manage multi-step jobs or projects",
  "recurring-clients": "I see the same clients regularly",
  "hourly-billing": "I bill by the hour or track time",
  "memberships": "I sell packages, memberships, or subscriptions",
  "products": "I sell products alongside my services",
  "campaigns": "I run promotions, campaigns, or offers",
  "referral-program": "I want a referral or loyalty program",
  "team": "I have staff or contractors",
  "automate": "I want to automate reminders and follow-ups",
  "reports": "I want to track revenue and performance",
  "contracts": "I use contracts or agreements",
  "client-portal": "I want clients to have a self-service portal",
  // Industry-specific chips
  "messaging": "Clients message me on WhatsApp or Instagram",
  "multiple-jobs": "I run multiple jobs at the same time",
  "remote-collab": "I collaborate with clients remotely",
  "deposits": "I collect deposits before starting work",
  "resources": "I share worksheets or learning materials",
};

export function AIQuestionsStep() {
  const { nextStep, prevStep, businessContext, selectedIndustry, selectedPersona, discoveryAnswers } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setDiscoveryAnswer = useOnboardingStore((s) => s.setDiscoveryAnswer);
  const getPersonaConfig = useOnboardingStore((s) => s.getPersonaConfig);
  const persistedCategories = useOnboardingStore((s) => s.aiCategories);
  const persistedAnswers = useOnboardingStore((s) => s.aiAnswers);
  const setAICategories = useOnboardingStore((s) => s.setAICategories);
  const setAIAnswer = useOnboardingStore((s) => s.setAIAnswer);
  const chipSelections = useOnboardingStore((s) => s.chipSelections);

  // ── Local follow-up questions (deterministic, triggered by chips) ──
  const localFollowUps = useMemo(
    () => getLocalFollowUps(chipSelections),
    [chipSelections],
  );

  // Build local category if there are any triggered questions
  const localCategory: Category | null = useMemo(() => {
    if (localFollowUps.length === 0) return null;
    return {
      title: "A few quick follow-ups",
      subtitle: "Based on what you told us",
      isLocal: true,
      questions: localFollowUps.map((q) => ({
        question: q.question,
        module: q.moduleId,
      })),
    };
  }, [localFollowUps]);

  // ── AI-generated questions ──
  const [aiCategories, setAiCats] = useState<Category[]>(persistedCategories);
  const answers = persistedAnswers;
  const [loading, setLoading] = useState(persistedCategories.length === 0);
  const [error, setError] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Convert chip selections to readable labels for the AI
  const selectedChipLabels = chipSelections.map((id) => CHIP_LABELS[id] || id);

  // Extract already-activated module IDs so the AI knows what to skip
  const activatedModules = Object.entries(discoveryAnswers)
    .filter(([key, val]) => key.startsWith("module:") && val === true)
    .map(([key]) => key.replace("module:", ""));

  // Extract explicitly-declined modules (user saw chip but didn't select it)
  const declinedModules = Object.entries(discoveryAnswers)
    .filter(([key, val]) => key.startsWith("module:") && val === false)
    .map(([key]) => key.replace("module:", ""));

  const persona = getPersonaConfig();
  const personaProfile = getProfileForAIPrompt(selectedPersona);

  // Topics already covered by local questions — AI should not duplicate
  const localQuestionTopics = localFollowUps.map((q) => q.question);

  // Fetch AI questions
  const chipsKey = chipSelections.slice().sort().join(",");
  useEffect(() => {
    if (persistedCategories.length > 0) {
      setAiCats(persistedCategories);
      setLoading(false);
      return;
    }

    async function fetchQuestions() {
      try {
        const res = await fetch("/api/onboarding/ai-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: selectedIndustry,
            persona: persona?.label || selectedPersona,
            businessName: businessContext.businessName,
            businessDescription: businessContext.businessDescription,
            location: businessContext.location,
            selectedChips: selectedChipLabels,
            activatedModules,
            declinedModules,
            localQuestionTopics,
            personaProfile,
          }),
        });

        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          const cats = data.categories.slice(0, 2);
          setAiCats(cats);
          setAICategories(cats); // Persist to store
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsKey]);

  // ── Merge local + AI categories ──
  const allCategories = useMemo(() => {
    const cats: Category[] = [];
    if (localCategory) cats.push(localCategory);
    cats.push(...aiCategories);
    return cats;
  }, [localCategory, aiCategories]);

  // ── Answer keys ──
  // Local questions use "local-{id}" keys, AI questions use "{catIndex}-{qIndex}" keys.
  // catIndex is relative to allCategories, so AI categories shift by 1 when local exists.

  const getAnswerKey = (catIdx: number, qIdx: number): string => {
    const cat = allCategories[catIdx];
    if (cat?.isLocal) {
      return `local-${localFollowUps[qIdx]?.id || qIdx}`;
    }
    // AI category: use the AI-relative index for backward compat
    const aiIdx = localCategory ? catIdx - 1 : catIdx;
    return `${aiIdx}-${qIdx}`;
  };

  const handleAnswer = useCallback(
    (qKey: string, value: boolean) => {
      setAIAnswer(qKey, value);
    },
    [setAIAnswer],
  );

  const currentCat = allCategories[catIndex];
  const isLastCat = catIndex === allCategories.length - 1;

  // Count answered in current category
  const currentCatAnswered = currentCat
    ? currentCat.questions.filter((_, i) => getAnswerKey(catIndex, i) in answers).length
    : 0;

  const handleNext = () => {
    if (isLastCat) {
      finalize();
    } else {
      setDirection(1);
      setCatIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (catIndex === 0) {
      prevStep();
    } else {
      setDirection(-1);
      setCatIndex((i) => i - 1);
    }
  };

  const finalize = () => {
    const currentAnswers = useOnboardingStore.getState().discoveryAnswers;

    // ── Process local follow-up answers ──
    for (const lq of localFollowUps) {
      const localKey = `local-${lq.id}`;
      if (answers[localKey] === true) {
        for (const enable of lq.enables) {
          setDiscoveryAnswer(`feature:${enable.featureId}`, true);
        }
        // Process follow-up
        if (lq.followUp) {
          const followUpKey = `local-${lq.id}:followup`;
          if (answers[followUpKey] === true) {
            for (const enable of lq.followUp.enables) {
              setDiscoveryAnswer(`feature:${enable.featureId}`, true);
            }
            if (lq.followUp.metaKey) {
              setDiscoveryAnswer(lq.followUp.metaKey, true);
            }
          }
        }
      }
    }

    // ── Process AI question answers ──
    for (const cat of aiCategories) {
      for (let i = 0; i < cat.questions.length; i++) {
        const aiCatIdx = aiCategories.indexOf(cat);
        const key = `${aiCatIdx}-${i}`;
        if (answers[key] === true) {
          const q = cat.questions[i];
          const mapping = MODULE_MAP[q.module];
          if (mapping) {
            const moduleKey = `module:${mapping.moduleId}`;
            if (currentAnswers[moduleKey] !== false) {
              setDiscoveryAnswer(moduleKey, true);
            }
            if (mapping.needsKey && currentAnswers[moduleKey] !== false) {
              setNeed(mapping.needsKey as keyof import("@/types/onboarding").NeedsAssessment, true);
            }
          }
        }
      }
    }
    nextStep();
  };

  const handleSkip = useCallback(() => nextStep(), [nextStep]);

  useEffect(() => {
    if (!loading && (error || aiCategories.length === 0) && !localCategory) {
      handleSkip();
    }
  }, [aiCategories.length, error, handleSkip, loading, localCategory]);

  // ── Loading state ──
  if (loading) {
    // If we have local questions, show them immediately while AI loads
    if (localCategory && catIndex === 0) {
      // Fall through to the main render — local questions don't need AI
    } else {
      return (
        <OnboardingLoader
          title={`Personalizing for ${businessContext.businessName || "you"}`}
          subtitle="Analyzing your workflow to ask the right questions"
          step={5}
          totalSteps={7}
          detail="This only takes a few seconds"
        />
      );
    }
  }

  // If AI failed and no local questions either, skip
  if (!loading && (error || aiCategories.length === 0) && !localCategory) {
    return null;
  }

  // Build the effective list of categories to show right now
  // If AI is still loading, only show local category
  const displayCategories = loading ? (localCategory ? [localCategory] : []) : allCategories;
  const displayCat = displayCategories[catIndex];
  if (!displayCat) return null;

  const isLastDisplay = catIndex === displayCategories.length - 1;
  const progress = ((catIndex + 1) / displayCategories.length) * 100;
  const isLocalSlide = displayCat.isLocal === true;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 40, -25, 0], y: [0, -25, 35, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <motion.div animate={{ x: [0, -35, 20, 0], y: [0, 20, -35, 0] }} transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Progress bar */}
        <div className="pt-6 px-6 lg:px-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
            {!isLocalSlide && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[11px] text-primary font-semibold">AI</span>
              </div>
            )}
          </div>
        </div>

        {/* Category slide */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={catIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg"
            >
              {/* Category header */}
              <div className="text-center mb-8">
                {!isLocalSlide && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-text-tertiary">Personalized for {businessContext.businessName || "you"}</span>
                  </div>
                )}
                <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1.5">
                  {displayCat.title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {displayCat.subtitle}
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {displayCat.questions.map((q, i) => {
                  const key = getAnswerKey(catIndex, i);
                  const isYes = answers[key] === true;
                  const isNo = answers[key] === false;
                  const isAnswered = key in answers;

                  // Check if this local question has a follow-up
                  const localQ = isLocalSlide ? localFollowUps[i] : null;
                  const showFollowUp = isLocalSlide && localQ?.followUp && isYes;
                  const followUpKey = localQ ? `local-${localQ.id}:followup` : "";
                  const followUpIsYes = answers[followUpKey] === true;
                  const followUpIsNo = answers[followUpKey] === false;

                  return (
                    <div key={key}>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                        className={`p-5 rounded-2xl border transition-all ${
                          isAnswered ? "bg-white/80 border-border-light" : "bg-white border-primary/15 shadow-sm"
                        }`}
                      >
                        <p className="text-[15px] font-medium text-foreground mb-3">{q.question}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswer(key, true)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                              isYes ? "bg-primary text-white shadow-sm" : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAnswer(key, false)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                              isNo ? "bg-foreground text-white" : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </motion.div>

                      {/* Conditional follow-up for local questions */}
                      <AnimatePresence>
                        {showFollowUp && localQ?.followUp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          >
                            <div className="p-5 rounded-2xl bg-white/60 border border-border-light ml-4">
                              <p className="text-sm font-medium text-foreground mb-3">{localQ.followUp.question}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAnswer(followUpKey, true)}
                                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                    followUpIsYes ? "bg-primary text-white shadow-sm" : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => handleAnswer(followUpKey, false)}
                                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                    followUpIsNo ? "bg-foreground text-white" : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Subtle progression message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-xs text-text-tertiary mt-5"
              >
                {currentCatAnswered === 0
                  ? isLocalSlide
                    ? "These follow from your earlier answers"
                    : "These are tailored to your business — answer what feels right"
                  : currentCatAnswered < displayCat.questions.length
                  ? `${displayCat.questions.length - currentCatAnswered} more to go`
                  : isLastDisplay ? "All done — let\u2019s see your workspace" : "Nice — one more category"}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={handleSkip} className="px-5 py-3.5 rounded-2xl text-[13px] font-medium text-text-tertiary hover:text-foreground cursor-pointer transition-colors">
              Skip
            </button>
            <button
              onClick={() => {
                if (isLastDisplay && loading) {
                  // Local questions done, but AI still loading — advance to next cat (will show loader)
                  setDirection(1);
                  setCatIndex((i) => i + 1);
                } else {
                  handleNext();
                }
              }}
              className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
            >
              {isLastDisplay && !loading ? "See my workspace" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
