// Pure helpers + small util types extracted from FormRenderer.tsx.
// These have no React state, just take a Form/branding and return strings/IDs.

import type {
  FormBranding,
  FormFieldConfig,
  FormFontFamily,
  FormTemplate,
  FormTheme,
} from "@/types/models";
import type { RenderableForm } from "./renderer-types";

/**
 * Autocomplete heuristic. Field type wins for email/phone/url; for plain
 * text we read keywords from the label so "First name" → given-name etc.
 * Returning undefined means we omit the attribute (browsers fall back to
 * no-autofill). Conservative on purpose — wrong autocomplete is worse than none.
 */
export function autocompleteFor(field: FormFieldConfig): string | undefined {
  const t = field.type;
  if (t === "email") return "email";
  if (t === "phone") return "tel";
  if (t === "url") return "url";
  const label = (field.label || field.name || "").toLowerCase();
  if (t === "text") {
    if (/(^|\b)(first|given)\b.*name/.test(label)) return "given-name";
    if (/(^|\b)(last|family|sur)\b.*name|surname/.test(label)) return "family-name";
    if (/full name|^name$|your name|name$/.test(label)) return "name";
    if (/company|business|organi[sz]ation/.test(label)) return "organization";
    if (/street|address(?! line 2)/.test(label)) return "street-address";
    if (/^city|town$|suburb/.test(label)) return "address-level2";
    if (/postcode|postal code|zip/.test(label)) return "postal-code";
    if (/country/.test(label)) return "country-name";
  }
  return undefined;
}

/** Normalise the dropdown placeholder. Avoids "Select select an option" when
 *  the operator typed a label that already starts with "Select". */
export function selectPlaceholderText(field: FormFieldConfig): string {
  const raw = (field.placeholder ?? field.label ?? "").trim();
  if (!raw) return "Select an option";
  if (/^select\b/i.test(raw)) return raw;
  return `Select ${raw.toLowerCase()}`;
}

export function effectiveLogo(form: RenderableForm, workspaceLogo?: string): string | undefined {
  return form.branding.logo || workspaceLogo;
}

export const FONT_CLASS: Record<FormFontFamily, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  display:
    "[font-family:'Optima','Avenir','Futura','Helvetica_Neue',sans-serif] tracking-wide",
};

export function fontClassFor(branding: FormBranding) {
  return FONT_CLASS[branding.fontFamily ?? "sans"];
}

/** Heading font falls back to body font when not explicitly set, so old forms
 *  that only configured `fontFamily` keep rendering uniformly. */
export function headingFontClassFor(branding: FormBranding) {
  return FONT_CLASS[branding.headingFontFamily ?? branding.fontFamily ?? "sans"];
}

/** Accent defaults to brand when unset — operators with one color get a
 *  uniform look without having to set both. Returned as a hex string. */
export function accentColorFor(branding: FormBranding, brand: string) {
  return branding.accentColor?.trim() || brand;
}

export function templateFor(branding: FormBranding): FormTemplate {
  return branding.template ?? "classic";
}

export function themeFor(branding: FormBranding): FormTheme {
  return branding.theme ?? "light";
}
