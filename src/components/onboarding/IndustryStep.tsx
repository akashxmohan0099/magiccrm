"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check,
  Sparkles, Wrench, Briefcase, Heart, Palette,
  UtensilsCrossed, GraduationCap, ShoppingBag, Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "beauty-wellness": Sparkles,
  "trades-construction": Wrench,
  "professional-services": Briefcase,
  "health-fitness": Heart,
  "creative-services": Palette,
  "hospitality-events": UtensilsCrossed,
  "education-coaching": GraduationCap,
  "retail-ecommerce": ShoppingBag,
  "other": Rocket,
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
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-2">
                What kind of business do you run?
              </h2>
              <p className="text-text-secondary text-[15px]">
                Pick the closest match. We&apos;ll customize everything from here.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {INDUSTRY_CONFIGS.map((config, i) => {
                const IconComp = INDUSTRY_ICONS[config.id];
                const isSelected = selectedIndustry === config.id;
                return (
                  <motion.button
                    key={config.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.03 }}
                    onClick={() => handleSelectIndustry(config.id)}
                    className={`relative text-left p-5 rounded-3xl transition-all duration-200 cursor-pointer w-full ${
                      isSelected
                        ? "bg-primary-muted border-2 border-primary"
                        : "bg-card-bg border border-border-light hover:border-foreground/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? "bg-primary" : "bg-surface"
                        }`}
                      >
                        {IconComp && (
                          <IconComp
                            className={`w-4 h-4 ${isSelected ? "text-foreground" : "text-text-secondary"}`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] tracking-tight mb-0.5 text-foreground">
                          {config.label}
                        </p>
                        <p className="text-[11px] leading-snug text-text-tertiary">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full"
            >
              Continue
            </Button>
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
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-2">
                What best describes you?
              </h2>
              <p className="text-text-secondary text-[15px]">
                This helps us set the right defaults.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {currentIndustry?.personas?.map((persona, i) => {
                const isSelected = selectedPersona === persona.id;
                return (
                  <motion.button
                    key={persona.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectPersona(persona.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? "bg-primary-muted border-2 border-primary"
                        : "bg-card-bg border border-border-light hover:border-foreground/15"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[14px] tracking-tight text-foreground">
                        {persona.label}
                      </p>
                      <p className="text-[12px] mt-0.5 text-text-tertiary">
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

            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedPersona}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
