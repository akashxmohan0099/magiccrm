// Shared types for the booking preview surface.

/** Visual layout the operator picks in the Style panel. */
export type Layout = "classic" | "compact" | "grid";

/** Step in the public booking flow — drives titles + back-button breadcrumbs. */
export type Step = "menu" | "artist" | "date" | "time" | "details" | "confirm";
