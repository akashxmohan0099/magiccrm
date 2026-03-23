"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Pin, Search, FileText, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Type, Heading1, Heading2,
  List, ListOrdered, Quote, Minus, Users, Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import { generateId } from "@/lib/id";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Note {
  id: string;
  title: string;
  content: string; // HTML content
  pinned: boolean;
  linkedClient: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotesStore {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  updateNotes: (fn: (prev: Note[]) => Note[]) => void;
}

const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      notes: [],
      setNotes: (notes) => set({ notes }),
      updateNotes: (fn) => set((s) => ({ notes: fn(s.notes) })),
    }),
    { name: "magic-crm-notes-docs" }
  )
);

// ── Toolbar button ──
function ToolBtn({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-foreground/10 text-foreground"
          : "text-text-secondary hover:bg-surface hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolSep() {
  return <div className="w-px h-5 bg-border-light mx-1" />;
}

// ── Color picker ──
const TEXT_COLORS = [
  { label: "Default", value: "", className: "bg-foreground" },
  { label: "Red", value: "#EF4444", className: "bg-red-500" },
  { label: "Orange", value: "#F97316", className: "bg-orange-500" },
  { label: "Green", value: "#22C55E", className: "bg-green-500" },
  { label: "Blue", value: "#3B82F6", className: "bg-blue-500" },
  { label: "Purple", value: "#8B5CF6", className: "bg-purple-500" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px"];

// Simple HTML sanitizer — allows only safe tags
function sanitizeHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  // Remove script tags and event handlers
  div.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  div.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    }
  });
  return div.innerHTML;
}

export function NotesDocsPage() {
  const { notes, updateNotes } = useNotesStore();
  const setNotes = updateNotes;
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // ── CRUD ──
  const createNote = () => {
    const note: Note = {
      id: generateId(),
      title: "Untitled",
      content: "",
      pinned: false,
      linkedClient: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(note.id);
  };

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
        )
      );
    },
    [setNotes]
  );

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
    toast("Note deleted");
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  // ── Formatting commands ──
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveContent();
  };

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const saveContent = useCallback(() => {
    if (!activeNoteId || !editorRef.current) return;
    updateNote(activeNoteId, { content: editorRef.current.innerHTML });
  }, [activeNoteId, updateNote]);

  const saveTitle = useCallback(() => {
    if (!activeNoteId || !editorRef.current) return;
    // Extract title from first line of content
    const text = editorRef.current.textContent || "";
    const firstLine = text.split("\n")[0]?.trim().slice(0, 50) || "Untitled";
    updateNote(activeNoteId, { title: firstLine });
  }, [activeNoteId, updateNote]);

  // Set editor content when switching notes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = sanitizeHtml(activeNote.content);
    }
  }, [activeNoteId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered + sorted notes ──
  const filtered = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  const timeAgo = useCallback((date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString();
  }, []);

  // ── No notes state ──
  if (notes.length === 0 && !activeNoteId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">Notes & Docs</h1>
            <p className="text-[13px] text-text-secondary mt-0.5">Write notes, create docs, and share with your team.</p>
          </div>
          <Button onClick={createNote}><Plus className="w-4 h-4" /> New note</Button>
        </div>
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No notes yet"
          description="Create your first note or document. Write freely with formatting, headings, lists, and colors."
          actionLabel="Create your first note"
          onAction={createNote}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 -mt-0">
      {/* ── Sidebar: note list ── */}
      <div className="w-[280px] flex-shrink-0 border-r border-border-light bg-card-bg flex flex-col">
        <div className="p-3 border-b border-border-light">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[14px] font-bold text-foreground">Notes</h2>
            <button
              onClick={createNote}
              className="p-1.5 rounded-lg bg-foreground text-white hover:bg-foreground/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border-light rounded-lg text-[12px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`relative px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                activeNoteId === note.id
                  ? "bg-primary/8 border border-primary/20"
                  : "hover:bg-surface border border-transparent"
              }`}
            >
              <div className="flex items-start gap-2">
                {note.pinned && <Pin className="w-2.5 h-2.5 text-primary fill-primary mt-1 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{note.title}</p>
                  <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                    {note.content ? note.content.replace(/<[^>]*>/g, "").slice(0, 60) : "Empty"}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-1 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {timeAgo(note.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                  className={`p-1 rounded transition-colors ${note.pinned ? "text-primary" : "text-text-tertiary hover:text-foreground"}`}
                >
                  <Pin className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="p-1 rounded text-text-tertiary hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main editor area ── */}
      {activeNote ? (
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-5 py-2 border-b border-border-light bg-white sticky top-0 z-10 flex-wrap">
            <ToolBtn icon={Bold} label="Bold (⌘B)" onClick={() => exec("bold")} />
            <ToolBtn icon={Italic} label="Italic (⌘I)" onClick={() => exec("italic")} />
            <ToolBtn icon={Underline} label="Underline (⌘U)" onClick={() => exec("underline")} />
            <ToolSep />
            <ToolBtn icon={Heading1} label="Heading 1" onClick={() => exec("formatBlock", "h1")} />
            <ToolBtn icon={Heading2} label="Heading 2" onClick={() => exec("formatBlock", "h2")} />
            <ToolBtn
              icon={Type}
              label="Normal text"
              onClick={() => exec("formatBlock", "p")}
            />
            <ToolSep />
            <ToolBtn icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
            <ToolBtn icon={ListOrdered} label="Numbered list" onClick={() => exec("insertOrderedList")} />
            <ToolBtn icon={Quote} label="Quote" onClick={() => exec("formatBlock", "blockquote")} />
            <ToolBtn icon={Minus} label="Divider" onClick={() => exec("insertHorizontalRule")} />
            <ToolSep />
            <ToolBtn icon={AlignLeft} label="Align left" onClick={() => exec("justifyLeft")} />
            <ToolBtn icon={AlignCenter} label="Align center" onClick={() => exec("justifyCenter")} />
            <ToolBtn icon={AlignRight} label="Align right" onClick={() => exec("justifyRight")} />
            <ToolSep />

            {/* Font size picker */}
            <div className="relative">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowSizePicker(!showSizePicker); setShowColorPicker(false); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-text-secondary hover:bg-surface hover:text-foreground transition-colors text-[12px] font-medium"
              >
                <Type className="w-3.5 h-3.5" /> Size
              </button>
              {showSizePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-border-light rounded-xl shadow-xl p-1.5 z-20 min-w-[100px]">
                  {FONT_SIZES.map((size, idx) => (
                    <button
                      key={size}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        // execCommand fontSize accepts 1-7; map index to that range
                        exec("fontSize", String(idx + 1));
                        setShowSizePicker(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] text-text-secondary hover:bg-surface hover:text-foreground transition-colors"
                      style={{ fontSize: size }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color picker */}
            <div className="relative">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowColorPicker(!showColorPicker); setShowSizePicker(false); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-text-secondary hover:bg-surface hover:text-foreground transition-colors"
              >
                <div className="w-4 h-4 rounded-full border-2 border-border-light bg-foreground" />
              </button>
              {showColorPicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-border-light rounded-xl shadow-xl p-2 z-20 flex gap-1.5">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.label}
                      title={color.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { exec("foreColor", color.value || "#000000"); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded-full ${color.className} hover:scale-110 transition-transform border border-white shadow-sm`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-text-tertiary hover:bg-surface hover:text-foreground transition-colors">
              <Users className="w-3.5 h-3.5" /> Link client
            </button>
          </div>

          {/* A4 page area */}
          <div
            className="flex-1 overflow-y-auto bg-[#F0F0F0]"
            onClick={() => { setShowColorPicker(false); setShowSizePicker(false); }}
          >
            <div className="flex justify-center py-8 px-4">
              {/* A4 page */}
              <div
                className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.08)] rounded-sm"
                style={{ width: 816, minHeight: 1056, padding: "72px 80px" }}
              >
                  <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => { saveContent(); saveTitle(); }}
                  data-placeholder="Start writing..."
                  className="min-h-[900px] outline-none text-[14px] text-foreground leading-[1.8] empty:before:content-[attr(data-placeholder)] empty:before:text-text-tertiary/30 [&>h1]:text-[24px] [&>h1]:font-bold [&>h1]:mb-3 [&>h1]:mt-5 [&>h2]:text-[19px] [&>h2]:font-bold [&>h2]:mb-2 [&>h2]:mt-4 [&>p]:mb-2 [&>ul]:ml-5 [&>ul]:list-disc [&>ul]:mb-2 [&>ol]:ml-5 [&>ol]:list-decimal [&>ol]:mb-2 [&>li]:mb-0.5 [&>blockquote]:border-l-[3px] [&>blockquote]:border-foreground/15 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-text-secondary [&>blockquote]:my-3 [&>hr]:my-5 [&>hr]:border-border-light"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center">
            <FileText className="w-10 h-10 text-text-tertiary/30 mx-auto mb-3" />
            <p className="text-[14px] text-text-tertiary">Select a note or create a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}
