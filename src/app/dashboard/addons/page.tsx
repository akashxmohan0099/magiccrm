"use client";

import { useState, useMemo } from "react";
import {
  Users, Inbox, Calendar, Receipt, MessageCircle,
  Megaphone, UsersRound, Zap, BarChart3, FolderKanban,
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, NotebookPen, Check, Plus, AlertTriangle,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered, FileText,
  Headphones, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  MODULE_REGISTRY,
  ALWAYS_ON_MODULES,
  getModuleDisplayName,
  computeEnabledModuleIds,
} from "@/lib/module-registry";
import { useAddonsStore } from "@/store/addons";
import { useOnboardingStore } from "@/store/onboarding";
import { useAuth } from "@/hooks/useAuth";
import { useVocabulary } from "@/hooks/useVocabulary";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Inbox, Calendar, Receipt, MessageCircle,
  Megaphone, UsersRound, Zap, BarChart3, FolderKanban,
  Crown, Camera, FileInput, ClipboardList, Gift, UserCheck,
  Store, Globe, Lightbulb, NotebookPen, FileText,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered, Headphones,
};

const MODULE_ACCENTS: Record<string, { accent: string; bg: string }> = {
  "client-database":   { accent: "#3B82F6", bg: "from-blue-50 to-blue-100/40" },
  "leads-pipeline":    { accent: "#6366F1", bg: "from-indigo-50 to-indigo-100/40" },
  "communication":     { accent: "#8B5CF6", bg: "from-violet-50 to-violet-100/40" },
  "bookings-calendar": { accent: "#10B981", bg: "from-emerald-50 to-emerald-100/40" },
  "quotes-invoicing":  { accent: "#F59E0B", bg: "from-amber-50 to-amber-100/40" },
  "marketing":         { accent: "#EC4899", bg: "from-pink-50 to-pink-100/40" },
  "team":              { accent: "#F43F5E", bg: "from-rose-50 to-rose-100/40" },
  "automations":       { accent: "#EAB308", bg: "from-yellow-50 to-yellow-100/40" },
  "reporting":         { accent: "#6B7280", bg: "from-gray-50 to-gray-100/40" },
  "jobs-projects":     { accent: "#F97316", bg: "from-orange-50 to-orange-100/40" },
  "client-portal":     { accent: "#14B8A6", bg: "from-teal-50 to-teal-100/40" },
  "documents":         { accent: "#8B5CF6", bg: "from-violet-50 to-violet-100/40" },
  "support":           { accent: "#3B82F6", bg: "from-blue-50 to-blue-100/40" },
  "memberships":       { accent: "#8B5CF6", bg: "from-purple-50 to-purple-100/40" },
  "before-after":      { accent: "#EC4899", bg: "from-pink-50 to-pink-100/40" },
  "intake-forms":      { accent: "#EC4899", bg: "from-pink-50 to-pink-100/40" },
  "soap-notes":        { accent: "#14B8A6", bg: "from-teal-50 to-teal-100/40" },
  "loyalty":           { accent: "#10B981", bg: "from-emerald-50 to-emerald-100/40" },
  "win-back":          { accent: "#F59E0B", bg: "from-amber-50 to-amber-100/40" },
  "storefront":        { accent: "#06B6D4", bg: "from-cyan-50 to-cyan-100/40" },
  "ai-insights":       { accent: "#F59E0B", bg: "from-amber-50 to-amber-100/40" },
  "notes-docs":        { accent: "#6366F1", bg: "from-indigo-50 to-indigo-100/40" },
  "gift-cards":        { accent: "#EC4899", bg: "from-pink-50 to-pink-100/40" },
  "class-timetable":   { accent: "#3B82F6", bg: "from-blue-50 to-blue-100/40" },
  "vendor-management": { accent: "#6B7280", bg: "from-gray-50 to-gray-100/40" },
  "proposals":         { accent: "#8B5CF6", bg: "from-violet-50 to-violet-100/40" },
  "waitlist-manager":  { accent: "#F97316", bg: "from-orange-50 to-orange-100/40" },
};

export default function ModulesAndAddonsPage() {
  const [tab, setTab] = useState<"modules" | "addons">("modules");
  const { enabledAddons, enableAddon, disableAddon } = useAddonsStore();
  const needs = useOnboardingStore((s) => s.needs);
  const discoveryAnswers = useOnboardingStore((s) => s.discoveryAnswers);
  const { workspaceId } = useAuth();
  const vocab = useVocabulary();
  const [disableTarget, setDisableTarget] = useState<{ id: string; name: string; kind: "module" | "addon" } | null>(null);
  const [deleteInput, setDeleteInput] = useState("");

  const enabledModuleIds = useMemo(() => computeEnabledModuleIds(needs, discoveryAnswers), [needs, discoveryAnswers]);

  const coreModules = useMemo(() => MODULE_REGISTRY.filter((m) => m.kind !== "addon"), []);
  const addonModules = useMemo(() => MODULE_REGISTRY.filter((m) => m.kind === "addon"), []);

  const items = tab === "modules" ? coreModules : addonModules;

  const isEnabled = (id: string, kind: "core" | "addon" | undefined) => {
    if (kind === "addon") return enabledAddons.includes(id);
    return enabledModuleIds.has(id);
  };

  const isAlwaysOn = (id: string) => ALWAYS_ON_MODULES.has(id);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-foreground tracking-tight">Modules & Add-ons</h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Manage what&apos;s active in your workspace. Enable what you need, disable what you don&apos;t.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-8 w-fit">
        <button
          onClick={() => setTab("modules")}
          className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
            tab === "modules"
              ? "bg-card-bg text-foreground shadow-sm"
              : "text-text-tertiary hover:text-foreground"
          }`}
        >
          Modules ({coreModules.length})
        </button>
        <button
          onClick={() => setTab("addons")}
          className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
            tab === "addons"
              ? "bg-card-bg text-foreground shadow-sm"
              : "text-text-tertiary hover:text-foreground"
          }`}
        >
          Add-ons ({addonModules.length})
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((mod, i) => {
          const enabled = isEnabled(mod.id, mod.kind);
          const alwaysOn = isAlwaysOn(mod.id);
          const Icon = ICON_MAP[mod.icon] || Zap;
          const colors = MODULE_ACCENTS[mod.id] || { accent: "#6B7280", bg: "from-gray-50 to-gray-100/40" };

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                enabled
                  ? `bg-gradient-to-br ${colors.bg}`
                  : "bg-card-bg"
              }`}
              style={{
                border: enabled ? `1.5px solid ${colors.accent}25` : "1.5px solid var(--border-light)",
              }}
            >
              {/* Accent glow for enabled */}
              {enabled && (
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15 blur-2xl"
                  style={{ backgroundColor: colors.accent }}
                />
              )}

              <div className="relative p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${colors.accent}${enabled ? "15" : "08"}`,
                      border: `1px solid ${colors.accent}${enabled ? "20" : "10"}`,
                    }}
                  >
                    <span style={{ color: enabled ? colors.accent : `${colors.accent}80` }}>
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Status badge */}
                  {alwaysOn ? (
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                      Always on
                    </span>
                  ) : enabled ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: `${colors.accent}12`, color: colors.accent }}
                    >
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : null}
                </div>

                <h3 className="text-[15px] font-semibold text-foreground mb-1">
                  {getModuleDisplayName(mod, vocab)}
                </h3>
                <p className="text-[12px] text-text-secondary leading-relaxed mb-4">
                  {mod.description}
                </p>

                {/* Action */}
                {alwaysOn ? (
                  <Link href={`/dashboard/${mod.slug}`}>
                    <Button variant="secondary" size="sm" className="w-full">Open</Button>
                  </Link>
                ) : enabled ? (
                  <div className="flex gap-2">
                    <Link href={`/dashboard/${mod.slug}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">Open</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDisableTarget({ id: mod.id, name: getModuleDisplayName(mod, vocab), kind: mod.kind === "addon" ? "addon" : "module" })}
                      className="text-text-tertiary hover:text-red-500"
                    >
                      Disable
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (mod.kind === "addon") {
                        enableAddon(mod.id, mod.name, workspaceId);
                      }
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Enable
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Disable confirmation */}
      {disableTarget && (
        <Modal open onClose={() => { setDisableTarget(null); setDeleteInput(""); }} title={`Disable ${disableTarget.name}`}>
          <div className="space-y-4">
            <p className="text-[13px] text-text-secondary">
              Are you sure you want to disable {disableTarget.name}? You can re-enable it anytime.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => { setDisableTarget(null); setDeleteInput(""); }}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (disableTarget.kind === "addon") {
                    disableAddon(disableTarget.id, disableTarget.name, workspaceId);
                  }
                  setDisableTarget(null);
                  setDeleteInput("");
                }}
              >
                Disable
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
