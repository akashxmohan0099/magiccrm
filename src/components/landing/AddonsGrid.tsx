"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Crown, Gift, UserCheck, NotebookPen,
  Ticket, ScrollText, BarChart3, Sparkles, Megaphone, FileSignature,
} from "lucide-react";
import { ADDON_PERSONAS, ADDON_BORDER_COLORS } from "@/app/landing-data";

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const ADDONS_DATA: { name: string; icon: LucideIcon; color: string; gradient: string; desc: string; personas: string[]; preview: React.ReactNode }[] = [
  { name: "Proposals", icon: ScrollText, color: "violet", gradient: "#7C3AED", desc: "Branded proposal pages with interactive pricing and e-signature.", personas: ["Makeup Artist"],
    preview: <div className="space-y-1.5">{[{ id: "PROP-001", title: "Bridal Package", s: "Sent", amt: "A$650", sc: "bg-blue-50 text-blue-600" }, { id: "PROP-002", title: "Lash Package", s: "Viewed", amt: "A$350", sc: "bg-amber-50 text-amber-700" }, { id: "PROP-003", title: "Wedding Party", s: "Accepted \u2713", amt: "A$1,200", sc: "bg-emerald-50 text-emerald-700" }].map(p => <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div className="flex items-center gap-2"><span className="text-[9px] font-mono text-text-tertiary">{p.id}</span><span className="text-[11px] font-semibold text-foreground">{p.title}</span></div><div className="flex items-center gap-2"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.s}</span><span className="text-[11px] font-bold text-foreground">{p.amt}</span></div></div>)}</div> },
  { name: "Win-Back", icon: UserCheck, color: "amber", gradient: "#F59E0B", desc: "Detect lapsed clients and auto-send re-engagement messages.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", days: "45 days inactive", s: "Contacted", sc: "bg-emerald-50 text-emerald-700" }, { name: "Tom K.", days: "62 days inactive", s: "Detected", sc: "bg-amber-50 text-amber-700" }].map(c => <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.s}</span></div>)}</div> },
  { name: "AI Insights", icon: Sparkles, color: "indigo", gradient: "#6366F1", desc: "Claude-powered recommendations drawn from your own data.", personas: ["Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ t: "Sarah M. is 2 weeks overdue for her lash fill", c: "border-l-red-400", tag: "Action", tc: "bg-red-50 text-red-600" }, { t: "Tuesday afternoons are consistently empty", c: "border-l-blue-400", tag: "Opportunity", tc: "bg-blue-50 text-blue-600" }, { t: "Try raising colour price by 10% \u2014 demand is up", c: "border-l-amber-400", tag: "Suggestion", tc: "bg-amber-50 text-amber-700" }].map((r,i) => <div key={i} className={`px-3 py-2 rounded-lg bg-background/80 border-l-2 ${r.c}`}><p className="text-[11px] text-foreground leading-snug">{r.t}</p><span className={`text-[8px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${r.tc}`}>{r.tag}</span></div>)}</div> },
  { name: "Analytics", icon: BarChart3, color: "cyan", gradient: "#06B6D4", desc: "Funnel metrics, revenue trends, and team performance at a glance.", personas: ["Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ label: "Revenue this month", val: "A$12.4k", t: "+18%" }, { label: "Form conversion", val: "72%", t: "+4%" }, { label: "No-show rate", val: "3%", t: "\u22122%" }].map(m => <div key={m.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><span className="text-[11px] text-text-secondary">{m.label}</span><div className="flex items-center gap-2"><span className="text-[12px] font-bold text-foreground">{m.val}</span><span className="text-[9px] font-semibold text-emerald-600">{m.t}</span></div></div>)}</div> },
  { name: "Marketing", icon: Megaphone, color: "orange", gradient: "#F97316", desc: "Email and SMS campaigns, segmentation, and promo codes.", personas: ["Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Spring Promo", s: "Sent", sc: "bg-emerald-50 text-emerald-700", stats: "Open 64%" }, { name: "Win-Back Q2", s: "Sending", sc: "bg-blue-50 text-blue-600", stats: "412 sent" }, { name: "Birthday Offer", s: "Scheduled", sc: "bg-amber-50 text-amber-700", stats: "Apr 28" }].map(c => <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.stats}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.s}</span></div>)}</div> },
  { name: "Memberships", icon: Crown, color: "purple", gradient: "#8B5CF6", desc: "Session packs, recurring plans, and member tracking with auto-billing.", personas: ["Hair Salon", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ plan: "10-Session Pack", price: "A$450", mem: "8 active" }, { plan: "Monthly Unlimited", price: "A$99/mo", mem: "12 active" }].map(p => <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.mem}</p></div><span className="text-[13px] font-bold text-foreground">{p.price}</span></div>)}</div> },
  { name: "Loyalty & Referrals", icon: Gift, color: "emerald", gradient: "#10B981", desc: "Points per visit, referral codes, and reward tiers for repeat clients.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", pts: "420 pts", r: "1" }, { name: "Emma R.", pts: "310 pts", r: "2" }, { name: "Jess T.", pts: "185 pts", r: "3" }].map(m => <div key={m.r} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/80"><span className="text-[10px] font-bold text-text-tertiary w-4">{m.r}.</span><div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-white">{m.name.split(" ").map(n=>n[0]).join("")}</span></div><span className="text-[11px] text-foreground font-medium flex-1">{m.name}</span><span className="text-[11px] font-bold text-emerald-600">{m.pts}</span></div>)}<div className="px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] text-emerald-700 font-medium">Referral code SARAH10 used 4 times this month</p></div></div> },
  { name: "Gift Cards", icon: Ticket, color: "pink", gradient: "#EC4899", desc: "Create, sell, and track digital gift vouchers. A revenue channel that markets itself.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ code: "GIFT-7X4K", val: "A$100", s: "Active", sc: "bg-emerald-50 text-emerald-700" }, { code: "GIFT-R9BW", val: "A$25", s: "Partial", sc: "bg-amber-50 text-amber-700" }, { code: "GIFT-5FHQ", val: "A$0", s: "Redeemed", sc: "bg-gray-100 text-gray-500" }].map(r => <div key={r.code} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80"><span className="text-[11px] text-text-secondary font-mono">{r.code}</span><div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-foreground">{r.val}</span><span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span></div></div>)}</div> },
  { name: "Documents", icon: FileSignature, color: "teal", gradient: "#14B8A6", desc: "Waivers, contracts, and consent forms with e-signature and tracking.", personas: ["Lash Tech", "Makeup Artist", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Waiver \u2014 Lash Set", who: "Sarah M.", s: "Signed \u2713", sc: "bg-emerald-50 text-emerald-700" }, { name: "Bridal Contract", who: "Jessica R.", s: "Sent", sc: "bg-blue-50 text-blue-600" }, { name: "Consent Form", who: "Emma K.", s: "Viewed", sc: "bg-amber-50 text-amber-700" }].map(d => <div key={d.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{d.name}</p><p className="text-[9px] text-text-tertiary">{d.who}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${d.sc}`}>{d.s}</span></div>)}</div> },
  { name: "Notes & Docs", icon: NotebookPen, color: "sky", gradient: "#0EA5E9", desc: "Write notes, create docs, and share with your team. Simple formatting, no bloat.", personas: ["Hair Salon", "Makeup Artist", "Spa Owner"],
    preview: <div className="rounded-xl bg-background/80 overflow-hidden border border-border-light"><div className="px-3 py-1.5 border-b border-border-light flex items-center gap-1.5"><span className="text-[10px] font-bold text-text-secondary px-1.5 py-0.5">B</span><span className="text-[10px] italic text-text-secondary px-1.5 py-0.5">I</span><span className="text-[10px] underline text-text-secondary px-1.5 py-0.5">U</span></div><div className="px-3 py-2.5"><p className="text-[11px] font-bold text-foreground mb-1">Session notes — Sarah M.</p><p className="text-[10px] text-text-secondary leading-relaxed">Discussed goals for Q2. Wants to <span className="font-bold">increase bookings by 20%</span> and launch a referral program.</p><div className="flex items-center gap-1.5 mt-2"><span className="text-[8px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-medium">Linked: Sarah M.</span><span className="text-[8px] px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded font-medium">Pinned</span></div></div></div> },
];

const FEATURED_ADDONS = ["Proposals", "Win-Back", "AI Insights"];

export function AddonsGrid() {
  const [filter, setFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState(false);

  const baseList = filter === "All" ? ADDONS_DATA : ADDONS_DATA.filter((a) => a.personas.includes(filter));
  const filtered = filter === "All"
    ? [
        ...FEATURED_ADDONS.map((n) => baseList.find((a) => a.name === n)).filter((a): a is typeof ADDONS_DATA[number] => Boolean(a)),
        ...baseList.filter((a) => !FEATURED_ADDONS.includes(a.name)),
      ]
    : baseList;
  const visible = expanded ? filtered : filtered.slice(0, 3);
  const hasMore = filtered.length > 3;

  // Persist the user's "View all" choice across filter changes
  const handleFilter = (p: string) => {
    setFilter(p);
  };

  return (
    <>
      <div
        className="flex gap-2 mb-10 overflow-x-auto sm:flex-wrap sm:justify-center sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: "none" }}
      >
        {ADDON_PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => handleFilter(p)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === p
                ? "bg-foreground text-background shadow-md"
                : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center items-stretch gap-5">
        <AnimatePresence mode="popLayout">
          {visible.map((addon) => {
            const Icon = addon.icon;
            return (
              <motion.div
                key={addon.name}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative flex flex-col bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${ADDON_BORDER_COLORS[addon.color] ?? ""}`}
              >
                <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: `linear-gradient(to bottom, ${addon.gradient}, transparent)` }} />
                <div className="relative px-5 pt-5 pb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: addon.gradient + "18" }}>
                    <Icon className="w-5 h-5" style={{ color: addon.gradient }} />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground">{addon.name}</h3>
                  <p className="text-xs text-text-secondary mt-1">{addon.desc}</p>
                </div>
                <div className="relative px-5 pb-3">
                  {addon.preview}
                </div>
                <div className="relative px-5 pb-4 mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {addon.personas.map((p) => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 bg-surface border border-border-light rounded-full text-text-tertiary font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && !expanded && (
        <div className="text-center mt-8">
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface border border-border-light text-[13px] font-semibold text-foreground hover:bg-foreground hover:text-background transition-all cursor-pointer"
          >
            View all {filtered.length} add-ons <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {expanded && hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setExpanded(false)}
            className="text-[13px] text-text-secondary font-medium hover:text-foreground transition-colors cursor-pointer"
          >
            Show less
          </button>
        </div>
      )}

      {filter !== "All" && (
        <p className="text-center text-xs text-text-tertiary mt-6">
          Showing {visible.length}{!expanded && hasMore ? ` of ${filtered.length}` : ""} add-ons relevant to {filter}s.{" "}
          <button onClick={() => handleFilter("All")} className="text-primary font-medium hover:underline cursor-pointer">Show all</button>
        </p>
      )}
    </>
  );
}
