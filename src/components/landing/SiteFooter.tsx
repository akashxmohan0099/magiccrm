"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  sectionHeadingVariants,
  sectionTransition,
  viewportConfig,
  ctaPulseVariants,
} from "@/app/landing-data";
import { useWaitlistModal } from "./waitlistStore";

export function SiteFooter() {
  const openWaitlist = useWaitlistModal((s) => s.open);
  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: "#0e0e0e" }}>
      {/* Ambient glow behind CTA */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(124,254,157,0.06), transparent 65%)" }} />

      {/* CTA */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5 }}
          className="mb-5"
        >
          <span className="text-[13px] font-medium" style={{ color: "var(--logo-green)" }}>Built for beauty professionals</span>
        </motion.div>
        <motion.h2
          variants={sectionHeadingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          transition={sectionTransition}
          className="text-[1.75rem] sm:text-[2.5rem] font-bold mb-5 leading-[1.1]"
          style={{ color: "#fff" }}
        >
          Stop juggling apps.<br />Start growing your business.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ delay: 0.1, ...sectionTransition }}
          className="mb-10 text-[15px] max-w-md mx-auto"
          style={{ color: "#888" }}
        >
          Everything your beauty business needs. One login. One price. No per-staff surprises.
        </motion.p>
        <motion.div variants={ctaPulseVariants} initial="hidden" whileInView="visible" viewport={viewportConfig}>
          <button
            type="button"
            onClick={openWaitlist}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-primary px-10 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-foreground transition-colors hover:bg-primary-hover cta-glow"
          >
            Join the waitlist <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="relative max-w-5xl mx-auto px-6 pb-8">
        <div className="border-t border-white/[0.06] py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--logo-green)" }}>
              <div className="w-2.5 h-2.5 bg-card-bg rounded-sm" />
            </div>
            <span className="text-sm font-semibold" style={{ color: "#777" }}>Magic</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs hover:underline" style={{ color: "#555" }}>Privacy</Link>
            <Link href="/terms" className="text-xs hover:underline" style={{ color: "#555" }}>Terms</Link>
            <span className="text-xs" style={{ color: "#555" }}>&copy; {new Date().getFullYear()} Magic</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
