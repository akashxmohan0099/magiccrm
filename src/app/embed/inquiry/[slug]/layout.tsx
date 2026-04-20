import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inquiry Form",
  robots: { index: false, follow: false },
};

/**
 * Minimal layout for the embeddable inquiry form.
 * No AuthProvider, no theme gate, no global nav — just the bare page
 * so it loads fast inside an iframe on an external website.
 */
export default function EmbedInquiryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
