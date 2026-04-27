"use client";

import { ReactNode, useEffect } from "react";
import {
  BarChart3, Megaphone, Ticket, Gift, Lightbulb, UserCheck,
  ScrollText, Crown, FileSignature, Puzzle, Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/store/settings";
import { ADDON_MODULES } from "@/lib/addon-modules";
import { useAuth } from "@/hooks/useAuth";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3, Megaphone, Ticket, Gift, Lightbulb, UserCheck, ScrollText, Crown, FileSignature,
};

const ACCENT: Record<string, { color: string; gradient: string }> = {
  analytics:     { color: "#6366F1", gradient: "from-indigo-500 to-violet-500" },
  marketing:     { color: "#EC4899", gradient: "from-pink-500 to-rose-500" },
  "gift-cards":  { color: "#F59E0B", gradient: "from-amber-400 to-orange-500" },
  loyalty:       { color: "#10B981", gradient: "from-emerald-400 to-teal-500" },
  "ai-insights": { color: "#F59E0B", gradient: "from-amber-400 to-yellow-500" },
  "win-back":    { color: "#3B82F6", gradient: "from-blue-400 to-indigo-500" },
  proposals:     { color: "#8B5CF6", gradient: "from-violet-500 to-purple-600" },
  memberships:   { color: "#8B5CF6", gradient: "from-purple-500 to-indigo-600" },
  documents:     { color: "#14B8A6", gradient: "from-teal-400 to-emerald-500" },
};

// ── Mini preview components for each module ──

function AnalyticsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { label: "Revenue", value: "$4,280", change: "+12%" },
        { label: "Bookings", value: "47", change: "+8%" },
        { label: "Completion", value: "94%", change: "+3%" },
      ].map((s) => (
        <div key={s.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60">
          <span className="text-[11px] text-text-secondary">{s.label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-foreground">{s.value}</span>
            <span className="text-[10px] font-semibold text-emerald-600">{s.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { name: "Winter Special", status: "Sent", count: "45 sent", sc: "text-emerald-600" },
        { name: "We miss you!", status: "Sent", count: "18 sent", sc: "text-emerald-600" },
        { name: "Mother's Day", status: "Draft", count: "", sc: "text-text-tertiary" },
      ].map((c) => (
        <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60">
          <span className="text-[11px] font-medium text-foreground">{c.name}</span>
          <span className={`text-[10px] font-semibold ${c.sc}`}>{c.status}</span>
        </div>
      ))}
    </div>
  );
}

function GiftCardsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { code: "GIFT-7X4K", amount: "$100", status: "Active", sc: "text-emerald-600" },
        { code: "GIFT-R9BW", amount: "$25", status: "Partial", sc: "text-amber-600" },
        { code: "GIFT-5FHQ", amount: "$0", status: "Redeemed", sc: "text-text-tertiary" },
      ].map((g) => (
        <div key={g.code} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60">
          <span className="text-[11px] font-mono text-foreground">{g.code}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground">{g.amount}</span>
            <span className={`text-[10px] font-semibold ${g.sc}`}>{g.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LoyaltyPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { rank: "1.", name: "Sarah M.", pts: "420 pts", initials: "SM", color: "bg-emerald-500" },
        { rank: "2.", name: "Emma R.", pts: "310 pts", initials: "ER", color: "bg-blue-500" },
        { rank: "3.", name: "Jess T.", pts: "185 pts", initials: "JT", color: "bg-violet-500" },
      ].map((l) => (
        <div key={l.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/60">
          <span className="text-[10px] text-text-tertiary w-3">{l.rank}</span>
          <div className={`w-6 h-6 ${l.color} rounded-full flex items-center justify-center`}>
            <span className="text-[8px] font-bold text-white">{l.initials}</span>
          </div>
          <span className="text-[11px] font-medium text-foreground flex-1">{l.name}</span>
          <span className="text-[11px] font-bold text-primary">{l.pts}</span>
        </div>
      ))}
    </div>
  );
}

function BusinessInsightsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { text: "Sarah M. is 2 weeks overdue for her lash fill", tag: "ACTION", tc: "text-red-600 bg-red-50" },
        { text: "Tuesday afternoons are consistently empty", tag: "OPPORTUNITY", tc: "text-emerald-600 bg-emerald-50" },
        { text: "Balayage is your most profitable service", tag: "INSIGHT", tc: "text-blue-600 bg-blue-50" },
      ].map((i) => (
        <div key={i.text} className="px-3 py-2.5 rounded-lg bg-background/60 border-l-2 border-amber-400">
          <p className="text-[11px] text-foreground leading-snug">{i.text}</p>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${i.tc} px-1.5 py-0.5 rounded mt-1 inline-block`}>{i.tag}</span>
        </div>
      ))}
    </div>
  );
}

function WinBackPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { name: "Sarah M.", days: "45 days inactive", status: "Contacted", sc: "text-emerald-600" },
        { name: "Tom K.", days: "62 days inactive", status: "Detected", sc: "text-amber-600" },
      ].map((w) => (
        <div key={w.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60">
          <div>
            <p className="text-[11px] font-medium text-foreground">{w.name}</p>
            <p className="text-[9px] text-text-tertiary">{w.days}</p>
          </div>
          <span className={`text-[10px] font-semibold ${w.sc}`}>{w.status}</span>
        </div>
      ))}
    </div>
  );
}

function ProposalsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      <div className="px-3 py-2.5 rounded-lg bg-background/60">
        <p className="text-[11px] font-semibold text-foreground">Bridal Package — Olivia M.</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-foreground">$1,450</span>
          <span className="text-[10px] font-semibold text-emerald-600">Accepted</span>
        </div>
      </div>
      <div className="px-3 py-2.5 rounded-lg bg-background/60">
        <p className="text-[11px] font-semibold text-foreground">Event Package — Lauren H.</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-foreground">$680</span>
          <span className="text-[10px] font-semibold text-blue-600">Viewed</span>
        </div>
      </div>
    </div>
  );
}

function MembershipsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { name: "10-Session Pack", price: "$450", members: "8 active" },
        { name: "Monthly Unlimited", price: "$99/mo", members: "12 active" },
      ].map((p) => (
        <div key={p.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/60">
          <div>
            <p className="text-[11px] font-medium text-foreground">{p.name}</p>
            <p className="text-[9px] text-text-tertiary">{p.members}</p>
          </div>
          <span className="text-[12px] font-bold text-foreground">{p.price}</span>
        </div>
      ))}
    </div>
  );
}

function DocumentsPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { name: "General Waiver", status: "Signed", sc: "text-emerald-600" },
        { name: "Consent Form", status: "Pending", sc: "text-amber-600" },
      ].map((d) => (
        <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/60">
          <span className="text-[11px] font-medium text-foreground">{d.name}</span>
          <span className={`text-[10px] font-semibold ${d.sc}`}>{d.status}</span>
        </div>
      ))}
    </div>
  );
}

const PREVIEW_MAP: Record<string, () => ReactNode> = {
  analytics: AnalyticsPreview,
  marketing: MarketingPreview,
  "gift-cards": GiftCardsPreview,
  loyalty: LoyaltyPreview,
  "ai-insights": BusinessInsightsPreview,
  "win-back": WinBackPreview,
  proposals: ProposalsPreview,
  memberships: MembershipsPreview,
  documents: DocumentsPreview,
};

// ── Main page ──

export default function AddonsPage() {
  const { enabledAddons, toggleAddon } = useSettingsStore();
  const { workspaceId } = useAuth();
  const enabledCount = enabledAddons.length;

  useEffect(() => {
    document.title = "Modules · Magic";
  }, []);

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ y: 6 }} animate={{ y: 0 }} className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight">
          <span className="gradient-text">Modules</span>
        </h1>
        <p className="text-[15px] text-text-secondary mt-1">
          Extend your workspace with powerful add-ons. Toggle what you need — everything is included.
        </p>
        {enabledCount > 0 && (
          <p className="text-[13px] text-primary font-medium mt-2">
            {enabledCount} module{enabledCount !== 1 ? "s" : ""} active
          </p>
        )}
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ADDON_MODULES.map((addon, i) => {
          const enabled = enabledAddons.includes(addon.id);
          const Icon = ICON_MAP[addon.icon] || Puzzle;
          const accent = ACCENT[addon.id] || { color: "#6B7280", gradient: "from-gray-400 to-gray-500" };
          const Preview = PREVIEW_MAP[addon.id];

          return (
            <motion.div
              key={addon.id}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`relative bg-card-bg border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg group ${
                enabled ? "border-primary/30" : "border-border-light hover:border-foreground/10"
              }`}
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 bg-gradient-to-r ${accent.gradient} ${enabled ? "opacity-100" : "opacity-30 group-hover:opacity-60"} transition-opacity`} />

              {/* Gradient overlay */}
              <div
                className="absolute top-0 left-0 right-0 h-28 transition-opacity pointer-events-none"
                style={{ background: `linear-gradient(to bottom, ${accent.color}0A, transparent)`, opacity: enabled ? 1 : 0.5 }}
              />

              <div className="relative p-5">
                {/* Header: icon + toggle */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: accent.color + "15" }}
                  >
                    <span style={{ color: accent.color }}>
                      <Icon className="w-5 h-5" />
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAddon(addon.id, workspaceId || undefined)}
                    className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-200 ${
                      enabled ? "bg-primary" : "bg-surface border border-border-light"
                    }`}
                  >
                    <div
                      className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }}
                    />
                  </button>
                </div>

                {/* Title + description */}
                <h3 className="text-[15px] font-semibold text-foreground mb-1">{addon.name}</h3>
                <p className="text-[12px] text-text-secondary leading-relaxed">{addon.description}</p>

                {/* Mini preview */}
                {Preview && <Preview />}

                {/* Status + portal badge */}
                <div className="flex items-center gap-2 mt-3">
                  {enabled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-text-tertiary bg-surface px-2.5 py-1 rounded-full">
                      Available
                    </span>
                  )}
                  {addon.activatesPortal && (
                    <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      + Client Portal
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
