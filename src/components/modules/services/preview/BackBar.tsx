"use client";

import { ArrowLeft } from "lucide-react";
import type { Service, TeamMember } from "@/types/models";
import type { Step } from "./types";
import { formatDate } from "./helpers";

export function BackBar({
  step,
  basketServices,
  artist,
  date,
  time,
  businessName,
  onBack,
}: {
  step: Step;
  basketServices: Service[];
  artist: TeamMember | null;
  date: string | null;
  time: string | null;
  businessName: string;
  onBack: () => void;
}) {
  const titles: Record<Step, string> = {
    menu: businessName,
    artist: "Choose your artist",
    date: "Pick a date",
    time: "Pick a time",
    details: "Your details",
    confirm: "Confirmed",
  };
  const breadcrumb = (() => {
    if (basketServices.length === 0) return null;
    const head = basketServices[0].name;
    const more = basketServices.length - 1;
    return more > 0 ? `${head} +${more}` : head;
  })();
  return (
    <div className="flex items-center gap-2 -mt-2 mb-2">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg hover:bg-card-bg text-text-secondary cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate">{titles[step]}</p>
        {breadcrumb && (
          <p className="text-[11px] text-text-tertiary truncate">
            {breadcrumb}
            {artist && ` · with ${artist.name}`}
            {date && ` · ${formatDate(date)}`}
            {time && ` · ${time}`}
          </p>
        )}
      </div>
    </div>
  );
}
