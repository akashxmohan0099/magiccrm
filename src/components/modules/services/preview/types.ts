// Shared types for the booking preview surface.

import type { TeamMember } from "@/types/models";

/** Visual layout the operator picks in the Style panel. */
export type Layout = "classic" | "compact" | "grid";

/** Step in the public booking flow — drives titles + back-button breadcrumbs. */
export type Step = "menu" | "artist" | "schedule" | "details" | "confirm";

export interface BasketItem {
  serviceId: string;
  variantId?: string;
  addonIds?: string[];
  /**
   * Per-service artist override (Pattern 1 opt-in). Only honoured when
   * flow.useArtistPerService is true. null = explicit "any" (engine picks).
   */
  artistId?: string | null;
}

export interface FlowState {
  basket: BasketItem[];
  /** Basket-wide artist (Pattern 3 default). One artist for the whole chain. */
  artist: TeamMember | null;
  /**
   * Opt-in: each basket item carries its own artistId. When true, the
   * artist step is skipped and the cart shows per-row pickers.
   */
  useArtistPerService: boolean;
  date: string | null; // ISO date
  time: string | null; // "10:30"
  name: string;
  email: string;
  phone: string;
  intakeAnswers: Record<string, string>; // questionId -> answer
}
