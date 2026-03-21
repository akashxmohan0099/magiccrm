"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Users, Receipt, Calendar, MessageCircle,
  FolderKanban, BarChart3, Star, Inbox, Megaphone, Headphones,
  FileText, CreditCard, Zap, Package, Crown, Camera, FileInput,
  ClipboardList, Gift, UserCheck, Store, Globe, Lightbulb, Puzzle, SlidersHorizontal, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FEATURE_BLOCKS } from "@/types/features";

// ── Module name to feature block ID mapping ──
const MODULE_FEATURE_MAP: Record<string, string> = {
  "Clients": "client-database",
  "Leads & Pipeline": "leads-pipeline",
  "Communication": "communication",
  "Bookings": "bookings-calendar",
  "Invoicing": "quotes-invoicing",
  "Jobs & Projects": "jobs-projects",
  "Marketing": "marketing",
  "Support": "support",
  "Documents": "documents",
  "Products": "products",
  "Team": "team",
  "Payments": "payments",
  "Automations": "automations",
  "Reporting": "reporting",
};

// Only show features that have VISIBLE impact on the preview
const DEMO_FEATURES: Record<string, string[]> = {
  "Clients": ["Tags & Categories", "Birthday Reminders", "Import / Export", "Merge Duplicates", "Bulk Actions", "Acquisition Source", "Activity Timeline", "Internal Notes"],
  "Leads & Pipeline": ["Web Forms", "Lead Scoring", "Auto-Assign", "Follow-up Reminders"],
  "Communication": ["Canned Responses", "Scheduled Send", "After-Hours Auto-Reply"],
  "Bookings": ["Deposits", "Waitlist", "Buffer Time", "No-Show Protection"],
  "Invoicing": ["Auto Tax", "Tipping", "Partial Payments", "Late Reminders"],
  "Jobs & Projects": ["Expense Tracking", "Time Tracking", "Recurring Jobs"],
  "Marketing": ["Email Sequences", "Social Scheduling", "Coupons"],
  "Support": ["Auto-Responses", "Satisfaction Ratings", "Knowledge Base"],
};

function getModuleFeatures(moduleName: string) {
  return DEMO_FEATURES[moduleName] ?? CORE_MODULES.find(m => m.name === moduleName)?.subs ?? [];
}

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
    label: "Electrician",
    businessName: "Spark Right Electrical",
    industry: "Trades & Construction",
    accent: "#3B82F6",
    nav: ["Clients", "Jobs", "Site Visits", "Invoices", "Quotes"],
    activeNav: "Jobs",
    contentTitle: "Active Jobs",
    items: [
      { name: "Kitchen rewire", meta: "Quoted", value: "$2,400", stageColor: "bg-blue-400" },
      { name: "Switchboard upgrade", meta: "Scheduled", value: "$850", stageColor: "bg-cyan-400" },
      { name: "Office fit-out", meta: "In Progress", value: "$6,200", stageColor: "bg-yellow-400" },
      { name: "Garden lights", meta: "Complete", value: "$1,100", stageColor: "bg-green-400" },
    ],
    fields: ["Job Site Address", "Property Type", "Access Notes"],
  },
  {
    label: "Life Coach",
    businessName: "Elevate Coaching",
    industry: "Education & Coaching",
    accent: "#10B981",
    nav: ["Clients", "Programs", "Sessions", "Invoices", "Leads"],
    activeNav: "Sessions",
    contentTitle: "Session Types",
    items: [
      { name: "Discovery Call", meta: "30min", value: "Free" },
      { name: "Coaching Session", meta: "1hr", value: "$200" },
      { name: "Group Coaching", meta: "1.5hr", value: "$80" },
      { name: "VIP Intensive", meta: "3hr", value: "$500" },
    ],
    fields: ["Company", "Role / Title", "Coaching Goals"],
  },
];

// ── Core modules with key sub-features ──

const CORE_MODULES = [
  { icon: Users, name: "Clients", desc: "Profiles, tags, and full history", subs: ["Follow-up Reminders", "Birthday Alerts", "Import / Export", "Merge Duplicates"] },
  { icon: Inbox, name: "Leads & Pipeline", desc: "Capture, track, and convert", subs: ["Web Forms", "Auto-Assign", "Follow-up Reminders"] },
  { icon: MessageCircle, name: "Communication", desc: "Email, SMS, social — one inbox", subs: ["Canned Responses", "Scheduled Send", "After-Hours Auto-Reply"] },
  { icon: Calendar, name: "Bookings", desc: "Online scheduling with reminders", subs: ["Waitlist", "Deposits", "Buffer Time", "No-Show Protection"] },
  { icon: Receipt, name: "Invoicing", desc: "Quotes, invoices, and payments", subs: ["Tipping", "Partial Payments", "Auto Tax", "Late Reminders"] },
  { icon: FolderKanban, name: "Jobs & Projects", desc: "Tasks, stages, and deadlines", subs: ["Expense Tracking", "Time Tracking", "Recurring Jobs"] },
  { icon: Megaphone, name: "Marketing", desc: "Campaigns, promos, and reviews", subs: ["Email Sequences", "Social Scheduling", "Coupons"] },
  { icon: Headphones, name: "Support", desc: "Track and resolve requests", subs: ["Auto-Responses", "Satisfaction Ratings", "Knowledge Base"] },
  { icon: FileText, name: "Documents", desc: "Contracts, files, and signatures", subs: ["Templates", "E-Signatures"] },
  { icon: CreditCard, name: "Payments", desc: "Track who paid and who didn't", subs: ["Overdue Reminders", "Refund Tracking"] },
  { icon: Zap, name: "Automations", desc: "Let your CRM do the boring stuff", subs: ["Triggers", "Email Automations", "Scheduled Tasks"] },
  { icon: BarChart3, name: "Reporting", desc: "Dashboards and insights", subs: ["Export Reports", "Goal Tracking", "Custom Dashboards"] },
  { icon: Package, name: "Products", desc: "Your service and product catalog", subs: ["Categories", "Stock Tracking"] },
  { icon: Users, name: "Team", desc: "Manage staff, roles, and permissions", subs: ["Activity Log", "Workload View"] },
];

// ── Add-on modules ──

const ADDONS = [
  { icon: Globe, name: "Client Portal", desc: "Self-service hub for clients to view bookings, pay invoices, and message you.", tags: ["Self-Rebooking", "Secure Messaging", "Invoice Payments"] },
  { icon: Crown, name: "Memberships", desc: "Session packs, recurring plans, and member tracking with auto-billing.", tags: ["Session Credits", "Auto-Billing", "Freeze / Pause"] },
  { icon: Gift, name: "Loyalty & Referrals", desc: "Points per visit, referral codes, and reward tiers for repeat clients.", tags: ["Points System", "Punch Cards", "Referral Codes"] },
  { icon: UserCheck, name: "Win-Back", desc: "Detect lapsed clients and auto-send re-engagement messages.", tags: ["Lapsed Detection", "Auto-Send", "Discount Offers"] },
  { icon: Lightbulb, name: "AI Insights", desc: "Smart suggestions like overdue rebookings, revenue forecasts, and churn risk.", tags: ["Rebooking Alerts", "Revenue Forecast", "Weekly Digest"] },
  { icon: Store, name: "Storefront", desc: "A public page showcasing your services with pricing and booking links.", tags: ["Photo Gallery", "Reviews Display", "Business Info"] },
  { icon: FileInput, name: "Intake Forms", desc: "Custom questionnaires with conditional logic for client intake.", tags: ["Auto-Send", "E-Signature", "Pre-Fill"] },
  { icon: Camera, name: "Before & After", desc: "Capture proof of work with photos and digital checklists.", tags: ["Side-by-Side View", "Client Consent", "Share to Storefront"] },
  { icon: ClipboardList, name: "Treatment Notes", desc: "Structured SOAP notes for clinical treatment records.", tags: ["Note Templates", "Auto-Link Booking", "Practitioner Filter"] },
];

const INDUSTRIES = [
  "Beauty & Wellness", "Trades & Construction", "Professional Services",
  "Health & Fitness", "Creative & Design", "Hospitality & Events",
  "Education & Coaching", "Retail & E-commerce",
];

// ── Attachment showcase data ──

const ATTACHMENT_EXAMPLE = {
  module: "Bookings & Calendar",
  icon: Calendar,
  core: "Online booking page, automated reminders, availability management",
  attachments: [
    { name: "Waitlist", desc: "Clients queue for full slots", on: true },
    { name: "Deposits", desc: "Require payment at booking", on: true },
    { name: "Buffer Time", desc: "Padding between appointments", on: false },
    { name: "No-Show Fees", desc: "Charge repeat no-showers", on: false },
    { name: "Recurring", desc: "Repeat bookings on a schedule", on: true },
    { name: "Google Cal Sync", desc: "Two-way calendar sync", on: false },
  ],
};

// ── Realistic module preview components ──

const MOCK_CLIENTS = [
  { name: "Sarah Mitchell", email: "sarah@email.com", status: "active", tags: ["VIP", "Lash"], birthday: "Mar 15", source: "Instagram" },
  { name: "Jess Thompson", email: "jess@email.com", status: "active", tags: ["Regular"], birthday: "Jul 22", source: "Referral" },
  { name: "Emma Roberts", email: "emma@email.com", status: "inactive", tags: [], birthday: "Nov 3", source: "Website" },
  { name: "Tom Kennedy", email: "tom@email.com", status: "prospect", tags: ["New"], birthday: "Jan 8", source: "Walk-in" },
];

function ModulePreview({ moduleName, getToggle }: { moduleName: string; getToggle: (sub: string) => boolean }) {
  if (moduleName === "Clients") return <ClientsPreview getToggle={getToggle} />;
  if (moduleName === "Leads & Pipeline") return <LeadsPreview getToggle={getToggle} />;
  if (moduleName === "Bookings") return <BookingsPreview getToggle={getToggle} />;
  if (moduleName === "Invoicing") return <InvoicingPreview getToggle={getToggle} />;
  if (moduleName === "Communication") return <CommunicationPreview getToggle={getToggle} />;
  if (moduleName === "Jobs & Projects") return <JobsPreview getToggle={getToggle} />;
  // Fallback for other modules
  return <GenericPreview moduleName={moduleName} getToggle={getToggle} />;
}

function ClientsPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const showTags = getToggle("Tags & Categories");
  const showBirthday = getToggle("Birthday Reminders");
  const showImport = getToggle("Import / Export");
  const showMerge = getToggle("Merge Duplicates");
  const showSource = getToggle("Acquisition Source");
  const showSegmentation = getToggle("Segmentation Filters");
  const showFollowUp = getToggle("Follow-Up Reminders");
  const showTimeline = getToggle("Activity Timeline");
  const showLifecycle = getToggle("Lifecycle Stages");
  const showNotes = getToggle("Internal Notes");
  const showBulk = getToggle("Bulk Actions");
  return (
    <div>
      {(showImport || showSegmentation || showBulk) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mb-3 flex-wrap">
          {showImport && <div className="px-2 py-1 bg-background border border-border-light rounded text-[10px] text-text-secondary">Import CSV</div>}
          {showImport && <div className="px-2 py-1 bg-background border border-border-light rounded text-[10px] text-text-secondary">Export</div>}
          {showSegmentation && <div className="px-2 py-1 bg-background border border-border-light rounded text-[10px] text-text-secondary">Filters</div>}
          {showBulk && <div className="px-2 py-1 bg-background border border-border-light rounded text-[10px] text-text-secondary">Bulk Actions</div>}
        </motion.div>
      )}
      <div className="border border-border-light rounded-xl overflow-hidden">
        <div className="grid bg-background px-3 py-2 border-b border-border-light text-[10px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `${showBulk ? "24px " : ""}1fr 1fr ${showTags ? "70px " : ""}${showBirthday ? "55px " : ""}${showSource ? "60px " : ""}${showLifecycle ? "60px " : ""}55px` }}>
          {showBulk && <span></span>}
          <span>Name</span><span>Email</span>
          {showTags && <span>Tags</span>}
          {showBirthday && <span>Birthday</span>}
          {showSource && <span>Source</span>}
          {showLifecycle && <span>Stage</span>}
          <span>Status</span>
        </div>
        {MOCK_CLIENTS.map((c, i) => (
          <motion.div key={i} layout className="grid px-3 py-2 border-b border-border-light/50 last:border-0 items-center" style={{ gridTemplateColumns: `${showBulk ? "24px " : ""}1fr 1fr ${showTags ? "70px " : ""}${showBirthday ? "55px " : ""}${showSource ? "60px " : ""}${showLifecycle ? "60px " : ""}55px` }}>
            {showBulk && <input type="checkbox" className="w-3 h-3 rounded accent-primary" readOnly />}
            <span className="font-medium text-foreground truncate">{c.name}</span>
            <span className="text-text-tertiary truncate">{c.email}</span>
            {showTags && <span className="overflow-hidden">{c.tags.map(t => <span key={t} className="inline-block px-1 py-0.5 bg-primary/10 text-primary rounded text-[8px] mr-0.5">{t}</span>)}</span>}
            {showBirthday && <span className="text-text-tertiary text-[10px]">{c.birthday}</span>}
            {showSource && <span className="text-text-tertiary text-[9px]">{c.source}</span>}
            {showLifecycle && <span className="text-[8px] px-1 py-0.5 bg-emerald-50 text-emerald-700 rounded">Active</span>}
            <span className={`px-1 py-0.5 rounded text-[8px] font-medium inline-block w-fit ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"}`}>{c.status}</span>
          </motion.div>
        ))}
      </div>
      {showMerge && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">
          1 potential duplicate detected — <span className="font-medium underline cursor-pointer">Review</span>
        </motion.div>
      )}
      {showFollowUp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">
          2 follow-ups due today
        </motion.div>
      )}
      {showTimeline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 space-y-1">
          {[{ text: "Sarah booked Lash Fill", time: "2hr ago" }, { text: "Invoice #42 sent to Jess", time: "Yesterday" }].map((e) => (
            <div key={e.text} className="flex items-start gap-2 px-2 py-1"><div className="w-1 h-1 bg-primary rounded-full mt-1.5" /><div><p className="text-[10px] text-foreground">{e.text}</p><p className="text-[8px] text-text-tertiary">{e.time}</p></div></div>
          ))}
        </motion.div>
      )}
      {showNotes && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary italic">
          "VIP client — always book extra 15min" — internal note
        </motion.div>
      )}
    </div>
  );
}

function LeadsPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const stages = [
    { label: "New", color: "bg-blue-400", leads: ["Lisa M.", "Tom K."] },
    { label: "Contacted", color: "bg-yellow-400", leads: ["Sarah P."] },
    { label: "Proposal", color: "bg-purple-400", leads: ["James W."] },
    { label: "Won", color: "bg-green-400", leads: ["Zoe R."] },
  ];
  return (
    <div>
      {getToggle("Web Forms") && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary font-medium">
          Web form active — share your capture link
        </motion.div>
      )}
      <div className="grid grid-cols-4 gap-1.5">
        {stages.map((s) => (
          <div key={s.label}>
            <div className="flex items-center gap-1 mb-1.5"><div className={`w-2 h-2 rounded-full ${s.color}`} /><span className="text-[9px] font-semibold text-text-tertiary uppercase">{s.label}</span></div>
            {s.leads.map((l) => (
              <div key={l} className="bg-background rounded-lg px-2 py-1.5 mb-1 border border-border-light">
                <p className="text-[10px] font-medium text-foreground">{l}</p>
                {getToggle("Lead Scoring") && <span className="text-[8px] px-1 py-0.5 bg-red-50 text-red-600 rounded mt-0.5 inline-block">Hot</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {getToggle("Auto-Assign") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[9px] text-text-tertiary">Auto-assigning to: <span className="font-medium text-foreground">You</span></motion.div>}
    </div>
  );
}

function BookingsPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const appts = [
    { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" },
    { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" },
    { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" },
  ];
  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {appts.map((a, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border-light">
            <div className={`w-1 h-5 rounded-full ${a.color}`} />
            <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
            <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
            {getToggle("Deposits") && <span className="text-[8px] text-primary font-medium">$30 dep</span>}
          </div>
        ))}
      </div>
      {getToggle("Waitlist") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">2 on waitlist for today</motion.div>}
      {getToggle("Buffer Time") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-[9px] text-text-tertiary">15 min buffer between appointments</motion.div>}
      {getToggle("No-Show Protection") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-[9px] text-red-600">Tom K. — 2 no-shows this month</motion.div>}
    </div>
  );
}

function InvoicingPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const invoices = [
    { num: "INV-001", client: "Sarah M.", amount: 175, status: "paid" },
    { num: "INV-002", client: "Jess T.", amount: 200, status: "sent" },
    { num: "INV-003", client: "Emma R.", amount: 95, status: "overdue" },
  ];
  return (
    <div>
      <div className="border border-border-light rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 bg-background px-3 py-1.5 border-b border-border-light text-[10px] font-medium text-text-tertiary">
          <span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span>
        </div>
        {invoices.map((inv) => (
          <div key={inv.num} className="grid grid-cols-4 px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]">
            <span className="font-medium text-foreground">{inv.num}</span>
            <span className="text-text-secondary">{inv.client}</span>
            <span className="font-medium text-foreground">
              ${inv.amount}
              {getToggle("Auto Tax") && <span className="text-text-tertiary ml-0.5">+GST</span>}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium inline-block w-fit ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{inv.status}</span>
          </div>
        ))}
      </div>
      {getToggle("Tipping") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[9px] text-text-tertiary">Tipping enabled — clients can add a tip at checkout</motion.div>}
      {getToggle("Partial Payments") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">Jess T. paid $100 of $200 — $100 remaining</motion.div>}
      {getToggle("Late Reminders") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600">Reminder sent to Emma R. — 14 days overdue</motion.div>}
    </div>
  );
}

function CommunicationPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const convos = [
    { name: "Sarah M.", channel: "SMS", msg: "Can I reschedule Thursday?", time: "2m", unread: true },
    { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice!", time: "1hr", unread: false },
    { name: "Emma R.", channel: "Instagram", msg: "Do you have Saturday slots?", time: "3hr", unread: true },
  ];
  return (
    <div>
      <div className="space-y-1.5">
        {convos.map((c, i) => (
          <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${c.unread ? "bg-primary/5 border border-primary/10" : "bg-background border border-border-light"}`}>
            <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold">{c.name.split(" ").map(n => n[0]).join("")}</span></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-foreground">{c.name}</span><span className="text-[8px] px-1 bg-surface rounded text-text-tertiary">{c.channel}</span></div>
              <p className="text-[10px] text-text-secondary truncate">{c.msg}</p>
            </div>
            <span className="text-[9px] text-text-tertiary">{c.time}</span>
          </div>
        ))}
      </div>
      {getToggle("Canned Responses") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex gap-1">{["Thanks!", "On my way", "Confirmed"].map(r => <span key={r} className="px-2 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary cursor-pointer hover:border-foreground/15">{r}</span>)}</motion.div>}
      {getToggle("Scheduled Send") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-[9px] text-text-tertiary">1 message scheduled for 9:00 AM tomorrow</motion.div>}
      {getToggle("After-Hours Auto-Reply") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Auto-reply active outside business hours</motion.div>}
    </div>
  );
}

function JobsPreview({ getToggle }: { getToggle: (s: string) => boolean }) {
  const jobs = [
    { title: "Kitchen renovation", stage: "In Progress", priority: "High", cost: 2400 },
    { title: "Bathroom refit", stage: "Quoted", priority: "Medium", cost: 850 },
    { title: "Garden lights", stage: "Complete", priority: "Low", cost: 1100 },
  ];
  return (
    <div>
      <div className="border border-border-light rounded-xl overflow-hidden">
        <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[10px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 70px ${getToggle("Expense Tracking") ? "60px" : ""} ${getToggle("Time Tracking") ? "50px" : ""} 50px` }}>
          <span>Job</span><span>Stage</span>
          {getToggle("Expense Tracking") && <span>Cost</span>}
          {getToggle("Time Tracking") && <span>Hours</span>}
          <span>Priority</span>
        </div>
        {jobs.map((j) => (
          <motion.div key={j.title} layout className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]" style={{ gridTemplateColumns: `1fr 70px ${getToggle("Expense Tracking") ? "60px" : ""} ${getToggle("Time Tracking") ? "50px" : ""} 50px` }}>
            <span className="font-medium text-foreground">{j.title}</span>
            <span className="text-text-secondary">{j.stage}</span>
            <AnimatePresence>{getToggle("Expense Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-text-secondary">${j.cost}</motion.span>}</AnimatePresence>
            <AnimatePresence>{getToggle("Time Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-text-secondary">12h</motion.span>}</AnimatePresence>
            <span className={`text-[9px] font-medium ${j.priority === "High" ? "text-red-500" : j.priority === "Medium" ? "text-yellow-600" : "text-text-tertiary"}`}>{j.priority}</span>
          </motion.div>
        ))}
      </div>
      {getToggle("Recurring Jobs") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-[9px] text-text-tertiary">1 recurring job: Garden maintenance (monthly)</motion.div>}
    </div>
  );
}

function GenericPreview({ moduleName, getToggle }: { moduleName: string; getToggle: (s: string) => boolean }) {
  const mod = CORE_MODULES.find(m => m.name === moduleName);
  if (!mod) return null;
  const activeSubs = mod.subs.filter(s => getToggle(s));
  return (
    <div>
      <div className="border border-border-light rounded-xl overflow-hidden mb-3">
        <div className="bg-background px-3 py-2 border-b border-border-light text-[10px] font-medium text-text-tertiary">Overview</div>
        <div className="p-3 space-y-2">
          {activeSubs.length === 0 ? (
            <p className="text-[10px] text-text-tertiary text-center py-4">Toggle features on to see them here</p>
          ) : activeSubs.map((sub) => (
            <motion.div key={sub} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-background border border-border-light">
              <div className="w-1 h-4 rounded-full bg-primary/30" />
              <span className="text-[10px] font-medium text-foreground">{sub}</span>
              <span className="ml-auto text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Active</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activePersona, setActivePersona] = useState(0);
  const [attachmentToggles, setAttachmentToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(ATTACHMENT_EXAMPLE.attachments.map((a) => [a.name, a.on]))
  );
  const [expandedModule, setExpandedModule] = useState<string | null>(CORE_MODULES[0].name);
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set(CORE_MODULES.map(m => m.name)));

  // Auto-animate module toggles — cinematic sequence
  useEffect(() => {
    const sequence = ["Marketing", "Support", "Documents", "Payments", "Team", "Products", "Automations",
      "Marketing", "Support", "Documents", "Team", "Products"];
    let step = 0;
    const interval = setInterval(() => {
      const name = sequence[step % sequence.length];
      setEnabledModules(prev => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name); else next.add(name);
        return next;
      });
      step++;
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  // Start with some features OFF so the demo shows the toggle effect
  const [demoToggles, setDemoToggles] = useState<Record<string, boolean>>({
    "Clients:Birthday Reminders": false,
    "Clients:Merge Duplicates": false,
    "Clients:Bulk Actions": false,
    "Clients:Activity Timeline": false,
    "Clients:Internal Notes": false,
    "Leads & Pipeline:Lead Scoring": false,
    "Leads & Pipeline:Auto-Assign": false,
    "Bookings:Waitlist": false,
    "Bookings:No-Show Protection": false,
    "Invoicing:Tipping": false,
    "Invoicing:Partial Payments": false,
    "Jobs & Projects:Expense Tracking": false,
    "Jobs & Projects:Time Tracking": false,
    "Communication:Scheduled Send": false,
    "Communication:After-Hours Auto-Reply": false,
  });
  const [selectedAddon, setSelectedAddon] = useState<number>(0);
  const [moduleAutoCycle, setModuleAutoCycle] = useState(true);
  const [moduleProgress, setModuleProgress] = useState(0);
  const moduleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleAttachment = (name: string) => {
    setAttachmentToggles((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const enabledAttachmentCount = Object.values(attachmentToggles).filter(Boolean).length;

  // Auto-cycle through modules
  useEffect(() => {
    if (!moduleAutoCycle) return;
    setModuleProgress(0);

    const progressInterval = setInterval(() => {
      setModuleProgress((p) => Math.min(p + 1.7, 100));
    }, 100);

    moduleTimerRef.current = setTimeout(() => {
      setExpandedModule((prev) => {
        const idx = CORE_MODULES.findIndex((m) => m.name === prev);
        return CORE_MODULES[(idx + 1) % CORE_MODULES.length].name;
      });
    }, 6000);

    return () => {
      clearInterval(progressInterval);
      if (moduleTimerRef.current) clearTimeout(moduleTimerRef.current);
    };
  }, [expandedModule, moduleAutoCycle]);

  const selectModule = useCallback((name: string) => {
    setModuleAutoCycle(false);
    setExpandedModule(name);
  }, []);

  // Auto-toggle demo for attachment showcase
  useEffect(() => {
    const interval = setInterval(() => {
      const names = ATTACHMENT_EXAMPLE.attachments.map((a) => a.name);
      const randomName = names[Math.floor(Math.random() * names.length)];
      setAttachmentToggles((prev) => ({ ...prev, [randomName]: !prev[randomName] }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-pattern noise-bg">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-white rounded-sm" />
          </div>
          <span className="font-bold text-foreground text-[15px] tracking-tight">Magic CRM</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/onboarding" className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium">
            Log in
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center relative overflow-hidden">
        {/* Floating glow orbs */}
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[12px] font-medium text-foreground mb-6"
          >
            <span className="w-2 h-2 bg-primary rounded-full pulse-dot" />
            23 modules &middot; 207 features &middot; 43 personas
          </motion.div>

          <h1 className="text-[2.25rem] sm:text-[3.5rem] md:text-[4rem] font-bold mb-6 leading-[1.05]">
            <span className="gradient-text">The CRM that fits</span><br />
            <span className="text-text-secondary">your business, not the other way around</span>
          </h1>

          <p className="text-[15px] sm:text-[17px] text-text-secondary mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            23 modules. 207 toggleable features. One flat price. Tell us what you do and we&apos;ll assemble a CRM with only what you need.
          </p>

          <div className="flex flex-col items-center gap-4">
            <Link href="/onboarding">
              <Button size="lg" className="px-10">
                Build my CRM <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[13px] text-text-tertiary">
              Free to set up. $49/mo when you&apos;re ready.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { num: "23", label: "Modules" },
              { num: "207", label: "Toggleable features" },
              { num: "43", label: "Personas supported" },
              { num: "$49", label: "Flat monthly" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-border-light p-4 text-center glow-border"
              >
                <p className="text-[28px] sm:text-[32px] font-bold text-foreground leading-none">{stat.num}</p>
                <p className="text-[11px] text-text-tertiary mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry tags */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-center text-[13px] text-text-tertiary mb-4 font-medium">Built for</p>
          <div className="flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((industry) => (
              <span key={industry} className="px-3.5 py-1.5 bg-surface border border-border-light rounded-full text-[12px] font-medium text-text-secondary">
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Persona Comparison — side by side */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Same platform. Your language.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Your clients aren&apos;t &ldquo;contacts&rdquo;. Your work isn&apos;t &ldquo;deals&rdquo;.
              Magic CRM adapts its vocabulary, fields, and workflows to match how you actually run your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONA_PREVIEWS.map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                onClick={() => setActivePersona(i)}
                className={`bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 glow-border ${
                  activePersona === i
                    ? "border-foreground/20 shadow-xl scale-[1.03] -translate-y-1"
                    : "border-border-light hover:border-foreground/10 hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: `2px solid ${persona.accent}` }}>
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: persona.accent + "18" }}>
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: persona.accent }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground leading-none">{persona.businessName}</p>
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
      </section>

      {/* Pick Your Modules — cinematic auto-demo */}
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Pick your modules.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Only turn on what you need. Every business gets a different combination.
            </p>
          </div>

          {/* Compact module pills — auto-animating */}
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center"><div className="w-2.5 h-2.5 bg-foreground rounded-sm" /></div>
                <span className="text-[13px] font-bold text-foreground">Your CRM</span>
              </div>
              <span className="text-[11px] text-text-tertiary">{enabledModules.size} of 14 modules active</span>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {CORE_MODULES.map((mod) => {
                  const isOn = enabledModules.has(mod.name);
                  return (
                    <motion.div
                      key={mod.name}
                      layout
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
                        isOn
                          ? "bg-white border-primary/25 shadow-sm"
                          : "bg-background/50 border-transparent opacity-40"
                      }`}
                    >
                      <mod.icon className={`w-3.5 h-3.5 ${isOn ? "text-primary" : "text-text-tertiary"}`} />
                      <span className={`text-[12px] font-medium ${isOn ? "text-foreground" : "text-text-tertiary"}`}>{mod.name}</span>
                      <div className={`w-7 h-[16px] rounded-full flex items-center px-0.5 transition-all duration-300 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                        <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customize Features — Full App Preview */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Then customize every detail.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Each module has toggleable sub-features. Turn on what matters, leave off what doesn&apos;t. Watch the page change in real time.
            </p>
          </div>

          {/* Interactive module selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CORE_MODULES.map((mod) => {
              const isActive = expandedModule === mod.name;
              return (
                <button
                  key={mod.name}
                  onClick={() => selectModule(mod.name)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer overflow-hidden ${
                    isActive
                      ? "bg-foreground text-white shadow-sm"
                      : "bg-white text-text-secondary hover:text-foreground border border-border-light hover:border-foreground/15 hover:shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  {isActive && moduleAutoCycle && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] bg-white/40"
                      style={{ width: `${moduleProgress}%` }}
                    />
                  )}
                  <mod.icon className="w-3.5 h-3.5" />
                  {mod.name}
                </button>
              );
            })}
          </div>

          {/* Full-width app mockup */}
          <div onMouseEnter={() => setModuleAutoCycle(false)} onMouseLeave={() => setModuleAutoCycle(true)}>
          <AnimatePresence mode="wait">
            {expandedModule && (() => {
              const mod = CORE_MODULES.find(m => m.name === expandedModule);
              if (!mod) return null;
              const allFeatures = getModuleFeatures(mod.name);
              const displayFeatures = allFeatures.length > 0 ? allFeatures : mod.subs;
              const getToggle = (sub: string) => demoToggles[`${mod.name}:${sub}`] !== false;
              const flipToggle = (sub: string) => setDemoToggles(prev => ({ ...prev, [`${mod.name}:${sub}`]: !getToggle(sub) }));
              const enabledCount = displayFeatures.filter(s => getToggle(s)).length;

              return (
                <motion.div
                  key={expandedModule}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="mb-8"
                >
                  {/* Full app mockup matching real dashboard layout */}
                  <div className="rounded-2xl border border-border-light overflow-hidden shadow-xl bg-background" style={{ minHeight: 520 }}>
                    {/* Browser chrome */}
                    <div className="bg-white border-b border-border-light px-4 py-2 flex items-center gap-2">
                      <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" /></div>
                      <div className="flex-1 flex justify-center"><div className="px-3 py-0.5 bg-background rounded text-[10px] text-text-tertiary">app.magiccrm.com</div></div>
                    </div>

                    <div className="flex h-[490px]">
                      {/* Sidebar */}
                      <div className="w-[180px] bg-white border-r border-border-light flex flex-col flex-shrink-0">
                        <div className="px-4 py-3 border-b border-border-light">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-foreground rounded-sm" /></div>
                            <span className="text-[11px] font-bold text-foreground">Magic CRM</span>
                          </div>
                        </div>
                        <nav className="flex-1 px-2 py-2 overflow-y-auto">
                          <div className="space-y-0.5">
                            {CORE_MODULES.slice(0, 8).map((m) => {
                              const isActive = m.name === mod.name;
                              return (
                                <div key={m.name} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] ${isActive ? "bg-primary-muted font-semibold text-foreground" : "text-text-secondary"}`}>
                                  {isActive && <div className="absolute left-0 w-[3px] h-3.5 bg-primary rounded-r-full" />}
                                  <m.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{m.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </nav>
                      </div>

                      {/* Main content area */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top header bar */}
                        <div className="bg-white border-b border-border-light px-5 py-2.5 flex items-center justify-between flex-shrink-0">
                          <div className="px-3 py-1.5 bg-background border border-border-light rounded-lg text-[10px] text-text-tertiary w-48">Search contacts, invoices...</div>
                          <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 bg-surface border border-border-light rounded-lg text-[10px] text-text-secondary flex items-center gap-1">
                              <SlidersHorizontal className="w-3 h-3" /> Customize <span className="text-[9px] text-primary bg-primary/10 px-1 rounded-full ml-0.5">{enabledCount}/{mod.subs.length}</span>
                            </div>
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"><span className="text-[8px] font-bold text-white">M</span></div>
                          </div>
                        </div>

                        {/* Page content + customize panel */}
                        <div className="flex flex-1 overflow-hidden">
                          {/* Module page */}
                          <div className="flex-1 overflow-y-auto p-5">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-[16px] font-bold text-foreground">{mod.name}</h3>
                                <p className="text-[11px] text-text-tertiary">{mod.desc}</p>
                              </div>
                              <div className="px-3 py-1.5 bg-foreground text-white rounded-xl text-[11px] font-semibold">+ New</div>
                            </div>
                            <ModulePreview moduleName={mod.name} getToggle={getToggle} />
                          </div>

                          {/* Customize slide-over panel — ALL features from features.ts */}
                          <div className="w-[280px] bg-white border-l border-border-light flex-shrink-0 overflow-y-auto">
                            <div className="px-4 py-3 border-b border-border-light sticky top-0 bg-white z-[1]">
                              <p className="text-[13px] font-bold text-foreground">Customize {mod.name}</p>
                              <p className="text-[10px] text-text-tertiary">{enabledCount} of {displayFeatures.length} features enabled</p>
                            </div>
                            <div className="p-2.5 space-y-0.5">
                              {displayFeatures.map((sub) => {
                                const isOn = getToggle(sub);
                                return (
                                  <div
                                    key={sub}
                                    onClick={() => flipToggle(sub)}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${isOn ? "bg-primary/5" : "hover:bg-background"}`}
                                  >
                                    <span className={`text-[10px] font-medium ${isOn ? "text-foreground" : "text-text-tertiary"}`}>{sub}</span>
                                    <div className={`w-7 h-[16px] rounded-full flex items-center px-0.5 transition-all duration-200 flex-shrink-0 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                                      <motion.div layout className="w-3 h-3 bg-white rounded-full shadow-sm" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-4" style={{ display: "none" }}>
            {/* Bookings preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-500" /></div>
                  <div><p className="text-[14px] font-semibold text-foreground">Bookings & Calendar</p><p className="text-[11px] text-text-tertiary">Online scheduling with reminders</p></div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} className="text-[10px] text-text-tertiary text-center font-medium">{d}</div>)}
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} className={`text-[11px] text-center py-1 rounded-md ${
                      [4,5,11,12,18,19,25,26].includes(i) ? "text-text-tertiary" :
                      [7,14,21].includes(i) ? "bg-primary/15 text-foreground font-semibold" :
                      [8,15].includes(i) ? "bg-blue-50 text-blue-600 font-medium" :
                      "text-foreground"
                    }`}>{i + 1}</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {[
                    { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" },
                    { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" },
                    { time: "2:00 PM", name: "Emma — Brow Lamination", color: "bg-blue-400" },
                  ].map((appt, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/50">
                      <div className={`w-1.5 h-6 rounded-full ${appt.color}`} />
                      <span className="text-[11px] text-text-tertiary w-16">{appt.time}</span>
                      <span className="text-[11px] text-foreground font-medium">{appt.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Online Booking Page", "Waitlist", "Deposits", "Buffer Time", "Reminders"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Pipeline preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Inbox className="w-4 h-4 text-purple-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Leads & Pipeline</p><p className="text-[11px] text-text-tertiary">Capture, track, and convert</p></div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { stage: "New", color: "bg-blue-400", items: ["Lisa M.", "Tom K."] },
                    { stage: "Contacted", color: "bg-yellow-400", items: ["Sarah P."] },
                    { stage: "Proposal", color: "bg-purple-400", items: ["James W.", "Mia L."] },
                    { stage: "Won", color: "bg-green-400", items: ["Zoe R."] },
                  ].map((col, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-2 h-2 rounded-full ${col.color}`} />
                        <span className="text-[10px] font-semibold text-text-tertiary uppercase">{col.stage}</span>
                      </div>
                      <div className="space-y-1.5">
                        {col.items.map((name, j) => (
                          <div key={j} className="bg-surface/70 rounded-lg px-2 py-1.5 text-[11px] text-foreground font-medium">{name}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Web Forms", "Follow-Ups", "Auto-Assign"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Invoicing preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center"><Receipt className="w-4 h-4 text-emerald-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Quotes & Invoicing</p><p className="text-[11px] text-text-tertiary">Quote the job, send the invoice, get paid</p></div>
              </div>
              <div className="p-4">
                <div className="bg-surface/30 rounded-xl p-3 border border-border-light">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">INV-0042</p>
                      <p className="text-[10px] text-text-tertiary">Sarah Mitchell</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 font-medium">Pending</span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {[
                      { item: "Classic Full Set", qty: "1", price: "$150" },
                      { item: "Lash Removal", qty: "1", price: "$25" },
                    ].map((line, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-text-secondary">{line.item} x{line.qty}</span>
                        <span className="text-foreground font-medium">{line.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border-light pt-2 flex justify-between">
                    <span className="text-[12px] font-semibold text-foreground">Total</span>
                    <span className="text-[14px] font-bold text-foreground">$175.00</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Quote Builder", "Templates", "Tipping", "Partial Payments", "Auto Tax"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Communication preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border-light flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center"><MessageCircle className="w-4 h-4 text-orange-500" /></div>
                <div><p className="text-[14px] font-semibold text-foreground">Communication</p><p className="text-[11px] text-text-tertiary">Every conversation, one inbox</p></div>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { name: "Sarah M.", channel: "SMS", msg: "Hi! Can I reschedule my Thursday appt?", time: "2m ago", unread: true },
                  { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice, paid!", time: "1hr ago", unread: false },
                  { name: "Emma R.", channel: "Instagram", msg: "Do you have availability this Sat?", time: "3hr ago", unread: true },
                  { name: "Tom K.", channel: "WhatsApp", msg: "Sent you the before photos", time: "Yesterday", unread: false },
                ].map((conv, i) => (
                  <div key={i} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${conv.unread ? "bg-primary/5" : "bg-surface/30"}`}>
                    <div className="w-7 h-7 bg-surface rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-foreground">{conv.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-foreground">{conv.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface text-text-tertiary">{conv.channel}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">{conv.msg}</p>
                    </div>
                    <span className="text-[10px] text-text-tertiary flex-shrink-0">{conv.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-border-light bg-surface/20 flex flex-wrap gap-1">
                {["Email", "SMS", "Instagram", "WhatsApp", "Canned Responses", "Scheduled Send"].map((f) => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-surface border border-border-light rounded-full text-text-secondary">{f}</span>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Attachment showcase — hidden, replaced by interactive demo above */}
      <section className="py-12 sm:py-20 bg-white" style={{ display: "none" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Every module goes deeper.
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Each module has toggleable features you can snap on or off. Like attachments on a tool — keep it simple, or kit it out.
              </p>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Need a waitlist for your salon? Toggle it on. Want deposit protection for no-shows? One switch. Don&apos;t need Google Calendar sync? Leave it off.
              </p>
              <p className="text-[14px] font-semibold text-foreground">
                207 toggleable features across 23 modules — you pick exactly what shows up.
              </p>
            </div>

            {/* Visual: Module with toggle switches */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card-bg rounded-2xl border border-border-light overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ATTACHMENT_EXAMPLE.icon className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{ATTACHMENT_EXAMPLE.module}</p>
                    <p className="text-[11px] text-text-tertiary">{ATTACHMENT_EXAMPLE.core}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {enabledAttachmentCount}/{ATTACHMENT_EXAMPLE.attachments.length} on
                </span>
              </div>
              <div className="p-4 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Try toggling — this is how it works inside the app</p>
                {ATTACHMENT_EXAMPLE.attachments.map((att, i) => {
                  const isOn = attachmentToggles[att.name] ?? att.on;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => toggleAttachment(att.name)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-all ${isOn ? "bg-primary/5 border border-primary/15" : "bg-surface/50 hover:bg-surface"}`}
                    >
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{att.name}</p>
                        <p className="text-[11px] text-text-tertiary">{att.desc}</p>
                      </div>
                      <div className={`w-10 h-[22px] rounded-full flex items-center px-0.5 transition-all duration-200 ${isOn ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}>
                        <motion.div layout className="w-[18px] h-[18px] bg-white rounded-full shadow-sm" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Add-ons — Visual Showcases */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              9 add-ons when you&apos;re ready for more.
            </h2>
            <p className="text-text-secondary text-[15px] max-w-lg mx-auto">
              Start simple. Add power later. One click from your sidebar — no setup, no downtime.
            </p>
          </div>

          {/* Hero add-ons with visual previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Client Portal preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #3B82F6" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-500/10"><Globe className="w-3.5 h-3.5 text-blue-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">Client Portal</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Your client sees</p>
                {[
                  { label: "Upcoming Bookings", value: "2 appointments" },
                  { label: "Outstanding Invoices", value: "$175.00 due" },
                  { label: "Shared Documents", value: "3 files" },
                  { label: "Messages", value: "1 unread" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-surface/50">
                    <span className="text-[11px] text-text-secondary">{row.label}</span>
                    <span className="text-[11px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Insights preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #F59E0B" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-500/10"><Lightbulb className="w-3.5 h-3.5 text-yellow-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">AI Insights</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">This week</p>
                {[
                  { text: "Sarah M. is 2 weeks overdue for her lash fill", border: "border-l-red-400", priority: "Action" },
                  { text: "Tom K. opened your quote 3x but hasn't responded", border: "border-l-yellow-400", priority: "Follow up" },
                  { text: "Tuesday afternoons are consistently empty", border: "border-l-blue-400", priority: "Opportunity" },
                ].map((insight, i) => (
                  <div key={i} className={`px-2.5 py-2 rounded-lg bg-surface/50 border-l-2 ${insight.border}`}>
                    <p className="text-[11px] text-foreground leading-snug">{insight.text}</p>
                    <span className="text-[9px] text-text-tertiary font-medium uppercase mt-0.5">{insight.priority}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Loyalty preview */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card-bg rounded-2xl border border-border-light overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light flex items-center gap-2.5" style={{ borderTop: "2px solid #10B981" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-500/10"><Gift className="w-3.5 h-3.5 text-emerald-500" /></div>
                <p className="text-[13px] font-semibold text-foreground">Loyalty & Referrals</p>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Top members</p>
                {[
                  { name: "Sarah M.", points: "420 pts", rank: "1" },
                  { name: "Emma R.", points: "310 pts", rank: "2" },
                  { name: "Jess T.", points: "185 pts", rank: "3" },
                ].map((member, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-surface/50">
                    <span className="text-[10px] font-bold text-text-tertiary w-4">{member.rank}.</span>
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[8px] font-bold text-white">{member.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <span className="text-[11px] text-foreground font-medium flex-1">{member.name}</span>
                    <span className="text-[11px] font-semibold text-primary">{member.points}</span>
                  </div>
                ))}
                <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-primary font-medium">Referral code SARAH10 used 4 times this month</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Remaining add-ons — with mini previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Memberships */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #8B5CF6" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><Crown className="w-4 h-4 text-purple-500" /><p className="text-[13px] font-semibold text-foreground">Memberships</p></div>
              <div className="px-4 pb-4 space-y-1.5">
                {[{ plan: "10-Session Pack", price: "$450", members: "8 active" }, { plan: "Monthly Unlimited", price: "$99/mo", members: "12 active" }].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border-light">
                    <div><p className="text-[11px] font-medium text-foreground">{p.plan}</p><p className="text-[9px] text-text-tertiary">{p.members}</p></div>
                    <span className="text-[11px] font-semibold text-foreground">{p.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Win-Back */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #F59E0B" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><UserCheck className="w-4 h-4 text-amber-500" /><p className="text-[13px] font-semibold text-foreground">Win-Back</p></div>
              <div className="px-4 pb-4 space-y-1.5">
                {[{ name: "Sarah M.", days: "45 days inactive", status: "Contacted" }, { name: "Tom K.", days: "62 days inactive", status: "Detected" }].map((c) => (
                  <div key={c.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border-light">
                    <div><p className="text-[11px] font-medium text-foreground">{c.name}</p><p className="text-[9px] text-text-tertiary">{c.days}</p></div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.status === "Contacted" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Storefront */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #06B6D4" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><Store className="w-4 h-4 text-cyan-500" /><p className="text-[13px] font-semibold text-foreground">Storefront</p></div>
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-background border border-border-light p-3">
                  <p className="text-[11px] font-semibold text-foreground mb-1">Your Business</p>
                  <p className="text-[9px] text-text-tertiary mb-2">yourbusiness.magic/book</p>
                  <div className="space-y-1">
                    {["Lash Full Set — $150", "Brow Lamination — $65"].map((s) => (
                      <div key={s} className="flex items-center justify-between text-[10px]"><span className="text-text-secondary">{s.split(" — ")[0]}</span><span className="font-medium text-foreground">{s.split(" — ")[1]}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Intake Forms */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.04 }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #EC4899" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><FileInput className="w-4 h-4 text-pink-500" /><p className="text-[13px] font-semibold text-foreground">Intake Forms</p></div>
              <div className="px-4 pb-4 space-y-1.5">
                <div className="rounded-lg bg-background border border-border-light p-3 space-y-2">
                  {["Full Name *", "Email *", "Any allergies?"].map((f) => (
                    <div key={f}><p className="text-[9px] text-text-tertiary mb-0.5">{f}</p><div className="h-6 bg-surface rounded border border-border-light" /></div>
                  ))}
                  <div className="h-7 bg-foreground/10 rounded flex items-center justify-center text-[9px] text-text-tertiary font-medium">Submit</div>
                </div>
              </div>
            </motion.div>

            {/* Before & After */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #14B8A6" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><Camera className="w-4 h-4 text-teal-500" /><p className="text-[13px] font-semibold text-foreground">Before & After</p></div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[9px] text-text-tertiary mb-1 text-center">Before</p><div className="aspect-square bg-surface rounded-lg border border-border-light flex items-center justify-center"><Camera className="w-5 h-5 text-text-tertiary/30" /></div></div>
                  <div><p className="text-[9px] text-text-tertiary mb-1 text-center">After</p><div className="aspect-square bg-primary/5 rounded-lg border border-primary/15 flex items-center justify-center"><Camera className="w-5 h-5 text-primary/30" /></div></div>
                </div>
              </div>
            </motion.div>

            {/* Treatment Notes */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderTop: "2px solid #6366F1" }}>
              <div className="px-4 py-3 flex items-center gap-2.5"><ClipboardList className="w-4 h-4 text-indigo-500" /><p className="text-[13px] font-semibold text-foreground">Treatment Notes</p></div>
              <div className="px-4 pb-4 space-y-1.5">
                {[{ letter: "S", label: "Subjective", text: "Patient reports lower back pain..." }, { letter: "O", label: "Objective", text: "ROM limited to 40° flexion..." }, { letter: "A", label: "Assessment", text: "Lumbar strain, improving..." }].map((n) => (
                  <div key={n.letter} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-background border border-border-light">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{n.letter}</span>
                    <div><p className="text-[10px] font-medium text-foreground">{n.label}</p><p className="text-[9px] text-text-tertiary">{n.text}</p></div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Build Your Own */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-[11px] font-medium text-purple-700 mb-4">
                <Zap className="w-3 h-3" /> AI-Powered
              </div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Build your own<br />features with AI.
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-6">
                Need something we don&apos;t have? Describe it in plain English and our AI builder creates a custom module — with its own data, views, and automations. Built on top of your existing CRM data.
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
                      <p className="text-[14px] font-semibold text-foreground">{step.title}</p>
                      <p className="text-[12px] text-text-secondary">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-lg">
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
                    <div className="flex-1 h-9 bg-foreground rounded-xl flex items-center justify-center text-[12px] text-white font-semibold">Build Feature</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">What AI can build</p>
                    {["Custom data collections", "Table & kanban views", "Automated triggers", "Connected to your CRM data"].map((c) => (
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
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3">
              Three steps. Your CRM.
            </h2>
            <p className="text-text-secondary text-[15px]">No consultants. No migration headaches. No training videos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Pick your industry", description: "We pre-select modules and settings that match your type of business. Makeup artist? Plumber? Consultant? We know what you need." },
              { num: "2", title: "Fine-tune it", description: "Toggle features on or off. Need invoicing but not bookings? Done. Want a lead pipeline but not marketing? Easy." },
              { num: "3", title: "Start working", description: "Your dashboard is ready with only what you selected. Add clients, send invoices, manage projects. Add more modules anytime from the sidebar." },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{item.num}</span>
                </div>
                <h3 className="font-semibold text-foreground text-[17px] mb-2">{item.title}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not the others */}
      <section className="py-12 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-4">
                Why not just use<br />HubSpot or Monday?
              </h2>
              <p className="text-text-secondary text-[15px] leading-relaxed mb-8">
                Because they weren&apos;t built for a 3-person landscaping crew or a solo makeup artist. You end up paying for 200 features and using 12.
              </p>
              <div className="space-y-4">
                {[
                  { title: "No per-seat pricing", desc: "Your whole team gets access. Add people without doing math." },
                  { title: "Only your features", desc: "No hidden tabs, no locked modules, no 'upgrade to unlock' walls." },
                  { title: "207 features, all toggleable", desc: "Every feature is a switch. Flip it on when you need it, off when you don't." },
                  { title: "9 add-ons, one click each", desc: "Need a client portal next month? Click install. Need SOAP notes? Click install." },
                  { title: "Industry-native vocabulary", desc: "A plumber sees Jobs and Quotes. A physio sees Patients and Treatment Plans." },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-[14px]">{item.title}</p>
                      <p className="text-[13px] text-text-secondary">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div className="space-y-4">
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  I was paying $180/mo for a CRM I used 10% of. Magic CRM gave me exactly what I needed for my salon in under 5 minutes.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">SK</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Sarah K.</p>
                    <p className="text-[11px] text-text-tertiary">Hair salon owner, Melbourne</p>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  Finally a CRM that gets trades. Quote, invoice, track the job, done. No nonsense. The add-ons are a bonus.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">MR</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Mike R.</p>
                    <p className="text-[11px] text-text-tertiary">Electrician, Gold Coast</p>
                  </div>
                </div>
              </div>
              <div className="bg-card-bg rounded-xl border border-border-light p-6 relative">
                <div className="absolute -top-2 -left-2 text-5xl text-foreground/5">&ldquo;</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-[14px] text-foreground leading-relaxed mb-4">
                  The client portal made my coaching practice feel so professional. Clients love being able to see their sessions and pay from one place.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center"><span className="text-[12px] font-bold text-foreground">JT</span></div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">Jess T.</p>
                    <p className="text-[11px] text-text-tertiary">Business coach, Sydney</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground mb-3 leading-tight">
            One plan. Everything included.
          </h2>
          <p className="text-text-secondary mb-10 text-[15px]">
            No tiers. No per-user fees. No feature gates.
          </p>

          <div className="bg-card-bg rounded-2xl border border-border-light p-8 text-left">
            <div className="mb-6">
              <span className="text-[40px] font-bold text-foreground">$49</span>
              <span className="text-text-secondary text-[15px]">/month</span>
            </div>
            <div className="space-y-3 mb-8">
              {[
                "23 modules — pick what you need",
                "207 toggleable features included",
                "9 add-ons — install anytime",
                "Unlimited team members",
                "AI Builder — 25 credits",
                "Priority email support",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-[14px] text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/onboarding">
              <Button size="lg" className="w-full">
                Start building <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-[11px] text-text-tertiary mt-3 text-center">
              Extra integrations from $10/mo. AI credits from $5 per 10.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-[1.5rem] sm:text-[2rem] font-bold text-white mb-4 leading-tight">
            Stop paying for features you don&apos;t use.
          </h2>
          <p className="text-white/50 mb-8 text-[15px]">
            Build a CRM that actually fits your business in under 2 minutes.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="px-10 bg-primary text-foreground hover:bg-primary-hover shadow-none hover:shadow-none">
              Build my CRM <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-sm" />
            </div>
            <span className="font-semibold text-foreground text-[13px]">Magic CRM</span>
          </div>
          <p className="text-[12px] text-text-tertiary">
            &copy; {new Date().getFullYear()} Magic CRM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
