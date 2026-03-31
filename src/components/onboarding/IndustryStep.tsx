"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

export function IndustryStep() {
  const {
    selectedPersona,
    setSelectedPersona,
    businessContext,
    setBusinessContext,
    nextStep,
    prevStep,
    applySmartDefaults,
  } = useOnboardingStore();

  const [businessName, setBusinessName] = useState(businessContext.businessName);

  const beautyIndustry = INDUSTRY_CONFIGS[0]; // Only beauty-wellness exists
  const personas = beautyIndustry?.personas ?? [];

  const canContinue = selectedPersona && businessName.trim().length > 0;

  const handleContinue = () => {
    setBusinessContext({
      ...businessContext,
      businessName: businessName.trim(),
      industry: beautyIndustry?.label ?? "Beauty & Wellness",
    });
    applySmartDefaults();
    nextStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6"
    >
      <button
        onClick={prevStep}
        className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Persona Selection */}
      <div className="text-center mb-8">
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
          What best describes you?
        </h2>
        <p className="text-text-secondary text-[15px]">
          We&apos;ll set up your workspace with the right defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {personas.map((persona, i) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedPersona(persona.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                isSelected
                  ? "bg-foreground text-background shadow-lg"
                  : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-md"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm tracking-tight ${
                  isSelected ? "text-white" : "text-foreground"
                }`}>
                  {persona.label}
                </p>
                {persona.description && (
                  <p className={`text-xs mt-0.5 ${
                    isSelected ? "text-white/60" : "text-text-tertiary"
                  }`}>
                    {persona.description}
                  </p>
                )}
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

      {/* Business Name */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-2">
          What&apos;s your business called?
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Glow Studio, The Lash Lab"
          className="w-full px-4 py-3.5 bg-card-bg border border-border-light rounded-2xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
          onKeyDown={(e) => e.key === "Enter" && canContinue && handleContinue()}
        />
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          canContinue
            ? "bg-foreground text-background hover:opacity-90 cursor-pointer shadow-lg"
            : "bg-border-light text-text-tertiary cursor-not-allowed"
        }`}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
