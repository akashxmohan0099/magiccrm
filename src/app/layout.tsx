import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeGate } from "@/components/providers/ThemeGate";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magic — CRM Built for Beauty & Wellness Professionals",
  description:
    "The CRM built specifically for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, invoicing, and AI — shaped to your specialty. $49/mo flat.",
  openGraph: {
    title: "Magic — CRM Built for Beauty & Wellness Professionals",
    description:
      "The CRM built specifically for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, invoicing, and AI — shaped to your specialty.",
    type: "website",
    siteName: "Magic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic — CRM Built for Beauty & Wellness Professionals",
    description:
      "The CRM built specifically for hairstylists, lash techs, nail artists, makeup artists, and spa owners. Bookings, clients, invoicing, and AI — shaped to your specialty.",
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
            __html: `(function(){try{if(!/^\\/dashboard/.test(location.pathname))return;var t=localStorage.getItem("magic-theme")||"light";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeGate />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
