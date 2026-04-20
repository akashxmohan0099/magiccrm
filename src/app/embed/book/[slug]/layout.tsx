import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book an Appointment",
  robots: { index: false, follow: false },
};

/**
 * Minimal layout for the embeddable booking widget.
 * No AuthProvider, no theme gate, no global nav — just the bare page
 * so it loads fast inside an iframe on an external website.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
