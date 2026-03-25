"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ChevronDown, ChevronRight, Plus, X, Check, User, Trash2 } from "lucide-react";
import { Client, TeamMember } from "@/types/models";

// ── Column configuration ────────────────────────────────────

export type ColumnId = "name" | "email" | "phone" | "status" | "tags" | "company" | "source" | "created" | "assignedTo";

export interface ClientColumnDef {
  id: ColumnId;
  label: string;
  minWidth: number;
  defaultVisible: boolean;
  removable: boolean;
}

export interface CustomColumnDef {
  id: string;
  label: string;
  type: "text" | "dropdown" | "number" | "date";
  options?: string[];
  dataKey: string;
  minWidth: number;
}

export const CLIENT_COLUMNS: ClientColumnDef[] = [
  { id: "name", label: "Name", minWidth: 200, defaultVisible: true, removable: false },
  { id: "email", label: "Email", minWidth: 200, defaultVisible: true, removable: true },
  { id: "phone", label: "Phone", minWidth: 140, defaultVisible: true, removable: true },
  { id: "status", label: "Status", minWidth: 120, defaultVisible: true, removable: true },
  { id: "tags", label: "Tags", minWidth: 160, defaultVisible: true, removable: true },
  { id: "company", label: "Company", minWidth: 160, defaultVisible: false, removable: true },
  { id: "source", label: "Source", minWidth: 120, defaultVisible: false, removable: true },
  { id: "created", label: "Created", minWidth: 120, defaultVisible: false, removable: true },
  { id: "assignedTo", label: "Assigned To", minWidth: 160, defaultVisible: false, removable: true },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = CLIENT_COLUMNS
  .filter((c) => c.defaultVisible)
  .map((c) => c.id);

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const BUILT_IN_IDS = new Set<string>(CLIENT_COLUMNS.map(c => c.id));

// ── Types ────────────────────────────────────────────────────

export type ClientStatus = Client["status"];

export const CLIENT_STATUSES: { value: ClientStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "inactive", label: "Inactive" },
  { value: "vip", label: "VIP" },
  { value: "churned", label: "Churned" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:   { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-emerald-400" },
  prospect: { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-blue-400" },
  inactive: { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-stone-300" },
  vip:      { bg: "bg-stone-50", text: "text-stone-600", dot: "bg-violet-400" },
  churned:  { bg: "bg-stone-50", text: "text-stone-400", dot: "bg-red-300" },
};

const TAG_COLORS = [
  "bg-stone-100/80 text-stone-500",
  "bg-stone-100/80 text-stone-500",
  "bg-stone-100/80 text-stone-500",
  "bg-stone-100/80 text-stone-500",
  "bg-stone-100/80 text-stone-500",
  "bg-stone-100/80 text-stone-500",
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  website: "Website",
  social: "Social",
  other: "Other",
};

// ── EditableCell ─────────────────────────────────────────────

interface EditableCellProps {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditableCell({ value, onSave, placeholder = "—", className = "" }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  }, [draft, value, onSave]);

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={`w-full bg-transparent border-b-2 border-blue-400 outline-none text-sm py-0.5 text-foreground ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-text text-sm truncate block py-0.5 hover:bg-surface/60 rounded px-1 -mx-1 transition-colors ${!value ? "text-text-secondary italic" : "text-foreground"} ${className}`}
    >
      {value || placeholder}
    </span>
  );
}

// ── StatusDropdown ───────────────────────────────────────────

interface StatusDropdownProps {
  status: ClientStatus;
  onChange: (s: ClientStatus) => void;
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
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

  const colors = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  const label = CLIENT_STATUSES.find((s) => s.value === status)?.label || status;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${colors.bg} ${colors.text} hover:ring-2 hover:ring-blue-300/50`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        {label}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-card-bg border border-border-light rounded-xl shadow-lg py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
          {CLIENT_STATUSES.map((s) => {
            const c = STATUS_COLORS[s.value];
            return (
              <button
                key={s.value}
                onClick={() => { onChange(s.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface transition-colors ${s.value === status ? "font-semibold" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className={c.text}>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── TagChips ─────────────────────────────────────────────────

interface TagChipsProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagChips({ tags, onChange }: TagChipsProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const addTag = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
    setAdding(false);
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tagColor(tag)}`}
        >
          {tag}
          <button onClick={() => removeTag(tag)} className="hover:opacity-70 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={addTag}
          onKeyDown={(e) => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setDraft(""); setAdding(false); } }}
          className="bg-transparent border-b border-border-light outline-none text-xs py-0.5 w-20"
          placeholder="Tag name"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs text-text-secondary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── ColumnPicker ─────────────────────────────────────────────

interface ColumnPickerProps {
  visibleColumns: string[];
  onToggle: (id: string) => void;
  customColumns: CustomColumnDef[];
  onAddCustomColumn: (col: CustomColumnDef) => void;
  onRemoveCustomColumn: (id: string) => void;
  availableFields?: { id: string; label: string; type: string; options?: string[]; group?: string }[];
}

export function ColumnPicker({ visibleColumns, onToggle, customColumns, onAddCustomColumn, onRemoveCustomColumn, availableFields = [] }: ColumnPickerProps) {
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
        <div className="absolute z-50 top-full mt-1 right-0 bg-card-bg border border-border-light rounded-xl shadow-lg py-2 min-w-[260px] max-h-[480px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Built-in columns */}
          <p className="px-3 pb-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Columns</p>
          {CLIENT_COLUMNS.map((col) => {
            const visible = visibleColumns.includes(col.id);
            return (
              <button
                key={col.id}
                onClick={() => { if (col.removable) onToggle(col.id); }}
                disabled={!col.removable}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2.5 transition-colors ${col.removable ? "hover:bg-surface cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${visible ? "bg-foreground border-foreground" : "border-border-light"}`}>
                  {visible && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="text-foreground">{col.label}</span>
              </button>
            );
          })}

          {/* Available fields from industry config */}
          {availableFields.length > 0 && (
            <>
              <div className="border-t border-border-light my-2" />
              <p className="px-3 pb-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Available Fields</p>
              {availableFields.map((field) => {
                const colId = `field_${field.id}`;
                const visible = visibleColumns.includes(colId);
                return (
                  <button
                    key={colId}
                    onClick={() => onToggle(colId)}
                    className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2.5 hover:bg-surface transition-colors cursor-pointer"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${visible ? "bg-foreground border-foreground" : "border-border-light"}`}>
                      {visible && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-foreground">{field.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Custom columns */}
          {customColumns.length > 0 && (
            <>
              <div className="border-t border-border-light my-2" />
              <p className="px-3 pb-1.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Custom</p>
              {customColumns.map((col) => {
                const visible = visibleColumns.includes(col.id);
                return (
                  <div key={col.id} className="flex items-center gap-1 px-3 py-1.5 hover:bg-surface transition-colors group/custom">
                    <button
                      onClick={() => onToggle(col.id)}
                      className="flex-1 text-left text-sm flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${visible ? "bg-foreground border-foreground" : "border-border-light"}`}>
                        {visible && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-foreground">{col.label}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveCustomColumn(col.id); }}
                      className="opacity-0 group-hover/custom:opacity-100 text-text-tertiary hover:text-red-500 transition-all cursor-pointer p-0.5"
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
          <div className="border-t border-border-light mt-2 pt-2">
            {!addingColumn ? (
              <button
                onClick={() => setAddingColumn(true)}
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-primary hover:bg-surface transition-colors cursor-pointer font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
            ) : (
              <div className="px-3 pb-2 space-y-2">
                <input
                  ref={nameInputRef}
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); if (e.key === "Escape") { setAddingColumn(false); setNewColName(""); } }}
                  placeholder="Column name"
                  className="w-full px-2.5 py-1.5 text-sm bg-surface border border-border-light rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-text-tertiary"
                />
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as CustomColumnDef["type"])}
                  className="w-full px-2.5 py-1.5 text-sm bg-surface border border-border-light rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground cursor-pointer"
                >
                  <option value="text">Text</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                {newColType === "dropdown" && (
                  <input
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); }}
                    placeholder="Options (comma-separated)"
                    className="w-full px-2.5 py-1.5 text-sm bg-surface border border-border-light rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-text-tertiary"
                  />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColName.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-foreground text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddingColumn(false); setNewColName(""); setNewColType("text"); setNewColOptions(""); }}
                    className="px-3 py-1.5 text-xs text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TeamMemberCell ───────────────────────────────────────────

interface TeamMemberCellProps {
  assignedToId?: string;
  assignedToName?: string;
  teamMembers: TeamMember[];
  onChange: (memberId: string | undefined, memberName: string | undefined) => void;
}

function TeamMemberCell({ assignedToId, assignedToName, teamMembers, onChange }: TeamMemberCellProps) {
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

  if (teamMembers.length === 0 && !assignedToId) {
    return <span className="text-xs text-text-secondary italic">No team</span>;
  }

  return (
    <div ref={ref} className="relative">
      {assignedToId ? (
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <User className="w-3 h-3" />
          {assignedToName || "Member"}
          <button
            onClick={(e) => { e.stopPropagation(); onChange(undefined, undefined); }}
            className="hover:opacity-70 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs text-text-secondary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Assign</span>
        </button>
      )}

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-card-bg border border-border-light rounded-xl shadow-lg py-1 min-w-[180px] max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {assignedToId && (
            <button
              onClick={() => { onChange(undefined, undefined); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-surface transition-colors flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              Unassign
            </button>
          )}
          {teamMembers.filter((m) => m.status === "active").map((member) => (
            <button
              key={member.id}
              onClick={() => { onChange(member.id, member.name); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface transition-colors ${member.id === assignedToId ? "font-semibold" : ""}`}
            >
              <User className="w-3 h-3 text-text-secondary" />
              <span className="text-foreground">{member.name}</span>
              {member.role !== "owner" && <span className="text-text-tertiary ml-auto">{member.role}</span>}
            </button>
          ))}
          {teamMembers.filter((m) => m.status === "active").length === 0 && (
            <p className="px-3 py-2 text-xs text-text-secondary">No active team members</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── ExpandedRow ──────────────────────────────────────────────

interface ExpandedRowProps {
  client: Client;
  onUpdate: (field: string, value: unknown) => void;
  colSpan: number;
}

export function ExpandedRow({ client, onUpdate, colSpan }: ExpandedRowProps) {
  const sourceOptions: (Client["source"] | "")[] = ["", "referral", "website", "social", "other"];

  return (
    <tr>
      <td colSpan={colSpan} className="border-b border-border-light">
        <div className="px-8 py-5 bg-surface/30 animate-in slide-in-from-top-1 duration-200">
          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-card-bg rounded-lg px-3.5 py-2.5 border border-border-light/50">
              <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1">Company</label>
              <EditableCell value={client.company || ""} onSave={(v) => onUpdate("company", v)} placeholder="Add company" />
            </div>
            <div className="bg-card-bg rounded-lg px-3.5 py-2.5 border border-border-light/50">
              <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1">Address</label>
              <EditableCell value={client.address || ""} onSave={(v) => onUpdate("address", v)} placeholder="Add address" />
            </div>
            <div className="bg-card-bg rounded-lg px-3.5 py-2.5 border border-border-light/50">
              <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1">Source</label>
              <select
                value={client.source || ""}
                onChange={(e) => onUpdate("source", e.target.value || undefined)}
                className="text-sm bg-transparent outline-none py-0.5 cursor-pointer text-foreground w-full"
              >
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "Select..."}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card-bg rounded-lg px-3.5 py-2.5 border border-border-light/50 mb-3">
            <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1">Notes</label>
            <EditableCell value={client.notes || ""} onSave={(v) => onUpdate("notes", v)} placeholder="Add notes..." />
          </div>

          {/* Tags & Created */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1.5">Tags</label>
              <TagChips tags={client.tags} onChange={(tags) => onUpdate("tags", tags)} />
            </div>
            <div className="text-right flex-shrink-0">
              <label className="text-[11px] text-text-secondary font-medium uppercase tracking-wider block mb-1.5">Created</label>
              <span className="text-sm text-text-secondary">{new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── AddRow ───────────────────────────────────────────────────

interface AddRowProps {
  onAdd: (name: string, email: string) => void;
  colSpan: number;
}

export function AddRow({ onAdd, colSpan }: AddRowProps) {
  const [active, setActive] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) nameRef.current?.focus();
  }, [active]);

  const submit = () => {
    if (name.trim() && email.trim()) {
      onAdd(name.trim(), email.trim());
      setName("");
      setEmail("");
      setActive(false);
    }
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") { setName(""); setEmail(""); setActive(false); }
  };

  if (!active) {
    return (
      <tr>
        <td colSpan={colSpan}>
          <button
            onClick={() => setActive(true)}
            className="w-full text-left px-6 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-surface/60 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add {"\u200B"}client
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-l-2 border-l-blue-400">
      <td className="px-6 py-2">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Name"
          className="w-full bg-transparent border-b-2 border-blue-400 outline-none text-sm py-0.5 text-foreground"
        />
      </td>
      <td className="px-4 py-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Email"
          className="w-full bg-transparent border-b-2 border-blue-400 outline-none text-sm py-0.5 text-foreground"
        />
      </td>
      <td colSpan={Math.max(1, colSpan - 2)} className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button onClick={submit} className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">Save</button>
          <button onClick={() => { setName(""); setEmail(""); setActive(false); }} className="text-xs text-text-secondary hover:text-foreground cursor-pointer">Cancel</button>
        </div>
      </td>
    </tr>
  );
}

// ── ClientBoardRow ───────────────────────────────────────────

interface ClientBoardRowProps {
  client: Client;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: string, value: unknown) => void;
  onOpenDetail: () => void;
  visibleColumns: string[];
  teamMembers: TeamMember[];
  customColumns?: CustomColumnDef[];
  industryFields?: { id: string; label: string; type: string; options?: string[] }[];
}

export function ClientBoardRow({ client, expanded, onToggleExpand, onUpdate, onOpenDetail, visibleColumns, teamMembers, customColumns = [], industryFields = [] }: ClientBoardRowProps) {
  const totalColSpan = visibleColumns.length + 2; // +1 actions, +1 column picker spacer

  const customData = (client.customData ?? {}) as Record<string, unknown>;

  const handleAssign = useCallback((memberId: string | undefined, memberName: string | undefined) => {
    onUpdate("customData", {
      ...customData,
      assignedToId: memberId ?? null,
      assignedToName: memberName ?? null,
    });
  }, [onUpdate, customData]);

  const renderCell = (colId: string) => {
    // ─── Built-in columns ───
    if (BUILT_IN_IDS.has(colId)) {
      switch (colId as ColumnId) {
        case "name":
          return (
            <td key={colId} className="px-6 py-2.5" style={{ minWidth: 200 }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleExpand}
                  className="text-text-secondary hover:text-foreground transition-colors flex-shrink-0 cursor-pointer"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={onToggleExpand}
                    className="text-sm font-medium text-foreground hover:text-blue-600 transition-colors truncate block text-left cursor-pointer"
                  >
                    {client.name}
                  </button>
                </div>
              </div>
            </td>
          );
        case "email":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 200 }}>
              <EditableCell value={client.email} onSave={(v) => onUpdate("email", v)} placeholder="Add email" />
            </td>
          );
        case "phone":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 140 }}>
              <EditableCell value={client.phone} onSave={(v) => onUpdate("phone", v)} placeholder="Add phone" />
            </td>
          );
        case "status":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 120 }}>
              <StatusDropdown status={client.status} onChange={(s) => onUpdate("status", s)} />
            </td>
          );
        case "tags":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 160 }}>
              <TagChips tags={client.tags} onChange={(tags) => onUpdate("tags", tags)} />
            </td>
          );
        case "company":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 160 }}>
              <EditableCell value={client.company || ""} onSave={(v) => onUpdate("company", v)} placeholder="Add company" />
            </td>
          );
        case "source":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 120 }}>
              <span className="text-sm text-foreground">
                {client.source ? SOURCE_LABELS[client.source] || client.source : <span className="text-text-secondary italic">—</span>}
              </span>
            </td>
          );
        case "created":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 120 }}>
              <span className="text-sm text-text-secondary">{new Date(client.createdAt).toLocaleDateString()}</span>
            </td>
          );
        case "assignedTo":
          return (
            <td key={colId} className="px-4 py-2.5" style={{ minWidth: 160 }}>
              <TeamMemberCell
                assignedToId={customData.assignedToId as string | undefined}
                assignedToName={customData.assignedToName as string | undefined}
                teamMembers={teamMembers}
                onChange={handleAssign}
              />
            </td>
          );
        default:
          return <td key={colId} className="px-4 py-2.5" />;
      }
    }

    // ─── Industry field columns (field_xxx) ───
    if (colId.startsWith("field_")) {
      const fieldId = colId.slice(6);
      const field = industryFields.find(f => f.id === fieldId);
      const value = customData[fieldId];

      if (!field) return <td key={colId} className="px-4 py-2.5" />;

      if (field.type === "select") {
        return (
          <td key={colId} className="px-4 py-2.5" style={{ minWidth: 140 }}>
            <select
              value={(value as string) || ""}
              onChange={(e) => onUpdate("customData", { ...customData, [fieldId]: e.target.value || undefined })}
              className="text-sm bg-transparent border-b border-transparent hover:border-border-light outline-none py-0.5 cursor-pointer text-foreground w-full"
            >
              <option value="">—</option>
              {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </td>
        );
      }

      if (field.type === "toggle") {
        return (
          <td key={colId} className="px-4 py-2.5" style={{ minWidth: 100 }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onUpdate("customData", { ...customData, [fieldId]: e.target.checked })}
              className="w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20 cursor-pointer"
            />
          </td>
        );
      }

      if (field.type === "date") {
        return (
          <td key={colId} className="px-4 py-2.5" style={{ minWidth: 140 }}>
            <input
              type="date"
              value={(value as string) || ""}
              onChange={(e) => onUpdate("customData", { ...customData, [fieldId]: e.target.value || undefined })}
              className="text-sm bg-transparent outline-none cursor-pointer text-foreground"
            />
          </td>
        );
      }

      // text, textarea, number
      return (
        <td key={colId} className="px-4 py-2.5" style={{ minWidth: 140 }}>
          <EditableCell
            value={String(value || "")}
            onSave={(v) => onUpdate("customData", { ...customData, [fieldId]: v || undefined })}
            placeholder="—"
          />
        </td>
      );
    }

    // ─── Custom columns (custom_xxx) ───
    const customCol = customColumns.find(c => c.id === colId);
    if (customCol) {
      const value = customData[customCol.dataKey];

      if (customCol.type === "dropdown") {
        return (
          <td key={colId} className="px-4 py-2.5" style={{ minWidth: customCol.minWidth }}>
            <select
              value={(value as string) || ""}
              onChange={(e) => onUpdate("customData", { ...customData, [customCol.dataKey]: e.target.value || undefined })}
              className="text-sm bg-transparent border-b border-transparent hover:border-border-light outline-none py-0.5 cursor-pointer text-foreground w-full"
            >
              <option value="">—</option>
              {customCol.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </td>
        );
      }

      if (customCol.type === "date") {
        return (
          <td key={colId} className="px-4 py-2.5" style={{ minWidth: customCol.minWidth }}>
            <input
              type="date"
              value={(value as string) || ""}
              onChange={(e) => onUpdate("customData", { ...customData, [customCol.dataKey]: e.target.value || undefined })}
              className="text-sm bg-transparent outline-none cursor-pointer text-foreground"
            />
          </td>
        );
      }

      return (
        <td key={colId} className="px-4 py-2.5" style={{ minWidth: customCol.minWidth }}>
          <EditableCell
            value={String(value || "")}
            onSave={(v) => onUpdate("customData", { ...customData, [customCol.dataKey]: v || undefined })}
            placeholder="—"
          />
        </td>
      );
    }

    // Fallback
    return <td key={colId} className="px-4 py-2.5" />;
  };

  return (
    <>
      <tr
        className={`group border-b border-border-light/60 hover:bg-surface/40 transition-colors ${expanded ? "border-l-2 border-l-blue-400 bg-surface/30" : "border-l-2 border-l-transparent"}`}
      >
        {visibleColumns.map(renderCell)}

        {/* Actions */}
        <td className="px-4 py-2.5 w-[60px] text-right">
          <button
            onClick={onOpenDetail}
            className="text-xs text-text-secondary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            Open
          </button>
        </td>

        {/* Column picker spacer */}
        <td className="w-[40px]" />
      </tr>
      {expanded && <ExpandedRow client={client} onUpdate={onUpdate} colSpan={totalColSpan} />}
    </>
  );
}
