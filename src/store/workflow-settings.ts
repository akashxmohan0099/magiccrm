import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StageDefinition } from "@/types/industry-config";

interface WorkflowSettingsStore {
  leadStages: StageDefinition[];
  jobStages: StageDefinition[];
  setLeadStages: (stages: StageDefinition[]) => void;
  setJobStages: (stages: StageDefinition[]) => void;
  resetLeadStages: () => void;
  resetJobStages: () => void;
}

export const useWorkflowSettingsStore = create<WorkflowSettingsStore>()(
  persist(
    (set) => ({
      leadStages: [],
      jobStages: [],

      setLeadStages: (stages) => set({ leadStages: stages }),
      setJobStages: (stages) => set({ jobStages: stages }),
      resetLeadStages: () => set({ leadStages: [] }),
      resetJobStages: () => set({ jobStages: [] }),
    }),
    { name: "magic-crm-workflow-settings" }
  )
);
