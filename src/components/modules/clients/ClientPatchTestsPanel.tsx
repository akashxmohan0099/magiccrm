"use client";

import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import type { Client, ClientPatchTest } from "@/types/models";
import { useClientsStore } from "@/store/clients";
import { useAuth } from "@/hooks/useAuth";
import { generateId } from "@/lib/id";

export function ClientPatchTestsPanel({ client }: { client: Client }) {
  const { updateClient } = useClientsStore();
  const { workspaceId } = useAuth();
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("");
  const [testedAt, setTestedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState("");

  const tests = client.patchTests ?? [];

  const inputClass =
    "w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-primary/20";

  const save = () => {
    const trimmed = category.trim();
    if (!trimmed || !testedAt) return;
    const next: ClientPatchTest[] = [
      ...tests,
      {
        id: generateId(),
        category: trimmed.toLowerCase().replace(/\s+/g, "_"),
        testedAt,
        result: result.trim() || undefined,
      },
    ];
    updateClient(client.id, { patchTests: next }, workspaceId || undefined);
    setCategory("");
    setResult("");
    setTestedAt(new Date().toISOString().slice(0, 10));
    setAdding(false);
  };

  const remove = (id: string) => {
    updateClient(
      client.id,
      { patchTests: tests.filter((t) => t.id !== id) },
      workspaceId || undefined,
    );
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Patch tests
        </h4>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[12px] text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Log test
          </button>
        )}
      </div>

      {tests.length === 0 && !adding && (
        <p className="text-[12px] text-text-tertiary">No patch tests on file.</p>
      )}

      {tests.length > 0 && (
        <div className="space-y-1.5">
          {tests
            .slice()
            .sort((a, b) => b.testedAt.localeCompare(a.testedAt))
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-[12px] bg-card-bg border border-border-light rounded-lg px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <span className="font-medium capitalize">{t.category.replace(/_/g, " ")}</span>
                  <span className="text-text-tertiary ml-2 tabular-nums">{t.testedAt}</span>
                  {t.result && <span className="text-text-secondary ml-2 truncate">{t.result}</span>}
                </div>
                <button
                  onClick={() => remove(t.id)}
                  className="p-1 text-text-tertiary hover:text-red-500 cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
        </div>
      )}

      {adding && (
        <div className="mt-3 bg-card-bg border border-border-light rounded-lg p-3 space-y-2">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (color, lash_glue, brow_tint, …)"
            className={inputClass}
            autoFocus
          />
          <input
            type="date"
            value={testedAt}
            onChange={(e) => setTestedAt(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="Result (no reaction)"
            className={inputClass}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setAdding(false);
                setCategory("");
                setResult("");
              }}
              className="px-3 py-1.5 text-[12px] text-text-secondary hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!category.trim()}
              className="px-3 py-1.5 text-[12px] font-medium bg-primary text-white rounded-lg cursor-pointer disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
