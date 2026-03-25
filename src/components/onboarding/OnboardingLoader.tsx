"use client";

import { motion } from "framer-motion";

/**
 * Unified loading/transition screen for the onboarding flow.
 *
 * Every loading state in onboarding uses this component to give users
 * a consistent sense of progression and purpose. No more random spinners
 * or blank white screens.
 *
 * @param title     - What's happening ("Personalizing your workspace")
 * @param subtitle  - Why it matters ("So we only show what you need")
 * @param step      - Current step number (shows progression like "Step 4 of 7")
 * @param totalSteps - Total steps
 * @param detail    - Optional extra line ("This takes a few seconds")
 */
interface OnboardingLoaderProps {
  title: string;
  subtitle: string;
  step?: number;
  totalSteps?: number;
  detail?: string;
}

export function OnboardingLoader({ title, subtitle, step, totalSteps, detail }: OnboardingLoaderProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #FAFAFA 40%, #F5F3FF 70%, #FAFAFA 100%)" }}
    >
      {/* Ambient blobs — consistent across all loading states */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 max-w-sm mx-auto px-6"
      >
        {/* Logo — always the same green box, pulsing */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
          style={{ backgroundColor: "var(--logo-green)", boxShadow: "0 0 40px rgba(124,254,157,0.3)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-7 h-7 bg-white rounded-lg"
          />
        </motion.div>

        {/* Step indicator */}
        {step && totalSteps && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[12px] font-medium text-text-tertiary mb-4 tracking-wide uppercase"
          >
            Step {step} of {totalSteps}
          </motion.p>
        )}

        {/* Title */}
        <h3 className="text-[20px] font-bold text-foreground mb-2">
          {title}
        </h3>

        {/* Subtitle — the WHY */}
        <p className="text-[14px] text-text-secondary mb-2">
          {subtitle}
        </p>

        {/* Optional detail */}
        {detail && (
          <p className="text-[12px] text-text-tertiary">
            {detail}
          </p>
        )}

        {/* Animated progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
