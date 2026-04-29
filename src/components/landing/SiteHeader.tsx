"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useWaitlistModal } from "./waitlistStore";
import { WaitlistModal } from "./WaitlistModal";

// Shared landing header — used by the homepage and every marketing page
// (Product, Pricing, Waitlist). Edit in one place so the nav stays
// consistent across routes.
//
// Behavior: hides when scrolling down, reappears on any upward scroll.
// Glass-morph backdrop fades in once the user leaves the very top.
export function SiteHeader() {
  const pathname = usePathname();
  const openWaitlist = useWaitlistModal((s) => s.open);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (y > lastY.current && y > 80) {
        setHidden(true);
      } else if (y < lastY.current - 2) {
        setHidden(false);
      }
      lastY.current = y;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks: { href: string; label: string }[] = [
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div
        className={`transition-[background-color,backdrop-filter,border-color] duration-300 ${
          scrolled
            ? "bg-background/75 backdrop-blur-xl border-b border-border-light/70"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="max-w-6xl mx-auto px-5 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--logo-green)" }}
            >
              <div className="w-3.5 h-3.5 bg-card-bg rounded-sm" />
            </div>
            <span className="font-bold text-foreground text-[17px] sm:text-[18px] tracking-tight">
              Magic
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Nav links hidden below sm so the logo + CTA have breathing room */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 sm:px-4 py-2 rounded-full text-[14px] sm:text-[14.5px] font-medium transition-colors ${
                      active
                        ? "text-foreground"
                        : "text-text-secondary hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.06]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={openWaitlist}
              className="sm:ml-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-semibold tracking-[-0.01em] text-background transition-all hover:opacity-90 hover:gap-2"
            >
              <span className="hidden sm:inline">Get early access</span>
              <span className="sm:hidden">Early access</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </div>
      <WaitlistModal />
    </motion.header>
  );
}
