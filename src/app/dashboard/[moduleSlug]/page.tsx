"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getModuleBySlug } from "@/lib/module-registry";
import { useModuleEnabled } from "@/hooks/useFeature";
import { PageTransition } from "@/components/ui/PageTransition";

const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  "client-database": dynamic(() => import("@/components/modules/clients/ClientsPage").then(m => ({ default: m.ClientsPage }))),
  "leads-pipeline": dynamic(() => import("@/components/modules/leads/LeadsPage").then(m => ({ default: m.LeadsPage }))),
  "communication": dynamic(() => import("@/components/modules/communication/CommunicationPage").then(m => ({ default: m.CommunicationPage }))),
  "bookings-calendar": dynamic(() => import("@/components/modules/bookings/BookingsPage").then(m => ({ default: m.BookingsPage }))),
  "quotes-invoicing": dynamic(() => import("@/components/modules/invoicing/InvoicingPage").then(m => ({ default: m.InvoicingPage }))),
  "jobs-projects": dynamic(() => import("@/components/modules/jobs/JobsPage").then(m => ({ default: m.JobsPage }))),
  "marketing": dynamic(() => import("@/components/modules/marketing/MarketingPage").then(m => ({ default: m.MarketingPage }))),
  "support": dynamic(() => import("@/components/modules/support/SupportPage").then(m => ({ default: m.SupportPage }))),
  "documents": dynamic(() => import("@/components/modules/documents/DocumentsPage").then(m => ({ default: m.DocumentsPage }))),
  "automations": dynamic(() => import("@/components/modules/automations/AutomationsPage").then(m => ({ default: m.AutomationsPage }))),
  "reporting": dynamic(() => import("@/components/modules/reporting/ReportingPage").then(m => ({ default: m.ReportingPage }))),
  "products": dynamic(() => import("@/components/modules/products/ProductsPage").then(m => ({ default: m.ProductsPage }))),
  "team": dynamic(() => import("@/components/modules/team/TeamPage").then(m => ({ default: m.TeamPage }))),
  "soap-notes": dynamic(() => import("@/components/modules/soap-notes/SOAPNotesPage").then(m => ({ default: m.SOAPNotesPage }))),
  "intake-forms": dynamic(() => import("@/components/modules/intake-forms/IntakeFormsPage").then(m => ({ default: m.IntakeFormsPage }))),
  "memberships": dynamic(() => import("@/components/modules/memberships/MembershipsPage").then(m => ({ default: m.MembershipsPage }))),
  "before-after": dynamic(() => import("@/components/modules/before-after/BeforeAfterPage").then(m => ({ default: m.BeforeAfterPage }))),
  "win-back": dynamic(() => import("@/components/modules/win-back/WinBackPage").then(m => ({ default: m.WinBackPage }))),
  "ai-insights": dynamic(() => import("@/components/modules/ai-insights/AIInsightsPage").then(m => ({ default: m.AIInsightsPage }))),
  "loyalty": dynamic(() => import("@/components/modules/loyalty/LoyaltyPage").then(m => ({ default: m.LoyaltyPage }))),
  "storefront": dynamic(() => import("@/components/modules/storefront/StorefrontPage").then(m => ({ default: m.StorefrontPage }))),
  "client-portal": dynamic(() => import("@/components/modules/client-portal/ClientPortalPage").then(m => ({ default: m.ClientPortalPage }))),
  "notes-docs": dynamic(() => import("@/components/modules/notes-docs/NotesDocsPage").then(m => ({ default: m.NotesDocsPage }))),
  "gift-cards": dynamic(() => import("@/components/modules/gift-cards/GiftCardsPage").then(m => ({ default: m.GiftCardsPage }))),
  "class-timetable": dynamic(() => import("@/components/modules/class-timetable/ClassTimetablePage").then(m => ({ default: m.ClassTimetablePage }))),
  "vendor-management": dynamic(() => import("@/components/modules/vendor-management/VendorManagementPage").then(m => ({ default: m.VendorManagementPage }))),
  "proposals": dynamic(() => import("@/components/modules/proposals/ProposalsPage").then(m => ({ default: m.ProposalsPage }))),
  "waitlist-manager": dynamic(() => import("@/components/modules/waitlist-manager/WaitlistManagerPage").then(m => ({ default: m.WaitlistManagerPage }))),
};

export default function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = use(params);
  const mod = getModuleBySlug(moduleSlug);
  const isEnabled = useModuleEnabled(mod?.id ?? "");

  if (!mod) {
    notFound();
  }

  if (!isEnabled) {
    notFound();
  }

  const Component = MODULE_COMPONENTS[mod.id];

  if (!Component) {
    notFound();
  }

  return (
    <PageTransition>
      <Component />
    </PageTransition>
  );
}
