"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, Check, TrendingUp, Wand2, Users, Receipt,
  Inbox, Clock, ChevronRight, Plus, Calendar, Headphones,
  FileText, MessageCircle, CreditCard, Zap, BarChart3, Megaphone,
  ArrowRight, ExternalLink,
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
  { id: "email", label: "Connect your email", description: "Sync your inbox for seamless communication", done: false, time: "2 min" },
  { id: "social", label: "Link social accounts", description: "Connect Instagram, Facebook, or other channels", done: false, time: "3 min" },
  { id: "invoice", label: "Set up invoice template", description: "Choose a branded template for your invoices", done: false, time: "5 min" },
  { id: "theme", label: "Choose your visual style", description: "Pick colors and themes that match your brand", done: false, time: "3 min" },
  { id: "contacts", label: "Import your contacts", description: "Upload a CSV or connect from another tool", done: false, time: "4 min" },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function DashboardPage() {
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const featureSelections = useOnboardingStore((s) => s.featureSelections);
  const enabledModules = useEnabledModules();
  const recentActivity = useActivityStore((s) => s.entries.slice(0, 5));
  const [checklist, setChecklist] = useState(CHECKLIST);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-8">
        <h2 className="text-[24px] font-bold text-foreground mb-1">
          {businessContext.businessName ? `${getTimeGreeting()}, ${businessContext.businessName}` : getTimeGreeting()}
        </h2>
        <p className="text-text-secondary text-[14px]">
          Your platform is ready. Complete setup to unlock everything.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Active Modules", value: enabledModules.length, icon: FolderKanban, trend: "up" },
          { label: "Total Features", value: totalFeatures, icon: Check, trend: "up" },
          { label: "Setup Progress", value: completedChecklist, suffix: `/${checklist.length}`, icon: TrendingUp, trend: "up" },
          { label: "AI Credits", value: 25, icon: Wand2, trend: "stable" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="bg-card-bg rounded-xl p-4 border border-border-light overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <polyline
                  points="0,20 10,18 20,15 30,16 40,12 50,14 60,10 70,12 80,8 90,10 100,6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="relative z-10 flex items-center justify-between mb-2.5">
              <span className="text-[12px] text-text-tertiary font-medium">{stat.label}</span>
              <div className="flex items-center gap-1.5">
                {stat.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-foreground/40" />}
                <stat.icon className="w-3.5 h-3.5 text-text-tertiary" />
              </div>
            </div>
            <p className="relative z-10 text-[22px] font-bold text-foreground leading-none">
              <AnimatedNumber value={stat.value} />
              {stat.suffix && <span className="text-text-tertiary text-[15px] font-normal">{stat.suffix}</span>}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup checklist */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-foreground">Setup checklist</h3>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-border-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-foreground rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedChecklist / checklist.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-[11px] text-text-tertiary font-medium tabular-nums">
                {completedChecklist}/{checklist.length}
              </span>
            </div>
          </div>
          <div className="bg-card-bg rounded-xl border border-border-light divide-y divide-border-light">
            {checklist.map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.03 }}
                onClick={() => toggleChecklist(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors cursor-pointer first:rounded-t-xl last:rounded-b-xl ${
                  item.done ? "bg-surface/40" : "hover:bg-surface/30"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  item.done ? "bg-foreground border-foreground" : "border-border-light"
                }`}>
                  {item.done && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-[13px] font-medium ${item.done ? "text-text-tertiary line-through" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-tertiary font-medium whitespace-nowrap">{item.time}</span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Active modules */}
        <motion.div variants={fadeUp}>
          <h3 className="text-[15px] font-semibold text-foreground mb-3">Your modules</h3>
          <div className="bg-card-bg rounded-xl border border-border-light divide-y divide-border-light">
            {enabledModules.map((mod, idx) => {
              const IconComp = MODULE_ICON_MAP[mod.icon];
              const featureCount = (featureSelections[mod.id] || []).filter((f) => f.selected).length;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.02 }}
                >
                  <Link
                    href={`/dashboard/${mod.slug}`}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface/30 transition-colors group first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-foreground/5 transition-colors">
                      {IconComp && <IconComp className="w-4 h-4 text-text-secondary group-hover:text-foreground transition-colors" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{mod.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground bg-surface/60 px-2.5 py-0.5 rounded-full">{featureCount}</span>
                      <ChevronRight className="w-3 h-3 text-text-tertiary group-hover:text-text-secondary transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <Link href="/ai-builder">
            <Button variant="secondary" size="sm" className="w-full mt-3 text-[12px]">
              <Plus className="w-3 h-3" /> Add custom feature
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} className="mt-8">
        <h3 className="text-[15px] font-semibold text-foreground mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Contact", icon: Users, href: "/dashboard/clients", shortcut: "⌘N" },
            { label: "Create Invoice", icon: Receipt, href: "/dashboard/invoicing", shortcut: "⌘I" },
            { label: "New Project", icon: FolderKanban, href: "/dashboard/jobs", shortcut: "⌘J" },
            { label: "Send Message", icon: MessageCircle, href: "/dashboard/communication", shortcut: "⌘M" },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
            >
              <Link
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl bg-card-bg border border-border-light hover:border-foreground/10 hover:shadow-sm hover:bg-surface/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center group-hover:bg-foreground/5 transition-colors">
                  <action.icon className="w-4 h-4 text-text-secondary group-hover:text-foreground transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-foreground block">{action.label}</span>
                  <span className="text-[10px] text-text-tertiary">{action.shortcut}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} className="mt-8">
        <h3 className="text-[15px] font-semibold text-foreground mb-3">Recent activity</h3>
        <div className="bg-card-bg rounded-xl border border-border-light">
          {recentActivity.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-text-tertiary"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-3"
              >
                <Clock className="w-6 h-6 text-text-secondary" />
              </motion.div>
              <p className="text-[13px] font-medium text-text-secondary">No activity yet</p>
              <p className="text-[12px] text-text-tertiary mt-1.5">Start working to see activity logged here</p>
              <Link href="/dashboard/clients" className="mt-4">
                <Button size="sm" variant="secondary">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add your first contact
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="divide-y divide-border-light">
              {recentActivity.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
                  <span className="text-foreground flex-1 text-[13px]">{entry.description}</span>
                  <span className="text-[11px] text-text-tertiary whitespace-nowrap tabular-nums">
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
