"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4"
    >
      <div className="max-w-md mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-10"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-6 h-6 bg-card-bg rounded-lg" />
          </div>
        </motion.div>

        {/* Welcome text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[14px] font-medium text-primary mb-4"
        >
          Welcome to Magic
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-[34px] sm:text-[40px] font-bold text-foreground mb-5 leading-[1.12] tracking-tight"
        >
          Let&apos;s build something
          <br />
          that works for you
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-[16px] text-text-secondary mb-12 leading-relaxed"
        >
          We&apos;ll ask a few quick questions about your business so we can
          set up the right clients, bookings, invoicing, and tools —
          tailored to your specialty.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            onClick={nextStep}
            className="group w-full sm:w-auto px-10 py-4 bg-foreground text-background rounded-2xl text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-all inline-flex items-center justify-center gap-2.5"
          >
            Let&apos;s go
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 space-y-2"
        >
          <p className="text-[12px] text-text-tertiary">
            Free to set up. Takes about 2 minutes. No credit card needed.
          </p>
          <p className="text-[13px] text-text-tertiary">
            Already have an account?{" "}
            <a href="/login" className="text-foreground font-medium hover:underline">
              Log in
            </a>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
