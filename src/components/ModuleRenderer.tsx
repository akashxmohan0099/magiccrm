"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Upload, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SchemaTable } from "@/components/primitives/SchemaTable";
import { SchemaForm } from "@/components/primitives/SchemaForm";
import { SchemaDetail } from "@/components/primitives/SchemaDetail";
import { SchemaKanban } from "@/components/primitives/SchemaKanban";
import { SchemaCalendar } from "@/components/primitives/SchemaCalendar";
import { SchemaChart } from "@/components/primitives/SchemaChart";
import type { ModuleSchema, ViewDefinition, ConvertAction } from "@/types/module-schema";

type RecordData = { id: string; [key: string]: unknown };

interface ModuleRendererProps {
  schema: ModuleSchema;
  records: RecordData[];
  onRecordCreate: (data: Record<string, unknown>) => void;
  onRecordUpdate: (id: string, data: Partial<Record<string, unknown>>) => void;
  onRecordDelete: (id: string) => void;
  /** Execute a named action from the schema */
  onExecuteAction?: (actionId: string, recordId: string) => void;
  /** Resolve relation options for dropdowns (module ID → options) */
  resolveRelationOptions?: (moduleId: string) => { value: string; label: string }[];
  /** Look up a full record from a related module (for autoFillFrom) */
  resolveRecord?: (moduleId: string, recordId: string) => RecordData | undefined;
}

/**
 * The central component that renders any module from its schema.
 * Orchestrates: view tabs + active primitive + page header + empty state + form modal.
 */
export function ModuleRenderer({
  schema,
  records,
  onRecordCreate,
  onRecordUpdate,
  onRecordDelete,
  onExecuteAction,
  resolveRelationOptions,
  resolveRecord,
}: ModuleRendererProps) {
  // ── State ──────────────────────────────────────────────
  const [activeViewId, setActiveViewId] = useState(schema.primaryView);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordData | null>(null);
  const [detailRecord, setDetailRecord] = useState<RecordData | null>(null);

  const activeView = schema.views.find((v) => v.id === activeViewId) || schema.views[0];

  // ── Search filtering ───────────────────────────────────
  const searchableFieldIds = useMemo(
    () => schema.fields.filter((f) => f.searchable).map((f) => f.id),
    [schema.fields],
  );

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const term = search.toLowerCase();
    return records.filter((record) =>
      searchableFieldIds.some((fieldId) => {
        const val = record[fieldId];
        return val && String(val).toLowerCase().includes(term);
      }),
    );
  }, [records, search, searchableFieldIds]);

  // ── Tabs config ────────────────────────────────────────
  const viewTabs = useMemo(
    () => schema.views.map((v) => ({ id: v.id, label: v.label })),
    [schema.views],
  );

  // ── Handlers ───────────────────────────────────────────
  const handleRowClick = useCallback((record: RecordData) => {
    if (schema.capabilities.hasDetailPanel) {
      setDetailRecord(record);
    }
  }, [schema.capabilities.hasDetailPanel]);

  const handleCreateSubmit = useCallback((data: Record<string, unknown>) => {
    onRecordCreate(data);
    setFormOpen(false);
  }, [onRecordCreate]);

  const handleEditSubmit = useCallback((data: Record<string, unknown>) => {
    if (editingRecord) {
      onRecordUpdate(editingRecord.id, data);
      setEditingRecord(null);
      setDetailRecord(null);
    }
  }, [editingRecord, onRecordUpdate]);

  const handleDelete = useCallback(() => {
    if (detailRecord) {
      onRecordDelete(detailRecord.id);
      setDetailRecord(null);
    }
  }, [detailRecord, onRecordDelete]);

  const handleKanbanMove = useCallback((recordId: string, newValue: string) => {
    if (!activeView.groupByField) return;
    onRecordUpdate(recordId, { [activeView.groupByField]: newValue });
  }, [activeView.groupByField, onRecordUpdate]);

  // ── Build detail actions from schema ────────────────────
  const detailActions = useMemo(() => {
    if (!schema.actions || !detailRecord) return [];
    return schema.actions
      .filter((a): a is ConvertAction => a.type === "convert" && (a.showOn === "detail" || a.showOn === "row"))
      .map((action) => ({
        label: action.label,
        onClick: () => onExecuteAction?.(action.id, detailRecord.id),
      }));
  }, [schema.actions, detailRecord, onExecuteAction]);

  // ── Empty state ────────────────────────────────────────
  if (records.length === 0 && schema.emptyState) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader
          title={schema.label}
          description={schema.description}
        />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Plus className="w-6 h-6 text-primary" /></div>}
            title={schema.emptyState.title}
            description={schema.emptyState.description}
            actionLabel={schema.primaryAction?.label || "Add Record"}
            onAction={schema.capabilities.canCreate ? () => setFormOpen(true) : undefined}
          />
        </div>

        {/* Create form modal */}
        <Modal open={formOpen} onClose={() => setFormOpen(false)} title={schema.primaryAction?.label || "New Record"}>
          <SchemaForm
            fields={schema.fields}
            onSubmit={handleCreateSubmit}
            onCancel={() => setFormOpen(false)}
            submitLabel="Create"
            resolveRelationOptions={resolveRelationOptions}
            resolveRecord={resolveRecord}
          />
        </Modal>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-foreground">{schema.label}</h1>
            <p className="text-[13px] text-text-secondary mt-0.5">{schema.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {schema.capabilities.canImport && (
              <button className="p-2 text-text-tertiary hover:text-foreground transition-colors rounded-lg hover:bg-surface cursor-pointer">
                <Upload className="w-4 h-4" />
              </button>
            )}
            {schema.capabilities.canExport && (
              <button className="p-2 text-text-tertiary hover:text-foreground transition-colors rounded-lg hover:bg-surface cursor-pointer">
                <Download className="w-4 h-4" />
              </button>
            )}
            {schema.capabilities.canCreate && (
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-foreground text-background rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{schema.primaryAction?.label || "Add"}</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Search + View tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {schema.views.length > 1 ? (
            <Tabs tabs={viewTabs} activeTab={activeViewId} onChange={setActiveViewId} />
          ) : (
            <div />
          )}
          <SearchInput value={search} onChange={setSearch} placeholder={`Search ${schema.label.toLowerCase()}...`} />
        </div>
      </div>

      {/* Active view */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        <ActiveViewRenderer
          view={activeView}
          schema={schema}
          records={filteredRecords}
          onRowClick={handleRowClick}
          onKanbanMove={handleKanbanMove}
        />
      </div>

      {/* Create form modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={schema.primaryAction?.label || "New Record"}>
        <SchemaForm
          fields={schema.fields}
          onSubmit={handleCreateSubmit}
          onCancel={() => setFormOpen(false)}
          submitLabel="Create"
          resolveRelationOptions={resolveRelationOptions}
        />
      </Modal>

      {/* Edit form modal */}
      <Modal
        open={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title={`Edit ${schema.label.replace(/s$/, "")}`}
      >
        {editingRecord && (
          <SchemaForm
            fields={schema.fields}
            initialValues={editingRecord}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingRecord(null)}
            submitLabel="Save Changes"
            resolveRelationOptions={resolveRelationOptions}
            resolveRecord={resolveRecord}
          />
        )}
      </Modal>

      {/* Detail panel */}
      {schema.capabilities.hasDetailPanel && detailRecord && (
        <SchemaDetail
          fields={schema.fields}
          record={detailRecord}
          statusFlow={schema.statusFlow}
          open={!!detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={schema.capabilities.canEdit ? () => { setEditingRecord(detailRecord); setDetailRecord(null); } : undefined}
          onDelete={schema.capabilities.canDelete ? handleDelete : undefined}
          actions={detailActions}
        />
      )}
    </div>
  );
}

// ── View Renderer Dispatcher ─────────────────────────────────

function ActiveViewRenderer({
  view,
  schema,
  records,
  onRowClick,
  onKanbanMove,
}: {
  view: ViewDefinition;
  schema: ModuleSchema;
  records: RecordData[];
  onRowClick: (record: RecordData) => void;
  onKanbanMove: (recordId: string, newValue: string) => void;
}) {
  switch (view.type) {
    case "table":
      return (
        <SchemaTable
          fields={schema.fields}
          view={view}
          records={records}
          statusFlow={schema.statusFlow}
          onRowClick={onRowClick}
          storageKey={`schema-${schema.id}-${view.id}`}
        />
      );

    case "kanban":
      return (
        <SchemaKanban
          fields={schema.fields}
          view={view}
          records={records}
          statusFlow={schema.statusFlow}
          onRecordClick={onRowClick}
          onMove={onKanbanMove}
        />
      );

    case "calendar":
      return (
        <SchemaCalendar
          fields={schema.fields}
          view={view}
          records={records}
          statusFlow={schema.statusFlow}
          onRecordClick={onRowClick}
        />
      );

    case "chart":
      return (
        <SchemaChart
          fields={schema.fields}
          view={view}
          records={records}
        />
      );

    default:
      return (
        <div className="text-center py-12 text-text-tertiary">
          Unknown view type: {view.type}
        </div>
      );
  }
}
