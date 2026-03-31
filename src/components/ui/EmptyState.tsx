"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface SetupStep {
  label: string;
  description?: string;
  action: () => void;
  done?: boolean;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  setupSteps?: SetupStep[];
}

export function EmptyState({ icon, title, description, actionLabel, onAction, setupSteps }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-5 text-text-secondary"
      >
        {icon}
      </motion.div>
      <h3 className="text-[18px] font-bold text-foreground mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">{description}</p>

      {/* Setup steps — guided onboarding within the module */}
      {setupSteps && setupSteps.length > 0 && (
        <div className="w-full max-w-sm space-y-2 mb-6">
          {setupSteps.map((step, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={step.action}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                step.done
                  ? "bg-surface/50 opacity-50"
                  : "bg-card-bg border border-border-light hover:border-foreground/15"
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                step.done ? "bg-primary" : "border-2 border-primary"
              }`}>
                {step.done && (
                  <svg className="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "text-text-tertiary line-through" : "text-foreground"}`}>
                  {step.label}
                </p>
                {step.description && !step.done && (
                  <p className="text-xs text-text-tertiary mt-0.5">{step.description}</p>
                )}
              </div>
              {!step.done && <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
            </motion.button>
          ))}
        </div>
      )}

      {actionLabel && onAction && !setupSteps?.length && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-foreground text-background rounded-full text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            {actionLabel}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
