// Static option lists + colour utilities for the General settings page.

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "GBP", label: "British Pound" },
  { code: "EUR", label: "Euro" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "INR", label: "Indian Rupee" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SGD", label: "Singapore Dollar" },
];

export const LOCALE_OPTIONS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-AU", label: "English (Australia)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-CA", label: "English (Canada)" },
  { code: "en-NZ", label: "English (New Zealand)" },
  { code: "en-IN", label: "English (India)" },
  { code: "fr-FR", label: "French (France)" },
  { code: "de-DE", label: "German (Germany)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "ja-JP", label: "Japanese" },
];

export const PRESET_COLORS = [
  { id: "emerald", label: "Emerald", hex: "#34D399" },
  { id: "blue", label: "Blue", hex: "#3B82F6" },
  { id: "violet", label: "Violet", hex: "#8B5CF6" },
  { id: "rose", label: "Rose", hex: "#F43F5E" },
  { id: "amber", label: "Amber", hex: "#F59E0B" },
  { id: "teal", label: "Teal", hex: "#14B8A6" },
  { id: "pink", label: "Pink", hex: "#EC4899" },
  { id: "slate", label: "Slate", hex: "#475569" },
];

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 52, g: 211, b: 153 };
}

export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#FFFFFF";
}
