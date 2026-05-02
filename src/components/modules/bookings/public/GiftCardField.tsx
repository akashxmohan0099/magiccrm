"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Loader2, Check, AlertCircle } from "lucide-react";
import { formatPrice } from "./helpers";

export interface GiftCardCheck {
  status: "valid";
  code: string;
  balance: number;
}

interface GiftCardFieldProps {
  slug: string;
  applied: GiftCardCheck | null;
  onApplied: (check: GiftCardCheck | null) => void;
}

/**
 * Optional gift-card redemption panel for the details step. Validates the
 * code via /api/public/gift-cards/redeem, surfaces remaining balance, and
 * lets the user remove it before submit. Does NOT debit the card —
 * the basket endpoint handles draw-down server-side after insert.
 */
export function GiftCardField({ slug, applied, onApplied }: GiftCardFieldProps) {
  const [open, setOpen] = useState(Boolean(applied));
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/public/gift-cards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't validate this code.");
        return;
      }
      onApplied({ status: "valid", code: trimmed, balance: Number(data.remainingBalance ?? 0) });
      setCode("");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setChecking(false);
    }
  };

  if (!open && !applied) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline cursor-pointer"
      >
        <Gift className="w-3.5 h-3.5" />
        Have a gift card?
      </button>
    );
  }

  return (
    <div>
      <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Gift className="w-3.5 h-3.5" /> Gift card
      </p>

      <AnimatePresence mode="wait">
        {applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/30"
          >
            <Check className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={3} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground tabular-nums">{applied.code}</p>
              <p className="text-[11px] text-text-secondary">
                Balance {formatPrice(applied.balance)} — drawn down at checkout
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onApplied(null); setOpen(false); }}
              aria-label="Remove gift card"
              className="text-text-tertiary hover:text-red-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="entry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="GIFT-CODE"
              className="flex-1 px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] font-mono uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCheck(); } }}
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking || !code.trim()}
              className="px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-1.5"
            >
              {checking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Apply
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-[12px] text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
