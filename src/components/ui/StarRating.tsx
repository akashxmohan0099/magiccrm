"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const gapClass = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div
      className={`flex items-center ${gapClass}`}
      onMouseLeave={() => !readOnly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer"}`}
          >
            <Star
              className={`${sizeClass} ${
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300"
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
