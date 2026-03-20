"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { Button } from "@/components/ui/Button";

interface SOAPNoteFormProps { open: boolean; onClose: () => void; }

export function SOAPNoteForm({ open, onClose }: SOAPNoteFormProps) {
  const { addNote } = useSOAPNotesStore();
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [practitioner, setPractitioner] = useState("");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    addNote({ clientId: "", clientName: clientName.trim(), date, subjective, objective, assessment, plan, practitioner: practitioner.trim() || undefined });
    setClientName(""); setSubjective(""); setObjective(""); setAssessment(""); setPlan(""); setPractitioner("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New SOAP Note</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Patient *</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Patient name" required className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Practitioner</label>
            <input type="text" value={practitioner} onChange={(e) => setPractitioner(e.target.value)} placeholder="Your name" className={inputClass} />
          </div>
          {[
            { label: "Subjective", value: subjective, setter: setSubjective, placeholder: "Patient's reported symptoms, concerns, and history..." },
            { label: "Objective", value: objective, setter: setObjective, placeholder: "Observable findings, measurements, test results..." },
            { label: "Assessment", value: assessment, setter: setAssessment, placeholder: "Clinical interpretation and diagnosis..." },
            { label: "Plan", value: plan, setter: setPlan, placeholder: "Treatment plan, follow-up, recommendations..." },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-[11px] font-bold mr-1.5">{field.label[0]}</span>
                {field.label}
              </label>
              <textarea value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} rows={3}
                className={`${inputClass} resize-none`} />
            </div>
          ))}
          <div className="pt-2"><Button type="submit" className="w-full">Save Note</Button></div>
        </form>
      </div>
    </div>
  );
}
