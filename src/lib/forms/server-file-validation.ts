// Server-side file validation for public form submissions. Two layers of
// defence: per-field operator rules (configured in the form editor) and
// hard global caps that protect form_responses.values from abuse even when
// the operator picks generous per-field rules. Files travel as JSON-encoded
// base64 inside `values[name]` — the renderer caps client-side, but the
// public API is reachable directly so we re-validate everything here.

export const SERVER_MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB per file
export const SERVER_MAX_FILES_PER_FIELD = 10;
export const SERVER_MAX_TOTAL_PAYLOAD_BYTES = 50 * 1024 * 1024; // 50MB total

export interface UploadedFileShape {
  name?: unknown;
  type?: unknown;
  dataUrl?: unknown;
}

export interface FileFieldShape {
  name: string;
  type: string;
  label?: string;
  multipleFiles?: boolean;
  maxFileSizeMb?: number;
  maxFiles?: number;
  acceptedFileTypes?: string;
}

/**
 * accept-attribute parser matching the renderer. Comma-separated MIME types
 * (image/*, application/pdf) or extensions (.pdf, .jpg). Returns true when
 * the file passes the configured filter, OR when no filter is set.
 */
export function fileMatchesAccept(
  accepted: string | undefined,
  fileType: string,
  fileName: string,
): boolean {
  if (!accepted || !accepted.trim()) return true;
  const tokens = accepted
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const lowerType = (fileType || "").toLowerCase();
  const lowerName = (fileName || "").toLowerCase();
  for (const token of tokens) {
    if (token.startsWith(".")) {
      if (lowerName.endsWith(token)) return true;
      continue;
    }
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1); // keeps trailing slash for "image/"
      if (lowerType.startsWith(prefix)) return true;
      continue;
    }
    if (lowerType === token) return true;
  }
  return false;
}

/**
 * Validate every file-typed field's payload before we touch the DB.
 * Returns an error message string on the first violation, or null if all good.
 */
export function validateFileFields(
  fields: FileFieldShape[],
  values: Record<string, string>,
): string | null {
  let totalBytes = 0;
  for (const field of fields) {
    if (field.type !== "file") continue;
    const raw = values[field.name];
    if (!raw) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return `Invalid file payload for "${field.label ?? field.name}".`;
    }
    if (!Array.isArray(parsed)) {
      return `Invalid file payload for "${field.label ?? field.name}".`;
    }

    // Per-field count rules first — operator's configured limit wins, falls
    // back to global cap. multipleFiles=false enforces a hard 1.
    const fieldMaxFiles = field.multipleFiles
      ? Math.min(field.maxFiles ?? SERVER_MAX_FILES_PER_FIELD, SERVER_MAX_FILES_PER_FIELD)
      : 1;
    if (parsed.length > fieldMaxFiles) {
      return `"${field.label ?? field.name}" allows up to ${fieldMaxFiles} file${
        fieldMaxFiles === 1 ? "" : "s"
      }.`;
    }

    // Per-field size cap — operator's value (in MB) wins, capped by global.
    const fieldCapBytes = Math.min(
      (field.maxFileSizeMb ?? 5) * 1024 * 1024,
      SERVER_MAX_FILE_BYTES,
    );

    for (const f of parsed as UploadedFileShape[]) {
      if (typeof f?.dataUrl !== "string") {
        return `Invalid file entry in "${field.label ?? field.name}".`;
      }
      // Base64 dataUrl is roughly (len * 3/4) bytes after the comma. Cheap
      // approximation; we don't need to actually decode for a size check.
      const commaIdx = f.dataUrl.indexOf(",");
      const base64Len =
        commaIdx >= 0 ? f.dataUrl.length - commaIdx - 1 : f.dataUrl.length;
      const approxBytes = Math.floor((base64Len * 3) / 4);
      if (approxBytes > fieldCapBytes) {
        const mb = Math.round(fieldCapBytes / (1024 * 1024));
        return `A file in "${field.label ?? field.name}" exceeds the ${mb}MB limit.`;
      }

      // Type whitelist. Keep generous: missing fields' acceptedFileTypes
      // mean "any". The renderer uses the same accept-attribute syntax.
      const fileType = typeof f.type === "string" ? f.type : "";
      const fileName = typeof f.name === "string" ? f.name : "";
      if (!fileMatchesAccept(field.acceptedFileTypes, fileType, fileName)) {
        return `"${fileName || "file"}" isn't an accepted type for "${
          field.label ?? field.name
        }".`;
      }

      totalBytes += approxBytes;
      if (totalBytes > SERVER_MAX_TOTAL_PAYLOAD_BYTES) {
        return "Total upload size exceeds limit.";
      }
    }
  }
  return null;
}
