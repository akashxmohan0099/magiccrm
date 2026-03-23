"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check,
  Scissors, Wrench, Briefcase, Dumbbell, PenTool,
  UtensilsCrossed, GraduationCap, ShoppingBag, Layers,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

const INDUSTRY_ICONS: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
}> = {
  "beauty-wellness":       { icon: Scissors,         bg: "bg-pink-50",    color: "text-pink-500" },
  "trades-construction":   { icon: Wrench,           bg: "bg-amber-50",   color: "text-amber-600" },
  "professional-services": { icon: Briefcase,        bg: "bg-blue-50",    color: "text-blue-500" },
  "health-fitness":        { icon: Dumbbell,         bg: "bg-rose-50",    color: "text-rose-500" },
  "creative-services":     { icon: PenTool,          bg: "bg-violet-50",  color: "text-violet-500" },
  "hospitality-events":    { icon: UtensilsCrossed,  bg: "bg-orange-50",  color: "text-orange-500" },
  "education-coaching":    { icon: GraduationCap,    bg: "bg-emerald-50", color: "text-emerald-600" },
  "retail-ecommerce":      { icon: ShoppingBag,      bg: "bg-cyan-50",    color: "text-cyan-600" },
  "other":                 { icon: Layers,           bg: "bg-gray-50",    color: "text-gray-500" },
};

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
                const iconConfig = INDUSTRY_ICONS[config.id] || INDUSTRY_ICONS["other"];
                const IconComp = iconConfig.icon;
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
                    className={`relative text-left p-5 rounded-2xl transition-all duration-200 cursor-pointer w-full ${
                      isSelected
                        ? "bg-foreground text-white shadow-lg"
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected ? "bg-white/15" : iconConfig.bg
                    }`}>
                      <IconComp className={`w-5 h-5 ${isSelected ? "text-white" : iconConfig.color}`} />
                    </div>
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
                  ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
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
              {(() => {
                const iconConfig = INDUSTRY_ICONS[currentIndustry?.id || ""] || INDUSTRY_ICONS["other"];
                const IconComp = iconConfig.icon;
                return (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${iconConfig.bg}`}>
                    <IconComp className={`w-4 h-4 ${iconConfig.color}`} />
                    <span className="text-[12px] font-semibold text-foreground">{currentIndustry?.label}</span>
                  </div>
                );
              })()}
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
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                      isSelected
                        ? "bg-foreground text-white shadow-lg"
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
                  ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
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
