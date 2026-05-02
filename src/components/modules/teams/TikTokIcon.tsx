// Lucide doesn't ship a TikTok icon — inline SVG so the social row stays
// consistent with the other platform glyphs.
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.896 2.896 0 0 1 2.305-4.638 2.91 2.91 0 0 1 .89.135V9.4a6.354 6.354 0 0 0-1-.083 6.34 6.34 0 0 0-3.486 11.643 6.337 6.337 0 0 0 9.823-5.291V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.83 4.83 0 0 1-.889-.104z" />
    </svg>
  );
}
