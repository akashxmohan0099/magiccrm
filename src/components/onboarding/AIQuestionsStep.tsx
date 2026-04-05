"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Mail, MessageSquare, MessageCircle, Instagram, Facebook } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { getLocalFollowUps, type LocalFollowUpQuestion } from "@/lib/local-followup-questions";

// ── Channel options for communication setup ──

const CHANNEL_OPTIONS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "instagram-dms", label: "Instagram", icon: Instagram },
  { id: "facebook-messenger", label: "Messenger", icon: Facebook },
];

// ── Slide types ──

interface FollowUpSlide {
  type: "followup";
  question: LocalFollowUpQuestion;
}

interface ChannelSlide {
  type: "channels";
}

type Slide = FollowUpSlide | ChannelSlide;

export function AIQuestionsStep() {
  const { nextStep, prevStep, chipSelections } = useOnboardingStore();
  const persistedAnswers = useOnboardingStore((s) => s.aiAnswers);
  const setAIAnswer = useOnboardingStore((s) => s.setAIAnswer);
  const setDiscoveryAnswer = useOnboardingStore((s) => s.setDiscoveryAnswer);

  // ── Build slides from deterministic follow-ups + channel picker ──
  const localFollowUps = useMemo(() => getLocalFollowUps(chipSelections), [chipSelections]);

  const slides: Slide[] = useMemo(() => {
    const s: Slide[] = localFollowUps.map((q) => ({ type: "followup" as const, question: q }));
    s.push({ type: "channels" as const }); // Always show channel picker
    return s;
  }, [localFollowUps]);

  // Auto-skip if no follow-ups and we only have the channel picker
  useEffect(() => {
    if (localFollowUps.length === 0 && slides.length <= 1) {
      // Only channel picker — still show it, channels are important
    }
  }, [localFollowUps, slides.length]);

  const [slideIndex, setSlideIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(() => {
    const persisted = persistedAnswers["channels"];
    if (Array.isArray(persisted)) return new Set(persisted as string[]);
    return new Set<string>();
  });

  const currentSlide = slides[slideIndex];
  const isLast = slideIndex === slides.length - 1;
  const progress = ((slideIndex + 1) / slides.length) * 100;

  const handleNext = () => {
    if (isLast) {
      finalize();
    } else {
      setDirection(1);
      setSlideIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (slideIndex === 0) {
      prevStep();
    } else {
      setDirection(-1);
      setSlideIndex((i) => i - 1);
    }
  };

  const answerFollowUp = (questionId: string, value: boolean) => {
    setAIAnswer(`local-${questionId}`, value);
    if (value) {
      const q = localFollowUps.find((f) => f.id === questionId);
      if (q) {
        q.enables.forEach((e) => {
          if (e.action === "auto") setDiscoveryAnswer(`feature:${e.featureId}`, true);
        });
      }
    }
    // Auto-advance
    setTimeout(() => {
      if (!isLast) {
        setDirection(1);
        setSlideIndex((i) => i + 1);
      }
    }, 300);
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  const finalize = () => {
    // Save channel selections
    setAIAnswer("channels", Array.from(selectedChannels) as unknown as boolean);
    selectedChannels.forEach((ch) => {
      setDiscoveryAnswer(`channel:${ch}`, true);
    });
    nextStep();
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 35%, #F5F3FF 65%, #FAFAFA 100%)" }}>
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Progress */}
        <div className="pt-6 px-6 lg:px-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="text-text-tertiary hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 h-1.5 bg-card-bg/60 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
            </div>
            <span className="text-xs text-text-tertiary font-medium tabular-nums">
              {slideIndex + 1}/{slides.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slideIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-lg"
            >
              {currentSlide?.type === "followup" && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                      Quick follow-up
                    </h2>
                    <p className="text-[15px] text-text-secondary">
                      Based on what you told us
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[16px] font-medium text-foreground text-center mb-6">
                      {currentSlide.question.question}
                    </p>
                    <div className="flex gap-3 justify-center">
                      {[true, false].map((val) => {
                        const answered = persistedAnswers[`local-${currentSlide.question.id}`];
                        const isSelected = answered === val;
                        return (
                          <button
                            key={String(val)}
                            onClick={() => answerFollowUp(currentSlide.question.id, val)}
                            className={`px-8 py-4 rounded-2xl text-[15px] font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-card-bg/90 border border-white/60 hover:border-primary/20 hover:shadow-md backdrop-blur-sm"
                            }`}
                          >
                            {val ? "Yes" : "No"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {currentSlide?.type === "channels" && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                      Where do clients message you?
                    </h2>
                    <p className="text-[15px] text-text-secondary">
                      Select all channels you use
                    </p>
                  </div>

                  <div className="space-y-3">
                    {CHANNEL_OPTIONS.map((ch) => {
                      const on = selectedChannels.has(ch.id);
                      const Icon = ch.icon;
                      return (
                        <motion.button
                          key={ch.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleChannel(ch.id)}
                          className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                            on
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "bg-card-bg/90 border border-white/60 hover:border-primary/20 hover:shadow-md backdrop-blur-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${on ? "text-white" : "text-text-secondary"}`} />
                            <span className={`text-[15px] font-medium ${on ? "text-white" : "text-foreground"}`}>
                              {ch.label}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            on ? "bg-card-bg/25" : "border-2 border-border-light"
                          }`}>
                            {on && (
                              <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 cursor-pointer shadow-lg"
            >
              {isLast ? "See my workspace" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
