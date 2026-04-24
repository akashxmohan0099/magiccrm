"use client";

import { useState, useCallback, useMemo } from "react";
import { Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  parseCSV,
  detectSource,
  buildDefaultMappings,
  transformClientRows,
  transformServiceRows,
  CLIENT_TARGET_FIELDS,
  SERVICE_TARGET_FIELDS,
  type ColumnMapping,
  type ImportType,
  type ImportSource,
  type ImportedClient,
  type ImportedService,
} from "@/lib/csv-import";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CSVImportWizardProps {
  open: boolean;
  onClose: () => void;
  type: ImportType;
  onImportClients?: (clients: ImportedClient[]) => void;
  onImportServices?: (services: ImportedService[]) => void;
}

type Step = "upload" | "mapping" | "preview" | "done";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CSVImportWizard({ open, onClose, type, onImportClients, onImportServices }: CSVImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [source, setSource] = useState<ImportSource>("generic");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  // Preview / import results
  const [importedClients, setImportedClients] = useState<ImportedClient[]>([]);
  const [importedServices, setImportedServices] = useState<ImportedService[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const targetFields = type === "clients" ? CLIENT_TARGET_FIELDS : SERVICE_TARGET_FIELDS;

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setSource("generic");
    setMappings([]);
    setError("");
    setImportedClients([]);
    setImportedServices([]);
    setSkippedCount(0);
    setImportErrors([]);
    setImportedCount(0);
  }, []);

  // ---- File handling ----

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a .csv file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File too large (max 10MB)");
        return;
      }

      setError("");
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") return;

        const { headers: h, rows: r } = parseCSV(text);
        if (h.length === 0 || r.length === 0) {
          setError("CSV appears to be empty or malformed");
          return;
        }

        const detected = detectSource(h);
        const defaultMappings = buildDefaultMappings(h, type);

        setHeaders(h);
        setRows(r);
        setSource(detected);
        setMappings(defaultMappings);
        setStep("mapping");
      };
      reader.onerror = () => setError("Failed to read file");
      reader.readAsText(file);
    },
    [type],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  // ---- Mapping changes ----

  const updateMapping = useCallback((csvColumn: string, targetField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, targetField } : m)),
    );
  }, []);

  const mappedFieldCount = useMemo(
    () => mappings.filter((m) => m.targetField !== "skip").length,
    [mappings],
  );

  // ---- Preview / transform ----

  const handlePreview = useCallback(() => {
    if (type === "clients") {
      const { valid, skipped, errors } = transformClientRows(rows, headers, mappings);
      setImportedClients(valid);
      setSkippedCount(skipped);
      setImportErrors(errors);
    } else {
      const { valid, skipped, errors } = transformServiceRows(rows, headers, mappings);
      setImportedServices(valid);
      setSkippedCount(skipped);
      setImportErrors(errors);
    }
    setStep("preview");
  }, [type, rows, headers, mappings]);

  // ---- Import ----

  const handleImport = useCallback(() => {
    if (type === "clients" && onImportClients) {
      onImportClients(importedClients);
      setImportedCount(importedClients.length);
    } else if (type === "services" && onImportServices) {
      onImportServices(importedServices);
      setImportedCount(importedServices.length);
    }
    setStep("done");
  }, [type, onImportClients, onImportServices, importedClients, importedServices]);

  const previewItems = type === "clients" ? importedClients : importedServices;

  // ---- Source label ----
  const sourceLabel = source === "fresha" ? "Fresha" : source === "timely" ? "Timely" : "CSV";

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={`Import ${type === "clients" ? "Clients" : "Services"}`}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-[11px] font-medium text-text-tertiary">
          {(["upload", "mapping", "preview", "done"] as Step[]).map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border-light">/</span>}
              <span className={step === s ? "text-foreground font-semibold" : ""}>
                {s === "upload" ? "Upload" : s === "mapping" ? "Map Columns" : s === "preview" ? "Preview" : "Done"}
              </span>
            </span>
          ))}
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === "upload" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border-light"
            }`}
          >
            <Upload className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-[13px] font-medium text-foreground mb-1">
              Drop your CSV file here
            </p>
            <p className="text-[11px] text-text-tertiary mb-4">
              Supports exports from Fresha, Timely, or any CSV with headers
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
              <FileSpreadsheet className="w-4 h-4" />
              Choose File
              <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </label>

            {error && (
              <p className="mt-3 text-[12px] text-red-600 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Column Mapping ── */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">{fileName}</p>
                <p className="text-[11px] text-text-tertiary">
                  {rows.length} rows detected &middot; Format: {sourceLabel}
                </p>
              </div>
              <span className="text-[11px] font-medium text-primary">{mappedFieldCount} fields mapped</span>
            </div>

            <div className="border border-border-light rounded-xl overflow-hidden divide-y divide-border-light">
              {mappings.map((m) => (
                <div key={m.csvColumn} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-[12px] text-text-secondary w-1/3 truncate font-mono">{m.csvColumn}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                  <select
                    value={m.targetField}
                    onChange={(e) => updateMapping(m.csvColumn, e.target.value)}
                    className="flex-1 text-[12px] px-2 py-1.5 bg-surface border border-border-light rounded-lg text-foreground outline-none cursor-pointer"
                  >
                    {targetFields.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Sample data preview */}
            {rows.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-text-tertiary mb-1.5">Sample row:</p>
                <div className="bg-surface rounded-lg px-3 py-2 text-[11px] text-text-secondary font-mono overflow-x-auto whitespace-nowrap">
                  {headers.map((h, i) => (
                    <span key={h}>
                      {i > 0 && <span className="text-text-tertiary mx-1">|</span>}
                      <span className="text-foreground">{rows[0]?.[i] || ""}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { reset(); }} className="flex-1">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePreview}
                disabled={mappedFieldCount === 0}
                className="flex-1"
              >
                Preview Import <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <Check className="w-3.5 h-3.5" /> {previewItems.length} ready to import
              </span>
              {skippedCount > 0 && (
                <span className="text-text-tertiary">{skippedCount} skipped (missing name)</span>
              )}
            </div>

            {importErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-0.5">
                <p className="text-[11px] font-medium text-amber-800">Warnings ({importErrors.length})</p>
                {importErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-[11px] text-amber-700">{err}</p>
                ))}
                {importErrors.length > 5 && (
                  <p className="text-[11px] text-amber-600">...and {importErrors.length - 5} more</p>
                )}
              </div>
            )}

            {/* Preview table */}
            <div className="border border-border-light rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-[11px]">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      {type === "clients" ? (
                        <>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Name</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Email</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Phone</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Source</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Name</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Price</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Duration</th>
                          <th className="text-left px-3 py-2 font-semibold text-text-secondary">Category</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {(type === "clients" ? importedClients : importedServices).slice(0, 50).map((item, i) => (
                      <tr key={i} className="hover:bg-surface/50">
                        {type === "clients" ? (
                          <>
                            <td className="px-3 py-2 text-foreground font-medium">{(item as ImportedClient).name}</td>
                            <td className="px-3 py-2 text-text-secondary">{(item as ImportedClient).email || "—"}</td>
                            <td className="px-3 py-2 text-text-secondary">{(item as ImportedClient).phone || "—"}</td>
                            <td className="px-3 py-2 text-text-tertiary">{(item as ImportedClient).source || "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-foreground font-medium">{(item as ImportedService).name}</td>
                            <td className="px-3 py-2 text-text-secondary">${(item as ImportedService).price}</td>
                            <td className="px-3 py-2 text-text-secondary">{(item as ImportedService).duration}m</td>
                            <td className="px-3 py-2 text-text-tertiary">{(item as ImportedService).category}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewItems.length > 50 && (
                  <p className="text-center text-[11px] text-text-tertiary py-2 bg-surface">
                    Showing first 50 of {previewItems.length} rows
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStep("mapping")} className="flex-1">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              <Button variant="primary" size="sm" onClick={handleImport} disabled={previewItems.length === 0} className="flex-1">
                Import {previewItems.length} {type === "clients" ? "Clients" : "Services"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-[16px] font-bold text-foreground mb-1">Import Complete</h3>
            <p className="text-[13px] text-text-secondary">
              Successfully imported {importedCount} {type === "clients" ? "clients" : "services"} from {sourceLabel}.
            </p>
            {skippedCount > 0 && (
              <p className="text-[12px] text-text-tertiary mt-1">{skippedCount} rows skipped (missing required data).</p>
            )}
            <Button variant="primary" size="sm" onClick={() => { reset(); onClose(); }} className="mt-4">
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
