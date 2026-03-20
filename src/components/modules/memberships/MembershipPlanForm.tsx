"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useMembershipsStore } from "@/store/memberships";
import { MembershipInterval } from "@/types/models";
import { Button } from "@/components/ui/Button";

interface MembershipPlanFormProps { open: boolean; onClose: () => void; }

export function MembershipPlanForm({ open, onClose }: MembershipPlanFormProps) {
  const { addPlan } = useMembershipsStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [interval, setInterval] = useState<MembershipInterval>("monthly");
  const [sessions, setSessions] = useState("");
  const [unlimited, setUnlimited] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addPlan({
      name: name.trim(), description: description.trim(), price: parseFloat(price) || 0,
      interval, sessionsIncluded: unlimited ? undefined : parseInt(sessions) || undefined,
      unlimitedSessions: unlimited, active: true,
    });
    setName(""); setDescription(""); setPrice(""); setSessions(""); setUnlimited(false);
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Plan</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Plan Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 10-Session Pack" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included in this plan?" rows={2} className={`${inputClass} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Price</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Billing Interval</label>
              <select value={interval} onChange={(e) => setInterval(e.target.value as MembershipInterval)} className={inputClass}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} className="rounded" />
              <span className="text-[13px] text-foreground">Unlimited sessions</span>
            </label>
          </div>
          {!unlimited && (
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Sessions Included</label>
              <input type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} placeholder="e.g. 10" className={inputClass} />
            </div>
          )}
          <div className="pt-2"><Button type="submit" className="w-full">Create Plan</Button></div>
        </form>
      </div>
    </div>
  );
}
