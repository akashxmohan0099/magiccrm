"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface SOAPNoteFormProps { open: boolean; onClose: () => void; }

export function SOAPNoteForm({ open, onClose }: SOAPNoteFormProps) {
  const { addNote } = useSOAPNotesStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [practitioner, setPractitioner] = useState("");
  const [template, setTemplate] = useState("");
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  const applyTemplate = (value: string) => {
    setTemplate(value);
    if (value === "initial") {
      setSubjective("Patient presents for initial assessment. Chief complaint: ");
      setObjective("Vitals within normal limits. Physical examination: ");
      setAssessment("Initial evaluation. Working diagnosis: ");
      setPlan("1. Diagnostic workup\n2. Treatment plan to be determined\n3. Follow-up in 2 weeks");
    } else if (value === "followup") {
      setSubjective("Patient returns for follow-up visit. Reports: ");
      setObjective("Compared to previous visit: ");
      setAssessment("Progress since last visit: ");
      setPlan("1. Continue current treatment\n2. Next follow-up: ");
    } else if (value === "discharge") {
      setSubjective("Patient reports readiness for discharge. Current symptoms: ");
      setObjective("Final assessment findings: ");
      setAssessment("Treatment goals met. Discharge criteria satisfied.");
      setPlan("1. Home care instructions provided\n2. Medications reviewed\n3. Follow-up appointment scheduled");
    } else {
      setSubjective(""); setObjective(""); setAssessment(""); setPlan("");
    }
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) newErrors.clientName = "Patient name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    addNote({ clientId: "", clientName: clientName.trim(), date, subjective, objective, assessment, plan, practitioner: practitioner.trim() || undefined });
    setClientName(""); setSubjective(""); setObjective(""); setAssessment(""); setPlan(""); setPractitioner("");
    onClose();
    setSaving(false);
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">New SOAP Note</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FeatureSection moduleId="soap-notes" featureId="note-templates" featureLabel="Note Templates">
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Template</label>
              <select value={template} onChange={(e) => applyTemplate(e.target.value)} className={inputClass}>
                <option value="">Blank note</option>
                <option value="initial">Initial Assessment</option>
                <option value="followup">Follow-Up Visit</option>
                <option value="discharge">Discharge Summary</option>
              </select>
            </div>
          </FeatureSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Patient" required error={errors.clientName}>
              <input type="text" value={clientName} onChange={(e) => { setClientName(e.target.value); if (errors.clientName) setErrors((prev) => { const next = { ...prev }; delete next.clientName; return next; }); }} placeholder="Patient name" className={inputClass} />
            </FormField>
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
          <div className="pt-2"><Button type="submit" loading={saving} className="w-full">Save Note</Button></div>
        </form>
      </div>
    </div>
  );
}
