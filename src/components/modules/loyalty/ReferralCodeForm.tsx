"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyalty";
import { Button } from "@/components/ui/Button";

interface ReferralCodeFormProps { open: boolean; onClose: () => void; }

export function ReferralCodeForm({ open, onClose }: ReferralCodeFormProps) {
  const { addReferralCode, referralBonus } = useLoyaltyStore();
  const [clientName, setClientName] = useState("");
  const [code, setCode] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !code.trim()) return;
    addReferralCode({ clientId: "", clientName: clientName.trim(), code: code.trim().toUpperCase(), rewardPoints: referralBonus });
    setClientName(""); setCode("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Referral Code</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Client Name *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Who is the referrer?" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Referral Code *</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SARAH10" required className={`${inputClass} font-mono uppercase`} />
          </div>
          <div className="bg-surface rounded-xl border border-border-light p-3">
            <p className="text-xs text-text-secondary">Both the referrer and new client will earn <span className="font-semibold text-foreground">{referralBonus} points</span> when the code is used.</p>
          </div>
          <div className="pt-2"><Button type="submit" className="w-full">Create Code</Button></div>
        </form>
      </div>
    </div>
  );
}
