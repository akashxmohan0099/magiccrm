const MAGIC_CRM_STORAGE_PREFIX = "magic-crm-";
const MAGIC_CRM_BACKUP_FORMAT = "magic-crm-local-backup";
const MAGIC_CRM_BACKUP_VERSION = 1;

const DEFAULT_AVAILABILITY = [
  { day: 1, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 2, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 3, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 4, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 5, startTime: "09:00", endTime: "17:00", enabled: true },
  { day: 6, startTime: "09:00", endTime: "12:00", enabled: false },
  { day: 0, startTime: "09:00", endTime: "12:00", enabled: false },
];

type StorageValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export interface MagicCrmLocalBackup {
  format: typeof MAGIC_CRM_BACKUP_FORMAT;
  version: typeof MAGIC_CRM_BACKUP_VERSION;
  exportedAt: string;
  summary: {
    totalStores: number;
  };
  stores: Record<string, StorageValue>;
}

export interface RestoreBackupResult {
  mode: "full" | "legacy";
  restoredKeys: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function listMagicCrmKeys(storage: Storage): string[] {
  return Object.keys(storage)
    .filter((key) => key.startsWith(MAGIC_CRM_STORAGE_PREFIX))
    .sort();
}

function parseStorageValue(raw: string): StorageValue {
  try {
    return JSON.parse(raw) as StorageValue;
  } catch {
    return raw;
  }
}

function serializeStorageValue(value: StorageValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function getNextSequence(items: unknown[], prefix: string, fallback: number): number {
  const maxNumber = items.reduce<number>((max, item) => {
    if (!isRecord(item) || typeof item.number !== "string") {
      return max;
    }

    const match = item.number.match(new RegExp(`^${prefix}(\\d+)$`));
    const numeric = match ? Number(match[1]) : Number.NaN;
    if (!Number.isFinite(numeric)) {
      return max;
    }

    return Math.max(max, numeric);
  }, fallback - 1);

  return maxNumber + 1;
}

function buildLegacyStores(value: unknown): Record<string, StorageValue> | null {
  if (!isRecord(value)) return null;

  const stores: Record<string, StorageValue> = {};

  if (Array.isArray(value.clients)) {
    stores["magic-crm-clients"] = {
      state: {
        clients: value.clients,
      },
      version: 1,
    };
  }

  if (Array.isArray(value.leads)) {
    stores["magic-crm-leads"] = {
      state: {
        leads: value.leads,
      },
      version: 0,
    };
  }

  if (Array.isArray(value.jobs)) {
    stores["magic-crm-jobs"] = {
      state: {
        jobs: value.jobs,
      },
      version: 0,
    };
  }

  if (Array.isArray(value.invoices) || Array.isArray(value.quotes)) {
    const invoices = Array.isArray(value.invoices) ? value.invoices : [];
    const quotes = Array.isArray(value.quotes) ? value.quotes : [];
    stores["magic-crm-invoices"] = {
      state: {
        invoices,
        quotes,
        nextInvoiceNum: getNextSequence(invoices, "INV-", 1001),
        nextQuoteNum: getNextSequence(quotes, "QT-", 1),
      },
      version: 1,
    };
  }

  if (Array.isArray(value.payments)) {
    stores["magic-crm-payments"] = {
      state: {
        payments: value.payments,
      },
      version: 0,
    };
  }

  if (Array.isArray(value.bookings)) {
    stores["magic-crm-bookings"] = {
      state: {
        bookings: value.bookings,
        availability: DEFAULT_AVAILABILITY,
        cancellationPolicy: "",
      },
      version: 2,
    };
  }

  if (Array.isArray(value.activities)) {
    stores["magic-crm-activity"] = {
      state: {
        entries: value.activities,
      },
      version: 0,
    };
  }

  if (Array.isArray(value.automations)) {
    stores["magic-crm-automations"] = {
      state: {
        rules: value.automations,
      },
      version: 0,
    };
  }

  return Object.keys(stores).length > 0 ? stores : null;
}

function isFullBackup(value: unknown): value is MagicCrmLocalBackup {
  return (
    isRecord(value) &&
    value.format === MAGIC_CRM_BACKUP_FORMAT &&
    value.version === MAGIC_CRM_BACKUP_VERSION &&
    isRecord(value.stores)
  );
}

export function createMagicCrmLocalBackup(storage: Storage): MagicCrmLocalBackup {
  const keys = listMagicCrmKeys(storage);
  const stores = Object.fromEntries(
    keys.map((key) => [key, parseStorageValue(storage.getItem(key) ?? "")])
  );

  return {
    format: MAGIC_CRM_BACKUP_FORMAT,
    version: MAGIC_CRM_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    summary: {
      totalStores: keys.length,
    },
    stores,
  };
}

export function clearMagicCrmLocalData(storage: Storage): void {
  listMagicCrmKeys(storage).forEach((key) => storage.removeItem(key));
}

export function restoreMagicCrmBackup(storage: Storage, value: unknown): RestoreBackupResult {
  if (isFullBackup(value)) {
    clearMagicCrmLocalData(storage);
    Object.entries(value.stores).forEach(([key, storageValue]) => {
      storage.setItem(key, serializeStorageValue(storageValue));
    });
    return {
      mode: "full",
      restoredKeys: Object.keys(value.stores),
    };
  }

  const legacyStores = buildLegacyStores(value);
  if (legacyStores) {
    Object.entries(legacyStores).forEach(([key, storageValue]) => {
      storage.setItem(key, serializeStorageValue(storageValue));
    });
    return {
      mode: "legacy",
      restoredKeys: Object.keys(legacyStores),
    };
  }

  throw new Error("Unsupported backup format");
}
