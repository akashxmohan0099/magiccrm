"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Layers, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto text-center pt-12"
    >
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        className="mb-10"
      >
        <div className="w-12 h-12 bg-foreground rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <div className="w-5 h-5 bg-white rounded-md" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[32px] font-bold text-foreground mb-4 leading-tight"
      >
        Let&apos;s build your CRM
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[16px] text-text-secondary mb-14 leading-relaxed max-w-sm mx-auto"
      >
        A few questions about your business, and we&apos;ll assemble a platform with only the tools you need.
      </motion.p>

      {/* Value props - horizontal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-8 mb-14"
      >
        {[
          { icon: Clock, text: "2 minutes" },
          { icon: Layers, text: "12 modules" },
          { icon: Settings2, text: "Fully customizable" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-text-secondary">
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
        <Button size="lg" onClick={nextStep} className="px-12">
          Get started <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-[12px] text-text-tertiary mt-4">
          Free to set up. No credit card needed.
        </p>
      </motion.div>
    </motion.div>
  );
}
