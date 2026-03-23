"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
  const showPersonas = selectedIndustry && hasPersonas;

  const handleSelectIndustry = (id: string) => {
    setSelectedIndustry(id);
    setSelectedPersona("");
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
          <motion.div
            key="industries"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="text-center mb-10">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                What kind of business do you run?
              </h2>
              <p className="text-text-secondary text-[15px]">
                Pick the closest match. We&apos;ll customize everything from here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
              {INDUSTRY_CONFIGS.map((config, i) => {
                const isSelected = selectedIndustry === config.id;
                return (
                  <motion.button
                    key={config.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.03 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectIndustry(config.id)}
                    className={`relative text-left p-5 rounded-2xl transition-all duration-200 cursor-pointer w-full group ${
                      isSelected
                        ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                        : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-foreground" />
                      </motion.div>
                    )}
                    <span className="text-[24px] block mb-2.5">{config.emoji}</span>
                    <p className={`font-semibold text-[14px] tracking-tight mb-1 ${
                      isSelected ? "text-white" : "text-foreground"
                    }`}>
                      {config.label}
                    </p>
                    <p className={`text-[12px] leading-relaxed ${
                      isSelected ? "text-white/60" : "text-text-tertiary"
                    }`}>
                      {config.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                canContinue
                  ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg shadow-foreground/10"
                  : "bg-border-light text-text-tertiary cursor-not-allowed"
              }`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleBackToIndustries}
              className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface rounded-full mb-4">
                <span className="text-[16px]">{currentIndustry?.emoji}</span>
                <span className="text-[12px] font-medium text-text-secondary">{currentIndustry?.label}</span>
              </div>
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                What best describes you?
              </h2>
              <p className="text-text-secondary text-[15px]">
                This helps us set the right defaults and vocabulary.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {currentIndustry?.personas?.map((persona, i) => {
                const isSelected = selectedPersona === persona.id;
                return (
                  <motion.button
                    key={persona.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectPersona(persona.id)}
                    className={`w-full text-left px-5 py-4.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? "bg-foreground text-white shadow-lg shadow-foreground/10"
                        : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-md"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-[14px] tracking-tight ${
                        isSelected ? "text-white" : "text-foreground"
                      }`}>
                        {persona.label}
                      </p>
                      <p className={`text-[12px] mt-0.5 ${
                        isSelected ? "text-white/60" : "text-text-tertiary"
                      }`}>
                        {persona.description}
                      </p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 text-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedPersona}
              className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                selectedPersona
                  ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg shadow-foreground/10"
                  : "bg-border-light text-text-tertiary cursor-not-allowed"
              }`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
