"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Plus, X, Check, Trash2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  defaultVisible?: boolean;  // defaults to true
  removable?: boolean;       // defaults to true
  minWidth?: number;
}

export interface CustomColumnDef {
  id: string;
  label: string;
  type: "text" | "dropdown" | "number" | "date";
  options?: string[];
  dataKey: string;
  minWidth: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  /** Provide to enable column picker + localStorage persistence */
  storageKey?: string;
  /** Accessor for custom data on each item (enables custom column values) */
  getCustomData?: (item: T) => Record<string, unknown>;
  /** Callback to update custom data (enables inline editing of custom columns) */
  onUpdateCustomData?: (itemKey: string, data: Record<string, unknown>) => void;
}

// ── Storage helpers ──────────────────────────────────────────

function loadVisibleKeys(storageKey: string, columns: Column<unknown>[]): string[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const allBuiltIn = new Set(columns.map(c => c.key));
      const filtered = parsed.filter(k => allBuiltIn.has(k) || k.startsWith("custom_"));
      // Ensure at least first column is present
      const firstKey = columns[0]?.key;
      if (firstKey && !filtered.includes(firstKey)) filtered.unshift(firstKey);
      return filtered.length > 0 ? filtered : columns.filter(c => c.defaultVisible !== false).map(c => c.key);
    }
  } catch { /* ignore */ }
  return columns.filter(c => c.defaultVisible !== false).map(c => c.key);
}

function saveVisibleKeys(storageKey: string, keys: string[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(keys)); } catch { /* ignore */ }
}

function loadCustomCols(storageKey: string): CustomColumnDef[] {
  try {
    const stored = localStorage.getItem(`${storageKey}-custom`);
    if (stored) return JSON.parse(stored) as CustomColumnDef[];
  } catch { /* ignore */ }
  return [];
}

function saveCustomCols(storageKey: string, cols: CustomColumnDef[]) {
  try { localStorage.setItem(`${storageKey}-custom`, JSON.stringify(cols)); } catch { /* ignore */ }
}

// ── InlineEditCell ───────────────────────────────────────────

function InlineEditCell({ value, onSave, placeholder }: { value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  }, [draft, value, onSave]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full bg-transparent border-b-2 border-blue-400 outline-none text-[13px] py-0.5 text-foreground"
      />
    );
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className={`cursor-text text-[13px] truncate block py-0.5 hover:bg-surface/60 rounded px-1 -mx-1 transition-colors ${!value ? "text-text-secondary italic" : "text-foreground"}`}
    >
      {value || placeholder || "—"}
    </span>
  );
}

// ── InlineSelectDropdown ─────────────────────────────────────

function InlineSelectDropdown({ value, options, onChange, placeholder = "—" }: { value: string; options: string[]; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-blue-300/50 ${
          value ? "bg-stone-50 text-stone-600" : "bg-stone-50 text-stone-400 italic"
        }`}
      >
        {value || placeholder}
        <ChevronDown className="w-3 h-3 opacity-40" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-card-bg border border-border-light rounded-xl shadow-lg py-1 min-w-[140px] max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface transition-colors ${!value ? "font-semibold text-foreground" : "text-text-secondary"}`}
          >
            <Check className={`w-3 h-3 ${!value ? "opacity-100" : "opacity-0"}`} />
            <span>{placeholder}</span>
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface transition-colors ${opt === value ? "font-semibold text-foreground" : "text-text-secondary"}`}
            >
              <Check className={`w-3 h-3 ${opt === value ? "opacity-100" : "opacity-0"}`} />
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TableColumnPicker ────────────────────────────────────────

function TableColumnPicker<T>({
  columns,
  visibleKeys,
  onToggle,
  customColumns,
  onAddCustomColumn,
  onRemoveCustomColumn,
  enableCustomColumns,
}: {
  columns: Column<T>[];
  visibleKeys: string[];
  onToggle: (key: string) => void;
  customColumns: CustomColumnDef[];
  onAddCustomColumn: (col: CustomColumnDef) => void;
  onRemoveCustomColumn: (id: string) => void;
  enableCustomColumns: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<CustomColumnDef["type"]>("text");
  const [newColOptions, setNewColOptions] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setAddingColumn(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (addingColumn) nameInputRef.current?.focus();
  }, [addingColumn]);

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const id = `custom_${Date.now()}`;
    const col: CustomColumnDef = {
      id,
      label: newColName.trim(),
      type: newColType,
      options: newColType === "dropdown" ? newColOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined,
      dataKey: id,
      minWidth: 140,
    };
    onAddCustomColumn(col);
    setNewColName("");
    setNewColType("text");
    setNewColOptions("");
    setAddingColumn(false);
  };

  // Determine which columns are removable (first column is always locked)
  const isRemovable = (col: Column<T>) => {
    if (col.removable === false) return false;
    if (!columns.some(c => c.removable === false)) {
      return col.key !== columns[0]?.key;
    }
    return true;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-text-secondary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        title="Manage columns"
      >
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-card-bg border border-border-light rounded-2xl shadow-xl py-3 w-[340px] max-h-[520px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="px-4 pb-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Columns</p>
          {columns.map((col) => {
            const visible = visibleKeys.includes(col.key);
            const removable = isRemovable(col);
            return (
              <button
                key={col.key}
                onClick={() => { if (removable) onToggle(col.key); }}
                disabled={!removable}
                className={`w-full text-left px-4 py-2 text-[14px] flex items-center gap-3 transition-colors ${removable ? "hover:bg-surface cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${visible ? "bg-foreground border-foreground" : "border-border-light"}`}>
                  {visible && <Check className="w-3.5 h-3.5 text-white" />}
                </span>
                <span className="text-foreground">{col.label}</span>
              </button>
            );
          })}

          {/* Custom columns */}
          {customColumns.length > 0 && (
            <>
              <div className="border-t border-border-light my-2" />
              <p className="px-4 pb-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Custom</p>
              {customColumns.map((col) => {
                const visible = visibleKeys.includes(col.id);
                return (
                  <div key={col.id} className="flex items-center gap-1 px-4 py-2 hover:bg-surface transition-colors group/custom">
                    <button
                      onClick={() => onToggle(col.id)}
                      className="flex-1 text-left text-[14px] flex items-center gap-3 cursor-pointer"
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${visible ? "bg-foreground border-foreground" : "border-border-light"}`}>
                        {visible && <Check className="w-3.5 h-3.5 text-white" />}
                      </span>
                      <span className="text-foreground">{col.label}</span>
                      <span className="text-[11px] text-text-tertiary ml-auto">{col.type}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveCustomColumn(col.id); }}
                      className="opacity-0 group-hover/custom:opacity-100 text-text-tertiary hover:text-red-500 transition-all cursor-pointer p-1"
                      title="Remove column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* Add column */}
          {enableCustomColumns && (
            <div className="border-t border-border-light mt-2 pt-2">
              {!addingColumn ? (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="w-full text-left px-4 py-2 text-[14px] flex items-center gap-2 text-primary hover:bg-surface transition-colors cursor-pointer font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
              ) : (
                <div className="px-4 pb-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider block mb-1.5">Column Name</label>
                    <input
                      ref={nameInputRef}
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); } }}
                      placeholder="e.g. Priority, Category..."
                      className="w-full px-3 py-2 text-sm bg-surface border border-border-light rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-text-tertiary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider block mb-1.5">Type</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([
                        { value: "text", label: "Text" },
                        { value: "dropdown", label: "Dropdown" },
                        { value: "number", label: "Number" },
                        { value: "date", label: "Date" },
                      ] as const).map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setNewColType(t.value)}
                          className={`px-2 py-1.5 text-[12px] font-medium rounded-lg border transition-all cursor-pointer ${
                            newColType === t.value
                              ? "bg-foreground text-white border-foreground"
                              : "bg-surface text-text-secondary border-border-light hover:border-foreground/30"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newColType === "dropdown" && (
                    <div>
                      <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider block mb-1.5">Options</label>
                      <input
                        value={newColOptions}
                        onChange={(e) => setNewColOptions(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); }}
                        placeholder="Option 1, Option 2, Option 3..."
                        className="w-full px-3 py-2 text-sm bg-surface border border-border-light rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-text-tertiary"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleAddColumn}
                      disabled={!newColName.trim()}
                      className="flex-1 px-3 py-2 text-sm font-medium bg-foreground text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add Column
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColName(""); setNewColType("text"); setNewColOptions(""); }}
                      className="px-3 py-2 text-sm text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DataTable ────────────────────────────────────────────────

export function DataTable<T>({ columns, data, onRowClick, keyExtractor, storageKey, getCustomData, onUpdateCustomData }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Column visibility (only active when storageKey is provided)
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    if (!storageKey) return columns.map(c => c.key);
    return loadVisibleKeys(storageKey, columns as Column<unknown>[]);
  });

  // Custom columns (only active when storageKey is provided)
  const [customColumns, setCustomColumns] = useState<CustomColumnDef[]>(() => {
    if (!storageKey) return [];
    return loadCustomCols(storageKey);
  });

  const hasColumnPicker = !!storageKey;
  const enableCustomColumns = !!onUpdateCustomData && !!getCustomData;

  // Filter built-in columns by visibility
  const visibleBuiltInColumns = useMemo(() => {
    if (!hasColumnPicker) return columns;
    return columns.filter(c => visibleKeys.includes(c.key));
  }, [columns, visibleKeys, hasColumnPicker]);

  // Filter custom columns by visibility
  const visibleCustomColumns = useMemo(() => {
    if (!hasColumnPicker) return [];
    return customColumns.filter(c => visibleKeys.includes(c.id));
  }, [customColumns, visibleKeys, hasColumnPicker]);

  // Total column count (for colSpan)
  const totalCols = visibleBuiltInColumns.length + visibleCustomColumns.length + (hasColumnPicker ? 1 : 0);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      // Check custom columns first
      const customCol = customColumns.find(c => c.id === sortKey);
      let aVal: unknown, bVal: unknown;
      if (customCol && getCustomData) {
        aVal = getCustomData(a)[customCol.dataKey];
        bVal = getCustomData(b)[customCol.dataKey];
      } else {
        aVal = (a as Record<string, unknown>)[sortKey];
        bVal = (b as Record<string, unknown>)[sortKey];
      }
      if (aVal == null || bVal == null) return 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, customColumns, getCustomData]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Column toggle
  const handleToggleColumn = useCallback((key: string) => {
    if (!storageKey) return;
    setVisibleKeys(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      saveVisibleKeys(storageKey, next);
      return next;
    });
  }, [storageKey]);

  // Add custom column
  const handleAddCustomColumn = useCallback((col: CustomColumnDef) => {
    if (!storageKey) return;
    setCustomColumns(prev => {
      const next = [...prev, col];
      saveCustomCols(storageKey, next);
      return next;
    });
    setVisibleKeys(prev => {
      const next = [...prev, col.id];
      saveVisibleKeys(storageKey, next);
      return next;
    });
  }, [storageKey]);

  // Remove custom column
  const handleRemoveCustomColumn = useCallback((id: string) => {
    if (!storageKey) return;
    setCustomColumns(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCustomCols(storageKey, next);
      return next;
    });
    setVisibleKeys(prev => {
      const next = prev.filter(k => k !== id);
      saveVisibleKeys(storageKey, next);
      return next;
    });
  }, [storageKey]);

  // Render a custom column cell
  const renderCustomCell = (item: T, col: CustomColumnDef) => {
    const itemData = getCustomData?.(item) ?? {};
    const value = itemData[col.dataKey];
    const itemKey = keyExtractor(item);

    if (!onUpdateCustomData) {
      // Read-only
      if (col.type === "date" && value) return <span className="text-text-secondary">{new Date(value as string).toLocaleDateString()}</span>;
      return <span className="text-foreground">{String(value ?? "—")}</span>;
    }

    // Editable
    switch (col.type) {
      case "dropdown":
        return (
          <InlineSelectDropdown
            value={(value as string) || ""}
            options={col.options ?? []}
            onChange={(v) => {
              onUpdateCustomData(itemKey, { ...itemData, [col.dataKey]: v || undefined });
            }}
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={(value as string) || ""}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              onUpdateCustomData(itemKey, { ...itemData, [col.dataKey]: e.target.value || undefined });
            }}
            className="text-[13px] bg-transparent outline-none cursor-pointer text-foreground"
          />
        );
      default: // text, number
        return (
          <InlineEditCell
            value={String(value || "")}
            onSave={(v) => {
              onUpdateCustomData(itemKey, { ...itemData, [col.dataKey]: v || undefined });
            }}
          />
        );
    }
  };

  // Determine if a built-in column is removable
  const isRemovable = (col: Column<T>) => {
    if (col.removable === false) return false;
    if (!columns.some(c => c.removable === false)) {
      return col.key !== columns[0]?.key;
    }
    return true;
  };

  return (
    <div className="rounded-xl border border-border-light overflow-hidden bg-card-bg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface/50">
            <tr className="border-b border-border-light">
              {visibleBuiltInColumns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`text-left text-[12px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 group/header ${
                    col.sortable ? "cursor-pointer select-none hover:text-foreground hover:bg-surface transition-colors" : ""
                  }`}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span>{col.label}</span>
                    {hasColumnPicker && isRemovable(col) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleColumn(col.key); }}
                        className="opacity-0 group-hover/header:opacity-100 text-text-tertiary hover:text-foreground transition-all cursor-pointer"
                        title={`Hide ${col.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {col.sortable && (
                      <div className="ml-auto">
                        {sortKey === col.key ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            {sortDir === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </motion.div>
                        ) : (
                          <div className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}

              {/* Custom column headers */}
              {visibleCustomColumns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className="text-left text-[12px] font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 group/header"
                  style={{ minWidth: col.minWidth }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    <button
                      onClick={() => handleToggleColumn(col.id)}
                      className="opacity-0 group-hover/header:opacity-100 text-text-tertiary hover:text-foreground transition-all cursor-pointer"
                      title={`Hide ${col.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}

              {/* Column picker */}
              {hasColumnPicker && (
                <th className="w-[40px] px-1 py-3">
                  <TableColumnPicker
                    columns={columns}
                    visibleKeys={visibleKeys}
                    onToggle={handleToggleColumn}
                    customColumns={customColumns}
                    onAddCustomColumn={handleAddCustomColumn}
                    onRemoveCustomColumn={handleRemoveCustomColumn}
                    enableCustomColumns={enableCustomColumns}
                  />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-4 py-12 text-center">
                  <p className="text-[13px] text-text-tertiary">No results found</p>
                </td>
              </tr>
            ) : (
              sorted.map((item, index) => (
                <motion.tr
                  key={keyExtractor(item)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  onClick={() => onRowClick?.(item)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e: React.KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(item);
                    }
                  } : undefined}
                  className={`border-t border-border-light transition-all ${
                    index % 2 === 1 ? "bg-foreground/[0.01]" : ""
                  } ${
                    onRowClick
                      ? "cursor-pointer hover:bg-surface/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      : ""
                  }`}
                >
                  {/* Built-in columns */}
                  {visibleBuiltInColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-[13px] text-foreground">
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}

                  {/* Custom columns */}
                  {visibleCustomColumns.map((col) => (
                    <td key={col.id} className="px-4 py-3.5 text-[13px] text-foreground">
                      {renderCustomCell(item, col)}
                    </td>
                  ))}

                  {/* Picker spacer */}
                  {hasColumnPicker && <td className="w-[40px]" />}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
