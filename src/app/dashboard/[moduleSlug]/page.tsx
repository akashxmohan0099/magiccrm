"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTransition } from "@/components/ui/PageTransition";
import { ADDON_MODULES } from "@/lib/addon-modules";
import { useSettingsStore } from "@/store/settings";

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  // Core modules
  communications: dynamic(() =>
    import("@/components/modules/communication/CommunicationPage").then((m) => ({
      default: m.CommunicationPage,
    }))
  ),
  communication: dynamic(() =>
    import("@/components/modules/communication/CommunicationPage").then((m) => ({
      default: m.CommunicationPage,
    }))
  ),
  inquiries: dynamic(() =>
    import("@/components/modules/inquiries/InquiriesPage").then((m) => ({
      default: m.InquiriesPage,
    }))
  ),
  leads: dynamic(() =>
    import("@/components/modules/inquiries/InquiriesPage").then((m) => ({
      default: m.InquiriesPage,
    }))
  ),
  bookings: dynamic(() =>
    import("@/components/modules/bookings/BookingsPage").then((m) => ({
      default: m.BookingsPage,
    }))
  ),
  calendar: dynamic(() =>
    import("@/components/modules/calendar/CalendarPage").then((m) => ({
      default: m.CalendarPage,
    }))
  ),
  clients: dynamic(() =>
    import("@/components/modules/clients/ClientsPage").then((m) => ({
      default: m.ClientsPage,
    }))
  ),
  payments: dynamic(() =>
    import("@/components/modules/payments/PaymentsPage").then((m) => ({
      default: m.PaymentsPage,
    }))
  ),
  invoicing: dynamic(() =>
    import("@/components/modules/payments/PaymentsPage").then((m) => ({
      default: m.PaymentsPage,
    }))
  ),
  services: dynamic(() =>
    import("@/components/modules/services/ServicesPage").then((m) => ({
      default: m.ServicesPage,
    }))
  ),
  forms: dynamic(() =>
    import("@/components/modules/forms/FormsPage").then((m) => ({
      default: m.FormsPage,
    }))
  ),
  automations: dynamic(() =>
    import("@/components/modules/automations/AutomationsPage").then((m) => ({
      default: m.AutomationsPage,
    }))
  ),
  teams: dynamic(() =>
    import("@/components/modules/teams/TeamsPage").then((m) => ({
      default: m.TeamsPage,
    }))
  ),
  // Addon modules
  marketing: dynamic(() =>
    import("@/components/modules/marketing/MarketingPage").then((m) => ({
      default: m.MarketingPage,
    }))
  ),
  "win-back": dynamic(() =>
    import("@/components/modules/win-back/WinBackPage").then((m) => ({
      default: m.WinBackPage,
    }))
  ),
  analytics: dynamic(() =>
    import("@/components/modules/analytics/AnalyticsPage").then((m) => ({
      default: m.AnalyticsPage,
    }))
  ),
  "gift-cards": dynamic(() =>
    import("@/components/modules/gift-cards/GiftCardsPage").then((m) => ({
      default: m.GiftCardsPage,
    }))
  ),
  loyalty: dynamic(() =>
    import("@/components/modules/loyalty/LoyaltyPage").then((m) => ({
      default: m.LoyaltyPage,
    }))
  ),
  "ai-insights": dynamic(() =>
    import("@/components/modules/ai-insights/AIInsightsPage").then((m) => ({
      default: m.AIInsightsPage,
    }))
  ),
  proposals: dynamic(() =>
    import("@/components/modules/proposals/ProposalsPage").then((m) => ({
      default: m.ProposalsPage,
    }))
  ),
  memberships: dynamic(() =>
    import("@/components/modules/memberships/MembershipsPage").then((m) => ({
      default: m.MembershipsPage,
    }))
  ),
  documents: dynamic(() =>
    import("@/components/modules/documents/DocumentsPage").then((m) => ({
      default: m.DocumentsPage,
    }))
  ),
};

export default function TabPage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = use(params);
  const enabledAddons = useSettingsStore((s) => s.enabledAddons);
  const addon = ADDON_MODULES.find((item) => item.route === moduleSlug);
  const Component = TAB_COMPONENTS[moduleSlug];

  if (!Component) notFound();
  if (addon && !enabledAddons.includes(addon.id)) {
    return (
      <PageTransition>
        <div className="max-w-lg rounded-2xl border border-border-light bg-card-bg p-8">
          <h1 className="text-xl font-bold text-foreground">{addon.name} is turned off</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Enable this add-on from Modules before you can use it in the dashboard.
          </p>
          <Link
            href="/dashboard/addons"
            className="mt-5 inline-flex items-center rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Manage Modules
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Component />
    </PageTransition>
  );
}
