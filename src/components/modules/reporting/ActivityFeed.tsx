"use client";

import { motion } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { useActivityStore } from "@/store/activity";
import { Button } from "@/components/ui/Button";

const MODULE_COLORS: Record<string, string> = {
  clients: "bg-blue-400",
  leads: "bg-amber-400",
  jobs: "bg-emerald-400",
  invoices: "bg-violet-400",
  payments: "bg-green-400",
  bookings: "bg-pink-400",
  communication: "bg-cyan-400",
  marketing: "bg-orange-400",
  support: "bg-red-400",
  documents: "bg-slate-400",
  automations: "bg-yellow-400",
};

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed() {
  const { entries, clearEntries } = useActivityStore();

  return (
    <div className="bg-card-bg border border-border-warm rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Activity Feed
        </h2>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearEntries}>
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-text-secondary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">
            No activity recorded yet. Actions across modules will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {entries.slice(0, 50).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-start gap-3 py-3 border-b border-border-light last:border-b-0"
            >
              <div className="mt-1.5 shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    MODULE_COLORS[entry.module] ?? "bg-text-secondary"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-secondary capitalize">
                    {entry.module}
                  </span>
                  <span className="text-xs text-text-secondary">
                    &middot; {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
