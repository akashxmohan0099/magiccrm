"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check,
  Scissors, Paintbrush, Eye, Sparkles, Palette, Building2,
  PenTool, Flower2, Slash,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS, type PersonaCategory } from "@/types/onboarding";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors, Paintbrush, Eye, Sparkles, Palette, Building2, PenTool, Flower2, Blade: Slash,
};

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const beautyIndustry = INDUSTRY_CONFIGS[0];
  const categories = beautyIndustry?.categories ?? [];
  const allPersonas = beautyIndustry?.personas ?? [];

  const categoryPersonas = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) return [];
    return allPersonas.filter((p) => cat.personaIds.includes(p.id));
  }, [selectedCategory, categories, allPersonas]);

  // Auto-advance for single-persona categories
  const handleCategorySelect = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    if (cat.personaIds.length === 1) {
      // Single persona — auto-select it
      setSelectedPersona(cat.personaIds[0]);
      setSelectedCategory(catId);
    } else {
      setSelectedCategory(catId);
      setSelectedPersona("");
    }
  };

  const handleBack = () => {
    if (selectedPersona && selectedCategory) {
      // If single-persona category, go back to categories
      const cat = categories.find((c) => c.id === selectedCategory);
      if (cat && cat.personaIds.length === 1) {
        setSelectedCategory(null);
        setSelectedPersona("");
        return;
      }
      // Multi-persona category — go back to persona list
      setSelectedPersona("");
      return;
    }
    if (selectedCategory) {
      setSelectedCategory(null);
      return;
    }
    prevStep();
  };

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

  // Show business name input when persona is selected
  const showBusinessName = !!selectedPersona;
  // Show persona picker when category is selected and has multiple personas
  const showPersonas = selectedCategory && categoryPersonas.length > 1 && !selectedPersona;
  // Show category picker when nothing selected
  const showCategories = !selectedCategory;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 px-6"
    >
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <AnimatePresence mode="wait">
        {/* ── Step 1A: Category Selection ── */}
        {showCategories && (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                What do you specialise in?
              </h2>
              <p className="text-text-secondary text-[15px]">
                Pick the category that best describes your work.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat, i) => {
                const IconComp = CATEGORY_ICONS[cat.icon] || Sparkles;
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="text-center px-4 py-6 rounded-2xl transition-all duration-200 cursor-pointer bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-md"
                  >
                    <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center mx-auto mb-3">
                      <IconComp className="w-5 h-5 text-text-secondary" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{cat.label}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {cat.personaIds.length === 1 ? "1 type" : `${cat.personaIds.length} types`}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Step 1B: Persona Selection (multi-persona categories) ── */}
        {showPersonas && (
          <motion.div
            key="personas"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                Which one are you?
              </h2>
              <p className="text-text-secondary text-[15px]">
                Pick the one that best describes your work.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryPersonas.map((persona, i) => (
                <motion.button
                  key={persona.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPersona(persona.id)}
                  className="w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-md"
                >
                  <p className="font-semibold text-sm text-foreground">{persona.label}</p>
                  {persona.description && (
                    <p className="text-xs text-text-tertiary mt-0.5">{persona.description}</p>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 1C: Business Name (after persona selected) ── */}
        {showBusinessName && (
          <motion.div
            key="business-name"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {/* Show selected persona badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-light rounded-full text-xs font-medium text-foreground">
                <Check className="w-3 h-3 text-primary" />
                {allPersonas.find((p) => p.id === selectedPersona)?.label}
              </span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
                What&apos;s your business called?
              </h2>
              <p className="text-text-secondary text-[15px]">
                This is what your clients will see.
              </p>
            </div>

            <div className="mb-8">
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={allPersonas.find((p) => p.id === selectedPersona)?.namePlaceholder || "e.g. Glow Studio"}
                className="w-full px-4 py-3.5 bg-card-bg border border-border-light rounded-2xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                onKeyDown={(e) => e.key === "Enter" && canContinue && handleContinue()}
                autoFocus
              />
            </div>

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
        )}
      </AnimatePresence>
    </motion.div>
  );
}
