"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Users, Upload, Download, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import { useClientsStore, DuplicateMatch } from "@/store/clients";
import { useTeamStore } from "@/store/team";
import { Client } from "@/types/models";
import { useVocabulary } from "@/hooks/useVocabulary";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { useAuth } from "@/hooks/useAuth";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ClientForm } from "./ClientForm";
import { ClientDetail } from "./ClientDetail";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";
import {
  ClientBoardRow,
  AddRow,
  ColumnVisibilityPicker,
  AddColumnDropdown,
  CLIENT_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  PAGE_SIZE_OPTIONS,
  type ColumnId,
  type CustomColumnDef,
} from "./BoardComponents";

const COLUMNS_STORAGE_KEY = "magic-crm-client-columns";
const CUSTOM_COLUMNS_KEY = "magic-crm-custom-client-columns";

function loadVisibleColumns(): string[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_COLUMNS;
  try {
    const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const validBuiltIn = new Set<string>(CLIENT_COLUMNS.map(c => c.id));
      const filtered = parsed.filter((id) =>
        validBuiltIn.has(id) || id.startsWith("field_") || id.startsWith("custom_")
      );
      if (!filtered.includes("name")) filtered.unshift("name");
      return filtered.length > 0 ? filtered : DEFAULT_VISIBLE_COLUMNS;
    }
  } catch { /* ignore */ }
  return DEFAULT_VISIBLE_COLUMNS;
}

function saveVisibleColumns(columns: string[]) {
  try {
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columns));
  } catch { /* ignore */ }
}

function loadCustomColumns(): CustomColumnDef[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_COLUMNS_KEY);
    if (stored) return JSON.parse(stored) as CustomColumnDef[];
  } catch { /* ignore */ }
  return [];
}

function saveCustomColumns(columns: CustomColumnDef[]) {
  try {
    localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
  } catch { /* ignore */ }
}

interface VisibleColInfo {
  id: string;
  label: string;
  minWidth: number;
  removable: boolean;
}

export function ClientsPage() {
  const {
    clients,
    getClient,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    loadPage,
    exportCSV,
    checkDuplicates,
    addClient,
    updateClient,
  } = useClientsStore();
  const teamMembers = useTeamStore((s) => s.members);
  const vocab = useVocabulary();
  const { workspaceId } = useAuth();
  const config = useIndustryConfig();
  const industryFieldDefs = config.customFields.clients ?? [];
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(loadVisibleColumns);
  const [customColumns, setCustomColumns] = useState<CustomColumnDef[]>(loadCustomColumns);

  // Duplicate warning state
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [pendingClientData, setPendingClientData] = useState<Omit<Client, "id" | "createdAt" | "updatedAt"> | null>(null);

  // Load paginated data from Supabase when page changes
  useEffect(() => {
    if (workspaceId) loadPage(workspaceId, page, pageSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Auto-close detail panel if the selected client was deleted
  const detailClient = detailClientId ? getClient(detailClientId) : null;
  useEffect(() => {
    if (detailClientId && !detailClient) queueMicrotask(() => setDetailClientId(null));
  }, [detailClientId, detailClient]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [clients, search]);

  // Resolve visible column defs (handles built-in, industry fields, and custom columns)
  const visibleColumnDefs = useMemo((): VisibleColInfo[] => {
    return visibleColumns.map((id): VisibleColInfo | null => {
      // Built-in column
      const builtIn = CLIENT_COLUMNS.find(c => c.id === id);
      if (builtIn) return { id: builtIn.id, label: builtIn.label, minWidth: builtIn.minWidth, removable: builtIn.removable };

      // Industry field column
      if (id.startsWith("field_")) {
        const fieldId = id.slice(6);
        const field = industryFieldDefs.find(f => f.id === fieldId);
        if (field) return { id, label: field.label, minWidth: 140, removable: true };
      }

      // Custom column
      const custom = customColumns.find(c => c.id === id);
      if (custom) return { id: custom.id, label: custom.label, minWidth: custom.minWidth, removable: true };

      return null;
    }).filter((x): x is VisibleColInfo => x !== null);
  }, [visibleColumns, industryFieldDefs, customColumns]);

  // Total colspan for full-width rows (visible cols + actions col + column picker col)
  const totalColSpan = visibleColumns.length + 2;

  // Column toggle handler
  const handleToggleColumn = useCallback((id: string) => {
    setVisibleColumns((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      saveVisibleColumns(next);
      return next;
    });
  }, []);

  // Custom column handlers
  const handleAddCustomColumn = useCallback((col: CustomColumnDef) => {
    setCustomColumns(prev => {
      const next = [...prev, col];
      saveCustomColumns(next);
      return next;
    });
    // Also make it visible immediately
    setVisibleColumns(prev => {
      const next = [...prev, col.id];
      saveVisibleColumns(next);
      return next;
    });
  }, []);

  const handleRemoveCustomColumn = useCallback((id: string) => {
    setCustomColumns(prev => {
      const next = prev.filter(c => c.id !== id);
      saveCustomColumns(next);
      return next;
    });
    setVisibleColumns(prev => {
      const next = prev.filter(c => c !== id);
      saveVisibleColumns(next);
      return next;
    });
  }, []);

  // Page size handler
  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
  }, [setPageSize]);

  // CSV export handler
  const handleExportCSV = useCallback(() => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportCSV]);

  // Inline update handler
  const handleUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      updateClient(id, { [field]: value } as Partial<Client>, workspaceId ?? undefined);
    },
    [updateClient, workspaceId],
  );

  // Inline add handler
  const handleInlineAdd = useCallback(
    (name: string, email: string) => {
      addClient(
        { name, email, phone: "", tags: [], notes: "", status: "prospect" },
        workspaceId ?? undefined,
      );
      if (workspaceId) loadPage(workspaceId, page, pageSize);
    },
    [addClient, workspaceId, loadPage, page, pageSize],
  );

  // Duplicate handling
  const handleForceCreate = useCallback(() => {
    if (pendingClientData) {
      addClient(pendingClientData, workspaceId ?? undefined);
      setPendingClientData(null);
      setDuplicateMatches([]);
      setDuplicateWarningOpen(false);
      if (workspaceId) loadPage(workspaceId, page, pageSize);
    }
  }, [pendingClientData, addClient, workspaceId, loadPage, page, pageSize]);

  const handleDismissDuplicates = useCallback(() => {
    setPendingClientData(null);
    setDuplicateMatches([]);
    setDuplicateWarningOpen(false);
  }, []);

  return (
    <div>
      <PageHeader
        title={vocab.clients}
        description={`Manage your ${vocab.client.toLowerCase()} database`}
        actions={
          <div className="flex items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={`Search ${vocab.clients.toLowerCase()}...`}
            />
            <FeatureSection moduleId="client-database" featureId="import-export" featureLabel="Import / Export">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Import
                </Button>
                {clients.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-1.5" />
                    Export CSV
                  </Button>
                )}
              </div>
            </FeatureSection>
            <Button onClick={() => setFormOpen(true)}>{vocab.addClient}</Button>
          </div>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title={`No ${vocab.clients.toLowerCase()} yet`}
          description={`Get started by importing your existing contacts or adding your first ${vocab.client.toLowerCase()}.`}
          setupSteps={[
            { label: `Add your first ${vocab.client.toLowerCase()}`, description: "Enter their details manually", action: () => setFormOpen(true) },
          ]}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">No clients match your search.</p>
        </div>
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light bg-surface/50">
                {visibleColumnDefs.map((col) => (
                  <th
                    key={col.id}
                    className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-4 py-3 group/header"
                    style={{ minWidth: col.minWidth }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.removable && (
                        <button
                          onClick={() => handleToggleColumn(col.id)}
                          className="opacity-0 group-hover/header:opacity-100 text-text-tertiary hover:text-foreground transition-all cursor-pointer"
                          title={`Hide ${col.label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {/* Actions header */}
                <th className="w-[60px]" />
                {/* Column controls */}
                <th className="w-[80px] px-1 py-3">
                  <div className="flex items-center gap-0.5 justify-end">
                    <ColumnVisibilityPicker
                      visibleColumns={visibleColumns}
                      onToggle={handleToggleColumn}
                      customColumns={customColumns}
                      onRemoveCustomColumn={handleRemoveCustomColumn}
                      availableFields={industryFieldDefs}
                    />
                    <AddColumnDropdown onAddCustomColumn={handleAddCustomColumn} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <ClientBoardRow
                  key={client.id}
                  client={client}
                  onUpdate={(field, value) => handleUpdate(client.id, field, value)}
                  onOpenDetail={() => setDetailClientId(client.id)}
                  visibleColumns={visibleColumns}
                  teamMembers={teamMembers}
                  customColumns={customColumns}
                  industryFields={industryFieldDefs}
                />
              ))}
              <AddRow onAdd={handleInlineAdd} colSpan={totalColSpan} />
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-secondary">
              Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, totalCount)} of {totalCount} {vocab.clients.toLowerCase()}
            </p>
            <select
              value={pageSize}
              onChange={(e) => handleSetPageSize(Number(e.target.value))}
              className="text-sm border border-border-light rounded-lg px-2 py-1.5 bg-card-bg text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-text-secondary px-2">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onBeforeCreate={async (data) => {
          const matches = await checkDuplicates(data.name, data.email, data.phone, workspaceId ?? undefined);
          if (matches.length > 0) {
            setPendingClientData(data);
            setDuplicateMatches(matches);
            setDuplicateWarningOpen(true);
            return false;
          }
          return true;
        }}
      />

      <CSVImportWizard open={importOpen} onClose={() => setImportOpen(false)} defaultTarget="clients" />

      <ClientDetail
        open={detailClientId !== null}
        onClose={() => setDetailClientId(null)}
        clientId={detailClientId}
      />

      {/* Duplicate warning modal */}
      <Modal open={duplicateWarningOpen} onClose={handleDismissDuplicates} title="Potential Duplicates Found">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              We found existing {vocab.clients.toLowerCase()} that may match the one you are creating. Please review before proceeding.
            </p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {duplicateMatches.map((match) => (
              <div key={match.client.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-light">
                <div>
                  <p className="text-sm font-medium text-foreground">{match.client.name}</p>
                  <p className="text-xs text-text-secondary">{match.client.email}</p>
                  {match.client.phone && <p className="text-xs text-text-secondary">{match.client.phone}</p>}
                </div>
                <div className="flex gap-1">
                  {match.matchedOn.map((field) => (
                    <span key={field} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
            <Button variant="ghost" onClick={handleDismissDuplicates}>Cancel</Button>
            <Button onClick={handleForceCreate}>Create Anyway</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
