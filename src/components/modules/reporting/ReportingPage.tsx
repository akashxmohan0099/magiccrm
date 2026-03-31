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
import { useInvoicesStore } from "@/store/invoices";
import { PageHeader } from "@/components/ui/PageHeader";
import { useModuleSchema } from "@/hooks/useModuleSchema";
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
  const ms = useModuleSchema("reporting");
  const { clients } = useClientsStore();
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { getTotalRevenue } = usePaymentsStore();
  const { bookings } = useBookingsStore();
  const { invoices } = useInvoicesStore();

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
        title={ms.label || "Reporting"}
        description={"See how your business is actually doing"}
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

        <FeatureSection moduleId="reporting" featureId="revenue-breakdown" featureLabel="Revenue Breakdown">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Revenue Breakdown</h3>
            <div className="space-y-2">
              {[{label:"This Month",value:"$0"},{label:"Last Month",value:"$0"},{label:"This Quarter",value:"$0"}].map(r => (
                <div key={r.label} className="flex justify-between px-3 py-2 bg-surface/50 rounded-lg">
                  <span className="text-[13px] text-text-secondary">{r.label}</span>
                  <span className="text-[13px] font-semibold text-foreground">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="lead-conversion-report" featureLabel="Lead Conversion Report">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Lead Conversion</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center"><p className="text-[20px] font-bold text-foreground">{leads.length}</p><p className="text-[11px] text-text-tertiary">Total Leads</p></div>
              <div className="text-center"><p className="text-[20px] font-bold text-emerald-600">{leads.filter(l => l.stage === "won").length}</p><p className="text-[11px] text-text-tertiary">Won</p></div>
              <div className="text-center"><p className="text-[20px] font-bold text-red-500">{leads.filter(l => l.stage === "lost").length}</p><p className="text-[11px] text-text-tertiary">Lost</p></div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="client-retention-report" featureLabel="Client Retention">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Client Retention</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center"><p className="text-[20px] font-bold text-foreground">{clients.length}</p><p className="text-[11px] text-text-tertiary">Total Clients</p></div>
              <div className="text-center"><p className="text-[20px] font-bold text-emerald-600">{clients.filter(c => c.status === "active").length}</p><p className="text-[11px] text-text-tertiary">Active</p></div>
              <div className="text-center"><p className="text-[20px] font-bold text-text-tertiary">{clients.filter(c => c.status === "inactive").length}</p><p className="text-[11px] text-text-tertiary">Inactive</p></div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="booking-utilization-report" featureLabel="Booking Utilisation">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Booking Utilisation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-center"><p className="text-[20px] font-bold text-foreground">{bookings.length}</p><p className="text-[11px] text-text-tertiary">Total Bookings</p></div>
              <div className="text-center"><p className="text-[20px] font-bold text-emerald-600">{bookings.filter(b => b.status === "completed").length}</p><p className="text-[11px] text-text-tertiary">Completed</p></div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="comparison-periods" featureLabel="Comparison Periods">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Period Comparison</h3>
            <p className="text-[13px] text-text-tertiary text-center py-4">Add data to compare performance across periods.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="pipeline-value-report" featureLabel="Pipeline Value">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Pipeline Value</h3>
            <p className="text-[24px] font-bold text-foreground">${leads.reduce((s, l) => s + (l.value || 0), 0).toLocaleString()}</p>
            <p className="text-[11px] text-text-tertiary">Total estimated value across all active leads</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="tax-summary-report" featureLabel="Tax Summary">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Tax Summary</h3>
            <p className="text-[13px] text-text-tertiary text-center py-4">Tax data will appear here once invoices with tax are created.</p>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="profit-loss-summary" featureLabel="Profit & Loss">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Profit & Loss</h3>
            <div className="space-y-2">
              <div className="flex justify-between px-3 py-2"><span className="text-[13px] text-text-secondary">Revenue</span><span className="text-[13px] font-semibold text-foreground">${invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.lineItems.reduce((t, li) => t + li.quantity * li.unitPrice, 0), 0).toLocaleString()}</span></div>
              <div className="flex justify-between px-3 py-2 border-t border-border-light"><span className="text-[13px] font-semibold text-foreground">Net</span><span className="text-[13px] font-bold text-foreground">${invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.lineItems.reduce((t, li) => t + li.quantity * li.unitPrice, 0), 0).toLocaleString()}</span></div>
            </div>
          </div>
        </FeatureSection>

        <FeatureSection moduleId="reporting" featureId="scheduled-reports" featureLabel="Scheduled Reports">
          <div className="bg-card-bg rounded-xl border border-border-light p-5">
            <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Scheduled Reports</h3>
            <p className="text-[13px] text-text-tertiary text-center py-4">Configure automatic email reports to be sent weekly or monthly.</p>
          </div>
        </FeatureSection>
      </div>
    </div>
  );
}
