"use client";

import { motion } from "framer-motion";
import { Clock, Sparkles, Sliders } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
    >
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-12"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "var(--logo-green)" }}>
            <div className="w-7 h-7 bg-white rounded-lg" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[40px] font-bold text-foreground mb-5 leading-[1.1] tracking-tight"
        >
          Your workspace, built around
          <br />
          the way you work
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[17px] text-text-secondary mb-16 leading-relaxed max-w-sm mx-auto"
        >
          Answer a few questions and we&apos;ll assemble a platform
          tailored to your business — no fluff, no features you&apos;ll never use.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-10 mb-16"
        >
          {[
            { icon: Clock, text: "Takes 2 minutes" },
            { icon: Sparkles, text: "Smart defaults" },
            { icon: Sliders, text: "Fully customizable" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 text-text-tertiary">
              <item.icon className="w-4 h-4" />
              <span className="text-[13px] font-medium">{item.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={nextStep}
            className="px-14 py-4 bg-foreground text-white rounded-full text-[16px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Get started
          </button>
          <p className="text-[12px] text-text-tertiary mt-5">
            Free to set up. No credit card needed.
          </p>
          <p className="text-[13px] text-text-tertiary mt-3">
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
