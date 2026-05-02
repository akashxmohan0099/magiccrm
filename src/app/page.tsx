"use client";

import { motion, useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { HeroSplit } from "@/components/landing/HeroSplit";
import { RevealText } from "@/components/landing/RevealText";
import { AddonsGrid } from "@/components/landing/AddonsGrid";
import { ComparisonToggle } from "@/components/landing/ComparisonToggle";
import { AIChatDemo } from "@/components/landing/AIChatDemo";

// Below-the-fold sections — split into their own JS chunks so the initial
// bundle stays small. ssr:false keeps them out of the server payload too;
// they hydrate as the user scrolls into them.
const ScrollMechanic = dynamic(
  () => import("@/components/landing/ScrollMechanic").then((m) => m.ScrollMechanic),
  { ssr: false, loading: () => null }
);
const CinematicDemo = dynamic(
  () => import("@/components/landing/CinematicDemo").then((m) => m.CinematicDemo),
  { ssr: false, loading: () => null }
);
const ComparisonSection = dynamic(
  () => import("@/components/landing/ComparisonSection").then((m) => m.ComparisonSection),
  { ssr: false, loading: () => null }
);
const PricingSection = dynamic(
  () => import("@/components/landing/PricingSection").then((m) => m.PricingSection),
  { ssr: false, loading: () => null }
);
const SiteFooter = dynamic(
  () => import("@/components/landing/SiteFooter").then((m) => m.SiteFooter),
  { ssr: false, loading: () => null }
);
import {
  sectionHeadingVariants, sectionTransition, viewportConfig,
} from "./landing-data";


export default function LandingPage() {
  // Global scroll progress for the progress bar
  const { scrollYProgress } = useScroll();

  return (
    <div className="min-h-screen bg-background grid-pattern noise-bg">
      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left"
        style={{
          scaleX: scrollYProgress,
          backgroundColor: "var(--primary)",
          willChange: "transform",
        }}
      />

      {/* Nav */}
      <SiteHeader />

      {/* Hero — split layout */}
      <HeroSplit />

      {/* Reveal text — scroll-driven word fade-in */}
      <RevealText />

      {/* Scroll mechanic — Pinterest grid → zoom → horizontal pan */}
      <ScrollMechanic />

      {/* Cinematic Demo */}
      <CinematicDemo />

      {/* AI Chat Demo */}
      <AIChatDemo />

      {/* The Difference — Generic CRM vs Magic */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24 bg-card-bg"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.25rem] font-bold text-foreground leading-tight mb-3"
            >
              Built for your specialty. Not for everyone.
            </motion.h2>
          </div>

          <ComparisonToggle viewportConfig={viewportConfig} />
        </div>
      </motion.section>

      {/* Add-ons */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportConfig}
        transition={{ duration: 0.5 }}
        className="py-16 sm:py-24"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.5rem] font-bold text-foreground leading-tight mb-3"
            >
              Extend it when you&apos;re ready.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.1, ...sectionTransition }}
              className="text-text-secondary text-[15px] max-w-lg mx-auto"
            >
              Start lean. Add gift cards, loyalty, intake forms, or memberships when your business is ready. One click, no migration.
            </motion.p>
          </div>

          <AddonsGrid />
        </div>
      </motion.section>

      {/* Why switch from Fresha/Timely */}
      <ComparisonSection />

      {/* Pricing */}
      <PricingSection />

      {/* Closing + footer */}
      <SiteFooter />
    </div>
  );
}
