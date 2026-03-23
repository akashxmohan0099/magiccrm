"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Upload, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import {
  parseCSV,
  autoMapColumns,
  validateRow,
  applyTransform,
  IMPORT_TARGETS,
  CSVParseResult,
  ColumnMapping,
} from "@/lib/csv-import";
import { useClientsStore } from "@/store/clients";
import { useLeadsStore } from "@/store/leads";
import { useProductsStore } from "@/store/products";
import { useAuth } from "@/hooks/useAuth";

interface CSVImportWizardProps {
  open: boolean;
  onClose: () => void;
  defaultTarget?: "clients" | "leads" | "products";
}

type WizardStep = 1 | 2 | 3;

export function CSVImportWizard({ open, onClose, defaultTarget }: CSVImportWizardProps) {
  const { workspaceId } = useAuth();
  const [step, setStep] = useState<WizardStep>(1);
  const [targetId, setTargetId] = useState<string>(defaultTarget || "");
  const [csvData, setCsvData] = useState<CSVParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const target = IMPORT_TARGETS.find((t) => t.id === targetId);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep(1);
    setTargetId(defaultTarget || "");
    setCsvData(null);
    setFileName("");
    setMappings([]);
    setImporting(false);
    setImportProgress(0);
    setImportComplete(false);
    setImportedCount(0);
    setErrorCount(0);
    onClose();
  }, [onClose, defaultTarget]);

  // ── Step 1: File Upload ───────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseCSV(text);
      setCsvData(result);
    };
    reader.readAsText(file);
  }, []);

  const canProceedStep1 = csvData && csvData.rowCount > 0 && targetId;

  const goToStep2 = useCallback(() => {
    if (!csvData || !target) return;
    const autoMapped = autoMapColumns(csvData.headers, target);
    setMappings(autoMapped);
    setStep(2);
  }, [csvData, target]);

  // ── Step 2: Column Mapping ────────────────────────────────

  const handleMappingChange = useCallback((csvColumn: string, targetField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, targetField } : m))
    );
  }, []);

  const allFields = useMemo(() => {
    if (!target) return [];
    return [...target.requiredFields, ...target.optionalFields];
  }, [target]);

  const requiredFieldsMapped = useMemo(() => {
    if (!target) return false;
    return target.requiredFields.every((field) =>
      mappings.some((m) => m.targetField === field)
    );
  }, [target, mappings]);

  // ── Step 3: Preview & Import ──────────────────────────────

  const previewRows = useMemo(() => {
    if (!csvData || !target) return [];

    return csvData.rows.slice(0, 5).map((row) => {
      const mapped: Record<string, string> = {};
      mappings.forEach((m, idx) => {
        if (m.targetField !== "__skip__" && row[idx] !== undefined) {
          mapped[m.targetField] = applyTransform(row[idx], m.transform);
        }
      });
      const errors = validateRow(mapped, target);
      return { data: mapped, errors };
    });
  }, [csvData, mappings, target]);

  const totalStats = useMemo(() => {
    if (!csvData || !target) return { ready: 0, withErrors: 0 };

    let ready = 0;
    let withErrors = 0;
    csvData.rows.forEach((row) => {
      const mapped: Record<string, string> = {};
      mappings.forEach((m, idx) => {
        if (m.targetField !== "__skip__" && row[idx] !== undefined) {
          mapped[m.targetField] = applyTransform(row[idx], m.transform);
        }
      });
      const errors = validateRow(mapped, target);
      if (errors.length === 0) ready++;
      else withErrors++;
    });
    return { ready, withErrors };
  }, [csvData, mappings, target]);

  const handleImport = useCallback(async () => {
    if (!csvData || !target) return;

    setImporting(true);
    setImportProgress(0);

    const validRows: Record<string, string>[] = [];
    csvData.rows.forEach((row) => {
      const mapped: Record<string, string> = {};
      mappings.forEach((m, idx) => {
        if (m.targetField !== "__skip__" && row[idx] !== undefined) {
          mapped[m.targetField] = applyTransform(row[idx], m.transform);
        }
      });
      const errors = validateRow(mapped, target);
      if (errors.length === 0) validRows.push(mapped);
    });

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        if (target.id === "clients") {
          useClientsStore.getState().addClient({
            name: row.name || "",
            email: row.email || "",
            phone: row.phone || "",
            company: row.company,
            address: row.address,
            tags: row.tags ? row.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [],
            notes: row.notes || "",
            source: (["referral", "website", "social", "other"].includes(row.source || "") ? row.source : undefined) as "referral" | "website" | "social" | "other" | undefined,
            status: (["active", "inactive", "prospect"].includes(row.status || "") ? row.status : "active") as "active" | "inactive" | "prospect",
          }, workspaceId ?? undefined);
        } else if (target.id === "leads") {
          useLeadsStore.getState().addLead({
            name: row.name || "",
            email: row.email || "",
            phone: row.phone || "",
            company: row.company,
            source: row.source,
            stage: row.stage || "new",
            value: row.value ? parseFloat(row.value) : undefined,
            notes: row.notes || "",
          }, workspaceId ?? undefined);
        } else if (target.id === "products") {
          useProductsStore.getState().addProduct({
            name: row.name || "",
            description: row.description || "",
            price: parseFloat(row.price) || 0,
            category: row.category || "General",
            sku: row.sku,
            inStock: true,
            quantity: row.quantity ? parseInt(row.quantity, 10) : undefined,
          }, workspaceId ?? undefined);
        }
        imported++;
      } catch {
        errors++;
      }

      // Update progress
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));

      // Yield to UI every 50 rows
      if (i % 50 === 0 && i > 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    setImportedCount(imported);
    setErrorCount(errors);
    setImporting(false);
    setImportComplete(true);
    toast(`Successfully imported ${imported} ${target.label.toLowerCase()}`, "success");
  }, [csvData, mappings, target, workspaceId]);

  // ── Step Indicator ────────────────────────────────────────

  const stepLabels = ["Upload", "Map Columns", "Import"];

  return (
    <Modal open={open} onClose={importing ? () => {} : handleClose} title="Import from CSV">
      <div className="-mx-6 -mb-6">
        {/* Wide modal override */}
        <style>{`
          [role="dialog"]:has([data-csv-wizard]) {
            max-width: 48rem !important;
          }
        `}</style>
        <div data-csv-wizard>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 px-6 pb-4">
            {stepLabels.map((label, idx) => {
              const stepNum = (idx + 1) as WizardStep;
              const isActive = step === stepNum;
              const isDone = step > stepNum || importComplete;
              return (
                <div key={label} className="flex items-center gap-2">
                  {idx > 0 && (
                    <div className={`w-8 h-px ${isDone || isActive ? "bg-accent" : "bg-border-light"}`} />
                  )}
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isActive
                          ? "bg-accent text-white"
                          : "bg-surface text-text-tertiary border border-border-light"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
                    </div>
                    <span
                      className={`text-[12px] font-medium ${
                        isActive ? "text-foreground" : "text-text-tertiary"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border-light" />

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-5"
              >
                {/* Target selection */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Import into
                  </label>
                  <div className="flex gap-2">
                    {IMPORT_TARGETS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTargetId(t.id)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-[13px] font-medium transition-all cursor-pointer ${
                          targetId === t.id
                            ? "border-accent bg-accent/5 text-accent"
                            : "border-border-light text-text-secondary hover:border-text-tertiary"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    CSV File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {!csvData ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border-light rounded-xl p-8 flex flex-col items-center gap-2 hover:border-accent/40 hover:bg-accent/3 transition-colors cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-text-tertiary" />
                      <span className="text-[13px] font-medium text-text-secondary">
                        Click to upload a CSV file
                      </span>
                      <span className="text-[11px] text-text-tertiary">
                        .csv files accepted
                      </span>
                    </button>
                  ) : (
                    <div className="border border-border-light rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">
                          {fileName}
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          {csvData.rowCount} rows &middot; {csvData.headers.length} columns
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCsvData(null);
                          setFileName("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1 rounded-md hover:bg-surface text-text-tertiary cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={goToStep2}
                    disabled={!canProceedStep1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && target && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                <p className="text-[12px] text-text-tertiary">
                  Map your CSV columns to {target.label.toLowerCase()} fields. Required fields are marked with *.
                </p>

                <div className="border border-border-light rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface">
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-4 py-2.5">
                          CSV Column
                        </th>
                        <th className="text-center text-[11px] text-text-tertiary px-2 py-2.5" />
                        <th className="text-left text-[11px] font-semibold text-text-tertiary uppercase tracking-wider px-4 py-2.5">
                          Maps To
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping) => {
                        const isRequired =
                          mapping.targetField !== "__skip__" &&
                          target.requiredFields.includes(mapping.targetField);
                        return (
                          <tr key={mapping.csvColumn} className="border-t border-border-light">
                            <td className="px-4 py-2.5">
                              <span className="text-[13px] font-medium text-foreground">
                                {mapping.csvColumn}
                              </span>
                            </td>
                            <td className="text-center px-2">
                              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary inline" />
                            </td>
                            <td className="px-4 py-2.5">
                              <select
                                value={mapping.targetField}
                                onChange={(e) =>
                                  handleMappingChange(mapping.csvColumn, e.target.value)
                                }
                                className={`w-full text-[13px] px-3 py-1.5 rounded-lg border bg-card-bg transition-colors cursor-pointer ${
                                  mapping.targetField === "__skip__"
                                    ? "border-border-light text-text-tertiary"
                                    : isRequired
                                    ? "border-accent/40 text-foreground"
                                    : "border-border-light text-foreground"
                                }`}
                              >
                                <option value="__skip__">-- Skip --</option>
                                {allFields.map((field) => (
                                  <option key={field} value={field}>
                                    {target.fieldLabels[field] || field}
                                    {target.requiredFields.includes(field) ? " *" : ""}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!requiredFieldsMapped && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[12px]">
                      Map all required fields ({target.requiredFields.map((f) => target.fieldLabels[f]).join(", ")}) to proceed.
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(3)}
                    disabled={!requiredFieldsMapped}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && target && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-4"
              >
                {!importComplete ? (
                  <>
                    {/* Summary */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-[13px] font-medium text-emerald-700">
                          {totalStats.ready} ready
                        </span>
                      </div>
                      {totalStats.withErrors > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-[13px] font-medium text-red-600">
                            {totalStats.withErrors} with errors (will be skipped)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preview table */}
                    <div>
                      <p className="text-[12px] text-text-tertiary mb-2">
                        Preview (first {Math.min(5, previewRows.length)} rows):
                      </p>
                      <div className="border border-border-light rounded-xl overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="bg-surface">
                              {allFields
                                .filter((f) => mappings.some((m) => m.targetField === f))
                                .map((field) => (
                                  <th
                                    key={field}
                                    className="text-left font-semibold text-text-tertiary uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                                  >
                                    {target.fieldLabels[field] || field}
                                  </th>
                                ))}
                              <th className="text-left font-semibold text-text-tertiary uppercase tracking-wider px-3 py-2">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, idx) => (
                              <tr
                                key={idx}
                                className={`border-t border-border-light ${
                                  row.errors.length > 0 ? "bg-red-50/50" : ""
                                }`}
                              >
                                {allFields
                                  .filter((f) => mappings.some((m) => m.targetField === f))
                                  .map((field) => (
                                    <td
                                      key={field}
                                      className="px-3 py-2 text-foreground max-w-[150px] truncate"
                                    >
                                      {row.data[field] || (
                                        <span className="text-text-tertiary">--</span>
                                      )}
                                    </td>
                                  ))}
                                <td className="px-3 py-2">
                                  {row.errors.length === 0 ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <span
                                      className="text-red-500"
                                      title={row.errors.join("\n")}
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                                      {row.errors[0]}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {importing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[12px] text-text-secondary">
                          <span>Importing...</span>
                          <span>{importProgress}%</span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-accent rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${importProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setStep(2)}
                        disabled={importing}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleImport}
                        disabled={importing || totalStats.ready === 0}
                      >
                        {importing ? "Importing..." : `Import ${totalStats.ready} ${target.label}`}
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Import Complete */
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Import Complete</h3>
                      <p className="text-[13px] text-text-secondary mt-1">
                        Successfully imported {importedCount} {target.label.toLowerCase()}.
                        {errorCount > 0 && ` ${errorCount} failed.`}
                      </p>
                    </div>
                    <Button variant="primary" size="sm" onClick={handleClose}>
                      Done
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}
