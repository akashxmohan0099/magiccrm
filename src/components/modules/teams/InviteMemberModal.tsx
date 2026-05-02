"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { TeamRole } from "@/types/models";
import { useTeamStore } from "@/store/team";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";

export function InviteMemberModal({
  open,
  onClose,
  workspaceId,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [submitting, setSubmitting] = useState(false);

  // Reset on open. Render-phase state sync (cheaper than useEffect for this
  // open/close edge — React will re-render with fresh values on the same tick).
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName("");
      setEmail("");
      setRole("staff");
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email.trim()) && !submitting;

  const handleSend = async () => {
    if (!canSubmit || !workspaceId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          role,
          workspaceId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast(json.error || "Failed to send invite");
        setSubmitting(false);
        return;
      }
      toast(`Invite sent to ${email.trim()}`);
      await useTeamStore.getState().loadFromSupabase(workspaceId);
      onClose();
    } catch (err) {
      console.error(err);
      toast("Failed to send invite");
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Invite team member">
      <div className="space-y-4">
        <p className="text-[13px] text-text-secondary">
          We&apos;ll email them a sign-in link. They&apos;ll add their photo, bio, working hours, and socials themselves.
        </p>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoFocus
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleSend(); }}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Role</p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="flex-1" onClick={handleSend} disabled={!canSubmit}>
            <Send className="w-4 h-4 mr-1.5" />
            {submitting ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
