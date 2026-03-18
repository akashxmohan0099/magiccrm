"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getModuleBySlug } from "@/lib/module-registry";
import { useModuleEnabled } from "@/hooks/useFeature";
import { PageTransition } from "@/components/ui/PageTransition";

import { ClientsPage } from "@/components/modules/clients/ClientsPage";
import { LeadsPage } from "@/components/modules/leads/LeadsPage";
import { CommunicationPage } from "@/components/modules/communication/CommunicationPage";
import { BookingsPage } from "@/components/modules/bookings/BookingsPage";
import { InvoicingPage } from "@/components/modules/invoicing/InvoicingPage";
import { JobsPage } from "@/components/modules/jobs/JobsPage";
import { MarketingPage } from "@/components/modules/marketing/MarketingPage";
import { SupportPage } from "@/components/modules/support/SupportPage";
import { DocumentsPage } from "@/components/modules/documents/DocumentsPage";
import { PaymentsPage } from "@/components/modules/payments/PaymentsPage";
import { AutomationsPage } from "@/components/modules/automations/AutomationsPage";
import { ReportingPage } from "@/components/modules/reporting/ReportingPage";

const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  "client-database": ClientsPage,
  "leads-pipeline": LeadsPage,
  "communication": CommunicationPage,
  "bookings-calendar": BookingsPage,
  "quotes-invoicing": InvoicingPage,
  "jobs-projects": JobsPage,
  "marketing": MarketingPage,
  "support": SupportPage,
  "documents": DocumentsPage,
  "payments": PaymentsPage,
  "automations": AutomationsPage,
  "reporting": ReportingPage,
};

export default function ModulePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = use(params);
  const mod = getModuleBySlug(moduleSlug);

  if (!mod) {
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
