"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import type { FormFontFamily, FormTemplate, FormTheme } from "@/types/models";

export const TEMPLATE_OPTIONS: { id: FormTemplate; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Card with branded header — versatile default." },
  { id: "minimal", label: "Minimal", description: "Flat layout, no card. Clean and quiet." },
  { id: "editorial", label: "Editorial", description: "Big centered title, generous spacing." },
  { id: "slides", label: "Slides", description: "One question at a time, Typeform-style." },
];

// Per-family preview class — used by the pair preview cards below.
export const FONT_PREVIEW_CLASS: Record<FormFontFamily, string> = {
  sans: "font-sans",
  serif: "font-serif",
  display:
    "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide",
  mono: "font-mono",
};

// Named font pairings — replaces the old generic Sans/Serif/Display/Mono
// picker. Each preset sets BOTH the heading font and the body font so the
// operator picks a feel, not a typography taxonomy.
export const FONT_PAIR_PRESETS: {
  id: string;
  label: string;
  description: string;
  heading: FormFontFamily;
  body: FormFontFamily;
}[] = [
  {
    id: "soft-romantic",
    label: "Soft & Romantic",
    description: "Serif heading, sans body — bridal default.",
    heading: "serif",
    body: "sans",
  },
  {
    id: "modern-editorial",
    label: "Modern Editorial",
    description: "Display heading, serif body — magazine feel.",
    heading: "display",
    body: "serif",
  },
  {
    id: "luxe-minimal",
    label: "Luxe Minimal",
    description: "Display heading, sans body — clean and quiet.",
    heading: "display",
    body: "sans",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Sans throughout — versatile, neutral.",
    heading: "sans",
    body: "sans",
  },
];

// Per-form theme picker. Scoped to the rendered form only — does not change
// the operator's dashboard theme. "Auto" follows the visitor's system pref.
// Dark/Auto are gated as `comingSoon` until the public-form dark surfaces
// (logo backplate, gradient header, etc.) are properly tuned — the renderer
// honours the token swap but visual polish isn't there yet, so we don't
// ship the option until it looks right.
export const THEME_OPTIONS: { id: FormTheme; label: string; icon: React.ComponentType<{ className?: string }>; swatchClass: string; comingSoon?: boolean }[] = [
  { id: "light", label: "Light", icon: Sun, swatchClass: "bg-white border-border-light text-foreground" },
  { id: "dark", label: "Dark", icon: Moon, swatchClass: "bg-[#141414] border-[#2A2A2A] text-white", comingSoon: true },
  { id: "auto", label: "Auto", icon: Monitor, swatchClass: "bg-gradient-to-br from-white to-[#141414] border-border-light text-foreground", comingSoon: true },
];
