"use client";

import { motion } from "framer-motion";

/**
 * Brand-aligned full-screen preloader.
 * Shown during initial dashboard load while auth + workspace data resolves.
 */
export function AppPreloader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: "var(--logo-green)", boxShadow: "0 0 40px rgba(124,254,157,0.25), 0 8px 32px rgba(0,0,0,0.08)" }}
        >
          <div className="w-8 h-8 bg-card-bg rounded-lg" />
        </motion.div>

        {/* Brand name */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-lg font-semibold tracking-wide text-foreground"
        >
          MAGIC
        </motion.p>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
