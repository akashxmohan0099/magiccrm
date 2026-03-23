"use client";

import { ReactNode, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { useWaitlistStore } from "@/store/waitlist";
import { PageHeader } from "@/components/ui/PageHeader";
import { WaitlistPanel } from "@/components/modules/bookings/WaitlistPanel";

function getTodayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="bg-card-bg rounded-xl border border-border-light p-4">
      <div className="flex items-center gap-2 text-text-tertiary mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function WaitlistManagerPage() {
  const entries = useWaitlistStore((s) => s.entries);
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate);

  const dateEntries = useMemo(
    () => entries.filter((entry) => entry.date === selectedDate),
    [entries, selectedDate]
  );

  const waitingCount = dateEntries.filter((entry) => entry.status === "waiting").length;
  const notifiedCount = dateEntries.filter((entry) => entry.status === "notified").length;
  const bookedCount = dateEntries.filter((entry) => entry.status === "booked").length;

  return (
    <div>
      <PageHeader
        title="Waitlist"
        description="Manage queues for fully booked days and keep track of who should be notified next."
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Selected Date
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
          />
        </label>
        <p className="text-sm text-text-secondary max-w-xl">
          When a booking is cancelled, matching waitlist entries for this date are moved to
          <span className="font-medium text-foreground"> notified </span>
          automatically.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Selected Day" value={dateEntries.length} icon={<CalendarDays className="w-4 h-4" />} />
        <StatCard label="Waiting" value={waitingCount} icon={<Clock3 className="w-4 h-4" />} />
        <StatCard label="Notified" value={notifiedCount} icon={<Bell className="w-4 h-4" />} />
        <StatCard label="Booked" value={bookedCount} icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      <WaitlistPanel selectedDate={selectedDate} standalone />
    </div>
  );
}
