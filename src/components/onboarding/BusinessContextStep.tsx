"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRIES } from "@/types/onboarding";

export function BusinessContextStep() {
  const { businessContext, setBusinessContext, nextStep } = useOnboardingStore();
  const [industryOpen, setIndustryOpen] = useState(false);

  const isValid =
    businessContext.businessName.trim() &&
    businessContext.businessDescription.trim() &&
    businessContext.industry &&
    (businessContext.industry !== "Other" || businessContext.industryOther.trim()) &&
    businessContext.location.trim();

  const displayIndustry = businessContext.industry === "Other" && businessContext.industryOther
    ? businessContext.industryOther
    : businessContext.industry;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-lg mx-auto"
    >
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Tell us about your business
        </h2>
        <p className="text-text-secondary">
          We&apos;ll use this to personalize your CRM.
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Business name
          </label>
          <input
            type="text"
            value={businessContext.businessName}
            onChange={(e) => setBusinessContext({ businessName: e.target.value })}
            placeholder="Your business name"
            className="w-full px-4 py-3 rounded-xl border border-border-warm bg-card-bg text-foreground placeholder:text-text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
          />
        </div>

        {/* Business Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            What does your business do?
          </label>
          <input
            type="text"
            value={businessContext.businessDescription}
            onChange={(e) => setBusinessContext({ businessDescription: e.target.value })}
            placeholder="We run a mobile dog grooming service"
            className="w-full px-4 py-3 rounded-xl border border-border-warm bg-card-bg text-foreground placeholder:text-text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
          />
        </div>

        {/* Industry Selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Industry
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIndustryOpen(!industryOpen)}
              className={`w-full px-4 py-3 rounded-xl border bg-card-bg text-left flex items-center justify-between transition-all cursor-pointer ${
                industryOpen
                  ? "border-brand ring-2 ring-brand/20"
                  : "border-border-warm hover:border-[#D4CDB8]"
              }`}
            >
              <span className={displayIndustry ? "text-foreground" : "text-text-secondary/50"}>
                {displayIndustry || "Select your industry"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-secondary transition-transform ${
                  industryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {industryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute z-20 w-full mt-1 bg-card-bg border border-border-warm rounded-xl shadow-lg overflow-hidden"
              >
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => {
                      setBusinessContext({ industry });
                      if (industry !== "Other") {
                        setBusinessContext({ industryOther: "" });
                      }
                      setIndustryOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      businessContext.industry === industry
                        ? "bg-brand-light text-brand font-medium"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Other free text */}
          {businessContext.industry === "Other" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              <input
                type="text"
                value={businessContext.industryOther}
                onChange={(e) => setBusinessContext({ industryOther: e.target.value })}
                placeholder="Tell us your industry"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-border-warm bg-card-bg text-foreground placeholder:text-text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              />
            </motion.div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Where are you based?
          </label>
          <input
            type="text"
            value={businessContext.location}
            onChange={(e) => setBusinessContext({ location: e.target.value })}
            placeholder="City or region"
            className="w-full px-4 py-3 rounded-xl border border-border-warm bg-card-bg text-foreground placeholder:text-text-secondary/50 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="mt-10">
        <Button size="lg" onClick={nextStep} disabled={!isValid} className="w-full">
          Next <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}
