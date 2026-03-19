"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  Inbox,
  FolderKanban,
  Receipt,
  Calendar,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { useJobsStore } from "@/store/jobs";
import { useInvoicesStore } from "@/store/invoices";
import { useBookingsStore } from "@/store/bookings";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface LinkedRecordsProps {
  clientId: string;
  onNavigate?: () => void;
}

const MAX_ITEMS = 3;

function RecordSection<T extends { id: string }>({
  label,
  icon: Icon,
  items,
  href,
  renderItem,
  onNavigate,
}: {
  label: string;
  icon: LucideIcon;
  items: T[];
  href: string;
  renderItem: (item: T) => ReactNode;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;

  const visibleItems = items.slice(0, MAX_ITEMS);
  const remaining = items.length - MAX_ITEMS;

  return (
    <div className="bg-surface rounded-lg p-3">
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center justify-between group mb-1"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-secondary" />
          <span className="text-[13px] font-medium text-foreground">
            {label}
          </span>
          <span className="text-[12px] text-text-secondary bg-white rounded-full px-1.5 py-0.5 border border-border-light">
            {items.length}
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      <div className="ml-6 divide-y divide-border-light">
        {visibleItems.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
      {remaining > 0 && (
        <Link
          href={href}
          onClick={onNavigate}
          className="ml-6 text-[12px] text-primary hover:text-primary-hover mt-1 inline-block"
        >
          +{remaining} more
        </Link>
      )}
    </div>
  );
}

export function LinkedRecords({ clientId, onNavigate }: LinkedRecordsProps) {
  const { leads } = useLeadsStore();
  const { jobs } = useJobsStore();
  const { invoices } = useInvoicesStore();
  const { bookings } = useBookingsStore();

  const clientLeads = leads.filter((l) => l.clientId === clientId);
  const clientJobs = jobs.filter((j) => j.clientId === clientId);
  const clientInvoices = invoices.filter((i) => i.clientId === clientId);
  const clientBookings = bookings.filter((b) => b.clientId === clientId);

  const totalLinked =
    clientLeads.length +
    clientJobs.length +
    clientInvoices.length +
    clientBookings.length;

  if (totalLinked === 0) return null;

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <h4 className="text-sm font-medium text-foreground mb-3">
        Linked Records
      </h4>
      <div className="space-y-3">
        <RecordSection
          label="Leads"
          icon={Inbox}
          items={clientLeads}
          href="/dashboard/leads"
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px] text-foreground truncate mr-2">
                {item.name}
              </span>
              <StatusBadge status={item.stage} className="text-[11px] shrink-0" />
            </div>
          )}
        />

        <RecordSection
          label="Jobs"
          icon={FolderKanban}
          items={clientJobs}
          href="/dashboard/jobs"
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px] text-foreground truncate mr-2">
                {item.title}
              </span>
              <StatusBadge status={item.stage} className="text-[11px] shrink-0" />
            </div>
          )}
        />

        <RecordSection
          label="Invoices"
          icon={Receipt}
          items={clientInvoices}
          href="/dashboard/invoicing"
          onNavigate={onNavigate}
          renderItem={(item) => {
            const total = item.lineItems.reduce(
              (sum, li) => sum + li.quantity * li.unitPrice,
              0
            );
            return (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-foreground truncate mr-2">
                  {item.number}
                  <span className="text-text-secondary ml-1.5">
                    ${total.toLocaleString()}
                  </span>
                </span>
                <StatusBadge
                  status={item.status}
                  className="text-[11px] shrink-0"
                />
              </div>
            );
          }}
        />

        <RecordSection
          label="Bookings"
          icon={Calendar}
          items={clientBookings}
          href="/dashboard/bookings"
          onNavigate={onNavigate}
          renderItem={(item) => (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px] text-foreground truncate mr-2">
                {item.title}
                <span className="text-text-secondary ml-1.5">
                  {item.date} {item.startTime}
                </span>
              </span>
              <StatusBadge status={item.status} className="text-[11px] shrink-0" />
            </div>
          )}
        />
      </div>
    </div>
  );
}
