// Static data driving the cinematic landing-page demo. Pulled out of the
// JSX so each demo component (ModulePicker, FeatureCustomize, Mobile,
// DemoContent) can pull only what it needs.

import {
  Users, Inbox, MessageCircle, Calendar, Receipt, FolderKanban,
  Megaphone, FileText, Zap, UsersRound, ScrollText,
  Sparkles, Gift, Heart, BadgeCheck, RotateCcw,
} from "lucide-react";

export const MODULES = [
  { name: "Clients", icon: Users },
  { name: "Inquiries", icon: Inbox },
  { name: "Messages", icon: MessageCircle },
  { name: "Bookings", icon: Calendar },
  { name: "Projects", icon: FolderKanban },
  { name: "Payments", icon: Receipt },
  { name: "Proposals", icon: ScrollText },
  { name: "Documents", icon: FileText },
  { name: "Marketing", icon: Megaphone },
  { name: "Team", icon: UsersRound },
  { name: "Automations", icon: Zap },
];

// Add-on modules — appear in FeatureCustomizeDemo sidebar based on persona,
// not part of the core MODULES grid in ModulePickerDemo.
export const ADDON_MODULES = [
  { name: "Memberships", icon: BadgeCheck },
  { name: "Gift Cards", icon: Gift },
  { name: "Loyalty", icon: Heart },
  { name: "AI Insights", icon: Sparkles },
  { name: "Win-Back", icon: RotateCcw },
];

export const ALL_FEATURE_MODULES = [...MODULES, ...ADDON_MODULES];

// ── Persona presets for the module picker demo ──
export const PERSONA_PRESETS = [
  { label: "Sarah", role: "Lash Tech", context: "Sarah does lash extensions and brow lamination. She uses Bookings tailored to lash work, a Service Menu, and Payments — because that’s how she works.", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Marketing", "Automations"] },
  { label: "Emma", role: "Hair Stylist", context: "Emma runs a 3-chair salon. She got a Client list with colour formulas and hair types, Bookings with rebooking prompts, and Payments that track tips and retail sales.", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Marketing", "Team", "Automations"] },
  { label: "Priya", role: "Nail Tech", context: "Priya does gel extensions and nail art from a home studio. She got a Service Menu with durations and pricing, Bookings with no-show protection, and client preferences for nail shape and type.", modules: ["Clients", "Messages", "Bookings", "Payments", "Marketing", "Automations"] },
  { label: "Jessica", role: "Makeup Artist", context: "Jessica does bridal and event makeup. She got Wedding Inquiries with event dates and party size, deposit-based Payments, and a trial booking workflow.", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Proposals", "Marketing", "Automations"] },
  { label: "Mia", role: "Spa Owner", context: "Mia runs a day spa with massage therapists. She got a treatment menu, client profiles with pressure preferences and contraindications, and team scheduling across multiple rooms.", modules: ["Clients", "Messages", "Bookings", "Payments", "Marketing", "Team", "Automations"] },
];

export const PERSONA_CYCLE_MS = 6000;

// Module-specific data for the customize demo (full feature list + sample
// content per module). Used by FeatureCustomizeDemo and DemoContent.
export const MODULE_DEMOS: Record<string, { features: string[]; desc: string; content: { type: string; data: Record<string, unknown>[] } }> = {
  Clients: { features: ["CSV Import", "Lifecycle Stages", "Follow-Up Reminders", "Birthday Alerts", "Custom Fields", "Referral Tracking"], desc: "Profiles, tags, and full client history",
    content: { type: "table", data: [{ name: "Sarah Mitchell", email: "sarah@email.com", status: "active" }, { name: "Jess Thompson", email: "jess@email.com", status: "active" }, { name: "Emma Roberts", email: "emma@email.com", status: "inactive" }, { name: "Tom Kennedy", email: "tom@email.com", status: "prospect" }] } },
  Inquiries: { features: ["Web Capture Forms", "Lead Scoring", "Custom Pipeline Stages", "Follow-Up Reminders", "Auto-Response", "Lead to Client Conversion"], desc: "Capture, score, and convert leads",
    content: { type: "kanban", data: [{ stage: "New", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", items: ["Sarah P."] }, { stage: "Proposal", items: ["James W."] }, { stage: "Won", items: ["Zoe R."] }] } },
  Messages: { features: ["Email", "SMS", "Instagram DMs", "WhatsApp", "Bulk Messaging", "After-Hours Auto-Reply"], desc: "Every channel, one inbox",
    content: { type: "inbox", data: [{ name: "Sarah M.", channel: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", channel: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", channel: "Instagram", msg: "Saturday availability?", time: "3hr" }] } },
  Bookings: { features: ["Online Booking Page", "Walk-In Queue", "Rebooking Prompts", "Booking Deposits", "No-Show Protection", "Satisfaction Rating"], desc: "Bookings, calendar, and reminders",
    content: { type: "appointments", data: [{ time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400" }, { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400" }, { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400" }] } },
  Projects: { features: ["Billable Rate Tracking", "Expense Tracking", "Client Approval", "Profitability Summary", "Job Templates", "Recurring Jobs"], desc: "Tasks, time tracking, and deadlines",
    content: { type: "table", data: [{ name: "Kitchen renovation", email: "In Progress", status: "high" }, { name: "Bathroom refit", email: "Quoted", status: "medium" }, { name: "Garden lights", email: "Complete", status: "low" }] } },
  Payments: { features: ["Invoices", "Quotes", "Milestone Billing", "Payment Plans", "Aging Report", "Stripe Integration"], desc: "Quotes, invoices, and payments",
    content: { type: "table", data: [{ name: "INV-001 Sarah M.", email: "A$175", status: "paid" }, { name: "INV-002 Jess T.", email: "A$200", status: "sent" }, { name: "INV-003 Emma R.", email: "A$90", status: "overdue" }] } },
  Proposals: { features: ["Wedding Templates", "Multi-Session Packages", "E-Signatures", "Deposit Capture", "Client View Tracking", "Auto-Follow-Up"], desc: "Branded proposals with e-sign",
    content: { type: "table", data: [{ name: "PROP-001 Bridal — Ava & James", email: "A$4,500", status: "viewed" }, { name: "PROP-002 Engagement — Mia K.", email: "A$850", status: "sent" }, { name: "PROP-003 Event — Lila R.", email: "A$2,200", status: "signed" }] } },
  Documents: { features: ["Contract Templates", "E-Signatures", "Version History", "Expiry Tracking", "Auto-Attach to Job", "Document Tags"], desc: "Contracts, files, and signatures",
    content: { type: "table", data: [{ name: "Service Agreement.pdf", email: "Contract", status: "signed" }, { name: "NDA — Tom K.pdf", email: "NDA", status: "pending" }] } },
  Marketing: { features: ["Email Sequences", "Social Scheduling", "Review Collection", "Coupon Codes", "Audience Segmentation", "Referral Program"], desc: "Campaigns, sequences, and reviews",
    content: { type: "table", data: [{ name: "Summer Promo", email: "Email Campaign", status: "sent" }, { name: "New Year Offer", email: "Email Campaign", status: "draft" }] } },
  Team: { features: ["Module Access Control", "Role Templates", "Workload View", "Shift Scheduling", "Performance Dashboard", "Team Discussions"], desc: "Staff, roles, and assignments",
    content: { type: "table", data: [{ name: "You", email: "Owner", status: "online" }, { name: "Alex K.", email: "Stylist", status: "online" }, { name: "Mia L.", email: "Junior", status: "offline" }] } },
  Automations: { features: ["Recurring Task Templates", "Email Automations", "Conditional Logic", "Trigger Rules", "Activity Triggers", "Automation Log"], desc: "Automate repetitive work",
    content: { type: "table", data: [{ name: "Welcome email", email: "New client added", status: "active" }, { name: "Follow-up", email: "No booking 30d", status: "active" }] } },
  Memberships: { features: ["Tier Builder", "Auto-Renewal", "Member Pricing", "Pause Membership", "Member-Only Promos", "Usage Tracking"], desc: "Recurring packages and member tiers",
    content: { type: "table", data: [{ name: "Lash Club — Monthly", email: "A$120/mo", status: "active" }, { name: "Glow Tier — Quarterly", email: "A$330/qtr", status: "active" }, { name: "VIP Annual", email: "A$1,200/yr", status: "active" }] } },
  "Gift Cards": { features: ["Custom Designs", "Bulk Sales", "Expiry Rules", "Refund Tracking", "Gift Card Reports", "Email Delivery"], desc: "Sell, redeem, and track gift cards",
    content: { type: "table", data: [{ name: "GC-1041 — Mother's Day", email: "A$100", status: "active" }, { name: "GC-1042 — Birthday", email: "A$50", status: "redeemed" }, { name: "GC-1043 — Holiday", email: "A$200", status: "active" }] } },
  Loyalty: { features: ["Points Per Visit", "Spend Multipliers", "Tier Rewards", "Birthday Bonuses", "Referral Rewards", "Redemption Tracking"], desc: "Reward repeat clients with points",
    content: { type: "table", data: [{ name: "Sarah M. — Gold", email: "1,240 pts", status: "active" }, { name: "Jess T. — Silver", email: "680 pts", status: "active" }, { name: "Emma R. — Bronze", email: "320 pts", status: "active" }] } },
  "AI Insights": { features: ["Daily Briefing", "Revenue Forecast", "At-Risk Client Score", "Booking Pattern Analysis", "Service Mix Suggestions", "Anomaly Alerts"], desc: "AI-powered business insights",
    content: { type: "table", data: [{ name: "Revenue forecast — May", email: "A$18,400 ▲12%", status: "active" }, { name: "5 clients at risk", email: "No booking 60d", status: "sent" }, { name: "Tuesday gap detected", email: "Avg 40% empty", status: "active" }] } },
  "Win-Back": { features: ["Inactivity Triggers", "Auto Drip Campaigns", "Discount Offers", "Win-Back Reports", "Custom Inactivity Window", "Outreach Lists"], desc: "Re-engage clients who've gone quiet",
    content: { type: "table", data: [{ name: "60-day silent — 12 clients", email: "Drip queued", status: "active" }, { name: "Lapsed VIPs — 4 clients", email: "20% offer sent", status: "sent" }, { name: "May win-back report", email: "8 reactivated", status: "paid" }] } },
};

// ── Module info cards (shown outside the demo frame) ──
export const MODULE_INFO: Record<string, { headline: string; detail: string; stat?: string; statLabel?: string }> = {
  Clients: { headline: "Customize how you track clients", detail: "From follow-up reminders and birthday alerts to lifecycle stages and referral tracking — choose what matters to your business. Add your own custom fields too." },
  Inquiries: { headline: "Your pipeline, your rules", detail: "From lead scoring and auto-response to custom pipeline stages — configure how inquiries flow through your business. Every step is yours to define." },
  Messages: { headline: "Pick your channels, set your rules", detail: "From email and SMS to Instagram DMs and WhatsApp — turn on the channels you use. Add bulk messaging, canned responses, and auto-replies as you need them." },
  Bookings: { headline: "Bookings built around your workflow", detail: "From online booking pages and deposits to walk-in queues and rebooking prompts — every booking feature is a toggle. Turn on what fits your business." },
  Projects: { headline: "Track work your way", detail: "From billable rate tracking and expense logging to client approval gates and profitability summaries — build the project workflow that matches how you actually work." },
  Payments: { headline: "Invoices and quotes — built in", detail: "From milestone billing and payment plans to aging reports — everything your payments need lives where your bookings do. Stripe-connected so paid invoices reconcile automatically." },
  Proposals: { headline: "Win weddings and events", detail: "Send branded multi-session packages with photos, pricing tiers, and e-signature. Capture a deposit at sign, track when the client opens the proposal, and auto-follow-up if they go quiet." },
  Documents: { headline: "Contracts and files, simplified", detail: "From contract templates with merge fields to e-signatures and expiry alerts — manage your documents without leaving your workspace. Auto-attach to jobs as you go." },
  Marketing: { headline: "Grow without extra tools", detail: "From email sequences and social scheduling to review collection and referral programs — your marketing stack lives inside your workspace. No extra subscriptions." },
  Team: { headline: "Everyone sees only what they need", detail: "From module-level access control to role templates and performance dashboards — set up your team so everyone has exactly the tools they need, nothing more." },
  Automations: { headline: "Automate the repetitive stuff", detail: "From trigger rules and email automations to recurring task templates — set up once and let your workspace handle the follow-ups, reminders, and status updates." },
  Memberships: { headline: "Recurring revenue, on autopilot", detail: "From tier builders and auto-renewal to member-only pricing and pause options — turn one-off clients into a predictable monthly base." },
  "Gift Cards": { headline: "Gift cards that sell themselves", detail: "From custom designs and bulk sales to expiry rules and email delivery — every gift card you sell is tracked, redeemed, and reconciled in one place." },
  Loyalty: { headline: "Reward the regulars", detail: "From points-per-visit and spend multipliers to tier rewards and birthday bonuses — give your repeat clients a reason to come back." },
  "AI Insights": { headline: "Your AI co-pilot", detail: "From daily briefings and revenue forecasts to at-risk client alerts and booking gap detection — surface what matters without lifting a finger." },
  "Win-Back": { headline: "Bring quiet clients back", detail: "From inactivity triggers and auto drip campaigns to targeted discount offers — re-engage clients who've gone silent before they're gone for good." },
};

// Left-side info: what the module does (points from sidebar)
export const MODULE_LEFT_INFO: Record<string, { title: string; points: string[] }> = {
  Clients: { title: "Client Database", points: ["Full contact profiles", "Service history & notes", "Tags, segments, lifecycle stages", "CSV import with smart mapping"] },
  Inquiries: { title: "Inquiry Pipeline", points: ["Capture from web, social, referrals", "Visual pipeline with custom stages", "Auto-score & prioritize inquiries", "One-click convert to client"] },
  Messages: { title: "Unified Inbox", points: ["Email, SMS, Instagram, WhatsApp", "Canned responses & templates", "Schedule messages in advance", "Auto-reply outside hours"] },
  Bookings: { title: "Booking System", points: ["Online booking page", "Walk-in queue management", "Deposits & no-show protection", "Auto rebooking reminders"] },
  Projects: { title: "Job Tracking", points: ["Task lists with checklists", "Time tracking with billable rates", "Expense logging per job", "Client approval at each stage"] },
  Payments: { title: "Payments Hub", points: ["Invoices with status tracking", "Quotes with version history", "Milestone & deposit billing", "Stripe-connected payments"] },
  Proposals: { title: "Proposals", points: ["Branded wedding & event proposals", "Multi-session packages & tiers", "E-signature & deposit capture", "View tracking & auto-follow-up"] },
  Documents: { title: "Document Manager", points: ["Contract templates with merge fields", "E-signatures built in", "Auto-attach to jobs", "Expiry alerts & version history"] },
  Marketing: { title: "Marketing Suite", points: ["Email sequences & campaigns", "Social media scheduling", "Review collection automation", "Coupon codes & referral program"] },
  Team: { title: "Team Management", points: ["Module-level access control", "Role templates per industry", "Workload & performance views", "Internal discussion threads"] },
  Automations: { title: "Workflow Engine", points: ["If-this-then-that triggers", "Email automation flows", "Recurring task templates", "Activity-based actions"] },
  Memberships: { title: "Memberships", points: ["Build tiers with custom perks", "Auto-renew & pause options", "Member-only pricing", "Track usage per member"] },
  "Gift Cards": { title: "Gift Cards", points: ["Sell single or bulk", "Custom designs & messages", "Expiry rules & reports", "Auto email delivery"] },
  Loyalty: { title: "Loyalty Program", points: ["Points per visit & spend", "Tiered rewards", "Birthday & referral bonuses", "Redemption tracking"] },
  "AI Insights": { title: "AI Insights", points: ["Daily business briefing", "Revenue forecasts", "At-risk client alerts", "Anomaly detection"] },
  "Win-Back": { title: "Win-Back", points: ["Inactivity triggers", "Auto drip campaigns", "Discount offer engine", "Outreach reports"] },
};

export const CUSTOMIZE_TICK_MS = 3500;

// ── Persona presets for the feature customize demo ──
export const FEATURE_PERSONAS = [
  { label: "Lash Tech", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Documents", "Marketing", "Automations", "Loyalty", "Memberships"] },
  { label: "Hair Stylist", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Documents", "Marketing", "Team", "Automations", "Memberships", "Loyalty"] },
  { label: "Nail Tech", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Documents", "Marketing", "Automations", "Loyalty", "Win-Back"] },
  { label: "Makeup Artist", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Proposals", "Documents", "Payments", "Marketing", "Automations", "Gift Cards", "Win-Back"] },
  { label: "Spa Owner", modules: ["Clients", "Inquiries", "Messages", "Bookings", "Payments", "Proposals", "Documents", "Marketing", "Team", "Automations", "Memberships", "Gift Cards", "AI Insights"] },
];
