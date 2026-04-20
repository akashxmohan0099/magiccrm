/**
 * CSV Import utilities for migrating data from Fresha, Timely, and generic CSVs.
 *
 * Supports:
 *  - Automatic format detection (Fresha vs Timely vs generic)
 *  - Column mapping with smart defaults
 *  - Preview and validation before commit
 */

// ---------------------------------------------------------------------------
// CSV Parser (handles quoted fields, newlines in quotes, BOM)
// ---------------------------------------------------------------------------

export function parseCSV(raw: string): { headers: string[]; rows: string[][] } {
  // Strip BOM
  const text = raw.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        current.push(field.trim());
        if (current.some((c) => c !== "")) rows.push(current);
        current = [];
        field = "";
        if (ch === "\r") i++; // skip \n after \r
      } else {
        field += ch;
      }
    }
  }

  // Last field/row
  current.push(field.trim());
  if (current.some((c) => c !== "")) rows.push(current);

  if (rows.length === 0) return { headers: [], rows: [] };

  const headers = rows[0];
  return { headers, rows: rows.slice(1) };
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

export type ImportSource = "fresha" | "timely" | "generic";

const FRESHA_CLIENT_SIGNALS = ["first name", "last name", "mobile", "date of birth"];
const TIMELY_CLIENT_SIGNALS = ["client_name", "client_email", "client_phone"];
const FRESHA_SERVICE_SIGNALS = ["service name", "sale price", "duration"];
const TIMELY_SERVICE_SIGNALS = ["service_name", "duration_minutes", "base_price"];

export function detectSource(headers: string[]): ImportSource {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const freshaClientHits = FRESHA_CLIENT_SIGNALS.filter((s) => lower.includes(s)).length;
  const timelyClientHits = TIMELY_CLIENT_SIGNALS.filter((s) => lower.includes(s)).length;
  const freshaServiceHits = FRESHA_SERVICE_SIGNALS.filter((s) => lower.includes(s)).length;
  const timelyServiceHits = TIMELY_SERVICE_SIGNALS.filter((s) => lower.includes(s)).length;

  const freshaTotal = freshaClientHits + freshaServiceHits;
  const timelyTotal = timelyClientHits + timelyServiceHits;

  if (freshaTotal >= 2) return "fresha";
  if (timelyTotal >= 2) return "timely";
  return "generic";
}

// ---------------------------------------------------------------------------
// Column mapping
// ---------------------------------------------------------------------------

export type ImportType = "clients" | "services";

export interface ColumnMapping {
  /** CSV header name */
  csvColumn: string;
  /** Target field in our system (or "skip") */
  targetField: string;
}

/** Fields available for client import */
export const CLIENT_TARGET_FIELDS = [
  { value: "skip", label: "Skip this column" },
  { value: "name", label: "Full Name" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "notes", label: "Notes" },
  { value: "birthday", label: "Birthday" },
  { value: "medicalAlerts", label: "Medical Alerts" },
  { value: "source", label: "Source" },
  { value: "addressStreet", label: "Street Address" },
  { value: "addressSuburb", label: "Suburb" },
  { value: "addressPostcode", label: "Postcode" },
  { value: "addressState", label: "State" },
] as const;

/** Fields available for service import */
export const SERVICE_TARGET_FIELDS = [
  { value: "skip", label: "Skip this column" },
  { value: "name", label: "Service Name" },
  { value: "description", label: "Description" },
  { value: "price", label: "Price" },
  { value: "duration", label: "Duration (minutes)" },
  { value: "category", label: "Category" },
] as const;

type FieldMapping = Record<string, string>;

/** Smart defaults: map CSV header to our field based on common naming. */
function guessField(header: string, type: ImportType): string {
  const h = header.toLowerCase().trim().replace(/[_\-\s]+/g, " ");

  if (type === "clients") {
    const map: FieldMapping = {
      "name": "name",
      "full name": "name",
      "client name": "name",
      "client_name": "name",
      "first name": "firstName",
      "firstname": "firstName",
      "last name": "lastName",
      "lastname": "lastName",
      "surname": "lastName",
      "email": "email",
      "email address": "email",
      "client email": "email",
      "client_email": "email",
      "phone": "phone",
      "phone number": "phone",
      "mobile": "phone",
      "mobile number": "phone",
      "cell": "phone",
      "client phone": "phone",
      "client_phone": "phone",
      "contact phone": "phone",
      "notes": "notes",
      "client notes": "notes",
      "birthday": "birthday",
      "date of birth": "birthday",
      "dob": "birthday",
      "birth date": "birthday",
      "medical alerts": "medicalAlerts",
      "medical notes": "medicalAlerts",
      "allergies": "medicalAlerts",
      "source": "source",
      "referral source": "source",
      "how did you hear": "source",
      "address": "addressStreet",
      "street": "addressStreet",
      "street address": "addressStreet",
      "address street": "addressStreet",
      "suburb": "addressSuburb",
      "city": "addressSuburb",
      "town": "addressSuburb",
      "postcode": "addressPostcode",
      "zip": "addressPostcode",
      "zip code": "addressPostcode",
      "postal code": "addressPostcode",
      "state": "addressState",
      "region": "addressState",
    };
    return map[h] || "skip";
  }

  // services
  const map: FieldMapping = {
    "name": "name",
    "service name": "name",
    "service_name": "name",
    "service": "name",
    "title": "name",
    "description": "description",
    "service description": "description",
    "price": "price",
    "sale price": "price",
    "base price": "price",
    "base_price": "price",
    "cost": "price",
    "amount": "price",
    "duration": "duration",
    "duration minutes": "duration",
    "duration_minutes": "duration",
    "time": "duration",
    "length": "duration",
    "category": "category",
    "service category": "category",
    "group": "category",
    "type": "category",
  };
  return map[h] || "skip";
}

export function buildDefaultMappings(headers: string[], type: ImportType): ColumnMapping[] {
  return headers.map((csvColumn) => ({
    csvColumn,
    targetField: guessField(csvColumn, type),
  }));
}

// ---------------------------------------------------------------------------
// Row transformation
// ---------------------------------------------------------------------------

export interface ImportedClient {
  name: string;
  email: string;
  phone: string;
  notes: string;
  birthday?: string;
  medicalAlerts?: string;
  source?: string;
  addressStreet?: string;
  addressSuburb?: string;
  addressPostcode?: string;
  addressState?: string;
}

export interface ImportedService {
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

function normalizePhone(raw: string): string {
  // Strip spaces, dashes, parens
  let p = raw.replace(/[\s\-()]/g, "");
  // Convert AU local format to international
  if (p.startsWith("04") && p.length === 10) p = "+61" + p.slice(1);
  return p;
}

function normalizeBirthday(raw: string): string | undefined {
  if (!raw) return undefined;
  // Try common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) return raw;

  const slashMatch = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    // Assume DD/MM/YYYY (AU format)
    const mm = b.padStart(2, "0");
    const dd = a.padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  return undefined;
}

export function transformClientRows(
  rows: string[][],
  headers: string[],
  mappings: ColumnMapping[],
): { valid: ImportedClient[]; skipped: number; errors: string[] } {
  const valid: ImportedClient[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const fieldIndex = new Map<string, number>();
  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    const idx = headers.indexOf(m.csvColumn);
    if (idx >= 0) fieldIndex.set(m.targetField, idx);
  }

  for (let rowNum = 0; rowNum < rows.length; rowNum++) {
    const row = rows[rowNum];
    const get = (field: string) => (fieldIndex.has(field) ? (row[fieldIndex.get(field)!] || "") : "");

    let name = get("name");
    const firstName = get("firstName");
    const lastName = get("lastName");

    // Merge first + last if no full name
    if (!name && (firstName || lastName)) {
      name = [firstName, lastName].filter(Boolean).join(" ");
    }

    if (!name.trim()) {
      skipped++;
      continue;
    }

    const email = get("email").toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${rowNum + 2}: Invalid email "${email}" for ${name}`);
    }

    valid.push({
      name: name.trim(),
      email,
      phone: normalizePhone(get("phone")),
      notes: get("notes"),
      birthday: normalizeBirthday(get("birthday")),
      medicalAlerts: get("medicalAlerts") || undefined,
      source: get("source") || "csv-import",
      addressStreet: get("addressStreet") || undefined,
      addressSuburb: get("addressSuburb") || undefined,
      addressPostcode: get("addressPostcode") || undefined,
      addressState: get("addressState") || undefined,
    });
  }

  return { valid, skipped, errors };
}

export function transformServiceRows(
  rows: string[][],
  headers: string[],
  mappings: ColumnMapping[],
): { valid: ImportedService[]; skipped: number; errors: string[] } {
  const valid: ImportedService[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const fieldIndex = new Map<string, number>();
  for (const m of mappings) {
    if (m.targetField === "skip") continue;
    const idx = headers.indexOf(m.csvColumn);
    if (idx >= 0) fieldIndex.set(m.targetField, idx);
  }

  for (let rowNum = 0; rowNum < rows.length; rowNum++) {
    const row = rows[rowNum];
    const get = (field: string) => (fieldIndex.has(field) ? (row[fieldIndex.get(field)!] || "") : "");

    const name = get("name").trim();
    if (!name) { skipped++; continue; }

    const rawPrice = get("price").replace(/[^0-9.]/g, "");
    const price = parseFloat(rawPrice) || 0;

    const rawDuration = get("duration").replace(/[^0-9]/g, "");
    const duration = parseInt(rawDuration) || 60;

    valid.push({
      name,
      description: get("description"),
      price,
      duration,
      category: get("category") || "Imported",
    });
  }

  return { valid, skipped, errors };
}
