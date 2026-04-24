"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Star,
  Crown, Camera, FileInput,
  ClipboardList, Gift, UserCheck, Store, Lightbulb, NotebookPen,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered,
  Users, Calendar, Receipt, MessageCircle, BarChart3,
  Send, Bot,
} from "lucide-react";
import Link from "next/link";
import { CinematicDemo } from "@/components/landing/CinematicDemo";
import { RevealText } from "@/components/landing/RevealText";
import { ScrollMechanic } from "@/components/landing/ScrollMechanic";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { PricingSection } from "@/components/landing/PricingSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import {
  sectionHeadingVariants, sectionTransition, viewportConfig,
  COMPARISON_PERSONAS, ADDON_PERSONAS, ADDON_BORDER_COLORS,
} from "./landing-data";

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const ADDONS_DATA: { name: string; icon: LucideIcon; color: string; gradient: string; desc: string; personas: string[]; preview: React.ReactNode }[] = [
  { name: "Gift Cards", icon: Ticket, color: "pink", gradient: "#EC4899", desc: "Create, sell, and track digital gift vouchers. A revenue channel that markets itself.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ code: "GIFT-7X4K", val: "A$100", s: "Active", sc: "bg-emerald-50 text-emerald-700" }, { code: "GIFT-R9BW", val: "A$25", s: "Partial", sc: "bg-amber-50 text-amber-700" }, { code: "GIFT-5FHQ", val: "A$0", s: "Redeemed", sc: "bg-gray-100 text-gray-500" }].map(r => <div key={r.code} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80"><span className="text-[11px] text-text-secondary font-mono">{r.code}</span><div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-foreground">{r.val}</span><span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span></div></div>)}</div> },
  { name: "Business Insights", icon: Lightbulb, color: "amber", gradient: "#F59E0B", desc: "Key metrics — overdue rebookings, revenue trends, and client retention.", personas: ["Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ t: "Sarah M. is 2 weeks overdue for her lash fill", c: "border-l-red-400", tag: "Action", tc: "bg-red-50 text-red-600" }, { t: "Tom K. opened your quote 3x but hasn\u2019t responded", c: "border-l-amber-400", tag: "Follow up", tc: "bg-amber-50 text-amber-700" }, { t: "Tuesday afternoons are consistently empty", c: "border-l-blue-400", tag: "Opportunity", tc: "bg-blue-50 text-blue-600" }].map((r,i) => <div key={i} className={`px-3 py-2 rounded-lg bg-background/80 border-l-2 ${r.c}`}><p className="text-[11px] text-foreground leading-snug">{r.t}</p><span className={`text-[8px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${r.tc}`}>{r.tag}</span></div>)}</div> },
  { name: "Loyalty & Referrals", icon: Gift, color: "emerald", gradient: "#10B981", desc: "Points per visit, referral codes, and reward tiers for repeat clients.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", pts: "420 pts", r: "1" }, { name: "Emma R.", pts: "310 pts", r: "2" }, { name: "Jess T.", pts: "185 pts", r: "3" }].map(m => <div key={m.r} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/80"><span className="text-[10px] font-bold text-text-tertiary w-4">{m.r}.</span><div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-white">{m.name.split(" ").map(n=>n[0]).join("")}</span></div><span className="text-[11px] text-foreground font-medium flex-1">{m.name}</span><span className="text-[11px] font-bold text-emerald-600">{m.pts}</span></div>)}<div className="px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] text-emerald-700 font-medium">Referral code SARAH10 used 4 times this month</p></div></div> },
  { name: "Memberships", icon: Crown, color: "purple", gradient: "#8B5CF6", desc: "Session packs, recurring plans, and member tracking with auto-billing.", personas: ["Hair Salon", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ plan: "10-Session Pack", price: "A$450", mem: "8 active" }, { plan: "Monthly Unlimited", price: "A$99/mo", mem: "12 active" }].map(p => <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.mem}</p></div><span className="text-[13px] font-bold text-foreground">{p.price}</span></div>)}</div> },
  { name: "Win-Back", icon: UserCheck, color: "amber", gradient: "#F59E0B", desc: "Detect lapsed clients and auto-send re-engagement messages.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", days: "45 days inactive", s: "Contacted", sc: "bg-emerald-50 text-emerald-700" }, { name: "Tom K.", days: "62 days inactive", s: "Detected", sc: "bg-amber-50 text-amber-700" }].map(c => <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.s}</span></div>)}</div> },
  { name: "Storefront", icon: Store, color: "cyan", gradient: "#06B6D4", desc: "A public page showcasing your services with pricing and booking links.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="rounded-lg bg-background/80 p-3"><div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold text-foreground">Your Business</p><span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">Live</span></div><p className="text-[9px] text-text-tertiary mb-2.5">yourbusiness.magic/book</p><div className="space-y-1.5">{["Lash Full Set — A$150", "Brow Lamination — A$65"].map(s => <div key={s} className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-card-bg rounded border border-border-light"><span className="text-text-secondary">{s.split(" — ")[0]}</span><span className="font-bold text-foreground">{s.split(" — ")[1]}</span></div>)}</div></div> },
  { name: "Intake Forms", icon: FileInput, color: "pink", gradient: "#EC4899", desc: "Custom questionnaires with conditional logic for client intake.", personas: ["Lash Tech", "Makeup Artist", "Spa Owner"],
    preview: <div className="rounded-lg bg-background/80 p-3 space-y-2">{["Full Name *", "Email *", "Any allergies?"].map(f => <div key={f}><p className="text-[9px] text-text-tertiary mb-0.5">{f}</p><div className="h-7 bg-card-bg rounded-lg border border-border-light" /></div>)}<div className="h-8 bg-foreground rounded-lg flex items-center justify-center text-[10px] text-background font-semibold">Submit</div></div> },
  { name: "Before & After", icon: Camera, color: "teal", gradient: "#14B8A6", desc: "Capture proof of work with photos and digital checklists.", personas: ["Hair Salon", "Lash Tech", "Nail Tech"],
    preview: <div className="grid grid-cols-2 gap-2.5"><div><p className="text-[9px] text-text-tertiary mb-1.5 text-center font-medium">Before</p><div className="aspect-[4/3] bg-surface rounded-xl border border-border-light flex items-center justify-center"><Camera className="w-6 h-6 text-text-tertiary/20" /></div></div><div><p className="text-[9px] text-teal-600 mb-1.5 text-center font-medium">After</p><div className="aspect-[4/3] bg-teal-50/50 rounded-xl border border-teal-200/50 flex items-center justify-center"><Camera className="w-6 h-6 text-teal-300" /></div></div></div> },
  { name: "Treatment Notes", icon: ClipboardList, color: "indigo", gradient: "#6366F1", desc: "Structured SOAP notes for clinical treatment records.", personas: ["Lash Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ l: "S", label: "Subjective", t: "Client wants fuller brows, previous microblading faded..." }, { l: "O", label: "Objective", t: "Skin type: normal, no sensitivities noted..." }, { l: "A", label: "Assessment", t: "Good candidate for combo brows, patch test clear..." }].map(n => <div key={n.l} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-background/80"><span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{n.l}</span><div><p className="text-[10px] font-semibold text-foreground">{n.label}</p><p className="text-[9px] text-text-tertiary">{n.t}</p></div></div>)}</div> },
  { name: "Notes & Docs", icon: NotebookPen, color: "sky", gradient: "#0EA5E9", desc: "Write notes, create docs, and share with your team. Simple formatting, no bloat.", personas: ["Hair Salon", "Makeup Artist", "Spa Owner"],
    preview: <div className="rounded-xl bg-background/80 overflow-hidden border border-border-light"><div className="px-3 py-1.5 border-b border-border-light flex items-center gap-1.5"><span className="text-[10px] font-bold text-text-secondary px-1.5 py-0.5">B</span><span className="text-[10px] italic text-text-secondary px-1.5 py-0.5">I</span><span className="text-[10px] underline text-text-secondary px-1.5 py-0.5">U</span></div><div className="px-3 py-2.5"><p className="text-[11px] font-bold text-foreground mb-1">Session notes — Sarah M.</p><p className="text-[10px] text-text-secondary leading-relaxed">Discussed goals for Q2. Wants to <span className="font-bold">increase bookings by 20%</span> and launch a referral program.</p><div className="flex items-center gap-1.5 mt-2"><span className="text-[8px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-medium">Linked: Sarah M.</span><span className="text-[8px] px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded font-medium">Pinned</span></div></div></div> },
  { name: "Class Timetable", icon: CalendarRange, color: "violet", gradient: "#8B5CF6", desc: "Visual weekly class schedule with capacity limits and check-in.", personas: ["Spa Owner"],
    preview: <div className="space-y-1.5">{[{ day: "Mon 9:00", name: "Lash Masterclass", cap: "4/8" }, { day: "Wed 6:00", name: "Nail Art Workshop", cap: "6/10" }, { day: "Fri 10:00", name: "Brow Lamination", cap: "5/8" }].map(c => <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div className="flex items-center gap-2.5"><span className="text-[10px] font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-semibold">{c.day}</span><span className="text-[11px] font-semibold text-foreground">{c.name}</span></div><span className="text-[10px] text-text-tertiary font-medium">{c.cap}</span></div>)}</div> },
  { name: "Vendors", icon: Building2, color: "orange", gradient: "#F97316", desc: "Track suppliers, vendor availability, contracts, and payments.", personas: ["Hair Salon", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Lash Supplies AU", type: "Lash Products", stars: 5 }, { name: "Salon Essentials", type: "Hair Products", stars: 4 }, { name: "NailCo Wholesale", type: "Nail Supplies", stars: 5 }].map(v => <div key={v.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{v.name}</p><p className="text-[9px] text-text-tertiary">{v.type}</p></div><div className="flex gap-0.5">{Array.from({length: v.stars}).map((_,i) => <Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />)}</div></div>)}</div> },
  { name: "Proposals", icon: ScrollText, color: "violet", gradient: "#7C3AED", desc: "Branded proposal pages with interactive pricing and e-signature.", personas: ["Makeup Artist"],
    preview: <div className="space-y-1.5">{[{ id: "PROP-001", title: "Bridal Package", s: "Sent", amt: "A$650", sc: "bg-blue-50 text-blue-600" }, { id: "PROP-002", title: "Lash Package", s: "Viewed", amt: "A$350", sc: "bg-amber-50 text-amber-700" }, { id: "PROP-003", title: "Wedding Party", s: "Accepted \u2713", amt: "A$1,200", sc: "bg-emerald-50 text-emerald-700" }].map(p => <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div className="flex items-center gap-2"><span className="text-[9px] font-mono text-text-tertiary">{p.id}</span><span className="text-[11px] font-semibold text-foreground">{p.title}</span></div><div className="flex items-center gap-2"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.s}</span><span className="text-[11px] font-bold text-foreground">{p.amt}</span></div></div>)}</div> },
  { name: "Waitlist", icon: ListOrdered, color: "teal", gradient: "#14B8A6", desc: "Manage walk-in queues and auto-notify clients when spots open up.", personas: ["Hair Salon", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Emma R.", d: "Lash Fill", s: "Waiting", sc: "bg-amber-50 text-amber-700" }, { name: "Tom K.", d: "2:00 PM slot", s: "Notified \u2713", sc: "bg-blue-50 text-blue-600" }].map(w => <div key={w.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{w.name}</p><p className="text-[9px] text-text-tertiary">{w.d}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${w.sc}`}>{w.s}</span></div>)}<div className="px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100"><p className="text-[10px] text-teal-700 font-medium">Spot opened! Auto-notified 2 clients</p></div></div> },
];

const FEATURED_ADDONS = ["Proposals", "Win-Back", "Waitlist"];

function AddonsGrid({ viewportConfig }: { viewportConfig: { once: boolean; margin: string } }) {
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

  // Reset expanded when filter changes
  const handleFilter = (p: string) => {
    setFilter(p);
    setExpanded(false);
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {ADDON_PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => handleFilter(p)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === p
                ? "bg-foreground text-background shadow-md"
                : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-5">
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
                className={`w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${ADDON_BORDER_COLORS[addon.color] ?? ""}`}
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
                <div className="relative px-5 pb-4">
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

function ComparisonToggle({ viewportConfig }: { viewportConfig: { once: boolean; margin: string } }) {
  const [active, setActive] = useState(0);
  const persona = COMPARISON_PERSONAS[active];

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {COMPARISON_PERSONAS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActive(i)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              active === i
                ? "text-white shadow-md"
                : "bg-surface border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/20"
            }`}
            style={active === i ? { backgroundColor: p.accent } : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generic CRM */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border-light p-6 bg-card-bg"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Generic software</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Contacts", sublabel: "Generic contact database" },
              { label: "Deals", sublabel: "Sales pipeline you don\u2019t use" },
              { label: "Tasks", sublabel: "Project management you didn\u2019t ask for" },
              { label: "Invoicing", sublabel: "One-size-fits-all billing" },
              { label: "Settings", sublabel: "200 options to figure out yourself" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50">
                <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary/30" />
                <div>
                  <p className="text-sm font-medium text-text-secondary">{item.label}</p>
                  <p className="text-xs text-text-tertiary">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Magic CRM — persona-specific */}
        <AnimatePresence mode="wait">
          <motion.div
            key={persona.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 p-6 bg-card-bg relative overflow-hidden"
            style={{ borderColor: persona.accent + "33" }}
          >
            <div className="absolute top-0 left-0 right-0 h-24 opacity-[0.06]" style={{ background: `linear-gradient(to bottom, ${persona.accent}, transparent)` }} />
            <div className="relative flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.accent }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: persona.accent }}>Magic for a {persona.label}</span>
            </div>
            <div className="relative space-y-3">
              {persona.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border" style={{ backgroundColor: persona.accent + "08", borderColor: persona.accent + "18" }}>
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: persona.accent }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[13px] font-medium" style={{ color: persona.accent }}>{item.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ── AI Chat Demo ──

type ChatMessage = {
  role: "user" | "ai";
  text: string;
  card?: React.ReactNode;
};

const AI_CHAT_CONVERSATIONS: { label: string; icon: typeof Receipt; messages: ChatMessage[] }[] = [
  {
    label: "Send an invoice",
    icon: Receipt,
    messages: [
      { role: "user", text: "Send Sarah M. her invoice for today\u2019s lash fill" },
      { role: "ai", text: "Here\u2019s the invoice I\u2019ve prepared:",
        card: (
          <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-text-tertiary">INV-1047</span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Sent</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Sarah M.</p>
                <p className="text-[11px] text-text-tertiary">Lash Full Set</p>
              </div>
              <p className="text-[18px] font-bold text-foreground">A$120</p>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border-light">
              <span className="text-[10px] text-text-tertiary flex items-center gap-1"><MessageCircle className="w-3 h-3" /> SMS sent</span>
              <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Send className="w-3 h-3" /> Email sent</span>
            </div>
          </div>
        ),
      },
      { role: "user", text: "Perfect. Does she have any upcoming bookings?" },
      { role: "ai", text: "Yes \u2014 she has a lash fill booked for April 28 at 10:00 AM. That\u2019s 9 days away. She\u2019s also due for a brow tint based on her usual 6-week cycle. Want me to suggest that when she comes in?" },
    ],
  },
  {
    label: "Check availability",
    icon: Calendar,
    messages: [
      { role: "user", text: "Am I free Thursday at 2pm? Can I fit a volume set?" },
      { role: "ai", text: "Let me check your Thursday schedule:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5 space-y-1.5">
            {[
              { time: "9:00 AM", client: "Megan T.", service: "Classic Set", color: "#EC4899" },
              { time: "12:00 PM", client: "Lunch break", service: "", color: "#9CA3AF" },
              { time: "2:00 PM", client: "Available", service: "2.5hr slot open", color: "#10B981" },
              { time: "5:00 PM", client: "Lily P.", service: "Lash Lift", color: "#8B5CF6" },
            ].map((s) => (
              <div key={s.time} className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-text-tertiary w-14 flex-shrink-0">{s.time}</span>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <p className={`text-[12px] font-medium ${s.color === "#10B981" ? "text-emerald-600" : "text-foreground"}`}>{s.client}</p>
                  {s.service && <p className="text-[10px] text-text-tertiary">{s.service}</p>}
                </div>
              </div>
            ))}
          </div>
        ),
      },
      { role: "ai", text: "A volume set (2.5hrs) would finish at 4:30 PM, and Lily P. is at 5:00 PM. You\u2019re good with 30 min buffer. Want me to hold the slot?" },
      { role: "user", text: "Yes, hold it for now" },
      { role: "ai", text: "Done. Thursday 2:00 PM is now blocked as a hold. I\u2019ll remind you tomorrow if it\u2019s still unbooked." },
    ],
  },
  {
    label: "Business insights",
    icon: BarChart3,
    messages: [
      { role: "user", text: "How did this week compare to last week?" },
      { role: "ai", text: "Here\u2019s your weekly snapshot:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "Revenue", value: "A$2,840", change: "+18%", up: true },
                { label: "Bookings", value: "24", change: "+3", up: true },
                { label: "Rebooking", value: "71%", change: "+9%", up: true },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">{m.label}</p>
                  <p className="text-[18px] font-bold text-foreground leading-tight">{m.value}</p>
                  <p className={`text-[11px] font-semibold ${m.up ? "text-emerald-600" : "text-red-500"}`}>{m.change}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-border-light">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-[11px] text-text-secondary">Tuesday afternoon is still your quietest slot</p>
            </div>
          </div>
        ),
      },
      { role: "user", text: "What can I do about those empty Tuesdays?" },
      { role: "ai", text: "Three options: run a 10% Tuesday-only promo to your 18 clients who\u2019ve visited in the last 60 days, open Tuesday slots on your Instagram booking link, or try a last-minute deal via SMS on Monday evening. Want me to draft any of these?" },
    ],
  },
  {
    label: "Client lookup",
    icon: Users,
    messages: [
      { role: "user", text: "What products did I use on Emma R. last time?" },
      { role: "ai", text: "Here\u2019s Emma R.\u2019s last visit:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-pink-600">ER</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Emma R.</p>
                <p className="text-[10px] text-text-tertiary">Last visit: March 12, 2026</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Service</p>
              <p className="text-[12px] text-foreground">Classic Lash Set</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Products</p>
              <p className="text-[12px] text-foreground">Lash Box LA C-curl 0.15mm, 10\u201313mm mix</p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-border-light">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Note: Mild sensitivity on outer corners</span>
            </div>
          </div>
        ),
      },
      { role: "user", text: "She\u2019s coming in tomorrow. Should I adjust anything?" },
      { role: "ai", text: "Based on her sensitivity note, I\u2019d suggest switching to a sensitive adhesive for the outer corners, or going with a slightly shorter length (11mm max) on the outer edges. I\u2019ve added a prep reminder to her appointment for tomorrow." },
    ],
  },
];

function AIChatDemo() {
  const [activeConvo, setActiveConvo] = useState(0);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [animatingConvo, setAnimatingConvo] = useState(0);
  const [completedConvos, setCompletedConvos] = useState<Set<number>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const convo = AI_CHAT_CONVERSATIONS[activeConvo];
  const isCompleted = completedConvos.has(activeConvo);

  // Reset the animation counter during render when we switch to a
  // not-yet-completed conversation. This avoids a setState-in-effect.
  if (!isCompleted && animatingConvo !== activeConvo) {
    setAnimatingConvo(activeConvo);
    setAnimatedCount(0);
  }

  const visibleMessages = isCompleted
    ? convo.messages.length
    : animatingConvo === activeConvo
    ? animatedCount
    : 0;

  useEffect(() => {
    // Already-played conversations render in full; no animation needed.
    if (isCompleted) return;

    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;

    // Pace the reveal: give AI responses a longer "typing" window and
    // let the user's follow-ups breathe instead of snapping instantly.
    let cumulative = 0;
    const delays = convo.messages.map((msg, i) => {
      if (i === 0) {
        cumulative = 500;
      } else if (msg.role === "ai") {
        cumulative += 1900; // typing indicator before AI response
      } else {
        cumulative += 1500; // user "thinking" before typing a reply
      }
      return cumulative;
    });

    const timers: ReturnType<typeof setTimeout>[] = delays.map((delay, i) =>
      setTimeout(() => setAnimatedCount(i + 1), delay)
    );
    // Mark this conversation as played once the last message is visible.
    const finalIdx = activeConvo;
    timers.push(
      setTimeout(
        () => setCompletedConvos((prev) => new Set(prev).add(finalIdx)),
        (delays[delays.length - 1] ?? 0) + 150
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [activeConvo, isCompleted, convo.messages]);

  // Auto-scroll chat container to bottom as new messages appear
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportConfig}
      transition={{ duration: 0.5 }}
      className="relative py-12 sm:py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--card-bg) 0%, var(--background) 50%, var(--card-bg) 100%)" }}
    >
      {/* Decorative glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, var(--logo-green) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[2rem] sm:text-[2.75rem] font-bold text-foreground leading-[1.08] mb-4 tracking-tight"
          >
            Just ask your <span className="text-primary">AI</span>. Magic handles it.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-text-secondary text-[15px] sm:text-[16px] max-w-xl mx-auto leading-relaxed"
          >
            Send invoices, check bookings, pull up a client card, or review rebooking. Type it like you&apos;d say it.
          </motion.p>
        </div>

        {/* Conversation tabs -- horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex justify-center gap-2 mb-8 overflow-x-auto scrollbar-hide pb-1"
        >
          {AI_CHAT_CONVERSATIONS.map((c, i) => {
            const Icon = c.icon;
            const active = activeConvo === i;
            return (
              <button
                key={c.label}
                onClick={() => setActiveConvo(i)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  active
                    ? "bg-foreground text-background shadow-[0_6px_20px_-6px_rgba(10,10,10,0.4)]"
                    : "bg-card-bg border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/25 hover:-translate-y-0.5"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "" : "text-text-tertiary"}`} />
                {c.label}
              </button>
            );
          })}
        </motion.div>

        {/* Chat + flanking insight notes */}
        <div className="grid lg:grid-cols-[minmax(200px,1fr)_minmax(0,680px)_minmax(200px,1fr)] gap-8 lg:gap-12 items-center">
          {/* Left insight notes — desktop only */}
          <div className="hidden lg:flex flex-col gap-10">
            {[
              { title: "Reads your workspace", desc: "Every client, booking, and payment — already loaded. No prompts to engineer." },
              { title: "Speaks beauty & wellness", desc: "Lash fills, brow tints, regrowth cycles. The vocab is built in." },
            ].map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="relative pl-5"
              >
                <span className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                </span>
                <p className="text-[14px] font-bold text-foreground mb-1.5 tracking-tight">{note.title}</p>
                <p className="text-[12.5px] text-text-secondary leading-relaxed">{note.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Chat window */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-6 rounded-[32px] opacity-[0.09] blur-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, var(--logo-green), #8B5CF6)" }} />

            <div className="relative bg-background rounded-[20px] border border-border-light overflow-hidden shadow-[0_24px_60px_-20px_rgba(10,10,10,0.18),0_8px_20px_-8px_rgba(10,10,10,0.08)]">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-light bg-gradient-to-b from-surface/60 to-surface/20">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shadow-[0_4px_12px_-3px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-foreground tracking-tight">Magic AI</p>
                <p className="text-[11px] text-text-tertiary truncate">Reads and writes across your workspace</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-700 font-semibold">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="px-5 py-5 h-[360px] sm:h-[400px] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeConvo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {convo.messages.map((msg, i) => (
                    <AnimatePresence key={i}>
                      {visibleMessages > i && (
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "ai" && (
                            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                              <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
                            </div>
                          )}
                          <div
                            className={`max-w-[82%] sm:max-w-[78%] rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-foreground text-background rounded-br-md shadow-[0_6px_16px_-4px_rgba(10,10,10,0.25)]"
                                : "bg-primary/[0.06] border border-primary/15 text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-[13.5px] leading-relaxed">{msg.text}</p>
                            {msg.card && msg.card}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}

                  {/* Typing indicator */}
                  {visibleMessages < convo.messages.length && visibleMessages > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                        <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
                      </div>
                      <div className="bg-primary/[0.06] border border-primary/15 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map((d) => (
                          <motion.div
                            key={d}
                            className="w-1.5 h-1.5 rounded-full bg-primary/60"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="px-5 pb-4 pt-3 border-t border-border-light bg-gradient-to-b from-transparent to-surface/30">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-card-bg rounded-xl border border-border-light shadow-sm">
                <span className="text-[13px] text-text-tertiary flex-1 flex items-center gap-1.5">
                  Ask Magic anything about your business…
                  <motion.span
                    className="inline-block w-[2px] h-3.5 bg-text-tertiary/70 rounded-sm"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                </span>
                <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                  <Send className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            </div>
          </motion.div>

          {/* Right insight notes — desktop only */}
          <div className="hidden lg:flex flex-col gap-10">
            {[
              { title: "Takes real actions", desc: "Not just answers — sends invoices, books appointments, drafts campaigns." },
              { title: "Always asks first", desc: "Every change shows a draft. Nothing sends until you confirm." },
            ].map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, x: 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                className="relative pr-5 text-right"
              >
                <span className="absolute right-0 top-1 w-2.5 h-2.5 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                </span>
                <p className="text-[14px] font-bold text-foreground mb-1.5 tracking-tight">{note.title}</p>
                <p className="text-[12.5px] text-text-secondary leading-relaxed">{note.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile / tablet insight notes — stacked below chat */}
        <div className="flex flex-col gap-5 mt-8 lg:hidden max-w-md mx-auto">
          {[
            { title: "Reads your workspace", desc: "Every client, booking, and payment — already loaded." },
            { title: "Speaks beauty & wellness", desc: "Lash fills, brow tints, regrowth cycles — vocab built in." },
            { title: "Takes real actions", desc: "Sends invoices, books appointments, drafts campaigns." },
            { title: "Always asks first", desc: "Every change shows a draft. Nothing sends without your confirmation." },
          ].map((note, i) => (
            <motion.div
              key={note.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
              className="border-l-2 border-primary/40 pl-3.5"
            >
              <p className="text-[13px] font-bold text-foreground mb-1 tracking-tight">{note.title}</p>
              <p className="text-[12px] text-text-secondary leading-relaxed">{note.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}


export default function LandingPage() {
  // Global scroll progress for the progress bar
  const { scrollYProgress } = useScroll();

  // Hero parallax — heading moves slower than scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 40]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7, 1], [1, 0.8, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.97]);

  return (
    <div className="min-h-screen bg-background grid-pattern noise-bg">
      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
        style={{
          scaleX: scrollYProgress,
          backgroundColor: "var(--primary)",
          willChange: "transform",
        }}
      />

      {/* Nav */}
      <SiteHeader />

      {/* Hero */}
      <section ref={heroRef} className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-36 pb-20 sm:pb-28 text-center relative overflow-hidden">

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale, willChange: "transform, opacity" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[13px] text-text-secondary font-medium mb-6"
          >
            The business platform for beauty &amp; wellness
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[2.25rem] sm:text-[3.5rem] md:text-[4.25rem] font-bold mb-6 leading-[1.05]"
          >
            <span className="gradient-text">Grow your beauty business.</span><br />
            <span className="text-text-secondary">Not your admin.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[15px] sm:text-[17px] text-text-secondary mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Bookings, clients, payments, and smart reminders — built for hair, lash, nail, and spa businesses in Australia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-10 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90"
            >
              Join the waitlist <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-text-tertiary">
              Be first in line when we open seats.
            </p>
          </motion.div>
        </motion.div>

      </section>

      {/* Reveal text — scroll-driven word fade-in */}
      <RevealText />

      {/* Scroll mechanic — Pinterest grid → zoom → horizontal pan */}
      <ScrollMechanic />

      {/* Trust bar archived to src/archive/TrustBar.tsx */}

      {/* Cinematic Demo */}
      <CinematicDemo />

      {/* AI Chat Demo */}
      <AIChatDemo />

      {/* The Difference — Generic CRM vs Magic */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24 bg-card-bg"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3"
            >
              Built for your specialty. Not for everyone.
            </motion.h2>
          </div>

          <ComparisonToggle viewportConfig={viewportConfig} />
        </div>
      </motion.section>

      {/* Add-ons */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-3"
            >
              Extend it when you&apos;re ready.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              Start lean. Add gift cards, loyalty, intake forms, or memberships when your business is ready. One click, no migration.
            </motion.p>
          </div>

          <AddonsGrid viewportConfig={viewportConfig} />
        </div>
      </motion.section>

      {/* Why switch from Fresha/Timely */}
      <ComparisonSection />

      {/* Pricing */}
      <PricingSection />

      {/* Closing + footer */}
      <SiteFooter />
    </div>
  );
}
