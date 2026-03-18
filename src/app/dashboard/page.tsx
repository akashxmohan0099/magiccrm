"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, Check, TrendingUp, Wand2, Users, Receipt,
  Inbox, Clock, ChevronRight, Plus, Calendar, Headphones,
  FileText, MessageCircle, CreditCard, Zap, BarChart3, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useOnboardingStore } from "@/store/onboarding";
import { useEnabledModules } from "@/hooks/useFeature";
import { useActivityStore } from "@/store/activity";
import Link from "next/link";

const MODULE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Receipt, Inbox, FolderKanban,
  Megaphone, Headphones, FileText, MessageCircle,
  CreditCard, Zap, BarChart3,
};

const CHECKLIST = [
  { id: "email", label: "Connect your email", description: "Sync your inbox for seamless communication", done: false },
  { id: "social", label: "Link social accounts", description: "Connect Instagram, Facebook, or other channels", done: false },
  { id: "invoice", label: "Set up invoice template", description: "Choose a branded template for your invoices", done: false },
  { id: "theme", label: "Choose your visual style", description: "Pick colors and themes that match your brand", done: false },
  { id: "contacts", label: "Import your contacts", description: "Upload a CSV or connect from another tool", done: false },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function DashboardPage() {
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const enabledModules = useEnabledModules();
  const recentActivity = useActivityStore((s) => s.entries.slice(0, 5));
  const [checklist, setChecklist] = useState(CHECKLIST);

  const completedChecklist = checklist.filter((c) => c.done).length;

  const totalFeatures = enabledModules.reduce((acc, mod) => {
    const features = featureSelections[mod.id] || [];
    return acc + features.filter((f) => f.selected).length;
  }, 0);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      <motion.div variants={fadeUp} className="mb-10">
        <h2 className="text-[28px] font-bold text-foreground mb-1.5">
          Welcome{businessContext.businessName ? `, ${businessContext.businessName}` : ""}
        </h2>
        <p className="text-text-secondary text-[15px]">
          Your custom platform is ready. Complete the setup to get started.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Active Modules", value: enabledModules.length, icon: FolderKanban },
          { label: "Total Features", value: totalFeatures, icon: Check },
          { label: "Setup Progress", value: completedChecklist, suffix: `/${checklist.length}`, icon: TrendingUp },
          { label: "AI Credits", value: 25, icon: Wand2 },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="bg-card-bg rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-text-secondary font-medium">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-text-tertiary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              <AnimatedNumber value={stat.value} />
              {stat.suffix && <span className="text-text-tertiary text-lg font-normal">{stat.suffix}</span>}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup checklist */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="section-label mb-1">Getting Started</p>
              <h3 className="text-lg font-semibold text-foreground">Setup Checklist</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-border-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FFE072] to-[#D4A017] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-text-tertiary font-medium">
                {completedChecklist}/{checklist.length}
              </span>
            </div>
          </div>
          <div className="bg-card-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-border-light">
            {checklist.map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.04 }}
                onClick={() => toggleChecklist(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                  item.done ? "bg-brand-light/40" : "hover:bg-surface/50"
                }`}
              >
                <motion.div
                  animate={item.done ? { scale: [1, 1.15, 1] } : {}}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    item.done ? "bg-brand border-brand" : "border-border-warm"
                  }`}
                >
                  {item.done && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-medium transition-all ${item.done ? "text-text-secondary line-through" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${item.done ? "text-text-tertiary" : "text-text-tertiary"}`} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Active modules */}
        <motion.div variants={fadeUp}>
          <div className="mb-4">
            <p className="section-label mb-1">Modules</p>
            <h3 className="text-lg font-semibold text-foreground">Your CRM</h3>
          </div>
          <div className="bg-card-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-border-light">
            {enabledModules.map((mod, idx) => {
              const IconComp = MODULE_ICON_MAP[mod.icon];
              const featureCount = (featureSelections[mod.id] || []).filter((f) => f.selected).length;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.03 }}
                >
                  <Link
                    href={`/dashboard/${mod.slug}`}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors group first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-light transition-colors">
                      {IconComp && <IconComp className="w-4 h-4 text-text-secondary group-hover:text-brand transition-colors" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{mod.name}</p>
                      <p className="text-[11px] text-text-tertiary">{featureCount} features</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <Link href="/ai-builder">
            <Button variant="secondary" size="sm" className="w-full mt-3">
              <Plus className="w-3.5 h-3.5" /> Add Custom Feature
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} className="mt-8">
        <p className="section-label mb-1">Quick Actions</p>
        <h3 className="text-lg font-semibold text-foreground mb-4">Jump in</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Contact", icon: Users, href: "/dashboard/clients" },
            { label: "Create Invoice", icon: Receipt, href: "/dashboard/invoicing" },
            { label: "New Project", icon: FolderKanban, href: "/dashboard/jobs" },
            { label: "Send Message", icon: Inbox, href: "/dashboard/communication" },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05 }}
            >
              <Link
                href={action.href}
                className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card-bg shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all text-text-secondary group card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-brand-light transition-colors">
                  <action.icon className="w-5 h-5 group-hover:text-brand transition-colors" />
                </div>
                <span className="text-[13px] font-medium text-foreground">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} className="mt-8">
        <p className="section-label mb-1">Activity</p>
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent</h3>
        <div className="bg-card-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Clock className="w-8 h-8 mb-3" />
              </motion.div>
              <p className="text-sm font-medium text-text-secondary">No activity yet</p>
              <p className="text-xs text-text-tertiary mt-0.5">Actions will appear here as you use your CRM</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {recentActivity.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
                  <span className="text-foreground flex-1 text-[13px]">{entry.description}</span>
                  <span className="text-[11px] text-text-tertiary whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
