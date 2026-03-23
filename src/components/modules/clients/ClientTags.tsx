"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface ClientTagsProps {
  clientId: string;
}

export function ClientTags({ clientId }: ClientTagsProps) {
  const { getClient, updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const client = getClient(clientId);
  if (!client) return null;

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || client.tags.includes(tag)) {
      setNewTag("");
      return;
    }
    updateClient(clientId, { tags: [...client.tags, tag] }, workspaceId ?? undefined);
    setNewTag("");
    setIsAdding(false);
  };

  const handleRemoveTag = (tag: string) => {
    updateClient(clientId, {
      tags: client.tags.filter((t) => t !== tag),
    }, workspaceId ?? undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === "Escape") {
      setNewTag("");
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">Tags</h4>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tag
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {client.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-foreground border border-foreground/20"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-foreground/70 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {client.tags.length === 0 && !isAdding && (
          <p className="text-xs text-text-secondary">No tags added yet.</p>
        )}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter tag name..."
            autoFocus
            className="flex-1 px-3 py-1.5 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground"
          />
          <Button size="sm" onClick={handleAddTag}>
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewTag("");
              setIsAdding(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
