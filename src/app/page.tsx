"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Star,
  Zap, Crown, Camera, FileInput,
  ClipboardList, Gift, UserCheck, Store, Lightbulb, Puzzle, Sparkles, NotebookPen,
  Ticket, CalendarRange, Building2, ScrollText, ListOrdered, BrainCircuit, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CinematicDemo } from "@/components/landing/CinematicDemo";

// ── Shared animation variants ──

const sectionHeadingVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sectionTransition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

const viewportConfig = { once: true, margin: "-40px" as const };

const ctaPulseVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const testimonialVariants = {
  hidden: { opacity: 0, x: -40, rotate: -1 },
  visible: { opacity: 1, x: 0, rotate: 0 },
};

// ── Persona comparison data ──

const PERSONA_PREVIEWS = [
  {
    label: "Lash Tech",
    businessName: "Lash Lab Co",
    industry: "Beauty & Wellness",
    accent: "#EC4899",
    nav: ["Clients", "Services", "Appointments", "Receipts", "Leads"],
    activeNav: "Services",
    contentTitle: "Service Menu",
    items: [
      { name: "Classic Full Set", meta: "2hr", value: "$150" },
      { name: "Volume Full Set", meta: "2.5hr", value: "$200" },
      { name: "Lash Lift & Tint", meta: "1hr", value: "$80" },
      { name: "Lash Removal", meta: "30min", value: "$25" },
    ],
    fields: ["Allergies", "Skin Type", "Preferred Products"],
  },
  {
    label: "Hair Salon",
    businessName: "Glow Studio",
    industry: "Beauty & Wellness",
    accent: "#8B5CF6",
    nav: ["Clients", "Services", "Appointments", "Receipts", "Inquiries"],
    activeNav: "Clients",
    contentTitle: "Client List",
    items: [
      { name: "Sarah M.", meta: "VIP", value: "Last: 2 weeks ago" },
      { name: "Emma R.", meta: "Regular", value: "Last: 5 days ago" },
      { name: "Jessica T.", meta: "Active", value: "Last: 3 weeks ago" },
      { name: "Olivia C.", meta: "Prospect", value: "Enquired balayage" },
    ],
    fields: ["Hair Type", "Colour Formula", "Scalp Condition"],
  },
  {
    label: "Makeup Artist",
    businessName: "Bridal Glam Co",
    industry: "Beauty & Wellness",
    accent: "#F59E0B",
    nav: ["Clients", "Inquiries", "Appointments", "Invoices", "Services"],
    activeNav: "Inquiries",
    contentTitle: "Wedding Inquiries",
    items: [
      { name: "Jessica & Ryan", meta: "Trial Booked", value: "$650" },
      { name: "Sophie & James", meta: "New Inquiry", value: "$850" },
      { name: "Megan L.", meta: "Quoted", value: "$180" },
      { name: "Anna K.", meta: "Booked", value: "$300" },
    ],
    fields: ["Skin Tone", "Foundation Shade", "Wedding Date"],
  },
];

const INDUSTRIES = [
  "Hair Salons", "Nail Techs", "Lash & Brow",
  "Barbers", "Makeup Artists", "Spas & Massage",
];

// ── Comparison section data ──

const COMPARISON_PERSONAS = [
  {
    label: "Hair Salon",
    accent: "#8B5CF6",
    items: [
      { label: "Clients", sublabel: "With hair type, colour formula, allergies" },
      { label: "Appointments", sublabel: "Calendar with services and rebooking" },
      { label: "Services", sublabel: "Your cuts, colours, and treatments with pricing" },
      { label: "Receipts", sublabel: "Pay-at-chair billing, no quotes or proposals" },
      { label: "Inquiries", sublabel: "Instagram DMs \u2192 leads, one click" },
    ],
  },
  {
    label: "Lash Tech",
    accent: "#EC4899",
    items: [
      { label: "Clients", sublabel: "Allergies, skin type, preferred products" },
      { label: "Appointments", sublabel: "With set durations and no-show deposits" },
      { label: "Service Menu", sublabel: "Classic, volume, lifts \u2014 with pricing" },
      { label: "Receipts", sublabel: "Pay after service, tips included" },
      { label: "Aftercare", sublabel: "Auto-send care instructions post-appointment" },
    ],
  },
  {
    label: "Makeup Artist",
    accent: "#F59E0B",
    items: [
      { label: "Inquiries", sublabel: "Wedding date, party size, budget \u2014 captured upfront" },
      { label: "Proposals", sublabel: "Branded quotes with packages and e-signature" },
      { label: "Invoicing", sublabel: "Deposit-based billing with milestone payments" },
      { label: "Clients", sublabel: "Skin tone, foundation shade, allergy notes" },
      { label: "Trial Bookings", sublabel: "Separate trial and wedding-day scheduling" },
    ],
  },
  {
    label: "Nail Tech",
    accent: "#10B981",
    items: [
      { label: "Clients", sublabel: "Nail shape, gel vs acrylic, allergy flags" },
      { label: "Service Menu", sublabel: "Manicure, pedicure, nail art \u2014 with durations" },
      { label: "Appointments", sublabel: "Home studio + mobile bookings" },
      { label: "Receipts", sublabel: "Card and cash tracking per session" },
      { label: "Reminders", sublabel: "Auto nudge when fill or maintenance is due" },
    ],
  },
  {
    label: "Spa Owner",
    accent: "#6366F1",
    items: [
      { label: "Clients", sublabel: "Pressure preferences, contraindications, history" },
      { label: "Team Schedule", sublabel: "Multi-therapist calendar across rooms" },
      { label: "Treatment Menu", sublabel: "Massages, facials, body wraps with pricing" },
      { label: "Receipts", sublabel: "Front-desk checkout with tips and upsells" },
      { label: "Reporting", sublabel: "Revenue by therapist, utilisation, rebooking rate" },
    ],
  },
];

// ── Add-ons section data with persona tags ──

const ADDON_PERSONAS = ["All", "Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ADDONS_DATA: { name: string; icon: any; color: string; gradient: string; desc: string; personas: string[]; preview: React.ReactNode }[] = [
  { name: "Gift Cards", icon: Ticket, color: "pink", gradient: "#EC4899", desc: "Create, sell, and track digital gift vouchers. A revenue channel that markets itself.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ code: "GIFT-7X4K", val: "$100", s: "Active", sc: "bg-emerald-50 text-emerald-700" }, { code: "GIFT-R9BW", val: "$25", s: "Partial", sc: "bg-amber-50 text-amber-700" }, { code: "GIFT-5FHQ", val: "$0", s: "Redeemed", sc: "bg-gray-100 text-gray-500" }].map(r => <div key={r.code} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80"><span className="text-[11px] text-text-secondary font-mono">{r.code}</span><div className="flex items-center gap-2"><span className="text-[11px] font-semibold text-foreground">{r.val}</span><span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span></div></div>)}</div> },
  { name: "AI Insights", icon: Lightbulb, color: "amber", gradient: "#F59E0B", desc: "Smart suggestions — overdue rebookings, revenue forecasts, and churn risk.", personas: ["Hair Salon", "Lash Tech", "Makeup Artist", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ t: "Sarah M. is 2 weeks overdue for her lash fill", c: "border-l-red-400", tag: "Action", tc: "bg-red-50 text-red-600" }, { t: "Tom K. opened your quote 3x but hasn\u2019t responded", c: "border-l-amber-400", tag: "Follow up", tc: "bg-amber-50 text-amber-700" }, { t: "Tuesday afternoons are consistently empty", c: "border-l-blue-400", tag: "Opportunity", tc: "bg-blue-50 text-blue-600" }].map((r,i) => <div key={i} className={`px-3 py-2 rounded-lg bg-background/80 border-l-2 ${r.c}`}><p className="text-[11px] text-foreground leading-snug">{r.t}</p><span className={`text-[8px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${r.tc}`}>{r.tag}</span></div>)}</div> },
  { name: "Loyalty & Referrals", icon: Gift, color: "emerald", gradient: "#10B981", desc: "Points per visit, referral codes, and reward tiers for repeat clients.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", pts: "420 pts", r: "1" }, { name: "Emma R.", pts: "310 pts", r: "2" }, { name: "Jess T.", pts: "185 pts", r: "3" }].map(m => <div key={m.r} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/80"><span className="text-[10px] font-bold text-text-tertiary w-4">{m.r}.</span><div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-white">{m.name.split(" ").map(n=>n[0]).join("")}</span></div><span className="text-[11px] text-foreground font-medium flex-1">{m.name}</span><span className="text-[11px] font-bold text-emerald-600">{m.pts}</span></div>)}<div className="px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] text-emerald-700 font-medium">Referral code SARAH10 used 4 times this month</p></div></div> },
  { name: "Memberships", icon: Crown, color: "purple", gradient: "#8B5CF6", desc: "Session packs, recurring plans, and member tracking with auto-billing.", personas: ["Hair Salon", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ plan: "10-Session Pack", price: "$450", mem: "8 active" }, { plan: "Monthly Unlimited", price: "$99/mo", mem: "12 active" }].map(p => <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.mem}</p></div><span className="text-[13px] font-bold text-foreground">{p.price}</span></div>)}</div> },
  { name: "Win-Back", icon: UserCheck, color: "amber", gradient: "#F59E0B", desc: "Detect lapsed clients and auto-send re-engagement messages.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Sarah M.", days: "45 days inactive", s: "Contacted", sc: "bg-emerald-50 text-emerald-700" }, { name: "Tom K.", days: "62 days inactive", s: "Detected", sc: "bg-amber-50 text-amber-700" }].map(c => <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.s}</span></div>)}</div> },
  { name: "Storefront", icon: Store, color: "cyan", gradient: "#06B6D4", desc: "A public page showcasing your services with pricing and booking links.", personas: ["Hair Salon", "Lash Tech", "Nail Tech", "Spa Owner"],
    preview: <div className="rounded-lg bg-background/80 p-3"><div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold text-foreground">Your Business</p><span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">Live</span></div><p className="text-[9px] text-text-tertiary mb-2.5">yourbusiness.magic/book</p><div className="space-y-1.5">{["Lash Full Set — $150", "Brow Lamination — $65"].map(s => <div key={s} className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-card-bg rounded border border-border-light"><span className="text-text-secondary">{s.split(" — ")[0]}</span><span className="font-bold text-foreground">{s.split(" — ")[1]}</span></div>)}</div></div> },
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
    preview: <div className="space-y-1.5">{[{ id: "PROP-001", title: "Bridal Package", s: "Sent", amt: "$650", sc: "bg-blue-50 text-blue-600" }, { id: "PROP-002", title: "Lash Package", s: "Viewed", amt: "$350", sc: "bg-amber-50 text-amber-700" }, { id: "PROP-003", title: "Wedding Party", s: "Accepted \u2713", amt: "$1,200", sc: "bg-emerald-50 text-emerald-700" }].map(p => <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80"><div className="flex items-center gap-2"><span className="text-[9px] font-mono text-text-tertiary">{p.id}</span><span className="text-[11px] font-semibold text-foreground">{p.title}</span></div><div className="flex items-center gap-2"><span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.s}</span><span className="text-[11px] font-bold text-foreground">{p.amt}</span></div></div>)}</div> },
  { name: "Waitlist", icon: ListOrdered, color: "teal", gradient: "#14B8A6", desc: "Manage walk-in queues and auto-notify clients when spots open up.", personas: ["Hair Salon", "Nail Tech", "Spa Owner"],
    preview: <div className="space-y-1.5">{[{ name: "Emma R.", d: "Lash Fill", s: "Waiting", sc: "bg-amber-50 text-amber-700" }, { name: "Tom K.", d: "2:00 PM slot", s: "Notified \u2713", sc: "bg-blue-50 text-blue-600" }].map(w => <div key={w.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80"><div><p className="text-[11px] font-semibold text-foreground">{w.name}</p><p className="text-[9px] text-text-tertiary">{w.d}</p></div><span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${w.sc}`}>{w.s}</span></div>)}<div className="px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100"><p className="text-[10px] text-teal-700 font-medium">Spot opened! Auto-notified 2 clients</p></div></div> },
];

const ADDON_BORDER_COLORS: Record<string, string> = {
  pink: "hover:border-pink-200", amber: "hover:border-amber-200", emerald: "hover:border-emerald-200",
  purple: "hover:border-purple-200", cyan: "hover:border-cyan-200", teal: "hover:border-teal-200",
  indigo: "hover:border-indigo-200", sky: "hover:border-sky-200", violet: "hover:border-violet-200",
  orange: "hover:border-orange-200",
};

function AddonsGrid({ viewportConfig }: { viewportConfig: { once: boolean; margin: string } }) {
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All" ? ADDONS_DATA : ADDONS_DATA.filter((a) => a.personas.includes(filter));

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {ADDON_PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
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
          {filtered.map((addon) => {
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

      {filter !== "All" && (
        <p className="text-center text-xs text-text-tertiary mt-6">
          Showing {filtered.length} of {ADDONS_DATA.length} add-ons relevant to {filter}s.{" "}
          <button onClick={() => setFilter("All")} className="text-primary font-medium hover:underline cursor-pointer">Show all</button>
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

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(0);

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
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-3.5 h-3.5 bg-card-bg rounded-sm" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">Magic</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium">
            Log in
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center relative overflow-hidden">

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
            The AI-powered CRM for beauty professionals
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[2.25rem] sm:text-[3.5rem] md:text-[4rem] font-bold mb-6 leading-[1.05]"
          >
            <span className="gradient-text">Clients, bookings, payments.</span><br />
            <span className="text-text-secondary">All in one place.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-[15px] sm:text-[17px] text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Magic is the CRM that knows your clients, manages your calendar, and tells you who to rebook — built specifically for hairstylists, lash techs, nail artists, and beauty pros.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Get started free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-text-tertiary">
              Set up in 60 seconds. No credit card needed.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar — removed, numbers mentioned elsewhere */}

      {/* Industry tags */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="pb-12 sm:pb-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5 }}
            className="text-center text-sm text-text-tertiary mb-4 font-medium"
          >
            Made for Beauty Professionals.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((industry, i) => (
              <motion.span
                key={industry}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: 0.4 + i * 0.04, duration: 0.4 }}
                className="px-4 py-2 bg-surface border border-border-light rounded-full text-[13px] font-medium text-text-secondary"
              >
                {industry}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-[13px] text-text-tertiary mt-4 max-w-md mx-auto">
            Built for hair, nails, lashes, makeup, and more. Tested. Ready to go.
          </p>
        </div>
      </motion.section>

      {/* Persona Comparison — side by side */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-card-bg"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3"
            >
              One platform. Shaped to your specialty.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              A lash tech sees Appointments and Services. A hair salon sees Clients with colour formulas. A makeup artist sees Wedding Inquiries with deposits. Same platform, shaped to how you actually work.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONA_PREVIEWS.map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => setActivePersona(i)}
                className={`bg-card-bg rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 glow-border ${
                  activePersona === i
                    ? "border-foreground/20 shadow-xl scale-[1.03] -translate-y-1"
                    : "border-border-light hover:border-foreground/10 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: `2px solid ${persona.accent}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: persona.accent + "18" }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: persona.accent }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground leading-none">{persona.businessName}</p>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ backgroundColor: persona.accent + "15", color: persona.accent }}>{persona.label}</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{persona.industry}</p>
                  </div>
                </div>
                <div className="flex" style={{ minHeight: 195 }}>
                  <div className="w-[100px] border-r border-border-light p-1.5 flex flex-col gap-0.5">
                    {persona.nav.map((item) => (
                      <div key={item} className={`text-[11px] py-1.5 px-2 rounded-md ${item === persona.activeNav ? "bg-background font-semibold text-foreground shadow-sm" : "text-text-tertiary"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-3">
                    <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">{persona.contentTitle}</p>
                    <div className="space-y-1.5">
                      {persona.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 bg-background rounded-lg px-2.5 py-1.5">
                          {"stageColor" in item && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.stageColor}`} />}
                          <span className="text-[11px] text-foreground font-medium flex-1 truncate">{item.name}</span>
                          <span className="text-[10px] text-text-tertiary">{item.meta}</span>
                          {"stageColor" in item
                            ? <span className="text-[10px] font-medium text-text-secondary">{item.value}</span>
                            : <span className="text-[11px] font-semibold text-foreground">{item.value}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2.5 border-t border-border-light">
                  <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Client fields</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.fields.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 bg-background border border-border-light rounded-full text-text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works — the 3-step assembly process */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-3"
            >
              Ready in 60 seconds.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              Pick your specialty, name your business, and your workspace is ready.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Tell us what you do",
                description: "Lash tech? Hairstylist? Makeup artist? Pick your specialty and we set up your workspace with the right services, fields, and vocabulary.",
                detail: "6 beauty personas, one click",
              },
              {
                step: "02",
                title: "Your workspace builds itself",
                description: "Clients with colour formulas. Appointments with service menus. Invoices with your branding. All pre-configured for how you actually work.",
                detail: "Customized to your specialty",
              },
              {
                step: "03",
                title: "Start booking clients",
                description: "Share your booking link on Instagram. Clients book themselves. You get reminders, smart nudges to rebook, and invoices that send themselves.",
                detail: "Your clients book, you focus on your craft",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="relative"
              >
                <div className="text-[48px] sm:text-[56px] font-bold text-foreground/[0.12] leading-none mb-3">{item.step}</div>
                <h3 className="text-[17px] font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-3">{item.description}</p>
                <p className="text-xs text-text-tertiary font-medium">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Cinematic Demo */}
      <CinematicDemo />

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
              Not another tool with settings you&apos;ll never touch.
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
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewportConfig} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 px-3.5 py-1 bg-surface border border-border-light rounded-full text-[11px] font-medium text-text-secondary mb-5">
              <Puzzle className="w-3 h-3" /> Install anytime
            </motion.div>
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
              Your core workspace is built for you. These add-ons snap in when the time is right — one click, no migration.
            </motion.p>
          </div>

          <AddonsGrid viewportConfig={viewportConfig} />
          <div className="hidden">{/* Gift Cards - legacy block start */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-pink-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #EC4899, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10 mb-3"><Ticket className="w-5 h-5 text-pink-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Gift Cards</h3>
                <p className="text-xs text-text-secondary mt-1">Create, sell, and track digital gift vouchers. A revenue channel that markets itself.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ label: "GIFT-7X4K-M2NP", value: "$100.00", status: "Active" }, { label: "GIFT-R9BW-3CTL", value: "$25.00", status: "Partial" }, { label: "GIFT-5FHQ-8YJA", value: "$0.00", status: "Redeemed" }].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[11px] text-text-secondary font-mono">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{row.value}</span>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : row.status === "Partial" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.06 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-amber-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #F59E0B, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 mb-3"><Lightbulb className="w-5 h-5 text-amber-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">AI Insights</h3>
                <p className="text-xs text-text-secondary mt-1">Smart suggestions — overdue rebookings, revenue forecasts, and churn risk.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ text: "Sarah M. is 2 weeks overdue for her lash fill", color: "border-l-red-400", tag: "Action", tagColor: "bg-red-50 text-red-600" }, { text: "Tom K. opened your quote 3x but hasn\u2019t responded", color: "border-l-amber-400", tag: "Follow up", tagColor: "bg-amber-50 text-amber-700" }, { text: "Tuesday afternoons are consistently empty", color: "border-l-blue-400", tag: "Opportunity", tagColor: "bg-blue-50 text-blue-600" }].map((insight, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg bg-background/80 border-l-2 ${insight.color}`}>
                    <p className="text-[11px] text-foreground leading-snug">{insight.text}</p>
                    <span className={`text-[8px] font-semibold uppercase mt-1 inline-block px-1.5 py-0.5 rounded ${insight.tagColor}`}>{insight.tag}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Loyalty & Referrals */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.12 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-emerald-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #10B981, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 mb-3"><Gift className="w-5 h-5 text-emerald-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Loyalty & Referrals</h3>
                <p className="text-xs text-text-secondary mt-1">Points per visit, referral codes, and reward tiers for repeat clients.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Sarah M.", points: "420 pts", rank: "1" }, { name: "Emma R.", points: "310 pts", rank: "2" }, { name: "Jess T.", points: "185 pts", rank: "3" }].map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[10px] font-bold text-text-tertiary w-4">{m.rank}.</span>
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold text-white">{m.name.split(" ").map(n => n[0]).join("")}</span></div>
                    <span className="text-[11px] text-foreground font-medium flex-1">{m.name}</span>
                    <span className="text-[11px] font-bold text-emerald-600">{m.points}</span>
                  </div>
                ))}
                <div className="px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100"><p className="text-[10px] text-emerald-700 font-medium">Referral code SARAH10 used 4 times this month</p></div>
              </div>
            </motion.div>

            {/* Memberships */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-purple-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #8B5CF6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 mb-3"><Crown className="w-5 h-5 text-purple-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Memberships</h3>
                <p className="text-xs text-text-secondary mt-1">Session packs, recurring plans, and member tracking with auto-billing.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ plan: "10-Session Pack", price: "$450", members: "8 active" }, { plan: "Monthly Unlimited", price: "$99/mo", members: "12 active" }].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.members}</p></div>
                    <span className="text-[13px] font-bold text-foreground">{p.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Win-Back */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-amber-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #F59E0B, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 mb-3"><UserCheck className="w-5 h-5 text-amber-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Win-Back</h3>
                <p className="text-xs text-text-secondary mt-1">Detect lapsed clients and auto-send re-engagement messages.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Sarah M.", days: "45 days inactive", status: "Contacted", sc: "bg-emerald-50 text-emerald-700" }, { name: "Tom K.", days: "62 days inactive", status: "Detected", sc: "bg-amber-50 text-amber-700" }].map((c) => (
                  <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${c.sc}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Storefront */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-cyan-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #06B6D4, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 mb-3"><Store className="w-5 h-5 text-cyan-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Storefront</h3>
                <p className="text-xs text-text-secondary mt-1">A public page showcasing your services with pricing and booking links.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-lg bg-background/80 p-3">
                  <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold text-foreground">Your Business</p><span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold">Live</span></div>
                  <p className="text-[9px] text-text-tertiary mb-2.5">yourbusiness.magic/book</p>
                  <div className="space-y-1.5">{["Lash Full Set — $150", "Brow Lamination — $65"].map((s) => (<div key={s} className="flex items-center justify-between text-[10px] px-2 py-1.5 bg-card-bg rounded border border-border-light"><span className="text-text-secondary">{s.split(" — ")[0]}</span><span className="font-bold text-foreground">{s.split(" — ")[1]}</span></div>))}</div>
                </div>
              </div>
            </motion.div>

            {/* Intake Forms */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-pink-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #EC4899, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/10 mb-3"><FileInput className="w-5 h-5 text-pink-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Intake Forms</h3>
                <p className="text-xs text-text-secondary mt-1">Custom questionnaires with conditional logic for client intake.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-lg bg-background/80 p-3 space-y-2">
                  {["Full Name *", "Email *", "Any allergies?"].map((field) => (<div key={field}><p className="text-[9px] text-text-tertiary mb-0.5">{field}</p><div className="h-7 bg-card-bg rounded-lg border border-border-light" /></div>))}
                  <div className="h-8 bg-foreground rounded-lg flex items-center justify-center text-[10px] text-background font-semibold">Submit</div>
                </div>
              </div>
            </motion.div>

            {/* Before & After */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #14B8A6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 mb-3"><Camera className="w-5 h-5 text-teal-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Before & After</h3>
                <p className="text-xs text-text-secondary mt-1">Capture proof of work with photos and digital checklists.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div><p className="text-[9px] text-text-tertiary mb-1.5 text-center font-medium">Before</p><div className="aspect-[4/3] bg-surface rounded-xl border border-border-light flex items-center justify-center"><Camera className="w-6 h-6 text-text-tertiary/20" /></div></div>
                  <div><p className="text-[9px] text-teal-600 mb-1.5 text-center font-medium">After</p><div className="aspect-[4/3] bg-teal-50/50 rounded-xl border border-teal-200/50 flex items-center justify-center"><Camera className="w-6 h-6 text-teal-300" /></div></div>
                </div>
              </div>
            </motion.div>

            {/* Treatment Notes */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-indigo-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #6366F1, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 mb-3"><ClipboardList className="w-5 h-5 text-indigo-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Treatment Notes</h3>
                <p className="text-xs text-text-secondary mt-1">Structured SOAP notes for clinical treatment records.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ letter: "S", label: "Subjective", text: "Client wants fuller brows, previous microblading faded..." }, { letter: "O", label: "Objective", text: "Skin type: normal, no sensitivities noted..." }, { letter: "A", label: "Assessment", text: "Good candidate for combo brows, patch test clear..." }].map((n) => (
                  <div key={n.letter} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-background/80">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{n.letter}</span>
                    <div><p className="text-[10px] font-semibold text-foreground">{n.label}</p><p className="text-[9px] text-text-tertiary">{n.text}</p></div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Notes & Docs */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.22 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-sky-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "linear-gradient(to bottom, #0EA5E9, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/10 mb-3"><NotebookPen className="w-5 h-5 text-sky-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Notes & Docs</h3>
                <p className="text-xs text-text-secondary mt-1">Write notes, create docs, and share with your team. Simple formatting, no bloat.</p>
              </div>
              <div className="relative px-5 pb-5">
                <div className="rounded-xl bg-background/80 overflow-hidden border border-border-light">
                  <div className="px-3 py-1.5 border-b border-border-light flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">B</span>
                    <span className="text-[10px] italic text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">I</span>
                    <span className="text-[10px] underline text-text-secondary px-1.5 py-0.5 hover:bg-surface rounded">U</span>
                    <div className="w-px h-3.5 bg-border-light mx-1" />
                    <span className="text-[9px] text-text-tertiary px-1">Aa</span>
                    <div className="w-3 h-3 rounded bg-foreground" />
                    <div className="w-px h-3.5 bg-border-light mx-1" />
                    <span className="text-[9px] text-text-tertiary">L</span>
                    <span className="text-[9px] text-text-tertiary">C</span>
                    <span className="text-[9px] text-text-tertiary">R</span>
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="text-[11px] font-bold text-foreground mb-1">Session notes — Sarah M.</p>
                    <p className="text-[10px] text-text-secondary leading-relaxed">Discussed goals for Q2. Wants to <span className="font-bold">increase bookings by 20%</span> and launch a referral program.</p>
                    <div className="flex items-center gap-1.5 mt-2"><span className="text-[8px] px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded font-medium">Linked: Sarah M.</span><span className="text-[8px] px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded font-medium">Pinned</span></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Class Timetable */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.04 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-violet-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #8B5CF6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 mb-3"><CalendarRange className="w-5 h-5 text-violet-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Class Timetable</h3>
                <p className="text-xs text-text-secondary mt-1">Visual weekly class schedule with capacity limits and check-in.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ day: "Mon 9:00", name: "Lash Masterclass", cap: "4/8" }, { day: "Wed 6:00", name: "Nail Art Workshop", cap: "6/10" }, { day: "Fri 10:00", name: "Brow Lamination", cap: "5/8" }].map((cls) => (
                  <div key={cls.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-semibold">{cls.day}</span>
                      <span className="text-[11px] font-semibold text-foreground">{cls.name}</span>
                    </div>
                    <span className="text-[10px] text-text-tertiary font-medium">{cls.cap}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vendors */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.1 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-orange-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #F97316, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 mb-3"><Building2 className="w-5 h-5 text-orange-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Vendors</h3>
                <p className="text-xs text-text-secondary mt-1">Track suppliers, vendor availability, contracts, and payments.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Lash Supplies AU", type: "Lash Products", stars: 5 }, { name: "Salon Essentials", type: "Hair Products", stars: 4 }, { name: "NailCo Wholesale", type: "Nail Supplies", stars: 5 }].map((v) => (
                  <div key={v.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{v.name}</p><p className="text-[9px] text-text-tertiary">{v.type}</p></div>
                    <div className="flex gap-0.5">{Array.from({ length: v.stars }).map((_, i) => (<Star key={i} className="w-3 h-3 fill-orange-400 text-orange-400" />))}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Proposals */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.16 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-violet-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #7C3AED, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-600/10 mb-3"><ScrollText className="w-5 h-5 text-violet-600" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Proposals</h3>
                <p className="text-xs text-text-secondary mt-1">Branded proposal pages with interactive pricing and e-signature.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ id: "PROP-001", title: "Bridal Package", status: "Sent", amount: "$650", sc: "bg-blue-50 text-blue-600" }, { id: "PROP-002", title: "Lash Extension Package", status: "Viewed", amount: "$350", sc: "bg-amber-50 text-amber-700" }, { id: "PROP-003", title: "Wedding Party (x5)", status: "Accepted", amount: "$1,200", sc: "bg-emerald-50 text-emerald-700" }].map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/80">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-text-tertiary">{p.id}</span>
                      <span className="text-[11px] font-semibold text-foreground">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${p.sc}`}>{p.status}{p.status === "Accepted" ? " \u2713" : ""}</span>
                      <span className="text-[11px] font-bold text-foreground">{p.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waitlist */}
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={viewportConfig} transition={{ delay: 0.22 }} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative bg-card-bg rounded-2xl border border-border-light overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-teal-200">
              <div className="absolute top-0 left-0 right-0 h-32 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity" style={{ background: "linear-gradient(to bottom, #14B8A6, transparent)" }} />
              <div className="relative px-5 pt-5 pb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 mb-3"><ListOrdered className="w-5 h-5 text-teal-500" /></div>
                <h3 className="text-[15px] font-bold text-foreground">Waitlist</h3>
                <p className="text-xs text-text-secondary mt-1">Manage walk-in queues and auto-notify clients when spots open up.</p>
              </div>
              <div className="relative px-5 pb-5 space-y-1.5">
                {[{ name: "Emma R.", detail: "Lash Fill", status: "Waiting", sc: "bg-amber-50 text-amber-700" }, { name: "Tom K.", detail: "2:00 PM slot", status: "Notified \u2713", sc: "bg-blue-50 text-blue-600" }].map((w) => (
                  <div key={w.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/80">
                    <div><p className="text-[11px] font-semibold text-foreground">{w.name}</p><p className="text-[9px] text-text-tertiary">{w.detail}</p></div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${w.sc}`}>{w.status}</span>
                  </div>
                ))}
                <div className="px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100"><p className="text-[10px] text-teal-700 font-medium">Spot opened! Auto-notified 2 clients</p></div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Build Your Own */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-card-bg"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] font-medium text-purple-700 mb-4">
                <Zap className="w-3 h-3" /> AI-Powered
              </div>
              <motion.h2
                variants={sectionHeadingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={sectionTransition}
                className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4"
              >
                Build your own<br />features with AI.
              </motion.h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Need something we don&apos;t have? Describe it in plain English and our AI builder creates a custom module — with its own data, views, and automations. Built on top of your existing data.
              </p>
              <div className="space-y-3">
                {[
                  { title: "Describe what you need", desc: "\"I need a warranty tracker for each job\"" },
                  { title: "AI builds it", desc: "Custom data model, views, and automations — in seconds" },
                  { title: "It lives in your sidebar", desc: "Uses your existing clients, jobs, and invoices" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[11px] font-bold text-white">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.title}</p>
                      <p className="text-xs text-text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-light">
                  <span className="text-[11px] text-text-tertiary">Powered by</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors">Anthropic</span>
                    <span className="text-[10px] text-border-light mx-1">/</span>
                    <span className="text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors">OpenAI</span>
                    <span className="text-[10px] text-border-light mx-1">/</span>
                    <span className="text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors">Kimi</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="bg-card-bg rounded-2xl border border-border-light overflow-hidden shadow-lg">
                <div className="px-5 py-3 border-b border-border-light flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-[13px] font-semibold text-foreground">AI Builder</span>
                  <span className="ml-auto text-[10px] bg-primary text-foreground px-2 py-0.5 rounded-full font-semibold">25 credits</span>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] text-text-tertiary mb-2">Describe your feature</p>
                    <div className="px-4 py-3 bg-background border border-border-light rounded-xl text-[13px] text-text-secondary italic">
                      &ldquo;I need a warranty tracker that links to completed jobs, tracks expiry dates, and sends reminders before warranties expire&rdquo;
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-9 bg-foreground rounded-xl flex items-center justify-center text-xs text-background font-semibold">Build Feature</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">What AI can build</p>
                    {["Custom data collections", "Table & kanban views", "Automated triggers", "Connected to your data"].map((c) => (
                      <div key={c} className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <Check className="w-3 h-3 text-primary" />{c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Why not the others */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <motion.h2
                variants={sectionHeadingVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={sectionTransition}
                className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4"
              >
                Why switch from<br />Fresha or Vagaro?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportConfig}
                transition={{ delay: 0.1, ...sectionTransition }}
                className="text-text-secondary text-[15px] leading-relaxed mb-8"
              >
                Because booking tools don&apos;t know your clients. They schedule appointments — they don&apos;t tell you who&apos;s overdue for a rebook or who hasn&apos;t been back in 6 weeks.
              </motion.p>
              <div className="space-y-4">
                {[
                  { title: "No hidden marketplace fees", desc: "You don't pay 20% when a client finds you on Google and books through your page." },
                  { title: "AI that works for you", desc: "Smart nudges tell you who to rebook, which invoices are overdue, and when your calendar is empty." },
                  { title: "Your client data, front and centre", desc: "Colour formulas, lash preferences, skin types — not buried in a tab nobody clicks." },
                  { title: "Simple, honest pricing", desc: "No per-seat fees, no feature gates, no surprise charges. One plan, everything included." },
                  { title: "Built for beauty, not for everyone", desc: "Every label, every field, every default is designed for how beauty professionals actually work." },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={viewportConfig} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-[13px] text-text-secondary">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div className="space-y-4">
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  I was paying $180/mo for software I used 10% of. Magic gave me exactly what I needed for my salon in under 5 minutes.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-xs font-bold text-foreground">SK</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Sarah K.</p>
                    <p className="text-[11px] text-text-tertiary">Hair salon owner, Melbourne</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ delay: 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  Switched from Fresha and never looked back. No hidden fees, no surprises. The rebooking nudges alone have paid for themselves.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-xs font-bold text-foreground">ER</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Emma R.</p>
                    <p className="text-[11px] text-text-tertiary">Lash Tech, Melbourne</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                variants={testimonialVariants}
                initial="hidden"
                whileInView="visible"
                viewport={viewportConfig}
                transition={{ delay: 0.16, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-card-bg rounded-xl border border-border-light p-6 relative"
              >
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  The client portal and gift cards changed everything. My clients book themselves, pay online, and gift cards sell themselves around the holidays.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-xs font-bold text-foreground">JT</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Jess T.</p>
                    <p className="text-[11px] text-text-tertiary">Nail Tech, Sydney</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Pricing */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-12 sm:py-20 bg-card-bg"
      >
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground mb-3 leading-tight"
          >
            One plan. Everything included.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="text-text-secondary mb-10 text-[15px]"
          >
            No tiers. No per-user fees. No feature gates.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-card-bg rounded-2xl border border-border-light p-8 text-left"
          >
            <div className="mb-6">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={viewportConfig}
                transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200, damping: 12 }}
                className="text-[40px] font-bold text-foreground inline-block"
              >
                $49
              </motion.span>
              <span className="text-text-secondary text-[15px]">/month</span>
            </div>
            <div className="space-y-3 mb-8">
              {[
                "Workspace built from your answers",
                "Tools, fields, and labels that match your business",
                "Add-ons — install anytime from your sidebar",
                "Unlimited team members",
                "AI-powered workspace tuning",
                "Priority email support",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <motion.div
              variants={ctaPulseVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              <Link href="/onboarding">
                <Button size="lg" className="w-full cta-glow">
                  Start building <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
            <p className="text-[11px] text-text-tertiary mt-3 text-center">
              Extra integrations from $10/mo. AI credits from $5 per 10.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Closing section */}
      <footer className="relative overflow-hidden" style={{ backgroundColor: "#0e0e0e" }}>
        {/* Ambient glow behind CTA */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(124,254,157,0.06), transparent 65%)" }} />

        {/* CTA */}
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <span className="text-[13px] font-medium" style={{ color: "#7CFE9D" }}>Built for beauty professionals</span>
          </motion.div>
          <motion.h2
            variants={sectionHeadingVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            transition={sectionTransition}
            className="text-[1.75rem] sm:text-[2.5rem] font-bold mb-5 leading-[1.1]"
            style={{ color: "#fff" }}
          >
            Stop juggling apps.<br />Start growing your business.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.1, ...sectionTransition }}
            className="mb-10 text-[15px] max-w-md mx-auto"
            style={{ color: "#888" }}
          >
            Clients, bookings, invoices, and AI-powered rebooking — all in one platform that speaks your language.
          </motion.p>
          <motion.div variants={ctaPulseVariants} initial="hidden" whileInView="visible" viewport={viewportConfig}>
            <Link href="/onboarding">
              <Button size="lg" className="px-10 bg-primary text-foreground hover:bg-primary-hover shadow-none hover:shadow-none cta-glow">
                Get started free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Intelligence strip */}
        <div className="relative max-w-5xl mx-auto px-6 pb-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportConfig}
            transition={{ duration: 0.6 }}
            className="border-t border-white/[0.06] pt-10 pb-8"
          >
            {/* Animated pipeline */}
            <div className="relative flex items-center justify-center gap-3 sm:gap-4 mb-6">
              {[
                { icon: Zap, label: "Collects" },
                { icon: Lightbulb, label: "Learns" },
                { icon: TrendingUp, label: "Predicts" },
                { icon: Sparkles, label: "Acts" },
              ].map((node, i) => (
                <motion.div
                  key={node.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                  className="flex items-center gap-3 sm:gap-4"
                >
                  {i > 0 && (
                    <div className="w-6 sm:w-10 h-px relative overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        className="absolute inset-y-0 w-4"
                        style={{ background: "linear-gradient(90deg, transparent, #7CFE9D, transparent)" }}
                        animate={{ left: ["-16px", "calc(100% + 16px)"] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
                      />
                    </div>
                  )}
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 0 rgba(124,254,157,0)", "0 0 14px 2px rgba(124,254,157,0.1)", "0 0 0 0 rgba(124,254,157,0)"] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <node.icon className="w-3.5 h-3.5" style={{ color: "#7CFE9D" }} />
                    <span className="text-[13px] font-medium" style={{ color: "#ccc" }}>{node.label}</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* ML line */}
            <p className="text-center text-[15px] mb-1.5" style={{ color: "#777" }}>
              AI that doesn&apos;t just answer questions — it shapes your entire workspace.
            </p>
            <p className="text-center text-[15px]" style={{ color: "#777" }}>
              From onboarding to daily use, it learns how you work and <span className="font-semibold" style={{ color: "#7CFE9D" }}>keeps adapting</span>.
            </p>
          </motion.div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] py-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#7CFE9D" }}>
                <div className="w-2.5 h-2.5 bg-card-bg rounded-sm" />
              </div>
              <span className="text-sm font-semibold" style={{ color: "#777" }}>Magic</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px]" style={{ color: "#555" }}>Powered by</span>
              {["Anthropic", "OpenAI", "Kimi"].map((name, i) => (
                <span key={name} className="flex items-center gap-2.5">
                  {i > 0 && <span className="text-[13px]" style={{ color: "#444" }}>&middot;</span>}
                  <span className="text-sm font-semibold" style={{ color: "#888" }}>{name}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs hover:underline" style={{ color: "#555" }}>Privacy</Link>
              <Link href="/terms" className="text-xs hover:underline" style={{ color: "#555" }}>Terms</Link>
              <span className="text-xs" style={{ color: "#555" }}>&copy; {new Date().getFullYear()} Magic</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
