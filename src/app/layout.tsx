import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeGate } from "@/components/providers/ThemeGate";
import { SentryInit } from "@/components/providers/SentryInit";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://usemagic.com";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

const themeBootstrapScript = `(function(){try{if(!/^\\/dashboard/.test(location.pathname))return;var t=localStorage.getItem("magic-theme")||"light";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magic — The Business Platform for Beauty & Wellness",
    template: "%s | Magic",
  },
  description:
    "The AI-powered business platform built for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, payments, and a built-in AI assistant — shaped to your specialty.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Magic — The Business Platform for Beauty & Wellness",
    description:
      "The AI-powered business platform built for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, payments, and a built-in AI assistant — shaped to your specialty.",
    type: "website",
    siteName: "Magic",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic — The Business Platform for Beauty & Wellness",
    description:
      "The AI-powered business platform built for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, payments, and a built-in AI assistant — shaped to your specialty.",
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
    <html lang="en" className={urbanist.variable} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body className="antialiased">
        <SentryInit />
        <ThemeGate />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
