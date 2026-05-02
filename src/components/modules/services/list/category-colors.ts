// Color helpers + the magic-string used as the catch-all bucket name.
// Stable hash → HSL so a category always renders the same hue.

export const UNCATEGORIZED = "Uncategorized";

export function categoryHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

export function categoryStripeColor(name: string): string {
  return `hsl(${categoryHue(name)} 70% 60%)`;
}

export function categorySoftColor(name: string): string {
  return `hsl(${categoryHue(name)} 70% 92%)`;
}
