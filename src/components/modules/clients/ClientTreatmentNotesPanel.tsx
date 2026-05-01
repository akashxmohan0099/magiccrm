"use client";

import { useState } from "react";
import { Plus, Lock, FileText } from "lucide-react";
import { useTreatmentNotesStore } from "@/store/treatment-notes";
import { useAuth } from "@/hooks/useAuth";

export function ClientTreatmentNotesPanel({ clientId }: { clientId: string }) {
  const { notes, addNote, lockNote, amendNote, updateNote } = useTreatmentNotesStore();
  const { workspaceId } = useAuth();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [amending, setAmending] = useState<string | null>(null);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amendmentDelta, setAmendmentDelta] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  const clientNotes = notes
    .filter((n) => n.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const inputClass =
    "w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-primary/20";

  const save = () => {
    if (!draft.subjective && !draft.objective && !draft.assessment && !draft.plan) return;
    addNote(
      {
        workspaceId: workspaceId ?? "",
        clientId,
        subjective: draft.subjective || undefined,
        objective: draft.objective || undefined,
        assessment: draft.assessment || undefined,
        plan: draft.plan || undefined,
      },
      workspaceId || undefined,
    );
    setDraft({ subjective: "", objective: "", assessment: "", plan: "" });
    setAdding(false);
  };

  const startAmend = (id: string, current: { subjective?: string; objective?: string; assessment?: string; plan?: string }) => {
    setAmending(id);
    setAmendmentReason("");
    setAmendmentDelta({
      subjective: current.subjective ?? "",
      objective: current.objective ?? "",
      assessment: current.assessment ?? "",
      plan: current.plan ?? "",
    });
  };

  const saveAmend = () => {
    if (!amending || !amendmentReason.trim()) return;
    amendNote(
      amending,
      {
        reason: amendmentReason.trim(),
        delta: {
          subjective: amendmentDelta.subjective || undefined,
          objective: amendmentDelta.objective || undefined,
          assessment: amendmentDelta.assessment || undefined,
          plan: amendmentDelta.plan || undefined,
        },
      },
      workspaceId || undefined,
    );
    setAmending(null);
    setAmendmentReason("");
  };

  return (
    <div className="bg-surface rounded-lg p-4 border border-border-light">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Treatment notes
        </h4>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[12px] text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New note
          </button>
        )}
      </div>

      {clientNotes.length === 0 && !adding && (
        <p className="text-[12px] text-text-tertiary">No notes yet.</p>
      )}

      {adding && (
        <div className="bg-card-bg border border-border-light rounded-lg p-3 space-y-2 mb-3">
          {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] uppercase tracking-wider text-text-tertiary block mb-1">
                {field}
              </label>
              <textarea
                value={draft[field]}
                onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-[12px] text-text-secondary hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-3 py-1.5 text-[12px] font-medium bg-primary text-white rounded-lg cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {clientNotes.map((n) => (
          <div
            key={n.id}
            className="bg-card-bg border border-border-light rounded-lg p-3 text-[12px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-tertiary tabular-nums">
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-1.5">
                {n.locked ? (
                  <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => lockNote(n.id, workspaceId || undefined)}
                      className="text-[11px] text-text-tertiary hover:text-foreground cursor-pointer"
                    >
                      Lock
                    </button>
                    <button
                      onClick={() => {
                        // Allow inline edit for unlocked notes via updateNote.
                        const next = window.prompt("Edit Plan:", n.plan ?? "");
                        if (next !== null)
                          updateNote(n.id, { plan: next }, workspaceId || undefined);
                      }}
                      className="text-[11px] text-text-tertiary hover:text-foreground cursor-pointer"
                    >
                      Edit
                    </button>
                  </>
                )}
                {n.locked && (
                  <button
                    onClick={() => startAmend(n.id, n)}
                    className="text-[11px] text-primary hover:underline cursor-pointer"
                  >
                    Amend
                  </button>
                )}
              </div>
            </div>
            {(["subjective", "objective", "assessment", "plan"] as const).map((field) =>
              n[field] ? (
                <p key={field} className="mb-1">
                  <span className="font-semibold uppercase text-[10px] tracking-wider text-text-tertiary mr-1">
                    {field[0]}:
                  </span>
                  {n[field]}
                </p>
              ) : null,
            )}
            {n.amendments && n.amendments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border-light text-text-tertiary">
                <p className="text-[10px] uppercase tracking-wider mb-1">Amendments</p>
                {n.amendments.map((a) => (
                  <p key={a.id} className="text-[11px]">
                    <span className="tabular-nums">{new Date(a.createdAt).toLocaleDateString()}</span>{" "}
                    — {a.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {amending && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card-bg rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h4 className="text-[14px] font-semibold">Amend note</h4>
            <input
              type="text"
              value={amendmentReason}
              onChange={(e) => setAmendmentReason(e.target.value)}
              placeholder="Reason for amendment"
              className={inputClass}
              autoFocus
            />
            {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
              <div key={field}>
                <label className="text-[10px] uppercase tracking-wider text-text-tertiary block mb-1">
                  {field}
                </label>
                <textarea
                  value={amendmentDelta[field]}
                  onChange={(e) =>
                    setAmendmentDelta((d) => ({ ...d, [field]: e.target.value }))
                  }
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAmending(null)}
                className="px-3 py-1.5 text-[12px] text-text-secondary hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveAmend}
                disabled={!amendmentReason.trim()}
                className="px-3 py-1.5 text-[12px] font-medium bg-primary text-white rounded-lg cursor-pointer disabled:opacity-40"
              >
                Save amendment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
