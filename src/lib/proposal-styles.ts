export interface ProposalPalette {
  id: string;
  name: string;
  accent: string;
}

export interface ProposalDesignStyle {
  id: string;
  name: string;
  description: string;
  category: "minimal" | "modern" | "bold" | "warm" | "elegant";
  bg: string;
  headerBg: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  fontFamily: string;
  palettes: ProposalPalette[];
}

export const PROPOSAL_STYLES: ProposalDesignStyle[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean and professional",
    category: "minimal",
    bg: "#ffffff",
    headerBg: "#f8f8f8",
    text: "#1a1a1a",
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#111827",
    fontFamily: "Inter, sans-serif",
    palettes: [
      { id: "slate", name: "Slate", accent: "#475569" },
      { id: "blue", name: "Blue", accent: "#2563eb" },
      { id: "emerald", name: "Emerald", accent: "#059669" },
    ],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold with dark header",
    category: "modern",
    bg: "#ffffff",
    headerBg: "#18181b",
    text: "#18181b",
    muted: "#71717a",
    border: "#e4e4e7",
    accent: "#18181b",
    fontFamily: "Inter, sans-serif",
    palettes: [
      { id: "noir", name: "Noir", accent: "#18181b" },
      { id: "indigo", name: "Indigo", accent: "#4f46e5" },
      { id: "rose", name: "Rose", accent: "#e11d48" },
    ],
  },
  {
    id: "warm",
    name: "Warm",
    description: "Soft parchment tones",
    category: "warm",
    bg: "#faf8f5",
    headerBg: "#f5f1eb",
    text: "#1c1a17",
    muted: "#78716c",
    border: "#e7e5e4",
    accent: "#b0aa9f",
    fontFamily: "Georgia, serif",
    palettes: [
      { id: "stone", name: "Stone", accent: "#b0aa9f" },
      { id: "rose-gold", name: "Rose Gold", accent: "#c5917b" },
      { id: "sage", name: "Sage", accent: "#7e876f" },
    ],
  },
  {
    id: "luxe",
    name: "Luxe",
    description: "Premium dark elegance",
    category: "elegant",
    bg: "#faf9f7",
    headerBg: "#1c1917",
    text: "#1c1917",
    muted: "#a8a29e",
    border: "#d6d3d1",
    accent: "#b5956e",
    fontFamily: "Georgia, serif",
    palettes: [
      { id: "gold", name: "Gold", accent: "#b5956e" },
      { id: "champagne", name: "Champagne", accent: "#c9b99a" },
      { id: "bronze", name: "Bronze", accent: "#92734d" },
    ],
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant and energetic",
    category: "bold",
    bg: "#ffffff",
    headerBg: "#7c3aed",
    text: "#1e1b4b",
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#7c3aed",
    fontFamily: "Inter, sans-serif",
    palettes: [
      { id: "violet", name: "Violet", accent: "#7c3aed" },
      { id: "cyan", name: "Cyan", accent: "#0891b2" },
      { id: "amber", name: "Amber", accent: "#d97706" },
    ],
  },
  {
    id: "sage",
    name: "Sage",
    description: "Natural and calming",
    category: "warm",
    bg: "#f5f7f4",
    headerBg: "#e8ece5",
    text: "#1a2e1a",
    muted: "#6b7c6b",
    border: "#d4dcd0",
    accent: "#5a7a5a",
    fontFamily: "Georgia, serif",
    palettes: [
      { id: "forest", name: "Forest", accent: "#5a7a5a" },
      { id: "olive", name: "Olive", accent: "#7c8a3c" },
      { id: "earth", name: "Earth", accent: "#8b7355" },
    ],
  },
];

export function getProposalStyle(styleId: string, paletteId?: string): ProposalDesignStyle & { activeAccent: string } {
  const style = PROPOSAL_STYLES.find((s) => s.id === styleId) || PROPOSAL_STYLES[0];
  const palette = paletteId ? style.palettes.find((p) => p.id === paletteId) : style.palettes[0];
  return {
    ...style,
    accent: palette?.accent || style.accent,
    activeAccent: palette?.accent || style.accent,
  };
}
