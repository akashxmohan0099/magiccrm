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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-5"
      >
        {/* Logo — matches sidebar/navbar logo */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--logo-green)" }}
        >
          <div className="w-4 h-4 bg-white rounded-[4px]" />
        </motion.div>

        {/* Animated dots */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-text-tertiary"
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
