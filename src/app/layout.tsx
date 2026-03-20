import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Magic CRM - Your Custom CRM, Built in Minutes",
  description:
    "Stop paying for features you don't use. Magic CRM builds a personalized CRM tailored to your exact business needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
