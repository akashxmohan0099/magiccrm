"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
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

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId]);
  const entries = job?.timeEntries ?? [];

  const totalMinutes = entries.reduce((sum, e) => sum + e.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleAdd = () => {
    const desc = description.trim();
    const mins = parseInt(minutes, 10);
    if (!desc || isNaN(mins) || mins <= 0 || !date) return;

    addTimeEntry(jobId, { description: desc, minutes: mins, date });
    setDescription("");
    setMinutes("");
    setDate(new Date().toISOString().split("T")[0]);
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

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="flex items-center gap-2 p-3 bg-surface rounded-lg">
        <Clock className="w-4 h-4 text-foreground" />
        <span className="text-sm font-medium text-foreground">
          Total: {totalHours} hours
        </span>
        <span className="text-xs text-text-secondary">
          ({totalMinutes} min)
        </span>
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
      </div>

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="space-y-1">
          {[...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface group transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {entry.description}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-medium text-foreground flex-shrink-0">
                {formatMinutes(entry.minutes)}
              </span>
              <button
                onClick={() => deleteTimeEntry(jobId, entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-500 cursor-pointer transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
