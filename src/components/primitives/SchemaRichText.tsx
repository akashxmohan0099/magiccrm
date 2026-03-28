"use client";

import { useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Link, Undo2, Redo2, RemoveFormatting,
} from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface SchemaRichTextProps {
  /** Current HTML content */
  value: string;
  /** Called with the updated HTML string */
  onChange: (html: string) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * Lightweight rich text editor using contentEditable.
 *
 * Supports: bold, italic, underline, headings, ordered/unordered
 * lists, links, and undo/redo. No third-party dependencies.
 */
export function SchemaRichText({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 200,
  readOnly = false,
}: SchemaRichTextProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    // Sync content after command
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  }, [exec]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Tab → indent in lists
    if (e.key === "Tab") {
      e.preventDefault();
      exec(e.shiftKey ? "outdent" : "indent");
    }
  }, [exec]);

  if (readOnly) {
    return (
      <div
        className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "") }}
      />
    );
  }

  return (
    <div className="border border-border-light rounded-xl overflow-hidden bg-card-bg focus-within:ring-2 focus-within:ring-primary/20">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-light bg-surface/30">
        <ToolbarButton icon={<Undo2 className="w-3.5 h-3.5" />} title="Undo" onClick={() => exec("undo")} />
        <ToolbarButton icon={<Redo2 className="w-3.5 h-3.5" />} title="Redo" onClick={() => exec("redo")} />
        <Divider />
        <ToolbarButton icon={<Bold className="w-3.5 h-3.5" />} title="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={<Italic className="w-3.5 h-3.5" />} title="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={<Underline className="w-3.5 h-3.5" />} title="Underline" onClick={() => exec("underline")} />
        <Divider />
        <ToolbarButton icon={<Heading1 className="w-3.5 h-3.5" />} title="Heading 1" onClick={() => exec("formatBlock", "h2")} />
        <ToolbarButton icon={<Heading2 className="w-3.5 h-3.5" />} title="Heading 2" onClick={() => exec("formatBlock", "h3")} />
        <Divider />
        <ToolbarButton icon={<List className="w-3.5 h-3.5" />} title="Bullet List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={<ListOrdered className="w-3.5 h-3.5" />} title="Numbered List" onClick={() => exec("insertOrderedList")} />
        <Divider />
        <ToolbarButton icon={<Link className="w-3.5 h-3.5" />} title="Insert Link" onClick={handleLink} />
        <ToolbarButton icon={<RemoveFormatting className="w-3.5 h-3.5" />} title="Clear Formatting" onClick={() => exec("removeFormat")} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="px-4 py-3 text-sm text-foreground leading-relaxed focus:outline-none prose prose-sm max-w-none
          [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-text-tertiary [&:empty]:before:pointer-events-none"
        data-placeholder={placeholder}
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || "") }}
      />
    </div>
  );
}

// ── Toolbar Components ───────────────────────────────────────

function ToolbarButton({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md text-text-tertiary hover:text-foreground hover:bg-surface transition-colors cursor-pointer"
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border-light mx-0.5" />;
}
