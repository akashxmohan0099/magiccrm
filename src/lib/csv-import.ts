// ── CSV Import Utilities ────────────────────────────────────

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  transform?: "none" | "trim" | "lowercase";
}

export interface ImportTarget {
  id: "clients" | "leads" | "products";
  label: string;
  requiredFields: string[];
  optionalFields: string[];
  fieldLabels: Record<string, string>;
}

export const IMPORT_TARGETS: ImportTarget[] = [
  {
    id: "clients",
    label: "Clients",
    requiredFields: ["name"],
    optionalFields: ["email", "phone", "company", "address", "tags", "notes", "source", "status"],
    fieldLabels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      address: "Address",
      tags: "Tags",
      notes: "Notes",
      source: "Source",
      status: "Status",
    },
  },
  {
    id: "leads",
    label: "Leads",
    requiredFields: ["name"],
    optionalFields: ["email", "phone", "company", "source", "stage", "value", "notes"],
    fieldLabels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      source: "Source",
      stage: "Stage",
      value: "Value",
      notes: "Notes",
    },
  },
  {
    id: "products",
    label: "Products",
    requiredFields: ["name", "price"],
    optionalFields: ["description", "category", "sku", "quantity"],
    fieldLabels: {
      name: "Name",
      price: "Price",
      description: "Description",
      category: "Category",
      sku: "SKU",
      quantity: "Stock Quantity",
    },
  },
];

// ── CSV Parser ──────────────────────────────────────────────

function parseCSVRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  cells.push(current);
  return cells;
}

export function parseCSV(text: string): CSVParseResult {
  // Normalize line endings and handle quoted fields with newlines
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into logical lines, respecting quoted fields that may contain newlines
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      currentLine += ch;
    } else if (ch === "\n" && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += ch;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], rowCount: 0 };
  }

  const headers = parseCSVRow(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => parseCSVRow(line));

  return { headers, rows, rowCount: rows.length };
}

// ── Auto Column Mapping ─────────────────────────────────────

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "fullname", "client name", "customer name", "contact name", "lead name", "product name", "first name", "display name"],
  email: ["email", "e-mail", "email address", "e-mail address", "mail"],
  phone: ["phone", "phone number", "telephone", "tel", "mobile", "cell", "contact number"],
  company: ["company", "company name", "organization", "organisation", "business", "business name"],
  address: ["address", "street address", "location", "street"],
  tags: ["tags", "labels", "categories", "groups"],
  notes: ["notes", "note", "comments", "description", "memo"],
  source: ["source", "lead source", "referral source", "how found", "channel"],
  status: ["status", "client status", "state"],
  stage: ["stage", "pipeline stage", "lead stage", "deal stage"],
  value: ["value", "deal value", "amount", "revenue", "worth"],
  price: ["price", "cost", "unit price", "rate", "amount"],
  description: ["description", "desc", "details", "summary", "about"],
  category: ["category", "type", "product category", "group"],
  sku: ["sku", "product code", "item code", "part number", "barcode"],
  quantity: ["quantity", "stock", "stock quantity", "qty", "inventory", "count", "units"],
};

export function autoMapColumns(headers: string[], target: ImportTarget): ColumnMapping[] {
  const allFields = [...target.requiredFields, ...target.optionalFields];

  return headers.map((header) => {
    const normalizedHeader = header.toLowerCase().trim();

    // Try to find a matching field
    let matchedField = "";
    for (const field of allFields) {
      const aliases = FIELD_ALIASES[field] || [field];
      if (aliases.some((alias) => alias === normalizedHeader)) {
        matchedField = field;
        break;
      }
    }

    // Fallback: try partial matching
    if (!matchedField) {
      for (const field of allFields) {
        const aliases = FIELD_ALIASES[field] || [field];
        if (aliases.some((alias) => normalizedHeader.includes(alias) || alias.includes(normalizedHeader))) {
          matchedField = field;
          break;
        }
      }
    }

    return {
      csvColumn: header,
      targetField: matchedField || "__skip__",
      transform: "trim" as const,
    };
  });
}

// ── Row Validation ──────────────────────────────────────────

export function validateRow(row: Record<string, string>, target: ImportTarget): string[] {
  const errors: string[] = [];

  for (const field of target.requiredFields) {
    const value = row[field];
    if (!value || !value.trim()) {
      errors.push(`Missing required field: ${target.fieldLabels[field] || field}`);
    }
  }

  // Type-specific validations
  if (target.id === "products" && row.price) {
    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
      errors.push("Price must be a valid positive number");
    }
  }

  if (target.id === "leads" && row.value) {
    const value = parseFloat(row.value);
    if (isNaN(value)) {
      errors.push("Value must be a valid number");
    }
  }

  if (row.email && row.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
    errors.push("Invalid email format");
  }

  return errors;
}

// ── Transform Helper ────────────────────────────────────────

export function applyTransform(value: string, transform: ColumnMapping["transform"]): string {
  if (!value) return value;
  switch (transform) {
    case "trim":
      return value.trim();
    case "lowercase":
      return value.toLowerCase().trim();
    default:
      return value;
  }
}
