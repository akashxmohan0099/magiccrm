"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar, Receipt, FolderKanban, Megaphone,
  MessageCircle, Check, ArrowLeft, Mail, Smartphone,
  Package, Sparkles,
} from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { NeedsAssessment, TEAM_SIZE_OPTIONS } from "@/types/onboarding";

// ── Brand icons ──

function InstagramIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.416-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.416 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 1 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/></svg>;
}
function WhatsAppIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>;
}
function FacebookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
}
function LinkedInIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-6 h-6" />,
  sms: <Smartphone className="w-6 h-6" />,
  "instagram-dms": <InstagramIcon className="w-6 h-6" />,
  whatsapp: <WhatsAppIcon className="w-6 h-6" />,
  "facebook-messenger": <FacebookIcon className="w-6 h-6" />,
  linkedin: <LinkedInIcon className="w-6 h-6" />,
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, Calendar, Receipt, FolderKanban, Megaphone, MessageCircle, Package, Sparkles,
};

// ── Categories with high-level bundles ──

interface FeatureBundle {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
  hasChannelIcon?: boolean;
}

interface FeatureCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  bundles: FeatureBundle[];
  isChannelPicker?: boolean;
}

const CATEGORIES: FeatureCategory[] = [
  {
    id: "clients",
    title: "Clients & Leads",
    subtitle: "Manage your contacts and grow your pipeline.",
    icon: "Users",
    bundles: [
      { id: "client-management", label: "Client Management", description: "Your contacts, notes, and history in one place", defaultOn: true },
      { id: "lead-capture", label: "Lead Capture", description: "Capture and track leads from your website and socials", defaultOn: true },
      { id: "support-helpdesk", label: "Support & Helpdesk", description: "Track client requests and follow-ups", defaultOn: false },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    subtitle: "Where do your clients reach you?",
    icon: "MessageCircle",
    isChannelPicker: true,
    bundles: [
      { id: "email", label: "Email", description: "", defaultOn: true, hasChannelIcon: true },
      { id: "sms", label: "SMS", description: "", defaultOn: false, hasChannelIcon: true },
      { id: "instagram-dms", label: "Instagram", description: "", defaultOn: false, hasChannelIcon: true },
      { id: "whatsapp", label: "WhatsApp", description: "", defaultOn: false, hasChannelIcon: true },
      { id: "facebook-messenger", label: "Messenger", description: "", defaultOn: false, hasChannelIcon: true },
      { id: "linkedin", label: "LinkedIn", description: "", defaultOn: false, hasChannelIcon: true },
    ],
  },
  {
    id: "scheduling",
    title: "Scheduling",
    subtitle: "Let clients book you without the back-and-forth.",
    icon: "Calendar",
    bundles: [
      { id: "online-booking", label: "Online Booking", description: "Booking page, reminders, and calendar sync included", defaultOn: true },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    subtitle: "Send bills and get paid.",
    icon: "Receipt",
    bundles: [
      { id: "billing-payments", label: "Billing & Payments", description: "Send bills, track payments, and manage quotes", defaultOn: true },
      { id: "contracts", label: "Contracts & Signatures", description: "Agreements and digital signatures", defaultOn: false },
    ],
  },
  {
    id: "work",
    title: "Work Management",
    subtitle: "Your projects, team, and time — all in one place.",
    icon: "FolderKanban",
    bundles: [
      { id: "work-management", label: "Work Management", description: "Projects, tasks, time tracking, and team rostering", defaultOn: true },
    ],
  },
  {
    id: "products",
    title: "Products & Inventory",
    subtitle: "Track what you sell and what's in stock.",
    icon: "Package",
    bundles: [
      { id: "product-catalog", label: "Product & Service Catalog", description: "List your products and services with pricing", defaultOn: true },
      { id: "inventory-tracking", label: "Inventory Tracking", description: "Track stock levels and get low-stock alerts", defaultOn: false },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    subtitle: "Get the word out and bring them back.",
    icon: "Megaphone",
    bundles: [
      { id: "email-campaigns", label: "Email Campaigns", description: "Send newsletters, promotions, and updates", defaultOn: true },
      { id: "social-reviews", label: "Social & Reviews", description: "Schedule posts and collect client reviews", defaultOn: false },
    ],
  },
  {
    id: "extras",
    title: "Finishing Touches",
    subtitle: "A few more things to make your CRM complete.",
    icon: "Sparkles",
    bundles: [
      { id: "reporting", label: "Reporting & Dashboards", description: "See how your business is performing", defaultOn: true },
      { id: "automations", label: "Workflow Automations", description: "Automate repetitive tasks like follow-ups and reminders", defaultOn: false },
      { id: "auto-replies", label: "Auto-Replies", description: "Automatically respond to new inquiries and messages", defaultOn: false },
    ],
  },
];

// ── Bundle → store mapping ──

function buildStoreSelections(selections: Record<string, Record<string, boolean>>) {
  const needs: Record<string, boolean> = {
    manageCustomers: false, receiveInquiries: false, communicateClients: false,
    acceptBookings: false, sendInvoices: false, manageProjects: false,
    runMarketing: false, handleSupport: false, manageDocuments: false,
  };
  const features: Record<string, { id: string; label: string; description: string; selected: boolean }[]> = {};

  // Clients
  if (selections.clients?.["client-management"]) {
    needs.manageCustomers = true;
    features["client-database"] = [
      { id: "client-tags", label: "Tags & Categories", description: "Group clients", selected: true },
      { id: "segmentation-filters", label: "Segmentation", description: "Filter clients", selected: true },
      { id: "follow-up-reminders", label: "Follow-Up Reminders", description: "Auto reminders", selected: true },
    ];
  }
  if (selections.clients?.["lead-capture"]) {
    needs.receiveInquiries = true;
    features["leads-pipeline"] = [
      { id: "web-forms", label: "Web Capture Forms", description: "Forms for website", selected: true },
      { id: "lead-follow-up-reminders", label: "Follow-Up Reminders", description: "Lead reminders", selected: true },
      { id: "auto-assign-leads", label: "Auto-Assign Leads", description: "Route leads", selected: false },
    ];
  }

  // Communication
  const commChannels: typeof features[string] = [];
  const commIds = ["email", "sms", "instagram-dms", "whatsapp", "facebook-messenger", "linkedin"];
  const commLabels: Record<string, string> = { email: "Email", sms: "SMS", "instagram-dms": "Instagram DMs", whatsapp: "WhatsApp", "facebook-messenger": "Facebook Messenger", linkedin: "LinkedIn" };
  for (const ch of commIds) {
    commChannels.push({ id: ch, label: commLabels[ch], description: "", selected: !!selections.communication?.[ch] });
  }
  if (commChannels.some((c) => c.selected)) {
    needs.communicateClients = true;
    features["communication"] = commChannels;
  }

  // Scheduling
  if (selections.scheduling?.["online-booking"]) {
    needs.acceptBookings = true;
    features["bookings-calendar"] = [
      { id: "booking-page", label: "Online Booking Page", description: "Booking link", selected: true },
      { id: "booking-reminders", label: "Automated Reminders", description: "Before appointments", selected: true },
      { id: "recurring-bookings", label: "Recurring Appointments", description: "Repeat bookings", selected: false },
      { id: "team-calendar", label: "Team Calendar View", description: "All schedules", selected: false },
      { id: "google-cal", label: "Google Calendar Sync", description: "Two-way sync", selected: true },
      { id: "outlook-cal", label: "Outlook Calendar Sync", description: "Two-way sync", selected: false },
    ];
  }

  // Billing
  if (selections.billing?.["billing-payments"]) {
    needs.sendInvoices = true;
    features["quotes-invoicing"] = [
      { id: "quote-builder", label: "Quote Builder", description: "Quotes to invoices", selected: true },
      { id: "invoice-templates", label: "Invoice Templates", description: "Reusable templates", selected: true },
      { id: "late-reminders", label: "Late Payment Reminders", description: "Overdue nudges", selected: true },
      { id: "recurring-invoices", label: "Recurring Invoices", description: "Auto-generate", selected: false },
    ];
    features["payments"] = [
      { id: "payment-reminders", label: "Overdue Reminders", description: "Auto reminders", selected: true },
      { id: "refund-tracking", label: "Refund Tracking", description: "Manage refunds", selected: false },
    ];
  }
  if (selections.billing?.["contracts"]) {
    needs.manageDocuments = true;
    features["documents"] = [
      { id: "contract-templates", label: "Contract Templates", description: "Reusable agreements", selected: true },
      { id: "e-signatures", label: "E-Signatures", description: "Digital signing", selected: true },
    ];
  }

  // Work Management
  if (selections.work?.["work-management"]) {
    needs.manageProjects = true;
    features["jobs-projects"] = [
      { id: "file-attachments", label: "File Attachments", description: "Files per job", selected: true },
      { id: "task-delegation", label: "Task Delegation", description: "Assign to team", selected: true },
      { id: "time-tracking", label: "Time Tracking", description: "Log hours", selected: true },
    ];
  }

  // Support
  if (selections.clients?.["support-helpdesk"]) {
    needs.handleSupport = true;
    features["support"] = [
      { id: "support-tracker", label: "Support Tracker", description: "Log requests", selected: true },
      { id: "satisfaction-ratings", label: "Satisfaction Ratings", description: "Client scores", selected: true },
    ];
  }

  // Products & Inventory
  if (selections.products?.["product-catalog"] || selections.products?.["inventory-tracking"]) {
    features["products"] = [
      { id: "product-catalog", label: "Product & Service Catalog", description: "Products with pricing", selected: !!selections.products?.["product-catalog"] },
      { id: "inventory-tracking", label: "Inventory Tracking", description: "Stock levels", selected: !!selections.products?.["inventory-tracking"] },
    ];
  }

  // Marketing
  if (selections.marketing?.["email-campaigns"] || selections.marketing?.["social-reviews"]) {
    needs.runMarketing = true;
    features["marketing"] = [
      { id: "audience-segmentation", label: "Audience Segmentation", description: "Target groups", selected: false },
      { id: "social-scheduling", label: "Social Scheduling", description: "Schedule posts", selected: !!selections.marketing?.["social-reviews"] },
      { id: "review-collection", label: "Review Collection", description: "Client reviews", selected: !!selections.marketing?.["social-reviews"] },
      { id: "coupon-codes", label: "Coupon Codes", description: "Promo offers", selected: false },
    ];
  }

  // Finishing Touches
  if (selections.extras?.["reporting"]) {
    features["reporting"] = [
      { id: "export-reports", label: "Export Reports", description: "CSV or PDF", selected: true },
      { id: "goal-tracking", label: "Goal Tracking", description: "Monitor targets", selected: false },
      { id: "custom-dashboards", label: "Custom Dashboards", description: "Your metrics", selected: false },
    ];
  }
  if (selections.extras?.["automations"]) {
    features["automations"] = [
      { id: "scheduled-tasks", label: "Scheduled Tasks", description: "Recurring tasks", selected: true },
      { id: "email-automations", label: "Email Automations", description: "Automated emails", selected: true },
    ];
  }
  if (selections.extras?.["auto-replies"]) {
    if (!features["support"]) {
      features["support"] = [];
    }
    features["support"].push(
      { id: "auto-responses", label: "Auto-Responses", description: "Instant replies", selected: true },
    );
  }
  // Auto-enable Team when customers or projects are active
  if (needs.manageCustomers || needs.manageProjects) {
    features["team"] = [
      { id: "activity-log", label: "Team Activity Log", description: "See who did what", selected: true },
      { id: "workload-view", label: "Workload View", description: "Tasks and bookings per member", selected: false },
    ];
  }

  return { needs, features };
}

export function FeatureSelectionStep() {
  const {
    setNeed, teamSize, setTeamSize, nextStep, prevStep,
    setFeatureSelections, getIndustryConfig, getPersonaConfig, businessContext,
  } = useOnboardingStore();

  const config = getIndustryConfig();
  const persona = getPersonaConfig();

  const smartDefaults = useMemo(() => {
    const defaults: Partial<Record<keyof NeedsAssessment, boolean>> = {};
    if (config?.smartDefaults) Object.assign(defaults, config.smartDefaults);
    if (persona?.smartDefaultOverrides) Object.assign(defaults, persona.smartDefaultOverrides);
    return defaults;
  }, [config, persona]);

  // Map industry defaults to bundle defaults
  const bundleDefaults = useMemo(() => {
    const d: Record<string, boolean> = {};
    d["client-management"] = smartDefaults.manageCustomers === true;
    d["lead-capture"] = smartDefaults.receiveInquiries === true;
    d["online-booking"] = smartDefaults.acceptBookings === true;
    d["support-helpdesk"] = smartDefaults.handleSupport === true;
    d["billing-payments"] = smartDefaults.sendInvoices === true;
    d["contracts"] = smartDefaults.manageDocuments === true;
    d["work-management"] = smartDefaults.manageProjects === true;
    d["product-catalog"] = ["retail-ecommerce"].includes(config?.id || "");
    d["inventory-tracking"] = config?.id === "retail-ecommerce";
    d["email-campaigns"] = smartDefaults.runMarketing === true;
    d["social-reviews"] = false;
    d["reporting"] = true;
    d["automations"] = false;
    d["auto-replies"] = false;
    // Per-industry channel defaults
    const channelMap: Record<string, string[]> = {
      "beauty-wellness": ["email", "instagram-dms", "whatsapp"],
      "trades-construction": ["email", "sms"],
      "professional-services": ["email", "linkedin"],
      "health-fitness": ["email", "sms", "instagram-dms", "whatsapp"],
      "creative-services": ["email", "instagram-dms", "whatsapp"],
      "hospitality-events": ["email", "whatsapp", "instagram-dms"],
      "education-coaching": ["email", "sms"],
      "retail-ecommerce": ["email", "instagram-dms", "facebook-messenger"],
    };
    const activeChannels = smartDefaults.communicateClients !== false
      ? (channelMap[config?.id || ""] || ["email"])
      : [];
    d["email"] = activeChannels.includes("email");
    d["sms"] = activeChannels.includes("sms");
    d["instagram-dms"] = activeChannels.includes("instagram-dms");
    d["whatsapp"] = activeChannels.includes("whatsapp");
    d["facebook-messenger"] = activeChannels.includes("facebook-messenger");
    d["linkedin"] = activeChannels.includes("linkedin");
    return d;
  }, [smartDefaults]);

  // Dynamic category labels based on industry
  const categories = useMemo(() => {
    return CATEGORIES.map((cat) => {
      if (cat.id !== "billing") return cat;
      return {
        ...cat,
        bundles: cat.bundles.map((b) => {
          if (b.id !== "contracts") return b;
          if (config?.id === "education-coaching") {
            return { ...b, label: "Files & Resources", description: "Worksheets, course materials, and certificates" };
          }
          return b;
        }),
      };
    });
  }, [config]);

  const [selections, setSelections] = useState(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const cat of categories) {
      initial[cat.id] = {};
      for (const b of cat.bundles) {
        initial[cat.id][b.id] = bundleDefaults[b.id] ?? b.defaultOn;
      }
    }
    return initial;
  });

  const [screenIndex, setScreenIndex] = useState(-1);
  const [direction, setDirection] = useState(1);

  const toggle = (catId: string, bundleId: string) => {
    setSelections((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [bundleId]: !prev[catId]?.[bundleId] },
    }));
  };

  const handleNext = () => { setDirection(1); setScreenIndex((p) => p + 1); };

  const handleBack = () => {
    setDirection(-1);
    if (screenIndex <= 0) prevStep();
    else setScreenIndex((p) => p - 1);
  };

  const handleFinish = () => {
    const { needs, features } = buildStoreSelections(selections);
    Object.entries(needs).forEach(([k, v]) => setNeed(k as keyof NeedsAssessment, v));
    Object.entries(features).forEach(([blockId, feats]) => setFeatureSelections(blockId, feats));
    nextStep();
  };

  // ── Transition ──
  if (screenIndex === -1) {
    const parts: string[] = [];
    if (persona) parts.push(`a ${persona.label.toLowerCase()}`);
    else if (config && config.id !== "other") parts.push(`in ${config.label.toLowerCase()}`);
    if (businessContext.location) parts.push(`based in ${businessContext.location}`);

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="text-[32px] font-bold text-foreground tracking-tight mb-4">
            {businessContext.businessName ? `Got it, ${businessContext.businessName}` : "Got it"}
          </h2>
          {parts.length > 0 && <p className="text-[16px] text-text-secondary mb-2">You&apos;re {parts.join(", ")}.</p>}
          <p className="text-[15px] text-text-tertiary mb-12">
            Let&apos;s pick what you need. Just {categories.length} quick steps.
          </p>
          <button onClick={handleNext} className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity">
            Let&apos;s go
          </button>
          <button
            onClick={() => {
              // Express setup: apply all defaults, skip feature screens
              const expressSelections: Record<string, Record<string, boolean>> = {};
              for (const cat of categories) {
                expressSelections[cat.id] = {};
                for (const b of cat.bundles) {
                  expressSelections[cat.id][b.id] = bundleDefaults[b.id] ?? b.defaultOn;
                }
              }
              const { needs, features } = buildStoreSelections(expressSelections);
              Object.entries(needs).forEach(([k, v]) => setNeed(k as keyof NeedsAssessment, v));
              Object.entries(features).forEach(([blockId, feats]) => setFeatureSelections(blockId, feats));
              const suggestedSize = persona?.suggestedTeamSize || config?.suggestedTeamSize || "Just me";
              setTeamSize(suggestedSize as typeof teamSize);
              nextStep();
            }}
            className="block mx-auto mt-4 text-[14px] text-text-tertiary hover:text-foreground cursor-pointer transition-colors"
          >
            Use recommended setup
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Team size ──
  if (screenIndex === categories.length) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-md mx-auto">
        <div className="pt-6 flex justify-center">
          <div className="flex items-center gap-1.5">
            {categories.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20" />)}
            <div className="w-6 h-1.5 rounded-full bg-foreground" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="text-center w-full">
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-7 h-7 text-foreground" />
            </div>
            <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-2">How big is your team?</h2>
            <p className="text-text-tertiary text-[15px] mb-10">We&apos;ll tailor collaboration features to fit.</p>
            <div className="space-y-2.5 max-w-xs mx-auto mb-10">
              {TEAM_SIZE_OPTIONS.map((opt, i) => (
                <motion.button key={opt} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setTeamSize(opt)}
                  className={`w-full px-5 py-4 rounded-2xl text-[16px] font-medium transition-all duration-150 cursor-pointer text-left flex items-center justify-between ${
                    teamSize === opt ? "bg-primary text-foreground font-semibold" : "bg-card-bg border border-border-light hover:border-foreground/20"
                  }`}>
                  {opt}
                  {teamSize === opt && <Check className="w-4 h-4 text-foreground" />}
                </motion.button>
              ))}
            </div>
            <button onClick={handleFinish} disabled={!teamSize}
              className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-25 disabled:cursor-not-allowed">
              Continue
            </button>
          </motion.div>
        </div>
        <div className="pb-6 flex justify-center">
          <button onClick={handleBack} className="text-[12px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 cursor-pointer transition-colors">
            <ArrowLeft className="w-3 h-3" /> back
          </button>
        </div>
      </div>
    );
  }

  // ── Category screen ──
  const cat = categories[screenIndex];
  if (!cat) return null;
  const IconComp = ICON_MAP[cat.icon] || MessageCircle;
  const hasAnySelected = cat.bundles.some((b) => selections[cat.id]?.[b.id]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col max-w-md mx-auto">
      <div className="pt-6 flex justify-center">
        <div className="flex items-center gap-1.5">
          {categories.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-200 ${
              i === screenIndex ? "w-6 h-1.5 bg-foreground" : i < screenIndex ? "w-1.5 h-1.5 bg-foreground/25" : "w-1.5 h-1.5 bg-border-light"
            }`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={screenIndex} custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
            transition={{ duration: 0.15 }} className="w-full">

            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
                <IconComp className="w-7 h-7 text-foreground" />
              </div>
              <h2 className="text-[26px] font-bold text-foreground tracking-tight mb-1.5">{cat.title}</h2>
              <p className="text-[14px] text-text-tertiary">{cat.subtitle}</p>
            </div>

            {cat.isChannelPicker ? (
              /* Communication: 2-col grid of channel toggles */
              <div className="grid grid-cols-2 gap-3 mb-10">
                {cat.bundles.map((b, i) => {
                  const isOn = selections[cat.id]?.[b.id] ?? false;
                  return (
                    <motion.button key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => toggle(cat.id, b.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-150 cursor-pointer ${
                        isOn ? "bg-primary-muted border-2 border-primary" : "bg-card-bg border border-border-light hover:border-foreground/15"
                      }`}>
                      <div className={`flex-shrink-0 transition-colors ${isOn ? "text-foreground" : "text-text-tertiary"}`}>
                        {CHANNEL_ICONS[b.id]}
                      </div>
                      <span className="text-[15px] font-medium text-foreground">{b.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              /* Module bundles: big toggle cards */
              <div className="space-y-3 mb-10">
                {cat.bundles.map((b, i) => {
                  const isOn = selections[cat.id]?.[b.id] ?? false;
                  return (
                    <motion.button key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => toggle(cat.id, b.id)}
                      className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-150 cursor-pointer text-left ${
                        isOn ? "bg-primary-muted border-2 border-primary" : "bg-card-bg border border-border-light hover:border-foreground/15"
                      }`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                        isOn ? "bg-primary" : "border-2 border-border-light"
                      }`}>
                        {isOn && <Check className="w-3.5 h-3.5 text-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[16px] font-semibold text-foreground">{b.label}</p>
                        <p className="text-[13px] text-text-tertiary mt-0.5">{b.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <div className="text-center">
              <button onClick={handleNext}
                className="px-10 py-3.5 bg-foreground text-white rounded-full text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                {hasAnySelected ? "Continue" : "Skip"}
              </button>
              {!hasAnySelected && (
                <p className="text-[12px] text-text-tertiary mt-3">This module won&apos;t be included</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-6 flex justify-center">
        <button onClick={handleBack} className="text-[12px] text-text-tertiary hover:text-text-secondary flex items-center gap-1 cursor-pointer transition-colors">
          <ArrowLeft className="w-3 h-3" /> back
        </button>
      </div>
    </div>
  );
}
