"use client";

import {
  DollarSign,
  Inbox,
  Briefcase,
  TrendingUp,
  BarChart3,
} from "lucide-react";

const WIDGETS = [
  {
    id: "revenue",
    label: "Revenue",
    description: "Monthly revenue over time",
    icon: DollarSign,
    mockBars: [30, 50, 45, 70, 65, 80, 75],
  },
  {
    id: "lead-pipeline",
    label: "Lead Pipeline",
    description: "Leads by stage breakdown",
    icon: Inbox,
    mockBars: [80, 60, 40, 25, 15],
  },
  {
    id: "active-jobs",
    label: "Active Jobs",
    description: "Jobs in progress this month",
    icon: Briefcase,
    mockBars: [20, 35, 55, 40, 60, 50, 70],
  },
  {
    id: "client-growth",
    label: "Client Growth",
    description: "New clients added per month",
    icon: TrendingUp,
    mockBars: [10, 20, 15, 30, 25, 45, 50],
  },
];

export function CustomDashboards() {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Custom Dashboards
        </h2>
      </div>
      <p className="text-sm text-text-secondary mb-5">
        Pick the metrics that matter most. Drag widgets to build your view.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WIDGETS.map((widget) => {
          const Icon = widget.icon;
          const maxBar = Math.max(...widget.mockBars);

          return (
            <div
              key={widget.id}
              className="border border-border-light rounded-lg p-4 bg-surface hover:border-brand/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-md bg-surface text-foreground">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {widget.label}
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-3">
                {widget.description}
              </p>

              {/* Mock chart placeholder */}
              <div className="flex items-end gap-1 h-16">
                {widget.mockBars.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-foreground/20 rounded-sm"
                    style={{ height: `${(val / maxBar) * 100}%` }}
                  />
                ))}
              </div>

              <div className="mt-2 text-center">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                  Preview
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
