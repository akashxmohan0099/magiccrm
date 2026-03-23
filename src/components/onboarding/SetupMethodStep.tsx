"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, SlidersHorizontal } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Step 3: Setup Method Fork
 *
 * Lets the user choose between guided (discovery questions) or
 * self-serve (manual module picker) onboarding paths.
 */
export function SetupMethodStep() {
  const { setSetupMethod, nextStep, prevStep } = useOnboardingStore();

  const handleChoice = (method: "guided" | "self-serve") => {
    setSetupMethod(method);
    nextStep();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-xl mx-auto">
      {/* Back button */}
      <div className="pt-6 px-4">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full text-center"
        >
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
            How would you like to set up?
          </h2>
          <p className="text-[15px] text-text-tertiary mb-12">
            You can always change everything later.
          </p>

          {/* Two cards — guided is visually emphasised */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg mx-auto">
            {/* Card 1: Guided — hero card */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleChoice("guided")}
              className="relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-primary bg-primary/[0.04] hover:bg-primary/[0.08] shadow-[0_0_0_4px_rgba(52,211,153,0.08)] hover:shadow-[0_0_0_6px_rgba(52,211,153,0.12)] transition-all duration-200 cursor-pointer text-center"
            >
              {/* Recommended badge */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-[11px] font-bold rounded-full whitespace-nowrap tracking-wide uppercase">
                Recommended
              </span>

              <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground mb-1.5">
                  Answer a few questions
                </h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  We&apos;ll ask about your workflow and build the perfect setup for you
                </p>
              </div>
              <span className="text-[11px] font-medium text-primary mt-1">
                Takes about 30 seconds
              </span>
            </motion.button>

            {/* Card 2: Self-serve — subdued */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleChoice("self-serve")}
              className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border-light bg-card-bg hover:border-foreground/15 transition-all duration-150 cursor-pointer text-center opacity-75 hover:opacity-100"
            >
              <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6 text-text-tertiary" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground mb-1">
                  I&apos;ll pick myself
                </h3>
                <p className="text-[13px] text-text-tertiary leading-relaxed">
                  Browse all modules and choose what you need
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
