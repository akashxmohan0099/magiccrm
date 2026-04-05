"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import { useSupportStore } from "@/store/support";
import { useAuth } from "@/hooks/useAuth";

interface SatisfactionWidgetProps {
  ticketId: string;
}

export function SatisfactionWidget({ ticketId }: SatisfactionWidgetProps) {
  const { tickets, updateTicket } = useSupportStore();
  const { workspaceId } = useAuth();
  const [hovered, setHovered] = useState<number | null>(null);

  const ticket = useMemo(
    () => tickets.find((t) => t.id === ticketId),
    [tickets, ticketId]
  );

  if (!ticket) return null;

  const currentRating = ticket.satisfaction ?? 0;
  const displayRating = hovered ?? currentRating;

  const handleRate = (rating: number) => {
    updateTicket(ticketId, { satisfaction: rating }, workspaceId ?? undefined);
  };

  return (
    <div>
      <p className="text-xs font-medium text-text-secondary mb-2">
        Customer Satisfaction
      </p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-border-light"
              }`}
            />
          </button>
        ))}
        {currentRating > 0 && (
          <span className="ml-2 text-xs text-text-secondary">
            {currentRating}/5
          </span>
        )}
      </div>
    </div>
  );
}
