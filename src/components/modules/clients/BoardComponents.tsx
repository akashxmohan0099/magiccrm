"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Client } from "@/types/models";

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

// Soft muted tag colors — all use the same neutral bg with subtle text tints
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

  // Keep draft in sync if value changes externally while not editing
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

// ── ExpandedRow ──────────────────────────────────────────────

interface ExpandedRowProps {
  client: Client;
  onUpdate: (field: string, value: unknown) => void;
}

export function ExpandedRow({ client, onUpdate }: ExpandedRowProps) {
  const sourceOptions: (Client["source"] | "")[] = ["", "referral", "website", "social", "other"];

  return (
    <tr>
      <td colSpan={6} className="bg-surface/50 border-b border-border-light">
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 animate-in slide-in-from-top-1 duration-200">
          <div>
            <label className="text-xs text-text-secondary font-medium mb-1 block">Company</label>
            <EditableCell value={client.company || ""} onSave={(v) => onUpdate("company", v)} placeholder="Add company" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium mb-1 block">Address</label>
            <EditableCell value={client.address || ""} onSave={(v) => onUpdate("address", v)} placeholder="Add address" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium mb-1 block">Source</label>
            <select
              value={client.source || ""}
              onChange={(e) => onUpdate("source", e.target.value || undefined)}
              className="text-sm bg-transparent border-b border-border-light outline-none py-0.5 cursor-pointer text-foreground"
            >
              {sourceOptions.map((s) => (
                <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "—"}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="text-xs text-text-secondary font-medium mb-1 block">Notes</label>
            <EditableCell value={client.notes || ""} onSave={(v) => onUpdate("notes", v)} placeholder="Add notes" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <label className="text-xs text-text-secondary font-medium mb-1 block">Tags</label>
            <TagChips tags={client.tags} onChange={(tags) => onUpdate("tags", tags)} />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium mb-0.5 block">Created</label>
            <span className="text-xs text-text-secondary">{new Date(client.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── AddRow ───────────────────────────────────────────────────

interface AddRowProps {
  onAdd: (name: string, email: string) => void;
}

export function AddRow({ onAdd }: AddRowProps) {
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
        <td colSpan={6}>
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
      <td colSpan={4} className="px-4 py-2">
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
}

export function ClientBoardRow({ client, expanded, onToggleExpand, onUpdate, onOpenDetail }: ClientBoardRowProps) {
  return (
    <>
      <tr
        className={`group border-b border-border-light/60 hover:bg-surface/40 transition-colors ${expanded ? "border-l-2 border-l-blue-400 bg-surface/30" : "border-l-2 border-l-transparent"}`}
      >
        {/* Name (wider) */}
        <td className="px-6 py-2.5 w-[28%]">
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

        {/* Email */}
        <td className="px-4 py-2.5 w-[24%]">
          <EditableCell value={client.email} onSave={(v) => onUpdate("email", v)} placeholder="Add email" />
        </td>

        {/* Phone */}
        <td className="px-4 py-2.5 w-[16%]">
          <EditableCell value={client.phone} onSave={(v) => onUpdate("phone", v)} placeholder="Add phone" />
        </td>

        {/* Status (narrower) */}
        <td className="px-4 py-2.5 w-[12%]">
          <StatusDropdown status={client.status} onChange={(s) => onUpdate("status", s)} />
        </td>

        {/* Tags */}
        <td className="px-4 py-2.5 w-[16%]">
          <TagChips tags={client.tags} onChange={(tags) => onUpdate("tags", tags)} />
        </td>

        {/* Actions */}
        <td className="px-4 py-2.5 w-[4%] text-right">
          <button
            onClick={onOpenDetail}
            className="text-xs text-text-secondary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            Open
          </button>
        </td>
      </tr>
      {expanded && <ExpandedRow client={client} onUpdate={onUpdate} />}
    </>
  );
}
