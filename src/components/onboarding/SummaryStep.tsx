"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Inbox, Calendar, Receipt, FolderKanban,
  Megaphone, MessageCircle, Package,
  Zap, BarChart3, ArrowRight, Globe, UsersRound,
  Scissors, Wrench, Briefcase, Dumbbell, PenTool,
  UtensilsCrossed, GraduationCap, ShoppingBag,
  Check, Plus,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { MODULE_REGISTRY } from "@/lib/module-registry";

const MODULE_DISPLAY: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
  tagline: string;
}> = {
  "client-database":    { icon: Users,           bg: "bg-blue-50",    color: "text-blue-500",    tagline: "Manage contacts, tags, notes, and history" },
  "leads-pipeline":     { icon: Inbox,           bg: "bg-indigo-50",  color: "text-indigo-500",  tagline: "Track inquiries and convert them to clients" },
  "communication":      { icon: MessageCircle,   bg: "bg-violet-50",  color: "text-violet-500",  tagline: "Email, SMS, and social — one inbox" },
  "bookings-calendar":  { icon: Calendar,        bg: "bg-emerald-50", color: "text-emerald-600", tagline: "Appointments, availability, and reminders" },
  "quotes-invoicing":   { icon: Receipt,         bg: "bg-amber-50",   color: "text-amber-600",   tagline: "Quotes, invoices, and payment tracking" },
  "jobs-projects":      { icon: FolderKanban,    bg: "bg-orange-50",  color: "text-orange-500",  tagline: "Tasks, deadlines, and time tracking" },
  "products":           { icon: Package,         bg: "bg-cyan-50",    color: "text-cyan-600",    tagline: "Your product and service catalog" },
  "marketing":          { icon: Megaphone,       bg: "bg-pink-50",    color: "text-pink-500",    tagline: "Campaigns, reviews, and promotions" },
  "team":               { icon: UsersRound,      bg: "bg-rose-50",    color: "text-rose-500",    tagline: "Roles, permissions, and schedules" },
  "client-portal":      { icon: Globe,           bg: "bg-teal-50",    color: "text-teal-600",    tagline: "Self-service hub for your clients" },
  "automations":        { icon: Zap,             bg: "bg-yellow-50",  color: "text-yellow-600",  tagline: "Auto-send reminders and follow-ups" },
  "reporting":          { icon: BarChart3,       bg: "bg-gray-100",   color: "text-gray-600",    tagline: "Dashboards, goals, and insights" },
};

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "beauty-wellness": Scissors, "trades-construction": Wrench, "professional-services": Briefcase,
  "health-fitness": Dumbbell, "creative-services": PenTool, "hospitality-events": UtensilsCrossed,
  "education-coaching": GraduationCap, "retail-ecommerce": ShoppingBag,
};

export function SummaryStep() {
  const { businessContext, prevStep, setIsBuilding, getIndustryConfig, needs } = useOnboardingStore();
  const setNeed = useOnboardingStore((s) => s.setNeed);
  const config = getIndustryConfig();

  const ALWAYS_ON = new Set(["client-database", "leads-pipeline", "communication", "quotes-invoicing"]);
  const NEED_TO_MODULE: Record<string, string> = {
    acceptBookings: "bookings-calendar",
    manageProjects: "jobs-projects",
    runMarketing: "marketing",
  };

  // Track which modules user manually toggled on from the "not included" section
  const [manuallyEnabled, setManuallyEnabled] = useState<Set<string>>(new Set());

  const { enabledModules, disabledModules } = useMemo(() => {
    const enabled = new Set<string>(ALWAYS_ON);
    for (const [needKey, moduleId] of Object.entries(NEED_TO_MODULE)) {
      if (needs[needKey as keyof typeof needs]) enabled.add(moduleId);
    }
    if (needs.acceptBookings) enabled.add("products");
    if (needs.manageProjects || needs.acceptBookings) enabled.add("automations");
    if (needs.manageProjects || needs.sendInvoices) enabled.add("reporting");

    // Add manually enabled
    for (const id of manuallyEnabled) enabled.add(id);

    const coreModules = MODULE_REGISTRY.filter((m) => m.kind !== "addon");
    return {
      enabledModules: coreModules.filter((m) => enabled.has(m.id)),
      disabledModules: coreModules.filter((m) => !enabled.has(m.id)),
    };
  }, [needs, manuallyEnabled]);

  const toggleModule = (moduleId: string) => {
    setManuallyEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
    // Also set the need so it persists
    const needEntry = Object.entries(NEED_TO_MODULE).find(([, v]) => v === moduleId);
    if (needEntry) {
      const [needKey] = needEntry;
      setNeed(needKey as keyof typeof needs, !needs[needKey as keyof typeof needs]);
    }
  };

  const IndustryIcon = config ? INDUSTRY_ICONS[config.id] : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 px-6 lg:px-16 py-10 w-full max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {config && IndustryIcon && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full mb-5">
              <IndustryIcon className="w-4 h-4 text-text-secondary" />
              <span className="text-[12px] font-semibold text-text-secondary">{config.label}</span>
            </div>
          )}
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-3">
            {businessContext.businessName
              ? `${businessContext.businessName} is ready`
              : "Your workspace is ready"}
          </h2>
          <p className="text-[15px] text-text-secondary max-w-lg mx-auto">
            {enabledModules.length} modules configured for you. Everything is customizable from your dashboard.
          </p>
        </motion.div>

        {/* Enabled modules — full width grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {enabledModules.map((mod, i) => {
            const display = MODULE_DISPLAY[mod.id];
            if (!display) return null;
            const IconComp = display.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className="relative bg-card-bg rounded-2xl border border-border-light p-5 hover:shadow-md transition-all"
              >
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${display.bg}`}>
                  <IconComp className={`w-5 h-5 ${display.color}`} />
                </div>
                <h3 className="font-semibold text-[14px] text-foreground tracking-tight mb-1">
                  {mod.name}
                </h3>
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  {display.tagline}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Disabled modules — can be toggled on */}
        {disabledModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-[13px] text-text-tertiary mb-3 font-medium">
              Not included — click to add
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {disabledModules.map((mod) => {
                const display = MODULE_DISPLAY[mod.id];
                if (!display) return null;
                const IconComp = display.icon;
                return (
                  <motion.button
                    key={mod.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleModule(mod.id)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border-light bg-surface/50 hover:bg-card-bg hover:border-foreground/15 transition-all cursor-pointer text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${display.bg} opacity-50`}>
                      <IconComp className={`w-4 h-4 ${display.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-text-secondary">{mod.name}</p>
                      <p className="text-[11px] text-text-tertiary">{display.tagline}</p>
                    </div>
                    <Plus className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bottom message + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto text-center"
        >
          <p className="text-[13px] text-text-tertiary mb-6">
            You can add more modules, enable add-ons, and fine-tune features anytime from your dashboard.
          </p>
          <button
            onClick={() => setIsBuilding(true)}
            className="w-full py-4 bg-foreground text-white rounded-2xl text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center justify-center gap-2.5 shadow-lg"
          >
            Launch my workspace
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
