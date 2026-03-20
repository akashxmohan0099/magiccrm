"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { TeamRole } from "@/types/models";
import { Button } from "@/components/ui/Button";

interface TeamMemberFormProps {
  open: boolean;
  onClose: () => void;
}

export function TeamMemberForm({ open, onClose }: TeamMemberFormProps) {
  const { addMember } = useTeamStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [title, setTitle] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    addMember({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      title: title.trim() || undefined,
      status: "invited",
    });
    setName(""); setEmail(""); setPhone(""); setRole("staff"); setTitle("");
    onClose();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">Invite Team Member</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Johnson" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Job Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Stylist, Office Manager" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className={inputClass}>
              <option value="staff">Staff — can use assigned modules</option>
              <option value="admin">Admin — can manage settings and team</option>
              <option value="owner">Owner — full access to everything</option>
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">Send Invite</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
