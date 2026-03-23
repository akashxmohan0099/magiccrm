"use client";

import { AlertCircle, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import type { BuilderRequest } from "@/types/custom-feature";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusMeta(request: BuilderRequest) {
  switch (request.status) {
    case "review-ready":
      return {
        label: "Brief Ready",
        icon: CheckCircle2,
        badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      };
    case "generating":
      return {
        label: "Generating",
        icon: Sparkles,
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      };
    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        badgeClass: "bg-red-50 text-red-700 border border-red-200",
      };
    default:
      return {
        label: "Queued",
        icon: Clock3,
        badgeClass: "bg-surface text-text-secondary border border-border-light",
      };
  }
}

interface BuilderRequestListProps {
  requests: BuilderRequest[];
  title?: string;
  description?: string;
}

export function BuilderRequestList({
  requests,
  title = "Request Queue",
  description = "Saved builder requests and AI-generated implementation briefs.",
}: BuilderRequestListProps) {
  if (requests.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        <p className="text-[12px] text-text-tertiary mt-1">{description}</p>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const status = getStatusMeta(request);
          const StatusIcon = status.icon;

          return (
            <div key={request.id} className="bg-card-bg border border-border-light rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground leading-relaxed">
                    {request.prompt}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-text-tertiary">
                    <span>{request.requestType === "widget" ? "Widget request" : "Feature request"}</span>
                    <span>•</span>
                    <span>{formatTimestamp(request.createdAt)}</span>
                    <span>•</span>
                    <span>{request.creditCost} credit</span>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${status.badgeClass}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </div>
              </div>

              {request.result ? (
                <div className="rounded-xl bg-surface/50 border border-border-light p-3">
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {request.result}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-surface/40 border border-border-light p-3">
                  <p className="text-[12px] text-text-secondary">
                    {request.status === "generating"
                      ? "Generating an implementation brief from your prompt."
                      : "Saved locally for backend handoff. AI enrichment has not completed yet."}
                  </p>
                </div>
              )}

              {request.error && (
                <p className="text-[11px] text-amber-700 mt-3">
                  {request.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
