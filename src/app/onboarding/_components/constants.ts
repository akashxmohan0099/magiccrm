// Static config for the onboarding flow. Step labels, the always-on core
// module set, and per-addon visual styling.

import {
  Users,
  MailQuestion,
  MessageSquare,
  CreditCard,
  Calendar,
  Package,
  BarChart3,
  Megaphone,
  Ticket,
  Gift,
  Lightbulb,
  UserCheck,
  ScrollText,
  Crown,
  FileSignature,
  type LucideIcon,
} from "lucide-react";

export const STEPS = [
  "Persona",
  "Structure",
  "Solutions",
  "Marketing",
  "Billing",
  "Engagement",
  "Summary",
  "Account",
];

export interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string; // hex — used for top gradient wash + icon tile tint
}

// Core dashboard tabs that are always on. Curated subset shown on the
// summary so the workspace feels populated even when no add-ons are
// resolved from the questionnaire.
export const CORE_MODULES: ModuleCard[] = [
  { id: "clients",        name: "Clients",    description: "Your clients all in one place.",      icon: Users,         accent: "#3B82F6" },
  { id: "inquiries",      name: "Inquiries",  description: "Never lose a potential customer.",    icon: MailQuestion,  accent: "#7C3AED" },
  { id: "communications", name: "Messages",   description: "Every conversation, one inbox.",      icon: MessageSquare, accent: "#F43F5E" },
  { id: "payments",       name: "Billing",    description: "Quotes, invoices, and payments.",     icon: CreditCard,    accent: "#F59E0B" },
  { id: "calendar",       name: "Scheduling", description: "Bookings, appointments, calendar.",   icon: Calendar,      accent: "#10B981" },
  { id: "services",       name: "Services",   description: "Your service catalog and pricing.",   icon: Package,       accent: "#6366F1" },
];

// Accent hex per add-on id, mirroring ADDON_MODULES.
export const ADDON_VISUALS: Record<string, { icon: LucideIcon; accent: string }> = {
  analytics:     { icon: BarChart3,     accent: "#0EA5E9" },
  marketing:     { icon: Megaphone,     accent: "#EC4899" },
  "gift-cards":  { icon: Ticket,        accent: "#F43F5E" },
  loyalty:       { icon: Gift,          accent: "#F59E0B" },
  "ai-insights": { icon: Lightbulb,     accent: "#EAB308" },
  "win-back":    { icon: UserCheck,     accent: "#14B8A6" },
  proposals:     { icon: ScrollText,    accent: "#7C3AED" },
  memberships:   { icon: Crown,         accent: "#D946EF" },
  documents:     { icon: FileSignature, accent: "#64748B" },
};
