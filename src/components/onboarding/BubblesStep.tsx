"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { FEATURE_CATEGORIES, NeedsAssessment } from "@/types/onboarding";
import { getAddonModules } from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";

interface Bubble {
  id: string;
  label: string;
  // Which modules this bubble activates
  activates: string[];
  // Which needs keys this sets
  needsKeys: (keyof NeedsAssessment)[];
  // Color theme
  color: string;
  // Size: lg = important/common, md = normal, sm = niche
  size: "lg" | "md" | "sm";
}

// All the bubbles — these represent daily tasks/activities, not modules
const ALL_BUBBLES: Bubble[] = [
  // Client/people management (always-on but confirms the need)
  { id: "manage-clients", label: "I manage clients", activates: ["client-database"], needsKeys: ["manageCustomers"], color: "bg-blue-100 text-blue-700 border-blue-200", size: "lg" },
  { id: "track-leads", label: "I get new inquiries", activates: ["leads-pipeline"], needsKeys: ["receiveInquiries"], color: "bg-indigo-100 text-indigo-700 border-indigo-200", size: "md" },

  // Scheduling
  { id: "book-appointments", label: "Clients book with me", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], color: "bg-emerald-100 text-emerald-700 border-emerald-200", size: "lg" },
  { id: "manage-calendar", label: "I manage a calendar", activates: ["bookings-calendar"], needsKeys: ["acceptBookings"], color: "bg-emerald-50 text-emerald-600 border-emerald-200", size: "md" },
  { id: "send-reminders", label: "I send reminders", activates: ["bookings-calendar", "automations"], needsKeys: ["acceptBookings"], color: "bg-green-100 text-green-700 border-green-200", size: "sm" },

  // Billing
  { id: "send-invoices", label: "I send invoices", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "bg-amber-100 text-amber-700 border-amber-200", size: "lg" },
  { id: "send-quotes", label: "I send quotes", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "bg-amber-50 text-amber-600 border-amber-200", size: "md" },
  { id: "track-payments", label: "I track payments", activates: ["quotes-invoicing"], needsKeys: ["sendInvoices"], color: "bg-yellow-100 text-yellow-700 border-yellow-200", size: "sm" },

  // Communication
  { id: "message-clients", label: "I message clients", activates: ["communication"], needsKeys: ["communicateClients"], color: "bg-violet-100 text-violet-700 border-violet-200", size: "lg" },
  { id: "email-clients", label: "I email clients", activates: ["communication"], needsKeys: ["communicateClients"], color: "bg-violet-50 text-violet-600 border-violet-200", size: "sm" },
  { id: "sms-clients", label: "I text/SMS clients", activates: ["communication"], needsKeys: ["communicateClients"], color: "bg-purple-100 text-purple-700 border-purple-200", size: "sm" },

  // Projects
  { id: "manage-projects", label: "I manage projects", activates: ["jobs-projects"], needsKeys: ["manageProjects"], color: "bg-orange-100 text-orange-700 border-orange-200", size: "lg" },
  { id: "track-tasks", label: "I track tasks & deadlines", activates: ["jobs-projects"], needsKeys: ["manageProjects"], color: "bg-orange-50 text-orange-600 border-orange-200", size: "md" },
  { id: "track-time", label: "I track time on jobs", activates: ["jobs-projects"], needsKeys: ["manageProjects"], color: "bg-red-50 text-red-600 border-red-200", size: "sm" },

  // Products
  { id: "sell-products", label: "I sell products", activates: ["products"], needsKeys: [], color: "bg-cyan-100 text-cyan-700 border-cyan-200", size: "md" },
  { id: "sell-services", label: "I sell services", activates: ["products"], needsKeys: [], color: "bg-cyan-50 text-cyan-600 border-cyan-200", size: "md" },

  // Marketing
  { id: "run-promotions", label: "I run promotions", activates: ["marketing"], needsKeys: ["runMarketing"], color: "bg-pink-100 text-pink-700 border-pink-200", size: "md" },
  { id: "collect-reviews", label: "I collect reviews", activates: ["marketing"], needsKeys: ["runMarketing"], color: "bg-pink-50 text-pink-600 border-pink-200", size: "sm" },
  { id: "social-media", label: "I post on social media", activates: ["marketing"], needsKeys: ["runMarketing"], color: "bg-rose-100 text-rose-700 border-rose-200", size: "sm" },

  // Team
  { id: "have-team", label: "I have a team", activates: ["team"], needsKeys: [], color: "bg-rose-50 text-rose-600 border-rose-200", size: "md" },
  { id: "manage-staff", label: "I manage staff schedules", activates: ["team"], needsKeys: [], color: "bg-red-100 text-red-700 border-red-200", size: "sm" },

  // Automations
  { id: "automate-tasks", label: "I want to automate stuff", activates: ["automations"], needsKeys: [], color: "bg-yellow-50 text-yellow-700 border-yellow-200", size: "md" },
  { id: "follow-ups", label: "I do follow-ups", activates: ["automations", "communication"], needsKeys: ["communicateClients"], color: "bg-lime-100 text-lime-700 border-lime-200", size: "sm" },

  // Reporting
  { id: "track-revenue", label: "I track revenue", activates: ["reporting"], needsKeys: [], color: "bg-gray-100 text-gray-700 border-gray-200", size: "sm" },
  { id: "want-dashboards", label: "I want dashboards", activates: ["reporting"], needsKeys: [], color: "bg-slate-100 text-slate-700 border-slate-200", size: "sm" },

  // Niche / persona-specific (these appear shuffled in)
  { id: "take-deposits", label: "I take deposits", activates: ["quotes-invoicing", "bookings-calendar"], needsKeys: ["sendInvoices", "acceptBookings"], color: "bg-amber-50 text-amber-600 border-amber-200", size: "sm" },
  { id: "contracts", label: "I send contracts", activates: ["documents"], needsKeys: [], color: "bg-stone-100 text-stone-700 border-stone-200", size: "sm" },
  { id: "client-notes", label: "I keep client notes", activates: ["client-database"], needsKeys: ["manageCustomers"], color: "bg-blue-50 text-blue-600 border-blue-200", size: "sm" },
  { id: "onsite-work", label: "I work on-site", activates: ["jobs-projects", "bookings-calendar"], needsKeys: ["manageProjects", "acceptBookings"], color: "bg-orange-50 text-orange-600 border-orange-200", size: "sm" },
];

// Shuffle array deterministically based on a seed
function shuffleWithSeed(arr: Bubble[], seed: number): Bubble[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((seed * (i + 1)) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function BubblesStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const setFeatureSelections = useOnboardingStore((s) => s.setFeatureSelections);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Shuffle bubbles but keep large ones more toward the center
  const bubbles = useMemo(() => {
    const large = ALL_BUBBLES.filter((b) => b.size === "lg");
    const medium = ALL_BUBBLES.filter((b) => b.size === "md");
    const small = ALL_BUBBLES.filter((b) => b.size === "sm");
    // Interleave: large first, then medium, then small — but shuffled within each group
    const shuffledLarge = shuffleWithSeed(large, 42);
    const shuffledMedium = shuffleWithSeed(medium, 73);
    const shuffledSmall = shuffleWithSeed(small, 17);

    const result: Bubble[] = [];
    let li = 0, mi = 0, si = 0;
    // Pattern: L M S M L S M S L M S S
    const pattern = ["lg", "md", "sm", "md", "lg", "sm", "md", "sm", "lg", "md", "sm", "sm"];
    let pi = 0;
    while (li < shuffledLarge.length || mi < shuffledMedium.length || si < shuffledSmall.length) {
      const pick = pattern[pi % pattern.length];
      pi++;
      if (pick === "lg" && li < shuffledLarge.length) result.push(shuffledLarge[li++]);
      else if (pick === "md" && mi < shuffledMedium.length) result.push(shuffledMedium[mi++]);
      else if (pick === "sm" && si < shuffledSmall.length) result.push(shuffledSmall[si++]);
      else if (li < shuffledLarge.length) result.push(shuffledLarge[li++]);
      else if (mi < shuffledMedium.length) result.push(shuffledMedium[mi++]);
      else if (si < shuffledSmall.length) result.push(shuffledSmall[si++]);
    }
    return result;
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleContinue = () => {
    // Collect all activated modules and needs from selected bubbles
    const activatedModules = new Set<string>();
    const activatedNeeds = new Set<keyof NeedsAssessment>();

    for (const bubble of ALL_BUBBLES) {
      if (selected.has(bubble.id)) {
        for (const mod of bubble.activates) activatedModules.add(mod);
        for (const need of bubble.needsKeys) activatedNeeds.add(need);
      }
    }

    // Always-on needs
    activatedNeeds.add("manageCustomers");
    activatedNeeds.add("receiveInquiries");
    activatedNeeds.add("communicateClients");
    activatedNeeds.add("sendInvoices");

    // Set all needs
    for (const need of activatedNeeds) {
      setNeed(need, true);
    }

    // Enable ALL features for all FEATURE_CATEGORIES
    const MODULE_TO_NEED: Record<string, string> = {
      "client-database": "manageCustomers", "leads-pipeline": "receiveInquiries",
      "communication": "communicateClients", "bookings-calendar": "acceptBookings",
      "quotes-invoicing": "sendInvoices", "jobs-projects": "manageProjects",
      "marketing": "runMarketing",
    };
    const NEED_TO_MODULE = Object.fromEntries(Object.entries(MODULE_TO_NEED).map(([m, n]) => [n, m]));

    for (const cat of FEATURE_CATEGORIES) {
      const moduleId = NEED_TO_MODULE[cat.id];
      const allOn = cat.features.map((f) => ({
        id: f.id, label: f.label, description: f.description, selected: true,
      }));
      setFeatureSelections(cat.id, allOn);
      if (moduleId) setFeatureSelections(moduleId, allOn);
    }

    // Enable add-ons that were activated
    const addonModules = getAddonModules();
    const addonIds = new Set(addonModules.map((m) => m.id));
    const addonsStore = useAddonsStore.getState();
    for (const modId of activatedModules) {
      if (addonIds.has(modId)) {
        const def = addonModules.find((m) => m.id === modId);
        if (def && !addonsStore.isAddonEnabled(modId)) {
          addonsStore.enableAddon(modId, def.name);
        }
      }
    }

    nextStep();
  };

  const sizeClasses = {
    lg: "px-6 py-3 text-[15px] font-semibold",
    md: "px-5 py-2.5 text-[14px] font-medium",
    sm: "px-4 py-2 text-[13px] font-medium",
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="pt-8 px-6 lg:px-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[28px] font-bold text-foreground tracking-tight mb-2"
        >
          What do you do day-to-day?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[15px] text-text-secondary mb-2"
        >
          Tap everything that applies. We&apos;ll build your workspace around it.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[13px] text-text-tertiary"
        >
          {selected.size === 0 ? "Nothing selected yet" : `${selected.size} selected`}
        </motion.p>
      </div>

      {/* Bubbles */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-20 py-8">
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
          <AnimatePresence>
            {bubbles.map((bubble, i) => {
              const isSelected = selected.has(bubble.id);
              return (
                <motion.button
                  key={bubble.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 + i * 0.02, type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggle(bubble.id)}
                  className={`rounded-full border-2 transition-all duration-200 cursor-pointer select-none ${sizeClasses[bubble.size]} ${
                    isSelected
                      ? `${bubble.color} shadow-md`
                      : "bg-card-bg border-border-light text-text-secondary hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {bubble.label}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Continue */}
      <div className="px-6 lg:px-20 pb-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinue}
            disabled={selected.size < 3}
            className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              selected.size >= 3
                ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
                : "bg-border-light text-text-tertiary cursor-not-allowed"
            }`}
          >
            {selected.size < 3 ? `Pick at least ${3 - selected.size} more` : "Continue"}
            {selected.size >= 3 && <ArrowRight className="w-4 h-4" />}
          </button>
          <button
            onClick={prevStep}
            className="w-full mt-3 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer text-center"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
