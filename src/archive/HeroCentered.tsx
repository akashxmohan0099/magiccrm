"use client";

// ARCHIVED: the original centered hero that shipped with the first
// landing-page pass. Replaced by src/components/landing/HeroSplit.tsx on
// 2026-04-24 after a team research pass (see conversation transcript).
// Kept for reference — if the split hero needs to be rolled back, import
// this component into src/app/page.tsx and drop it in place of HeroSplit.

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useWaitlistModal } from "@/components/landing/waitlistStore";

export function HeroCentered() {
  const openWaitlist = useWaitlistModal((s) => s.open);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroProgress, [0, 1], [0, 40]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7, 1], [1, 0.8, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.97]);

  return (
    <section
      ref={heroRef}
      className="max-w-5xl mx-auto px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center pt-20 sm:pt-24 pb-12 text-center relative overflow-hidden"
    >
      <motion.div
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale, willChange: "transform, opacity" }}
        className="relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[13px] text-text-secondary font-medium mb-6"
        >
          The business platform for beauty &amp; wellness
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[2.25rem] sm:text-[3.5rem] md:text-[4.25rem] font-bold mb-6 leading-[1.05]"
        >
          <span className="gradient-text">Grow your beauty business.</span>
          <br />
          <span className="text-text-secondary">Not your admin.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-[15px] sm:text-[17px] text-text-secondary mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Bookings, clients, payments, and smart reminders — built for hair, lash, nail, and spa businesses in Australia.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <button
            type="button"
            onClick={openWaitlist}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-foreground px-10 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-background transition-opacity hover:opacity-90"
          >
            Join the waitlist <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-text-tertiary">
            Be first in line when we open seats.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
