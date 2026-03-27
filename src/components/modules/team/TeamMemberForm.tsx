"use client";

import { useState, useMemo } from "react";
import { X, Shield, Zap } from "lucide-react";
import { useTeamStore } from "@/store/team";
import { TeamRole, TeamMember } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useEnabledModules, useEnabledAddons } from "@/hooks/useFeature";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/Toast";

interface TeamMemberFormProps {
  open: boolean;
  onClose: () => void;
  member?: TeamMember;
}

// Role templates — quick-select presets for module access
const ROLE_TEMPLATES: { label: string; description: string; moduleIds: string[] }[] = [
  {
    label: "Full Access",
    description: "All modules",
    moduleIds: [], // empty means all
  },
  {
    label: "Front of House",
    description: "Clients, Bookings, Communication, Products",
    moduleIds: ["client-database", "bookings-calendar", "communication", "products"],
  },
  {
    label: "Field Worker",
    description: "Jobs, Clients, Documents",
    moduleIds: ["jobs-projects", "client-database", "documents"],
  },
  {
    label: "Sales",
    description: "Leads, Clients, Communication, Billing",
    moduleIds: ["leads-pipeline", "client-database", "communication", "quotes-invoicing"],
  },
];

export function TeamMemberForm({ open, onClose, member }: TeamMemberFormProps) {
  const { addMember, updateMember, deleteMember, loadFromSupabase } = useTeamStore();
  const { workspaceId } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const enabledModules = useEnabledModules();
  const enabledAddons = useEnabledAddons();

  const allEnabledModules = useMemo(
    () => [...enabledModules, ...enabledAddons].filter((m) => m.id !== "team"), // don't show "Team" module in access list
    [enabledModules, enabledAddons]
  );

  const allModuleIds = useMemo(() => allEnabledModules.map((m) => m.id), [allEnabledModules]);

  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<TeamRole>(member?.role ?? "staff");
  const [title, setTitle] = useState(member?.title ?? "");
  const [moduleAccess, setModuleAccess] = useState<string[]>(
    member?.moduleAccess ?? [...allModuleIds] // default: all enabled modules
  );

  // Reset form when opened
  const resetForm = () => {
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setPhone(member?.phone ?? "");
    setRole(member?.role ?? "staff");
    setTitle(member?.title ?? "");
    setModuleAccess(member?.moduleAccess ?? [...allModuleIds]);
  };

  if (!open) return null;

  const isFullAccess = role === "owner" || role === "admin";

  const toggleModule = (moduleId: string) => {
    setModuleAccess((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const applyTemplate = (template: typeof ROLE_TEMPLATES[number]) => {
    if (template.moduleIds.length === 0) {
      // Full Access
      setModuleAccess([...allModuleIds]);
    } else {
      // Filter to only modules that are actually enabled
      setModuleAccess(template.moduleIds.filter((id) => allModuleIds.includes(id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = "Enter a valid email";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const data = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      title: title.trim() || undefined,
      status: member?.status ?? ("invited" as const),
      moduleAccess: isFullAccess ? undefined : moduleAccess, // owners/admins get all
    };

    if (member) {
      updateMember(member.id, data, workspaceId ?? undefined);
      resetForm();
      onClose();
      setSaving(false);
    } else {
      if (workspaceId) {
        try {
          const res = await fetch("/api/auth/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.email,
              name: data.name,
              role: data.role,
              workspaceId,
              moduleAccess: data.moduleAccess,
            }),
          });

          const result = await res.json();
          if (!res.ok) {
            toast(result.error || "Failed to send invite", "error");
          } else {
            await loadFromSupabase(workspaceId);
            toast(`Invite sent to ${data.email}`, "success");
            resetForm();
            onClose();
          }
        } catch {
          toast("Failed to send invite email", "error");
        }
      } else {
        addMember(data);
        resetForm();
        onClose();
      }
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">
            {member ? "Edit Team Member" : "Invite Team Member"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Name" required error={errors.name}>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => { const next = { ...prev }; delete next.name; return next; }); }} placeholder="e.g. Sarah Johnson" className={inputClass} />
          </FormField>
          <FormField label="Email" required error={errors.email}>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((prev) => { const next = { ...prev }; delete next.email; return next; }); }} placeholder="sarah@example.com" className={inputClass} />
          </FormField>
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

          {/* Module Access Section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-text-secondary" />
              <label className="text-[13px] font-semibold text-foreground">Module Access</label>
            </div>
            <p className="text-[11px] text-text-tertiary mb-3">
              {isFullAccess
                ? "Owners and Admins have access to all modules."
                : "Choose which modules this team member can see."}
            </p>

            {/* Role Templates (only for Staff) */}
            {!isFullAccess && (
              <div className="mb-3">
                <p className="text-[11px] font-medium text-text-secondary mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Quick templates
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_TEMPLATES.filter((tpl) => {
                    // Hide templates where none of their modules are enabled
                    if (tpl.moduleIds.length === 0) return true; // "Full Access" always shows
                    return tpl.moduleIds.some((id) => allModuleIds.includes(id));
                  }).map((tpl) => {
                    // Check if this template's modules match current selection
                    const tplIds = tpl.moduleIds.length === 0 ? allModuleIds : tpl.moduleIds.filter((id) => allModuleIds.includes(id));
                    const isActive = tplIds.length === moduleAccess.length && tplIds.every((id) => moduleAccess.includes(id));
                    return (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                          isActive
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-surface text-text-secondary border-border-light hover:border-primary/20 hover:text-foreground"
                        }`}
                        title={tpl.description}
                      >
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Module Checkboxes */}
            <div className="space-y-1 max-h-60 overflow-y-auto rounded-xl border border-border-light bg-surface/50 p-2">
              {allEnabledModules.map((mod) => {
                const checked = isFullAccess || moduleAccess.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                      isFullAccess ? "opacity-60" : "cursor-pointer hover:bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(mod.id)}
                      disabled={isFullAccess}
                      className="rounded border-border-light text-primary focus:ring-primary/20"
                    />
                    <span className="text-[13px] text-foreground">{mod.name}</span>
                    <span className="text-[10px] text-text-tertiary ml-auto">{mod.group}</span>
                  </label>
                );
              })}
            </div>
            {!isFullAccess && moduleAccess.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">Select at least one module for this team member.</p>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <Button type="submit" loading={saving} className="w-full">
              {member ? "Save Changes" : "Send Invite"}
            </Button>
            {member && member.role !== "owner" && (
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={() => setDeleteOpen(true)}
              >
                Remove Team Member
              </Button>
            )}
          </div>
        </form>

        <ConfirmDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            if (member) {
              deleteMember(member.id, workspaceId ?? undefined);
              setDeleteOpen(false);
              onClose();
            }
          }}
          title="Remove Team Member"
          message={`Are you sure you want to remove ${member?.name}? They will lose access to the workspace.`}
          confirmLabel="Remove"
          variant="danger"
        />
      </div>
    </div>
  );
}
