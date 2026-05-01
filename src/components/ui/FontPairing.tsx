"use client";

export type FontPairingId = "modern" | "editorial" | "monospaced" | "classic-serif";

export const FONT_PAIRINGS: {
  id: FontPairingId;
  label: string;
  description: string;
  headingClass: string;
  bodyClass: string;
}[] = [
  {
    id: "modern",
    label: "Modern Clean",
    description: "Crisp sans, all-purpose.",
    headingClass: "font-sans",
    bodyClass: "font-sans",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Display heading, sans body.",
    headingClass:
      "[font-family:'Didot','Bodoni_72','Bodoni_MT','Playfair_Display',Georgia,serif]",
    bodyClass: "font-sans",
  },
  {
    id: "classic-serif",
    label: "Classic Serif",
    description: "Soft serif, refined feel.",
    headingClass: "font-serif",
    bodyClass: "font-serif",
  },
  {
    id: "monospaced",
    label: "Monospaced",
    description: "Mechanical, technical.",
    headingClass: "font-mono",
    bodyClass: "font-mono",
  },
];

export function fontClassesFor(id: string | undefined) {
  const match = FONT_PAIRINGS.find((p) => p.id === id) ?? FONT_PAIRINGS[0];
  return { heading: match.headingClass, body: match.bodyClass };
}

interface FontPairingPickerProps {
  value: string;
  onChange: (id: FontPairingId) => void;
}

export function FontPairingPicker({ value, onChange }: FontPairingPickerProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">
        Font pairing
      </label>
      <div className="grid grid-cols-2 gap-2">
        {FONT_PAIRINGS.map((preset) => {
          const active = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`text-left rounded-lg border py-3 px-3.5 cursor-pointer transition-all ${
                active
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border-light hover:border-text-tertiary bg-surface"
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className={`text-[18px] font-semibold text-foreground ${preset.headingClass}`}>
                  Aa
                </span>
                <span className={`text-[12.5px] text-text-secondary ${preset.bodyClass}`}>
                  the quick brown fox
                </span>
              </div>
              <p className="text-[12px] font-semibold text-foreground">{preset.label}</p>
              <p className="text-[10.5px] text-text-tertiary leading-snug">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
