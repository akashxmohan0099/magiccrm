"use client";

import { useState } from "react";
import { Plus, ClipboardList, X } from "lucide-react";
import { useSOAPNotesStore } from "@/store/soap-notes";
import { SOAPNote } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SOAPNoteForm } from "./SOAPNoteForm";
import { FeatureSection } from "@/components/modules/FeatureSection";

/* ── Body Map zone definitions ── */
interface BodyZone {
  id: string;
  label: string;
  /* SVG path data for the zone */
  path: string;
}

const bodyZones: BodyZone[] = [
  { id: "head", label: "Head", path: "M120,10 C135,10 148,20 148,38 C148,56 135,68 120,68 C105,68 92,56 92,38 C92,20 105,10 120,10 Z" },
  { id: "chest", label: "Chest", path: "M92,72 L148,72 L155,120 L85,120 Z" },
  { id: "left-arm", label: "Left Arm", path: "M85,72 L70,72 L55,140 L65,145 L80,120 Z" },
  { id: "right-arm", label: "Right Arm", path: "M155,72 L170,72 L185,140 L175,145 L160,120 Z" },
  { id: "abdomen", label: "Abdomen", path: "M85,122 L155,122 L152,180 L88,180 Z" },
  { id: "left-leg", label: "Left Leg", path: "M88,182 L115,182 L108,290 L82,290 Z" },
  { id: "right-leg", label: "Right Leg", path: "M125,182 L152,182 L158,290 L132,290 Z" },
];

export function SOAPNotesPage() {
  const { notes } = useSOAPNotesStore();
  const [formOpen, setFormOpen] = useState(false);
  const [practFilter, setPractFilter] = useState("");

  /* ── Body Map state ── */
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [bodyNotes, setBodyNotes] = useState<Record<string, string>>({});
  const [zoneInput, setZoneInput] = useState("");

  const handleZoneClick = (zoneId: string) => {
    if (selectedZone === zoneId) {
      setSelectedZone(null);
      setZoneInput("");
    } else {
      setSelectedZone(zoneId);
      setZoneInput(bodyNotes[zoneId] || "");
    }
  };

  const saveZoneNote = () => {
    if (selectedZone) {
      setBodyNotes((prev) => ({ ...prev, [selectedZone]: zoneInput }));
      setSelectedZone(null);
      setZoneInput("");
    }
  };

  const clearZoneNote = (zoneId: string) => {
    setBodyNotes((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
    if (selectedZone === zoneId) {
      setSelectedZone(null);
      setZoneInput("");
    }
  };

  const columns: Column<SOAPNote>[] = [
    { key: "clientName", label: "Patient", sortable: true },
    { key: "date", label: "Date", sortable: true, render: (n) => new Date(n.date).toLocaleDateString() },
    { key: "subjective", label: "Chief Complaint", render: (n) => <span className="text-text-secondary truncate max-w-[200px] block">{n.subjective.slice(0, 60)}{n.subjective.length > 60 ? "..." : ""}</span> },
    { key: "practitioner", label: "Practitioner", render: (n) => n.practitioner || <span className="text-text-tertiary">—</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Treatment Notes"
        description="SOAP notes and treatment records for your patients."
        actions={<Button variant="primary" size="sm" onClick={() => setFormOpen(true)}><Plus className="w-4 h-4" /> New Note</Button>}
      />
      <FeatureSection moduleId="soap-notes" featureId="practitioner-filter" featureLabel="Practitioner Filter">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Filter by:</span>
          <select value={practFilter} onChange={(e) => setPractFilter(e.target.value)} className="px-3 py-1.5 bg-surface border border-border-light rounded-lg text-[13px] text-foreground">
            <option value="">All practitioners</option>
          </select>
        </div>
      </FeatureSection>

      {notes.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10" />}
          title="No treatment notes yet"
          description="Start documenting patient treatments with structured SOAP notes."
          setupSteps={[{ label: "Create your first SOAP note", description: "Subjective, Objective, Assessment, Plan", action: () => setFormOpen(true) }]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<SOAPNote> storageKey="magic-crm-soapnotes-columns" columns={columns} data={notes} keyExtractor={(n) => n.id} />
        </div>
      )}
      <FeatureSection moduleId="soap-notes" featureId="auto-link-booking" featureLabel="Auto-Link to Booking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Auto-Link is active</p>
          <p className="text-[11px] text-text-tertiary">Treatment notes automatically attach to the related appointment.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="body-map-markup" featureLabel="Body Map">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Body Map</h3>
          <p className="text-[11px] text-text-tertiary mb-3">Click a body zone to add or edit a note for that area.</p>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* SVG Body Outline */}
            <div className="flex-shrink-0 flex justify-center">
              <svg viewBox="40 0 160 300" className="w-48 h-auto" xmlns="http://www.w3.org/2000/svg">
                {bodyZones.map((zone) => (
                  <path
                    key={zone.id}
                    d={zone.path}
                    fill={selectedZone === zone.id ? "rgba(59,130,246,0.3)" : bodyNotes[zone.id] ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.04)"}
                    stroke={selectedZone === zone.id ? "#3b82f6" : bodyNotes[zone.id] ? "#10b981" : "#d1d5db"}
                    strokeWidth={selectedZone === zone.id ? 2 : 1}
                    className="cursor-pointer transition-colors hover:fill-blue-100 hover:stroke-blue-400"
                    onClick={() => handleZoneClick(zone.id)}
                  >
                    <title>{zone.label}{bodyNotes[zone.id] ? `: ${bodyNotes[zone.id]}` : ""}</title>
                  </path>
                ))}
              </svg>
            </div>

            {/* Notes panel */}
            <div className="flex-1 min-w-0">
              {selectedZone ? (
                <div className="bg-surface rounded-xl border border-border-light p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-medium text-foreground">
                      {bodyZones.find((z) => z.id === selectedZone)?.label}
                    </h4>
                    <button onClick={() => { setSelectedZone(null); setZoneInput(""); }} className="p-1 rounded hover:bg-card-bg text-text-tertiary cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={zoneInput}
                    onChange={(e) => setZoneInput(e.target.value)}
                    placeholder="Add a note for this area..."
                    rows={3}
                    className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedZone(null); setZoneInput(""); }}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={saveZoneNote}>Save Note</Button>
                  </div>
                </div>
              ) : Object.keys(bodyNotes).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(bodyNotes).map(([zoneId, note]) => (
                    <div key={zoneId} className="flex items-start gap-2 px-3 py-2 bg-surface rounded-lg border border-border-light">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{bodyZones.find((z) => z.id === zoneId)?.label}</p>
                        <p className="text-[11px] text-text-secondary">{note}</p>
                      </div>
                      <button onClick={() => clearZoneNote(zoneId)} className="p-0.5 rounded hover:bg-card-bg text-text-tertiary hover:text-red-500 cursor-pointer flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-text-tertiary">Select a zone on the body outline to add notes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="note-locking" featureLabel="Note Locking">
        <div className="mt-4 p-4 bg-surface/50 rounded-xl border border-border-light">
          <p className="text-[13px] font-medium text-foreground">Note Locking</p>
          <p className="text-[11px] text-text-tertiary">Notes are locked after 24 hours and cannot be edited — for compliance and audit trail.</p>
        </div>
      </FeatureSection>

      <FeatureSection moduleId="soap-notes" featureId="treatment-plan-builder" featureLabel="Treatment Plan Builder">
        <div className="mt-4 bg-card-bg rounded-xl border border-border-light p-5">
          <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Treatment Plans</h3>
          <p className="text-[13px] text-text-tertiary text-center py-4">Create multi-session treatment plans with progress tracking across visits.</p>
          <div className="flex justify-center">
            <button className="px-4 py-2 bg-foreground text-white rounded-lg text-xs font-medium cursor-pointer hover:opacity-90">New Treatment Plan</button>
          </div>
        </div>
      </FeatureSection>

      <SOAPNoteForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
