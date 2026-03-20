"use client";

import { useMemo } from "react";
import { UserCheck, DollarSign, Mail } from "lucide-react";
import { useLeadsStore } from "@/store/leads";
import { Lead } from "@/types/models";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { KanbanBoard, KanbanColumn } from "@/components/ui/KanbanBoard";
import { Button } from "@/components/ui/Button";

interface PipelineBoardProps {
  leads?: Lead[];
}

export function PipelineBoard({ leads: externalLeads }: PipelineBoardProps) {
  const store = useLeadsStore();
  const config = useIndustryConfig();
  const leads = externalLeads ?? store.leads;

  const columns: KanbanColumn<Lead>[] = useMemo(() => {
    const stageIds = new Set(config.leadStages.map((s) => s.id));
    const fallbackStageId = config.leadStages.find((s) => !s.isClosed)?.id ?? config.leadStages[0]?.id;

    return config.leadStages.map((stage) => ({
      id: stage.id,
      label: stage.label,
      color: stage.color,
      items: leads.filter((l) => {
        if (l.stage === stage.id) return true;
        if (!stageIds.has(l.stage) && stage.id === fallbackStageId) return true;
        return false;
      }),
    }));
  }, [leads, config.leadStages]);

  const handleMove = (leadId: string, toStage: string) => {
    store.moveLead(leadId, toStage as string);
  };

  const handleConvert = (leadId: string) => {
    store.convertToClient(leadId);
  };

  return (
    <KanbanBoard<Lead>
      columns={columns}
      keyExtractor={(lead) => lead.id}
      onMove={handleMove}
      renderCard={(lead) => (
        <div className="bg-card-bg rounded-lg border border-border-light p-3 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-foreground truncate">
            {lead.name}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-secondary">
            <Mail className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          {lead.value != null && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-text-secondary">
              <DollarSign className="w-3 h-3 flex-shrink-0" />
              <span>${lead.value.toLocaleString()}</span>
            </div>
          )}
          {lead.stage === "won" && !lead.clientId && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleConvert(lead.id);
              }}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              Convert to Client
            </Button>
          )}
        </div>
      )}
    />
  );
}
