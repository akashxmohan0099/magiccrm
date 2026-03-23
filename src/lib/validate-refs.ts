/**
 * Reference validation utilities.
 * Validates foreign key references before creating records.
 */

import { useClientsStore } from "@/store/clients";

/**
 * Validates that a clientId references an existing client.
 * Returns true if valid (client exists or clientId is undefined/empty).
 */
export function validateClientRef(clientId?: string): boolean {
  if (!clientId) return true; // optional field, no ref to validate
  return !!useClientsStore.getState().getClient(clientId);
}
