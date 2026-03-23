"use client";

import { useState, useMemo } from "react";
import { Plus, X, Clock, Bell, CheckCircle, AlertCircle } from "lucide-react";
import { useWaitlistStore } from "@/store/waitlist";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

interface WaitlistPanelProps {
  selectedDate: string;
  standalone?: boolean;
}

export function WaitlistPanel({ selectedDate, standalone = false }: WaitlistPanelProps) {
  const { entries, addEntry, removeEntry, updateEntry } = useWaitlistStore();
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [preferredStart, setPreferredStart] = useState("");
  const [preferredEnd, setPreferredEnd] = useState("");
  const [serviceName, setServiceName] = useState("");

  const dateEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [entries, selectedDate]
  );

  const handleAdd = () => {
    if (!clientName.trim()) return;
    addEntry({
      clientName: clientName.trim(),
      date: selectedDate,
      startTime: preferredStart || undefined,
      endTime: preferredEnd || undefined,
      serviceName: serviceName.trim() || undefined,
    });
    setClientName("");
    setPreferredStart("");
    setPreferredEnd("");
    setServiceName("");
    setShowForm(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case "notified":
        return <Bell className="w-3.5 h-3.5 text-amber-500" />;
      case "booked":
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case "expired":
        return <AlertCircle className="w-3.5 h-3.5 text-gray-400" />;
      default:
        return null;
    }
  };

  const content = (
    <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">
          Waitlist
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Waitlist
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-surface rounded-lg border border-border-light space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-foreground mb-1">
              Client Name *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1">
                Preferred Start
              </label>
              <input
                type="time"
                value={preferredStart}
                onChange={(e) => setPreferredStart(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-1">
                Preferred End
              </label>
              <input
                type="time"
                value={preferredEnd}
                onChange={(e) => setPreferredEnd(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-foreground mb-1">
              Service
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Service name (optional)"
              className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}

      {dateEntries.length === 0 ? (
        <p className="text-[13px] text-text-tertiary text-center py-4">
          No one on the waitlist for this date. When slots are full, add clients here and they&apos;ll be notified when a spot opens.
        </p>
      ) : (
        <div className="space-y-2">
          {dateEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-light"
            >
              <div className="flex items-center gap-2 min-w-0">
                {statusIcon(entry.status)}
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">
                    {entry.clientName}
                  </p>
                  <p className="text-[11px] text-text-tertiary">
                    {entry.startTime && entry.endTime
                      ? `${entry.startTime} - ${entry.endTime}`
                      : "Any time"}
                    {entry.serviceName ? ` \u00B7 ${entry.serviceName}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={entry.status} />
                {entry.status === "notified" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateEntry(entry.id, { status: "booked" })}
                  >
                    Mark Booked
                  </Button>
                )}
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="p-1 text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <FeatureSection moduleId="bookings-calendar" featureId="waitlist" featureLabel="Waitlist">
      {content}
    </FeatureSection>
  );
}
