"use client";

import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { useMarketingStore } from "@/store/marketing";
import { useClientsStore } from "@/store/clients";
import { ReviewRequest } from "@/types/models";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { FormField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import { FeatureSection } from "@/components/modules/FeatureSection";

function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return <span className="text-xs text-text-secondary">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-border-warm"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewCollection() {
  const { reviewRequests, addReviewRequest } = useMarketingStore();
  const { clients } = useClientsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    addReviewRequest({
      clientId: client.id,
      clientName: client.name,
      status: "pending",
    });

    setSelectedClientId("");
    setFormOpen(false);
  };

  return (
    <FeatureSection moduleId="marketing" featureId="review-collection">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">
            Review Requests
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Request Review
          </Button>
        </div>

        {reviewRequests.length === 0 ? (
          <EmptyState
            icon="star"
            title="No review requests"
            description="Request reviews from your clients to build social proof."
            actionLabel="Request Review"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {reviewRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 bg-card-bg rounded-xl border border-border-warm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {req.clientName}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Requested {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StarRating rating={req.rating} />
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        <SlideOver
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setSelectedClientId("");
          }}
          title="Request Review"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Client" required>
              {clientOptions.length > 0 ? (
                <SelectField
                  options={[
                    { value: "", label: "Select a client..." },
                    ...clientOptions,
                  ]}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                />
              ) : (
                <p className="text-sm text-text-secondary">
                  No clients found. Add clients first.
                </p>
              )}
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-warm">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormOpen(false);
                  setSelectedClientId("");
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!selectedClientId}
              >
                Send Request
              </Button>
            </div>
          </form>
        </SlideOver>
      </div>
    </FeatureSection>
  );
}
