// Shared types for the forms editor surface.
// Slide-over modes — kept in sync with the FormsPage URL state.

export type SlideMode = "edit" | "after" | "reply" | "style" | "embed";

export type FormSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";
