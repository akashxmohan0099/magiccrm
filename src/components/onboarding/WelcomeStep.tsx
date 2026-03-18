"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Wand2, Puzzle, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useOnboardingStore } from "@/store/onboarding";

export function WelcomeStep() {
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-xl mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-16 h-16 bg-gradient-to-br from-[#FFE072] to-[#D4A017] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#D4A017]/20"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-foreground mb-4"
      >
        Welcome to{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A017] to-[#B8860B]">
          Magic CRM
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[17px] text-text-secondary mb-12 leading-relaxed max-w-md mx-auto"
      >
        Answer a few questions about your business, and we&apos;ll build a CRM
        tailored exactly to how you work.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-4 mb-12"
      >
        {[
          { icon: Wand2, title: "Answer", desc: "Tell us what you need" },
          { icon: Puzzle, title: "Assemble", desc: "We build your CRM" },
          { icon: Zap, title: "Launch", desc: "Ready in minutes" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            className="p-5 bg-card-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          >
            <item.icon className="w-6 h-6 text-brand mb-3 mx-auto" />
            <h3 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h3>
            <p className="text-[12px] text-text-tertiary">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-3"
      >
        <Button size="lg" onClick={nextStep} className="px-10">
          Get Started <ArrowRight className="w-5 h-5" />
        </Button>
        <p className="text-[13px] text-text-tertiary">
          Takes about 2 minutes. You can change everything later.
        </p>
      </motion.div>
    </motion.div>
  );
}
