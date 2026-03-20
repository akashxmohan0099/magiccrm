"use client";

import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import type { ClientRelationship } from "@/types/models";

interface RelationshipsSectionProps {
  clientId: string;
  relationships: ClientRelationship[];
  onUpdate: (relationships: ClientRelationship[]) => void;
}

export function RelationshipsSection({ clientId, relationships, onUpdate }: RelationshipsSectionProps) {
  const config = useIndustryConfig();
  const { clients } = useClientsStore();
  const [adding, setAdding] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedType, setSelectedType] = useState("");

  if (config.relationships.length === 0) return null;

  const otherClients = clients.filter((c) => c.id !== clientId);
  const clientOptions = [
    { value: "", label: "Select..." },
    ...otherClients.map((c) => ({ value: c.id, label: c.name })),
  ];
  const typeOptions = [
    { value: "", label: "Select type..." },
    ...config.relationships.map((r) => ({ value: r.id, label: r.label })),
  ];

  const handleAdd = () => {
    if (!selectedClientId || !selectedType) return;
    onUpdate([...relationships, { clientId: selectedClientId, type: selectedType }]);
    setSelectedClientId("");
    setSelectedType("");
    setAdding(false);
  };

  const handleRemove = (idx: number) => {
    onUpdate(relationships.filter((_, i) => i !== idx));
  };

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";
  const getTypeLabel = (typeId: string) => config.relationships.find((r) => r.id === typeId)?.label ?? typeId;

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4 text-text-secondary" />
          Relationships
        </h4>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        )}
      </div>

      {relationships.length > 0 && (
        <div className="space-y-2 mb-3">
          {relationships.map((rel, idx) => (
            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-card-bg rounded-lg border border-border-light">
              <div>
                <span className="text-sm text-foreground">{getClientName(rel.clientId)}</span>
                <span className="text-xs text-text-secondary ml-2">({getTypeLabel(rel.type)})</span>
              </div>
              <button onClick={() => handleRemove(idx)} className="text-text-tertiary hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="space-y-2 p-3 bg-card-bg rounded-lg border border-border-light">
          <SelectField options={clientOptions} value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} />
          <SelectField options={typeOptions} value={selectedType} onChange={(e) => setSelectedType(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedClientId || !selectedType}>Add</Button>
          </div>
        </div>
      )}

      {relationships.length === 0 && !adding && (
        <p className="text-xs text-text-tertiary">No relationships added yet.</p>
      )}
    </div>
  );
}
