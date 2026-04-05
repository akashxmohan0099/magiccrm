"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt,
  Megaphone, MessageCircle,
  Zap, BarChart3, ArrowRight, UsersRound,
  FileText, Check,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { useVocabulary } from "@/hooks/useVocabulary";
import {
  MODULE_REGISTRY,
  ALWAYS_ON_MODULES,
  computeEnabledModuleIds,
  getModuleDisplayName,
} from "@/lib/module-registry";

// ── Module display config ──

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "client-database": Users,
  "leads-pipeline": Inbox,
  "communication": MessageCircle,
  "bookings-calendar": Calendar,
  "quotes-invoicing": Receipt,
  "marketing": Megaphone,
  "team": UsersRound,
  "automations": Zap,
  "reporting": BarChart3,
  "documents": FileText,
};

const MODULE_COLORS: Record<string, { bg: string; text: string; accent: string; gradient: string }> = {
  "client-database": { bg: "bg-blue-500/10", text: "text-blue-500", accent: "#3B82F6", gradient: "from-blue-50 to-blue-100/50" },
  "leads-pipeline": { bg: "bg-indigo-500/10", text: "text-indigo-500", accent: "#6366F1", gradient: "from-indigo-50 to-indigo-100/50" },
  "communication": { bg: "bg-violet-500/10", text: "text-violet-500", accent: "#8B5CF6", gradient: "from-violet-50 to-violet-100/50" },
  "bookings-calendar": { bg: "bg-emerald-500/10", text: "text-emerald-600", accent: "#10B981", gradient: "from-emerald-50 to-emerald-100/50" },
  "quotes-invoicing": { bg: "bg-amber-500/10", text: "text-amber-600", accent: "#F59E0B", gradient: "from-amber-50 to-amber-100/50" },
  "marketing": { bg: "bg-pink-500/10", text: "text-pink-500", accent: "#EC4899", gradient: "from-pink-50 to-pink-100/50" },
  "team": { bg: "bg-rose-500/10", text: "text-rose-500", accent: "#F43F5E", gradient: "from-rose-50 to-rose-100/50" },
  "automations": { bg: "bg-yellow-500/10", text: "text-yellow-600", accent: "#EAB308", gradient: "from-yellow-50 to-yellow-100/50" },
  "reporting": { bg: "bg-gray-500/10", text: "text-gray-600", accent: "#6B7280", gradient: "from-gray-50 to-gray-100/50" },
  "documents": { bg: "bg-violet-500/10", text: "text-violet-500", accent: "#8B5CF6", gradient: "from-violet-50 to-violet-100/50" },
};

// ── Reason mapping: chip ID → human-readable reason ──

const CHIP_REASONS: Record<string, string> = {
  "op-team": "you have a team",
  "inquire-first": "brides and event clients inquire before booking",
  "contracts": "your clients sign contracts",
  "newsletters": "you want to send newsletters",
  "deposits": "you collect deposits",
  "proposals": "you send branded proposals",
  "online-payments": "you want online payments",
  "bridal-wedding": "you do bridal and wedding work",
  "group-bookings": "you do group bookings",
  "trials": "you do trials before events",
  "client-preferences": "you track client preferences",
  "regular-clients": "you see regular clients",
  "online-booking": "you want an online booking page",
  "long-lead": "clients book 6–12 months in advance",
  "referrals": "your clients come from referrals",
  "vendor-referrals": "you get referrals from planners and vendors",
  "lessons": "you teach lessons or workshops",
  "op-mobile": "you travel to clients and venues",
};

// ── Which chips trigger which modules ──

const MODULE_TRIGGER_CHIPS: Record<string, string[]> = {
  "leads-pipeline": ["inquire-first"],
  "team": ["op-team"],
  "marketing": ["newsletters"],
};

// ── Always-on module reasons ──

const ALWAYS_ON_REASONS: Record<string, string> = {
  "client-database": "Every business needs to manage their clients",
  "bookings-calendar": "Your calendar and appointments, always ready",
  "communication": "One inbox for all your client conversations",
  "quotes-invoicing": "Invoicing and payments, built in",
  "automations": "Reminders and follow-ups run automatically",
  "reporting": "Track how your business is performing",
};

// ── Feature highlights based on chip selections ──

function getFeatureHighlights(chipSelections: Set<string>): { moduleId: string; feature: string }[] {
  const highlights: { moduleId: string; feature: string }[] = [];

  if (chipSelections.has("deposits")) {
    highlights.push({ moduleId: "quotes-invoicing", feature: "Deposit tracking enabled" });
  }
  if (chipSelections.has("proposals")) {
    highlights.push({ moduleId: "quotes-invoicing", feature: "Proposal builder enabled" });
  }
  if (chipSelections.has("online-payments")) {
    highlights.push({ moduleId: "quotes-invoicing", feature: "Online payments ready" });
  }
  if (chipSelections.has("online-booking")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "Public booking page enabled" });
  }
  if (chipSelections.has("bridal-wedding")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "Event workflow configured" });
  }
  if (chipSelections.has("group-bookings")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "Group booking support" });
  }
  if (chipSelections.has("trials")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "Trial-to-event booking flow" });
  }
  if (chipSelections.has("contracts")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "Contract signing on booking" });
  }
  if (chipSelections.has("client-preferences")) {
    highlights.push({ moduleId: "client-database", feature: "Custom fields: shade, skin type, allergies" });
  }
  if (chipSelections.has("regular-clients")) {
    highlights.push({ moduleId: "client-database", feature: "Rebooking prompts enabled" });
  }
  if (chipSelections.has("social-dms")) {
    highlights.push({ moduleId: "communication", feature: "Instagram & WhatsApp connected" });
  }
  if (chipSelections.has("long-lead")) {
    highlights.push({ moduleId: "bookings-calendar", feature: "12-month calendar view" });
  }
  if (chipSelections.has("bridal-wedding") || chipSelections.has("group-bookings")) {
    highlights.push({ moduleId: "automations", feature: "Post-event follow-ups enabled" });
  }

  return highlights;
}

export function SummaryStep({ workspaceId: _workspaceId }: { workspaceId: string | null }) {
  const {
    businessContext, prevStep, nextStep, needs,
    setDiscoveryAnswer,
  } = useOnboardingStore();
  const chipSelections = useOnboardingStore((s) => s.chipSelections);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);
  const vocab = useVocabulary();
  const [launching, setLaunching] = useState(false);

  const chipSet = useMemo(() => new Set(chipSelections), [chipSelections]);

  const { enabledModules, enabledModuleIds } = useMemo(() => {
    const enabled = computeEnabledModuleIds(needs, discoveryAnswers);
    const allModules = MODULE_REGISTRY.filter(
      (m) => enabled.has(m.id) && (m.status ?? "production") === "production"
    );
    return {
      enabledModules: allModules,
      enabledModuleIds: enabled,
    };
  }, [needs, discoveryAnswers]);

  const featureHighlights = useMemo(() => getFeatureHighlights(chipSet), [chipSet]);

  // Build reason for each module
  const getModuleReason = (moduleId: string): string => {
    // Always-on modules
    if (ALWAYS_ON_MODULES.has(moduleId)) {
      return ALWAYS_ON_REASONS[moduleId] || "Included in every workspace";
    }

    // Chip-triggered modules
    const triggerChips = MODULE_TRIGGER_CHIPS[moduleId];
    if (triggerChips) {
      for (const chipId of triggerChips) {
        if (chipSet.has(chipId) && CHIP_REASONS[chipId]) {
          return `Because ${CHIP_REASONS[chipId]}`;
        }
      }
    }

    return "Enabled based on your selections";
  };

  const getModuleHighlights = (moduleId: string): string[] => {
    return featureHighlights
      .filter((h) => h.moduleId === moduleId)
      .map((h) => h.feature);
  };

  const handleLaunch = () => {
    if (launching) return;
    setLaunching(true);
    nextStep();
  };

  // Split into always-on and chosen modules
  const alwaysOnModules = enabledModules.filter((m) => ALWAYS_ON_MODULES.has(m.id));
  const chosenModules = enabledModules.filter((m) => !ALWAYS_ON_MODULES.has(m.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
            Here&apos;s what we&apos;ve set up for you
          </h2>
          <p className="text-[15px] text-text-secondary">
            Based on your answers, {businessContext.businessName || "your workspace"} gets these tools
          </p>
        </motion.div>

        {/* Chosen modules — color-tinted cards in grid */}
        {chosenModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">
              Configured for you
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chosenModules.map((mod, i) => {
                const Icon = MODULE_ICONS[mod.id] || Zap;
                const colors = MODULE_COLORS[mod.id] || { bg: "bg-gray-100", text: "text-gray-500", accent: "#6B7280", gradient: "from-gray-50 to-gray-100/50" };
                const reason = getModuleReason(mod.id);
                const highlights = getModuleHighlights(mod.id);

                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className={`relative p-5 rounded-2xl bg-gradient-to-br ${colors.gradient} overflow-hidden`}
                    style={{ border: `1.5px solid ${colors.accent}20` }}
                  >
                    {/* Accent corner glow */}
                    <div
                      className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl"
                      style={{ backgroundColor: colors.accent }}
                    />

                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                        style={{ backgroundColor: `${colors.accent}15`, border: `1px solid ${colors.accent}20` }}
                      >
                        <span style={{ color: colors.accent }}><Icon className="w-6 h-6" /></span>
                      </div>
                      <p className="text-[16px] font-bold text-foreground mb-1">
                        {getModuleDisplayName(mod, vocab)}
                      </p>
                      <p className="text-[13px] text-text-secondary leading-relaxed">
                        {reason}
                      </p>
                      {highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {highlights.map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: `${colors.accent}12`, color: colors.accent }}
                            >
                              <Check className="w-3 h-3" /> {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Always-on modules — compact grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">
            Always included
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {alwaysOnModules.map((mod, i) => {
              const Icon = MODULE_ICONS[mod.id] || Zap;
              const colors = MODULE_COLORS[mod.id] || { bg: "bg-gray-100", text: "text-gray-500", accent: "#6B7280", gradient: "" };
              const highlights = getModuleHighlights(mod.id);

              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.04 }}
                  className="p-4 rounded-2xl bg-card-bg border border-border-light text-center"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5"
                    style={{ backgroundColor: `${colors.accent}10` }}
                  >
                    <span style={{ color: colors.accent }}><Icon className="w-5 h-5" /></span>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground mb-0.5">
                    {getModuleDisplayName(mod, vocab)}
                  </p>
                  <p className="text-[11px] text-text-tertiary leading-snug">
                    {ALWAYS_ON_REASONS[mod.id] || "Included in every workspace"}
                  </p>
                  {highlights.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {highlights.map((h) => (
                        <span
                          key={h}
                          className="inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium"
                        >
                          <Check className="w-2.5 h-2.5" /> {h}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[12px] text-text-tertiary mb-8"
        >
          You can add more modules, change settings, and customise everything from your dashboard.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="max-w-md mx-auto text-center"
        >
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full py-4 bg-foreground text-background rounded-2xl text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {launching ? "Saving your setup..." : "Launch my workspace"}{" "}
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={prevStep}
            className="w-full mt-3 py-3 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
          >
            Go back and change answers
          </button>
        </motion.div>
      </div>
    </div>
  );
}
