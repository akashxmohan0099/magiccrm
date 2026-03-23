"use client";

interface ViewToggleProps {
  view: "my" | "team";
  onChange: (view: "my" | "team") => void;
  moduleLabel?: string; // e.g. "Bookings", "Jobs"
}

export function ViewToggle({ view, onChange, moduleLabel = "" }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-surface rounded-lg p-0.5 border border-border-light">
      <button
        type="button"
        onClick={() => onChange("my")}
        className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
          view === "my"
            ? "bg-card-bg text-foreground shadow-sm"
            : "text-text-secondary hover:text-foreground"
        }`}
      >
        My{moduleLabel ? ` ${moduleLabel}` : ""}
      </button>
      <button
        type="button"
        onClick={() => onChange("team")}
        className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
          view === "team"
            ? "bg-card-bg text-foreground shadow-sm"
            : "text-text-secondary hover:text-foreground"
        }`}
      >
        All{moduleLabel ? ` ${moduleLabel}` : ""}
      </button>
    </div>
  );
}
