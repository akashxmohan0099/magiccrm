"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useWinBackStore } from "@/store/win-back";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface WinBackRuleFormProps { open: boolean; onClose: () => void; }

export function WinBackRuleForm({ open, onClose }: WinBackRuleFormProps) {
  const { addRule } = useWinBackStore();
  const { workspaceId } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [days, setDays] = useState("60");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [template, setTemplate] = useState("Hi {name}, we haven't seen you in a while! We'd love to have you back. Book your next visit here: {booking_link}");
  const [discountCode, setDiscountCode] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Rule name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    addRule({ name: name.trim(), inactiveDays: parseInt(days) || 60, channel, messageTemplate: template, enabled: true }, workspaceId ?? undefined);
    setName(""); setDays("60"); setTemplate("");
    onClose();
    setSaving(false);
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Win-Back Rule</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Rule Name" required error={errors.name}>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }} placeholder="e.g. 60-day lash rebook reminder" className={inputClass} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <FeatureSection moduleId="win-back" featureId="winback-offer" featureLabel="Win-Back Offer">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Attach Discount</label>
              <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="e.g. COMEBACK10" className={inputClass} />
              <p className="text-[11px] text-text-tertiary mt-1">Include a discount code in the re-engagement message.</p>
            </div>
          </FeatureSection>
          <div className="pt-2"><Button type="submit" loading={saving} className="w-full">Create Rule</Button></div>
        </form>
      </div>
    </div>
  );
}
