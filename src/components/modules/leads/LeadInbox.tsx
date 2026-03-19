"use client";

import { useMemo } from "react";
import { Inbox, Clock, Tag } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function LeadInbox() {
  const { leads } = useLeadsStore();

  const sorted = useMemo(
    () =>
      [...leads].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [leads]
  );

  return (
    <FeatureSection moduleId="leads-pipeline" featureId="lead-inbox">
      <div>
        <h3 className="text-lg font-semibold text-foreground tracking-tight mb-4">
          Lead Inbox
        </h3>

        {sorted.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-10 h-10" />}
            title="Inbox is empty"
            description="New leads will appear here as they come in."
          />
        ) : (
          <div className="space-y-2">
            {sorted.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-4 bg-card-bg rounded-lg border border-border-light p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {lead.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                    <StatusBadge status={lead.stage} />
                    {lead.source && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {lead.source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo(lead.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureSection>
  );
}
