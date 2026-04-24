"use client";

import Link from "next/link";

// Shared landing header — used by the homepage and every marketing page
// (Product, Pricing, Waitlist). Edit in one place so the nav stays
// consistent across routes.
export function SiteHeader() {
  return (
    <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--logo-green)" }}
        >
          <div className="w-3.5 h-3.5 bg-card-bg rounded-sm" />
        </div>
        <span className="font-bold text-foreground text-[15px] tracking-tight">Magic</span>
      </Link>
      <div className="flex items-center gap-8">
        <Link
          href="/product"
          className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium"
        >
          Product
        </Link>
        <Link
          href="/pricing"
          className="text-[13px] text-text-secondary hover:text-foreground transition-colors font-medium"
        >
          Pricing
        </Link>
        <Link
          href="/waitlist"
          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-[13px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90"
        >
          Join the waitlist
        </Link>
      </div>
    </nav>
  );
}
