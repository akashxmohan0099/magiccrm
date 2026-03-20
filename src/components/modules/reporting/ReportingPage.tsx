"use client";

import {
  Users,
  Inbox,
  Briefcase,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { usePaymentsStore } from "@/store/payments";
import { useBookingsStore } from "@/store/bookings";
import { PageHeader } from "@/components/ui/PageHeader";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { ActivityFeed } from "./ActivityFeed";
import { ExportReports } from "./ExportReports";
import { GoalTracking } from "./GoalTracking";
import { CustomDashboards } from "./CustomDashboards";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-surface text-foreground">{icon}</div>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">
        {value}
      </p>
    </div>
  );
}

export function ReportingPage() {
  const { clients } = useClientsStore();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { getTotalRevenue } = usePaymentsStore();
  const { bookings } = useBookingsStore();

  const totalRevenue = getTotalRevenue();
  const activeJobs = jobs.filter(
    (j) => j.stage === "in-progress" || j.stage === "review"
  ).length;
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  ).length;

  return (
    <div>
      <PageHeader
        title="Reporting"
        description="See how your business is actually doing"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Clients"
          value={clients.length}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Total Leads"
          value={leads.length}
          icon={<Inbox className="w-5 h-5" />}
        />
        <StatCard
          label="Active Jobs"
          value={activeJobs}
          icon={<Briefcase className="w-5 h-5" />}
        />
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          label="Upcoming Bookings"
          value={upcomingBookings}
          icon={<CalendarDays className="w-5 h-5" />}
        />
      </div>

      <div className="space-y-8">
        <ActivityFeed />

        <FeatureSection moduleId="reporting" featureId="export-reports">
          <ExportReports />
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="goal-tracking">
          <GoalTracking />
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="custom-dashboards">
          <CustomDashboards />
        </FeatureSection>
      </div>
    </div>
  );
}
