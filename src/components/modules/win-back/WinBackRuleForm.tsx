"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useWinBackStore } from "@/store/win-back";
import { Button } from "@/components/ui/Button";

interface WinBackRuleFormProps { open: boolean; onClose: () => void; }

export function WinBackRuleForm({ open, onClose }: WinBackRuleFormProps) {
  const { addRule } = useWinBackStore();
  const [name, setName] = useState("");
  const [days, setDays] = useState("60");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [template, setTemplate] = useState("Hi {name}, we haven't seen you in a while! We'd love to have you back. Book your next visit here: {booking_link}");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addRule({ name: name.trim(), inactiveDays: parseInt(days) || 60, channel, messageTemplate: template, enabled: true });
    setName(""); setDays("60"); setTemplate("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Win-Back Rule</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Rule Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 60-day lash rebook reminder" required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Days Inactive</label>
              <input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="60" className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "sms")} className={inputClass}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Message Template</label>
            <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={4} className={`${inputClass} resize-none`} />
            <p className="text-[11px] text-text-tertiary mt-1">Use {"{name}"} for client name, {"{booking_link}"} for booking page</p>
          </div>
          <div className="pt-2"><Button type="submit" className="w-full">Create Rule</Button></div>
        </form>
      </div>
    </div>
  );
}
