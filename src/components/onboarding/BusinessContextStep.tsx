"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

export function BusinessContextStep() {
  const { businessContext, setBusinessContext, nextStep, prevStep, getIndustryConfig } =
    useOnboardingStore();

  const config = getIndustryConfig();

  const isValid =
    businessContext.businessName.trim() &&
    businessContext.businessDescription.trim() &&
    businessContext.location.trim();

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-border-light bg-card-bg text-foreground placeholder:text-text-tertiary focus:border-foreground focus:ring-2 focus:ring-foreground/10 outline-none transition-all text-[15px]";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-lg mx-auto"
    >
      <div className="mb-10">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-foreground transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <h2 className="text-[24px] font-bold text-foreground tracking-tight mb-2">
          Tell us about your business
        </h2>
        <p className="text-text-secondary text-[15px]">
          {config
            ? `We'll customize your ${config.label.toLowerCase()} workspace based on this.`
            : "We'll use this to personalize your workspace."}
        </p>
      </div>

      <div className="space-y-5">
        {/* Business Name */}
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">
            Business name
          </label>
          <input
            type="text"
            value={businessContext.businessName}
            onChange={(e) => setBusinessContext({ businessName: e.target.value })}
            placeholder={config?.namePlaceholder || "e.g. Glow Studio"}
            className={inputClass}
            autoFocus
          />
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">
            What does your business do?
          </label>
          <input
            type="text"
            value={businessContext.businessDescription}
            onChange={(e) => setBusinessContext({ businessDescription: e.target.value })}
            placeholder={config?.descriptionPlaceholder || "e.g. Mobile lash technician in Brisbane"}
            className={inputClass}
          />
          <p className="text-[11px] text-text-tertiary mt-1.5">
            One sentence is fine. This helps us understand your workflow.
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">
            Where are you based?
          </label>
          <input
            type="text"
            value={businessContext.location}
            onChange={(e) => setBusinessContext({ location: e.target.value })}
            placeholder="City or region"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-10">
        <Button size="lg" onClick={nextStep} disabled={!isValid} className="w-full">
          Continue <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}
