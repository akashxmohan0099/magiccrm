/**
 * Local backup utilities for Magic CRM localStorage data.
 */

const MAGIC_PREFIX = "magic-crm-";

/**
 * Export all localStorage keys that belong to Magic CRM.
 */
export function createMagicCrmLocalBackup(storage: Storage): string {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(MAGIC_PREFIX)) {
      try {
        data[key] = JSON.parse(storage.getItem(key) ?? "null");
      } catch {
        data[key] = storage.getItem(key);
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Restore a previously exported backup into localStorage.
 */
export function restoreMagicCrmBackup(
  storage: Storage,
  json: string
): { restored: number; errors: string[] } {
  const errors: string[] = [];
  let restored = 0;
  try {
    const data = JSON.parse(json) as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith(MAGIC_PREFIX)) {
        errors.push(`Skipped non-MAGIC key: ${key}`);
        continue;
      }
      try {
        storage.setItem(key, JSON.stringify(value));
        restored++;
      } catch (e) {
        errors.push(`Failed to restore ${key}: ${e}`);
      }
    }
  } catch (e) {
    errors.push(`Invalid JSON: ${e}`);
  }
  return { restored, errors };
}

/**
 * Clear all Magic CRM localStorage data.
 */
export function clearMagicCrmLocalData(storage: Storage): number {
  const keysToRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(MAGIC_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key));
  return keysToRemove.length;
}
