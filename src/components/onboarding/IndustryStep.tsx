"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";
import { INDUSTRY_CONFIGS } from "@/types/onboarding";

export function IndustryStep() {
  const { selectedIndustry, setSelectedIndustry, nextStep, applySmartDefaults } =
    useOnboardingStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedIndustry(id);
  };

  const handleContinue = () => {
    applySmartDefaults();
    nextStep();
  };

  const getEnabledModules = (industryId: string) => {
    const industry = INDUSTRY_CONFIGS.find(c => c.id === industryId);
    if (!industry) return [];
    const defaults = industry.smartDefaults;
    return Object.entries(defaults)
      .filter(([_, v]) => v === true)
      .map(([k]) => k);
  };

  const moduleNames: Record<string, string> = {
    manageCustomers: "Client Database",
    receiveInquiries: "Leads & Pipeline",
    communicateClients: "Communication",
    acceptBookings: "Bookings",
    sendInvoices: "Invoicing",
    manageProjects: "Projects",
    runMarketing: "Marketing",
    handleSupport: "Support",
    manageDocuments: "Documents",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[28px] font-bold text-foreground tracking-tight mb-3"
        >
          What kind of business do you run?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-[15px] max-w-md mx-auto"
        >
          We'll tailor every question, default setting, and feature recommendation to your industry.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {INDUSTRY_CONFIGS.map((config, i) => {
          const isSelected = selectedIndustry === config.id;
          const isHovered = hoveredId === config.id;

          return (
            <motion.div key={config.id} className="group/card relative">
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                onClick={() => handleSelect(config.id)}
                onMouseEnter={() => setHoveredId(config.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative text-left px-5 py-4 rounded-xl transition-all duration-200 cursor-pointer group w-full ${
                  isSelected
                    ? "bg-foreground text-white shadow-lg shadow-foreground/10 ring-1 ring-foreground"
                    : "bg-card-bg border border-border-light hover:border-foreground/20 hover:shadow-sm"
                }`}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-foreground" />
                  </motion.div>
                )}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-white text-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-sm"
                  >
                    {getEnabledModules(config.id).length} modules
                  </motion.div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{config.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-[14px] tracking-tight mb-0.5 ${
                      isSelected ? "text-white" : "text-foreground"
                    }`}>
                      {config.label}
                    </p>
                    <p className={`text-[12px] leading-snug ${
                      isSelected ? "text-white/60" : "text-text-tertiary"
                    }`}>
                      {config.description}
                    </p>
                  </div>
                </div>
              </motion.button>

              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-foreground text-white text-[11px] rounded-lg p-2 z-10 shadow-lg whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <p className="font-medium mb-1">Includes:</p>
                  <p className="text-white/70">
                    {getEnabledModules(config.id).slice(0, 3).map(m => moduleNames[m]).join(", ")}
                    {getEnabledModules(config.id).length > 3 ? "..." : ""}
                  </p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedIndustry}
          className="w-full"
        >
          Continue <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-center text-[12px] text-text-tertiary mt-3">
          This helps us pre-select the right features for you. You can change anything later.
        </p>
      </motion.div>
    </motion.div>
  );
}
