"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useBeforeAfterStore } from "@/store/before-after";
import { Button } from "@/components/ui/Button";

interface BeforeAfterFormProps { open: boolean; onClose: () => void; }

export function BeforeAfterForm({ open, onClose }: BeforeAfterFormProps) {
  const { addRecord } = useBeforeAfterStore();
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !title.trim()) return;
    addRecord({ clientName: clientName.trim(), title: title.trim(), notes, beforePhotos: [], afterPhotos: [], checklist: [] });
    setClientName(""); setTitle(""); setNotes("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New Before/After Record</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Client *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kitchen renovation, Full detail clean" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Job notes, observations..." rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div className="bg-surface rounded-xl border border-border-light p-4 text-center">
            <p className="text-[13px] text-text-tertiary">Photo upload available after creating the record</p>
          </div>
          <div className="pt-2"><Button type="submit" className="w-full">Create Record</Button></div>
        </form>
      </div>
    </div>
  );
}
