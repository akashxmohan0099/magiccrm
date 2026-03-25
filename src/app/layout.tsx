import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magic - Your Custom Business Software, Built in Minutes",
  description:
    "Stop paying for features you don't use. Magic builds personalized business software tailored to your exact needs.",
  openGraph: {
    title: "Magic - Your Custom Business Software, Built in Minutes",
    description:
      "Stop paying for features you don't use. Magic builds personalized business software tailored to your exact needs.",
    type: "website",
    siteName: "Magic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic - Your Custom Business Software, Built in Minutes",
    description:
      "Stop paying for features you don't use. Magic builds personalized business software tailored to your exact needs.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
