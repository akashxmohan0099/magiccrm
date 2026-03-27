"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useVocabulary } from "@/hooks/useVocabulary";
import { computeEnabledModuleIds, getModuleById } from "@/lib/module-registry";
import { FEATURE_BLOCKS } from "@/types/features";
import {
  selectQuestionsForUser,
  DEEP_DIVE_QUESTIONS,
  CHANNEL_OPTIONS,
  type DeepDiveQuestion,
} from "@/lib/deep-dive-questions";
import { trackDeepDiveEvent, createActivation } from "@/lib/deep-dive-analytics";
import { useRecommendedSetupStore } from "@/store/recommended-setup";
import { getFeatureDefinition } from "@/lib/feature-registry";
import { getProfileForAIPrompt } from "@/lib/persona-profiles";
import { OnboardingLoader } from "@/components/onboarding/OnboardingLoader";

// ── Module display config ────────────────────────────────

const MODULE_ICONS: Record<string, string> = {
  "bookings-calendar": "Calendar",
  "quotes-invoicing": "Receipt",
  "jobs-projects": "FolderKanban",
  "communication": "MessageCircle",
  "client-database": "Users",
  "team": "UsersRound",
  "products": "Package",
  "marketing": "Megaphone",
  "client-portal": "Globe",
};

// ── Component ────────────────────────────────────────────

export function ConfigureStep() {
  const { nextStep, prevStep, needs, discoveryAnswers, selectedIndustry, chipSelections, businessContext, selectedPersona } = useOnboardingStore();
  const deepDiveAnswers = useOnboardingStore((s) => s.deepDiveAnswers);
  const aiAnswers = useOnboardingStore((s) => s.aiAnswers);
  const setDeepDiveAnswer = useOnboardingStore((s) => s.setDeepDiveAnswer);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);
  const addFeatureActivation = useOnboardingStore((s) => s.addFeatureActivation);
  const getPersonaConfig = useOnboardingStore((s) => s.getPersonaConfig);
  const addRecommendedItem = useRecommendedSetupStore((s) => s.addItem);
  const vocab = useVocabulary();

  const [loading, setLoading] = useState(true);
  const [rewordedTexts, setRewordedTexts] = useState<Record<string, string>>({});

  // Extract local follow-up IDs that were asked in Step 5
  // so we can skip overlapping deep-dive questions
  const answeredLocalIds = useMemo(() => {
    return Object.keys(aiAnswers)
      .filter((k) => k.startsWith("local-") && !k.includes(":followup"))
      .map((k) => k.replace("local-", ""));
  }, [aiAnswers]);

  // Get enabled modules and select questions
  const enabledModules = useMemo(
    () => Array.from(computeEnabledModuleIds(needs, discoveryAnswers)),
    [needs, discoveryAnswers],
  );

  const questions = useMemo(
    () => selectQuestionsForUser(enabledModules, selectedIndustry, chipSelections, answeredLocalIds),
    [enabledModules, selectedIndustry, chipSelections, answeredLocalIds],
  );

  // Group questions by module for section headers
  const groupedQuestions = useMemo(() => {
    const groups: { moduleId: string; moduleName: string; questions: DeepDiveQuestion[] }[] = [];
    const seen = new Map<string, DeepDiveQuestion[]>();

    for (const q of questions) {
      if (!seen.has(q.moduleId)) {
        seen.set(q.moduleId, []);
      }
      seen.get(q.moduleId)!.push(q);
    }

    for (const [moduleId, qs] of seen) {
      const mod = getModuleById(moduleId);
      groups.push({
        moduleId,
        moduleName: mod?.name ?? moduleId,
        questions: qs,
      });
    }

    return groups;
  }, [questions]);

  // Fetch AI-reworded text (optional — fallback to defaults)
  const persona = getPersonaConfig();
  useEffect(() => {
    if (questions.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchRewords() {
      try {
        const res = await fetch("/api/onboarding/configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: selectedIndustry,
            persona: persona?.label || selectedPersona,
            businessName: businessContext.businessName,
            businessDescription: businessContext.businessDescription,
            vocabulary: vocab,
            personaProfile: getProfileForAIPrompt(selectedPersona),
            questions: questions
              .filter((q) => q.question !== "WHERE_DO_CLIENTS_MESSAGE_YOU")
              .map((q) => ({ id: q.id, question: q.question, moduleId: q.moduleId })),
          }),
        });

        const data = await res.json();
        if (data.questions?.length > 0) {
          const map: Record<string, string> = {};
          for (const q of data.questions) {
            map[q.id] = q.text;
          }
          setRewordedTexts(map);
        }
      } catch {
        // Fallback: use default text
      } finally {
        setLoading(false);
      }
    }
    fetchRewords();
    // Track questions shown
    for (const q of questions) {
      trackDeepDiveEvent("question_shown", { questionId: q.id, moduleId: q.moduleId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]);

  const handleAnswer = useCallback(
    (questionId: string, value: boolean) => {
      setDeepDiveAnswer(questionId, value);
      trackDeepDiveEvent("question_answered", { questionId, answer: value });
    },
    [setDeepDiveAnswer],
  );

  const handleFollowUpAnswer = useCallback(
    (parentId: string, value: boolean) => {
      setDeepDiveAnswer(`${parentId}:followup`, value);
      trackDeepDiveEvent("followup_answered", { questionId: `${parentId}:followup`, answer: value });
    },
    [setDeepDiveAnswer],
  );

  // Channel picker state
  const handleChannelInbound = useCallback(
    (channels: string[]) => {
      setDeepDiveAnswer("comms-channels:inbound", channels);
      // Pre-fill workflow intent with same channels on first selection
      const current = deepDiveAnswers["comms-channels:workflow"];
      if (!current) {
        setDeepDiveAnswer("comms-channels:workflow", channels);
      } else if (Array.isArray(current)) {
        // Clean up workflow channels that are no longer in inbound
        const inboundSet = new Set(channels);
        const cleaned = current.filter((c) => inboundSet.has(c));
        setDeepDiveAnswer("comms-channels:workflow", cleaned);
      }
    },
    [setDeepDiveAnswer, deepDiveAnswers],
  );

  const handleChannelWorkflow = useCallback(
    (channels: string[]) => {
      setDeepDiveAnswer("comms-channels:workflow", channels);
    },
    [setDeepDiveAnswer],
  );

  const finalize = () => {
    // Build feature selections from answers + defaults
    const moduleFeatureMap: Record<string, Record<string, boolean>> = {};

    // Initialize with defaults from FEATURE_BLOCKS for all enabled modules
    for (const block of FEATURE_BLOCKS) {
      if (!enabledModules.includes(block.id)) continue;
      moduleFeatureMap[block.id] = {};
      for (const sf of block.subFeatures) {
        moduleFeatureMap[block.id][sf.id] = sf.defaultOn;
      }
    }

    // Helper: enable a feature in the correct module (using registry, not question moduleId)
    const enableFeature = (featureId: string, questionId: string, answer: boolean | string[]) => {
      const def = getFeatureDefinition(featureId);
      if (!def) return;
      const realModule = def.moduleId;
      if (moduleFeatureMap[realModule]?.[featureId] !== undefined) {
        moduleFeatureMap[realModule][featureId] = true;
      }
      addFeatureActivation(createActivation(featureId, realModule, "enabled", "deep-dive", questionId, answer));
      trackDeepDiveEvent("feature_auto_enabled", { featureId, moduleId: realModule, questionId });
    };

    const recommendFeature = (featureId: string, questionId: string, reason: string) => {
      const def = getFeatureDefinition(featureId);
      if (!def) return;
      addFeatureActivation(createActivation(featureId, def.moduleId, "recommended", "deep-dive", questionId, true));
      addRecommendedItem({ featureId, moduleId: def.moduleId, reason, triggerQuestionId: questionId, priority: 3 });
      trackDeepDiveEvent("feature_recommended", { featureId, moduleId: def.moduleId, questionId });
    };

    // Apply deep-dive answers
    for (const q of questions) {
      if (q.question === "WHERE_DO_CLIENTS_MESSAGE_YOU") continue; // handled separately

      const answer = deepDiveAnswers[q.id];
      if (answer === true) {
        for (const { featureId, action } of q.enables) {
          if (action === "auto") {
            enableFeature(featureId, q.id, true);
          } else {
            const def = getFeatureDefinition(featureId);
            recommendFeature(featureId, q.id, `Suggested based on: "${q.question}" — ${def?.moduleId ?? q.moduleId}`);
          }
        }
      }

      // Follow-up
      if (q.followUp && answer === true) {
        const followUpKey = `${q.id}:followup`;
        const followUpAnswer = deepDiveAnswers[followUpKey];
        if (followUpAnswer === true) {
          for (const { featureId, action } of q.followUp.enables) {
            if (action === "auto") {
              enableFeature(featureId, followUpKey, true);
            } else {
              recommendFeature(featureId, followUpKey, `Suggested based on follow-up: "${q.followUp!.question}"`);
            }
          }
        }
      }
    }

    // Apply channel picker answers
    const wkChannels = deepDiveAnswers["comms-channels:workflow"];
    const inChannels = deepDiveAnswers["comms-channels:inbound"];
    if (Array.isArray(wkChannels) && moduleFeatureMap["communication"]) {
      for (const ch of wkChannels) {
        if (moduleFeatureMap["communication"][ch] !== undefined) {
          moduleFeatureMap["communication"][ch] = true;
          addFeatureActivation(createActivation(ch, "communication", "enabled", "deep-dive", "comms-channels", wkChannels));
          trackDeepDiveEvent("channel_selected", { featureId: ch, moduleId: "communication" });
        }
      }
    }
    // Inbound-only channels (Layer A but not Layer B) → recommend
    if (Array.isArray(inChannels) && Array.isArray(wkChannels)) {
      for (const ch of inChannels) {
        if (!wkChannels.includes(ch)) {
          recommendFeature(ch, "comms-channels", `Clients message you here but you chose not to manage it in the CRM yet`);
        }
      }
    }

    // Write feature selections to store
    for (const [moduleId, features] of Object.entries(moduleFeatureMap)) {
      const block = FEATURE_BLOCKS.find((b) => b.id === moduleId);
      if (!block) continue;
      const featureDetails = block.subFeatures.map((sf) => ({
        id: sf.id,
        label: sf.label,
        description: sf.description,
        selected: features[sf.id] ?? sf.defaultOn,
      }));
      setFeatureSelections(moduleId, featureDetails);
    }

    trackDeepDiveEvent("configure_completed", { totalQuestionsShown: questions.length });
    nextStep();
  };

  const handleSkip = () => {
    trackDeepDiveEvent("configure_skipped", { totalQuestionsShown: questions.length });
    // Write defaults for all enabled modules
    for (const block of FEATURE_BLOCKS) {
      if (!enabledModules.includes(block.id)) continue;
      const featureDetails = block.subFeatures.map((sf) => ({
        id: sf.id,
        label: sf.label,
        description: sf.description,
        selected: sf.defaultOn,
      }));
      setFeatureSelections(block.id, featureDetails);
    }
    nextStep();
  };

  // If no questions to ask, skip to next step via effect (not during render)
  useEffect(() => {
    if (!loading && questions.length === 0) {
      handleSkip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length]);

  // ── Loading state ──────────────────────────────────────

  if (loading) {
    return (
      <OnboardingLoader
        title="Fine-tuning your workspace"
        subtitle="A few more questions so we get things right"
        step={6}
        totalSteps={7}
        detail="Almost there"
      />
    );
  }

  if (!loading && questions.length === 0) return null;

  // ── Render ─────────────────────────────────────────────

  const inboundChannels = (deepDiveAnswers["comms-channels:inbound"] as string[] | undefined) ?? [];
  const workflowChannels = (deepDiveAnswers["comms-channels:workflow"] as string[] | undefined) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      <div className="max-w-lg mx-auto px-6 pt-16 pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-medium text-text-tertiary">Personalizing for {businessContext.businessName || "you"}</span>
          </div>
          <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
            Let&apos;s fine-tune your workspace
          </h2>
          <p className="text-[15px] text-text-secondary">
            A few more to get things just right
          </p>
        </motion.div>

        {/* Question groups by module */}
        <div className="space-y-8">
          {groupedQuestions.map((group) => (
            <motion.div
              key={group.moduleId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Module section header */}
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-3 px-1">
                {group.moduleName}
              </p>

              <div className="space-y-3">
                {group.questions.map((q) => {
                  // Channel picker — special rendering
                  if (q.question === "WHERE_DO_CLIENTS_MESSAGE_YOU") {
                    return (
                      <div key={q.id} className="space-y-4">
                        {/* Layer A: Inbound */}
                        <div className="p-5 rounded-2xl bg-white border border-border-light">
                          <p className="text-[15px] font-medium text-foreground mb-3">
                            Where do {vocab.clients.toLowerCase()} currently message you?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {CHANNEL_OPTIONS.map((ch) => {
                              const on = inboundChannels.includes(ch.id);
                              return (
                                <button
                                  key={ch.id}
                                  onClick={() => {
                                    const next = on
                                      ? inboundChannels.filter((c) => c !== ch.id)
                                      : [...inboundChannels, ch.id];
                                    handleChannelInbound(next);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                    on
                                      ? "bg-primary text-white shadow-sm"
                                      : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                                  }`}
                                >
                                  {ch.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Layer B: Workflow intent (only if Layer A has selections) */}
                        <AnimatePresence>
                          {inboundChannels.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-5 rounded-2xl bg-white/80 border border-border-light"
                            >
                              <p className="text-[15px] font-medium text-foreground mb-3">
                                Which do you want to manage inside the CRM?
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {CHANNEL_OPTIONS.filter((ch) => inboundChannels.includes(ch.id)).map((ch) => {
                                  const on = workflowChannels.includes(ch.id);
                                  return (
                                    <button
                                      key={ch.id}
                                      onClick={() => {
                                        const next = on
                                          ? workflowChannels.filter((c) => c !== ch.id)
                                          : [...workflowChannels, ch.id];
                                        handleChannelWorkflow(next);
                                      }}
                                      className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                        on
                                          ? "bg-primary text-white shadow-sm"
                                          : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                                      }`}
                                    >
                                      {ch.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // Standard yes/no question
                  const answer = deepDiveAnswers[q.id] as boolean | undefined;
                  const isYes = answer === true;
                  const isNo = answer === false;
                  const isAnswered = answer !== undefined;
                  const displayText = rewordedTexts[q.id] || q.question;
                  const showFollowUp = q.followUp && isYes;

                  return (
                    <div key={q.id} className="space-y-2">
                      <div className={`p-5 rounded-2xl border transition-all ${
                        isAnswered ? "bg-white/80 border-border-light" : "bg-white border-primary/15 shadow-sm"
                      }`}>
                        <p className="text-[15px] font-medium text-foreground mb-3">{displayText}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnswer(q.id, true)}
                            className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                              isYes ? "bg-primary text-white shadow-sm" : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAnswer(q.id, false)}
                            className={`flex-1 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                              isNo ? "bg-foreground text-white" : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Conditional follow-up */}
                      <AnimatePresence>
                        {showFollowUp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="p-5 rounded-2xl bg-white/60 border border-border-light ml-4">
                              <p className="text-[14px] font-medium text-foreground mb-3">{q.followUp!.question}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleFollowUpAnswer(q.id, true)}
                                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                    deepDiveAnswers[`${q.id}:followup`] === true
                                      ? "bg-primary text-white shadow-sm"
                                      : "bg-surface border border-border-light text-foreground hover:border-primary/30"
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => handleFollowUpAnswer(q.id, false)}
                                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                                    deepDiveAnswers[`${q.id}:followup`] === false
                                      ? "bg-foreground text-white"
                                      : "bg-surface border border-border-light text-foreground hover:border-foreground/20"
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
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 space-y-3">
          <button
            onClick={finalize}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex gap-3">
            <button onClick={prevStep} className="flex-1 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              Back
            </button>
            <button onClick={handleSkip} className="flex-1 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              Skip — use defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
