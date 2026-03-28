"use client";

import { useState } from "react";
import { useBookingsStore } from "@/store/bookings";
import { Booking } from "@/types/models";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";

interface SatisfactionPromptProps {
  booking: Booking;
}

export function SatisfactionPrompt({ booking }: SatisfactionPromptProps) {
  const { rateBooking } = useBookingsStore();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  if (booking.status !== "completed" || booking.satisfactionRating) {
    return null;
  }

  const handleSubmit = () => {
    if (rating === 0) return;
    rateBooking(booking.id, rating, feedback.trim() || undefined);
  };

  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
      <p className="text-[13px] font-medium text-amber-900">
        How did this appointment go?
      </p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Optional feedback..."
        rows={2}
        className="w-full px-3 py-2 bg-card-bg border border-amber-200 rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300 resize-none"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={rating === 0}
      >
        Submit Rating
      </Button>
    </div>
  );
}
