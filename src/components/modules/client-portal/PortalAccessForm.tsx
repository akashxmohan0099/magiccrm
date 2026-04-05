"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useClientPortalStore } from "@/store/client-portal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface PortalAccessFormProps { open: boolean; onClose: () => void; }

export function PortalAccessForm({ open, onClose }: PortalAccessFormProps) {
  const { grantAccess } = useClientPortalStore();
  const { workspaceId } = useAuth();
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim()) return;
    grantAccess({ clientId: "", clientName: clientName.trim(), email: email.trim() }, workspaceId ?? undefined);
    setClientName(""); setEmail("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">Grant Portal Access</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Client Name *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" required className={inputClass} />
          </div>
          <div className="bg-surface rounded-xl border border-border-light p-3">
            <p className="text-xs text-text-secondary">The client will receive an email with a link to access their portal.</p>
          </div>
          <div className="pt-2"><Button type="submit" className="w-full">Grant Access</Button></div>
        </form>
      </div>
    </div>
  );
}
