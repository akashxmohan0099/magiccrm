"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useIntakeFormsStore } from "@/store/intake-forms";
import { Button } from "@/components/ui/Button";

interface IntakeFormFormProps { open: boolean; onClose: () => void; }

export function IntakeFormForm({ open, onClose }: IntakeFormFormProps) {
  const { addForm } = useIntakeFormsStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addForm({ name: name.trim(), description: description.trim(), fields: [], active: true, linkedTo: undefined });
    setName(""); setDescription("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Intake Form</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Form Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Client Health History" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What information does this form collect?" rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="pt-2"><Button type="submit" className="w-full">Create Form</Button></div>
        </form>
      </div>
    </div>
  );
}
