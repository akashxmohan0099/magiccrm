"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

export function IndustryStep() {
  const {
    selectedIndustry,
    selectedPersona,
    setSelectedIndustry,
    setSelectedPersona,
    nextStep,
    prevStep,
    applySmartDefaults,
  } = useOnboardingStore();

  const currentIndustry = INDUSTRY_CONFIGS.find((c) => c.id === selectedIndustry);
  const hasPersonas = currentIndustry?.personas && currentIndustry.personas.length > 0;

  // If industry is selected and it has personas, show persona picker
  const showPersonas = selectedIndustry && hasPersonas;

  const handleSelectIndustry = (id: string) => {
    setSelectedIndustry(id);
    setSelectedPersona("");
    // If "Something else" or no personas, don't wait for persona selection
    const industry = INDUSTRY_CONFIGS.find((c) => c.id === id);
    if (!industry?.personas || industry.personas.length === 0) {
      // No personas — proceed directly
    }
  };

  const handleSelectPersona = (id: string) => {
    setSelectedPersona(id);
  };

  const handleContinue = () => {
    applySmartDefaults();
    nextStep();
  };

  const handleBackToIndustries = () => {
    setSelectedIndustry("");
    setSelectedPersona("");
  };

  const canContinue = selectedIndustry && (!hasPersonas || selectedPersona);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <AnimatePresence mode="wait">
        {!showPersonas ? (
          // ── Level 1: Industry Selection ──
          <motion.div
            key="industries"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="text-center mb-10">
              <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-3">
                What kind of business do you run?
              </h2>
              <p className="text-text-secondary text-[15px] max-w-md mx-auto">
                Pick the closest match. We&apos;ll customize everything from here.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {INDUSTRY_CONFIGS.map((config, i) => (
                <motion.button
                  key={config.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  onClick={() => handleSelectIndustry(config.id)}
                  className={`relative text-left px-5 py-4 rounded-xl transition-all duration-200 cursor-pointer w-full ${
                    selectedIndustry === config.id
                      ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                      : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl leading-none mt-0.5">{config.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-[14px] tracking-tight mb-0.5 ${
                        selectedIndustry === config.id ? "text-white" : "text-foreground"
                      }`}>
                        {config.label}
                      </p>
                      <p className={`text-[12px] leading-snug ${
                        selectedIndustry === config.id ? "text-white/60" : "text-text-tertiary"
                      }`}>
                        {config.description}
                      </p>
                    </div>
                  </div>
                  {selectedIndustry === config.id && config.personas && config.personas.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 pt-2 border-t border-white/20 text-[11px] text-white/50"
                    >
                      Tap continue to pick your specific role →
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={!hasPersonas ? handleContinue : () => {}}
              disabled={!selectedIndustry}
              className="w-full"
            >
              {hasPersonas ? "Continue" : "Continue"} <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-center text-[12px] text-text-tertiary mt-3">
              You can change this later in settings.
            </p>
          </motion.div>
        ) : (
          // ── Level 2: Persona Selection ──
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={handleBackToIndustries}
              className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to industries
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface rounded-full text-[12px] font-medium text-text-secondary mb-4">
                <span>{currentIndustry?.emoji}</span>
                {currentIndustry?.label}
              </div>
              <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-3">
                What best describes you?
              </h2>
              <p className="text-text-secondary text-[15px] max-w-md mx-auto">
                This helps us use the right language and set the right defaults.
              </p>
            </div>

            <div className="space-y-2 mb-8">
              {currentIndustry?.personas?.map((persona, i) => (
                <motion.button
                  key={persona.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleSelectPersona(persona.id)}
                  className={`relative w-full text-left px-5 py-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                    selectedPersona === persona.id
                      ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                      : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-sm"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[14px] tracking-tight ${
                      selectedPersona === persona.id ? "text-white" : "text-foreground"
                    }`}>
                      {persona.label}
                    </p>
                    <p className={`text-[12px] mt-0.5 ${
                      selectedPersona === persona.id ? "text-white/60" : "text-text-tertiary"
                    }`}>
                      {persona.description}
                    </p>
                  </div>
                  {selectedPersona === persona.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedPersona}
              className="w-full"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-center text-[12px] text-text-tertiary mt-3">
              Don&apos;t see your exact role? Pick the closest match — you can customize everything next.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
