"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Clock, DollarSign } from "lucide-react";
import { useJobsStore } from "@/store/jobs";
import { Button } from "@/components/ui/Button";

interface TimeTrackerProps {
  jobId: string;
}

export function TimeTracker({ jobId }: TimeTrackerProps) {
  const { jobs, addTimeEntry, deleteTimeEntry } = useJobsStore();
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [billableRate, setBillableRate] = useState("");
  const [billable, setBillable] = useState(true);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const entries = job?.timeEntries ?? [];

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const totalBillableAmount = entries.reduce((sum, e) => {
    if (e.billable === false || !e.billableRate) return sum;
    return sum + (e.minutes / 60) * e.billableRate;
  }, 0);

  const handleAdd = () => {
    const desc = description.trim();
    const mins = parseInt(minutes, 10);
    if (!desc || isNaN(mins) || mins <= 0 || !date) return;

    const rate = parseFloat(billableRate);
    addTimeEntry(jobId, {
      description: desc,
      minutes: mins,
      date,
      billable,
      ...((!isNaN(rate) && rate > 0) ? { billableRate: rate } : {}),
    });
    setDescription("");
    setMinutes("");
    setDate(new Date().toISOString().split("T")[0]);
    setBillableRate("");
    setBillable(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const formatMinutes = (m: number) => {
    if (m < 60) return `${m}m`;
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="flex items-center gap-4 p-3 bg-surface rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">
            Total: {totalHours} hours
          </span>
          <span className="text-xs text-text-secondary">
            ({totalMinutes} min)
          </span>
        </div>
        {totalBillableAmount > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {formatCurrency(totalBillableAmount)} billable
            </span>
          </div>
        )}
      </div>

      {/* Add entry form */}
      <div className="space-y-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What did you work on?"
          className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Minutes"
            min={1}
            className="w-28 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <input
            type="number"
            value={billableRate}
            onChange={(e) => setBillableRate(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rate ($/hr)"
            min={0}
            step="0.01"
            className="w-28 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!description.trim() || !minutes || parseInt(minutes) <= 0}
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
            className="w-4 h-4 rounded border-border-light text-brand focus:ring-brand/20"
          />
          <span className="text-sm text-text-secondary">Billable</span>
        </label>
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-1">
          {[...entries].reverse().map((entry) => {
            const entryAmount =
              entry.billable !== false && entry.billableRate
                ? (entry.minutes / 60) * entry.billableRate
                : null;

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface group transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground truncate">
                      {entry.description}
                    </p>
                    {entry.billable === false && (
                      <span className="text-[10px] uppercase tracking-wider text-text-secondary bg-surface px-1.5 py-0.5 rounded flex-shrink-0">
                        Non-billable
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {new Date(entry.date).toLocaleDateString()}
                    {entry.billableRate != null && entry.billable !== false && (
                      <span className="ml-2">@ ${entry.billableRate}/hr</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-foreground">
                    {formatMinutes(entry.minutes)}
                  </span>
                  {entryAmount != null && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(entryAmount)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteTimeEntry(jobId, entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 cursor-pointer transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-4">
          No time entries yet. Log your first entry above.
        </p>
      )}
    </div>
  );
}
