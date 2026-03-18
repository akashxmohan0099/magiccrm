import { useActivityStore } from "@/store/activity";

export function logActivity(
  type: string,
  module: string,
  description: string,
  entityId?: string
) {
  useActivityStore.getState().addEntry({ type, module, description, entityId });
}
