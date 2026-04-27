"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Crown,
  Users,
  Zap,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useMembershipsStore } from "@/store/memberships";
import { useClientsStore } from "@/store/clients";
import { useServicesStore } from "@/store/services";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function MembershipsPage() {
  const { plans, memberships, addPlan, deletePlan, addMembership, updateMembership, recordSession } = useMembershipsStore();
  const { clients } = useClientsStore();
  const { services } = useServicesStore();

  const [tab, setTab] = useState<"plans" | "members">("plans");
  const [search, setSearch] = useState("");
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [detailMembershipId, setDetailMembershipId] = useState<string | null>(null);

  // Plan form
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planServiceIds, setPlanServiceIds] = useState<string[]>([]);
  const [planSessions, setPlanSessions] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planCycle, setPlanCycle] = useState<"weekly" | "monthly">("monthly");

  // Add member form
  const [memberClientId, setMemberClientId] = useState("");
  const [memberPlanId, setMemberPlanId] = useState("");

  const filteredPlans = useMemo(() => {
    if (!search.trim()) return plans;
    const q = search.toLowerCase();
    return plans.filter((p) => p.name.toLowerCase().includes(q));
  }, [plans, search]);

  const filteredMemberships = useMemo(() => {
    if (!search.trim()) return memberships;
    const q = search.toLowerCase();
    return memberships.filter((m) => {
      const client = clients.find((c) => c.id === m.clientId);
      const plan = plans.find((p) => p.id === m.planId);
      return (client?.name.toLowerCase().includes(q)) || (plan?.name.toLowerCase().includes(q));
    });
  }, [memberships, search, clients, plans]);

  const detailMembership = detailMembershipId ? memberships.find((m) => m.id === detailMembershipId) : null;

  const resetPlanForm = () => {
    setPlanName(""); setPlanDesc(""); setPlanServiceIds([]); setPlanSessions(""); setPlanPrice(""); setPlanCycle("monthly");
  };

  const handleCreatePlan = () => {
    if (!planName.trim()) { toast("Plan name is required", "error"); return; }
    addPlan({
      workspaceId: "",
      name: planName.trim(),
      description: planDesc.trim(),
      serviceIds: planServiceIds,
      sessionsPerPeriod: Number(planSessions) || 0,
      price: Number(planPrice) || 0,
      billingCycle: planCycle,
      enabled: true,
    });
    setCreatePlanOpen(false);
    resetPlanForm();
  };

  const handleAddMember = () => {
    if (!memberClientId) { toast("Select a client", "error"); return; }
    if (!memberPlanId) { toast("Select a plan", "error"); return; }
    const now = new Date().toISOString();
    const plan = plans.find((p) => p.id === memberPlanId);
    const nextRenewal = new Date();
    if (plan?.billingCycle === "weekly") nextRenewal.setDate(nextRenewal.getDate() + 7);
    else nextRenewal.setMonth(nextRenewal.getMonth() + 1);

    addMembership({
      workspaceId: "",
      clientId: memberClientId,
      planId: memberPlanId,
      status: "active",
      sessionsUsed: 0,
      currentPeriodStart: now,
      nextRenewalDate: nextRenewal.toISOString(),
    });
    setAddMemberOpen(false);
    setMemberClientId(""); setMemberPlanId("");
  };

  const toggleService = (id: string) => {
    setPlanServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <PageHeader
        title="Memberships"
        description="Manage membership plans and subscriptions."
        actions={
          tab === "plans" ? (
            <Button size="sm" onClick={() => setCreatePlanOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create Plan
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAddMemberOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Member
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border-light">
        {(["plans", "members"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSearch(""); }}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              tab === t ? "border-foreground text-foreground" : "border-transparent text-text-secondary hover:text-foreground"
            }`}>
            {t === "plans" ? "Plans" : "Members"}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === "plans" ? plans.length : memberships.length) > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder={tab === "plans" ? "Search plans..." : "Search members..."} />
        </div>
      )}

      {/* Plans Tab */}
      {tab === "plans" && (
        plans.length === 0 ? (
          <EmptyState
            icon={<Crown className="w-6 h-6" />}
            title="No plans yet"
            description="Create your first membership plan."
            actionLabel="Create Plan"
            onAction={() => setCreatePlanOpen(true)}
          />
        ) : filteredPlans.length === 0 ? (
          <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
            <p className="text-[14px] text-text-tertiary">No plans match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const planServices = services.filter((s) => plan.serviceIds.includes(s.id));
              const activeMemberships = memberships.filter((m) => m.planId === plan.id && m.status === "active").length;
              return (
                <div key={plan.id} className="bg-card-bg border border-border-light rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">{plan.name}</h3>
                      {plan.description && <p className="text-[12px] text-text-secondary mt-0.5">{plan.description}</p>}
                    </div>
                    <button onClick={() => deletePlan(plan.id)} className="p-1.5 text-text-tertiary hover:text-red-500 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(plan.price)}</span>
                    <span className="text-[12px] text-text-tertiary">/ {plan.billingCycle}</span>
                  </div>
                  <div className="space-y-1.5 text-[13px]">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Zap className="w-3.5 h-3.5" /> {plan.sessionsPerPeriod} sessions per {plan.billingCycle === "weekly" ? "week" : "month"}
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Users className="w-3.5 h-3.5" /> {activeMemberships} active member{activeMemberships !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {planServices.length > 0 && (
                    <div className="pt-2 border-t border-border-light">
                      <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {planServices.map((s) => (
                          <span key={s.id} className="px-2 py-0.5 bg-surface rounded-full text-[11px] text-text-secondary">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Members Tab */}
      {tab === "members" && (
        memberships.length === 0 ? (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No members yet"
            description="Add your first membership to get started."
            actionLabel="Add Member"
            onAction={() => setAddMemberOpen(true)}
          />
        ) : filteredMemberships.length === 0 ? (
          <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
            <p className="text-[14px] text-text-tertiary">No members match your search.</p>
          </div>
        ) : (
          <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_120px_100px_120px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Plan</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Sessions</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</span>
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Renewal</span>
            </div>
            <div className="divide-y divide-border-light">
              {filteredMemberships.map((m) => {
                const client = clients.find((c) => c.id === m.clientId);
                const plan = plans.find((p) => p.id === m.planId);
                return (
                  <div key={m.id} onClick={() => setDetailMembershipId(m.id)}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_100px_120px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors cursor-pointer">
                    <span className="text-[14px] font-medium text-foreground truncate">{client?.name || "---"}</span>
                    <span className="text-[13px] text-text-secondary truncate">{plan?.name || "---"}</span>
                    <span className="text-[13px] text-foreground">{m.sessionsUsed} / {plan?.sessionsPerPeriod ?? "---"}</span>
                    <div><StatusBadge status={m.status} /></div>
                    <span className="text-[12px] text-text-tertiary">{m.nextRenewalDate ? formatDate(m.nextRenewalDate) : "---"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* Create Plan SlideOver */}
      <SlideOver open={createPlanOpen} onClose={() => { setCreatePlanOpen(false); resetPlanForm(); }} title="Create Plan">
        <div className="space-y-5">
          <Field label="Plan Name" required>
            <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Gold Membership"
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
          </Field>
          <Field label="Description">
            <textarea value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} rows={2} placeholder="Plan description..."
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10 resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sessions per Period">
              <input type="number" value={planSessions} onChange={(e) => setPlanSessions(e.target.value)} placeholder="e.g. 4" min={0}
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
            </Field>
            <Field label="Price ($)">
              <input type="number" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} placeholder="0.00" min={0}
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10" />
            </Field>
          </div>
          <Field label="Billing Cycle">
            <select value={planCycle} onChange={(e) => setPlanCycle(e.target.value as "weekly" | "monthly")}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          {services.length > 0 && (
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Included Services</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {services.filter((s) => s.enabled).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer text-[13px] text-foreground">
                    <input type="checkbox" checked={planServiceIds.includes(s.id)} onChange={() => toggleService(s.id)}
                      className="rounded border-border-light" />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => { setCreatePlanOpen(false); resetPlanForm(); }}>Cancel</Button>
            <Button onClick={handleCreatePlan}><Plus className="w-4 h-4 mr-1.5" /> Create Plan</Button>
          </div>
        </div>
      </SlideOver>

      {/* Add Member SlideOver */}
      <SlideOver open={addMemberOpen} onClose={() => { setAddMemberOpen(false); setMemberClientId(""); setMemberPlanId(""); }} title="Add Member">
        <div className="space-y-5">
          <Field label="Client" required>
            <select value={memberClientId} onChange={(e) => setMemberClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Plan" required>
            <select value={memberPlanId} onChange={(e) => setMemberPlanId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10">
              <option value="">Select plan...</option>
              {plans.filter((p) => p.enabled).map((p) => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)}/{p.billingCycle}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => { setAddMemberOpen(false); setMemberClientId(""); setMemberPlanId(""); }}>Cancel</Button>
            <Button onClick={handleAddMember}><Plus className="w-4 h-4 mr-1.5" /> Add Member</Button>
          </div>
        </div>
      </SlideOver>

      {/* Member Detail SlideOver */}
      <SlideOver open={!!detailMembership} onClose={() => setDetailMembershipId(null)} title="Membership Details">
        {detailMembership && (() => {
          const client = clients.find((c) => c.id === detailMembership.clientId);
          const plan = plans.find((p) => p.id === detailMembership.planId);
          return (
            <div className="space-y-6">
              <div className="bg-surface rounded-xl p-5 text-center">
                <p className="text-[15px] font-semibold text-foreground">{client?.name || "---"}</p>
                <p className="text-[13px] text-text-secondary mt-0.5">{plan?.name || "---"}</p>
                <div className="mt-2"><StatusBadge status={detailMembership.status} /></div>
              </div>

              <div className="bg-surface rounded-xl p-4">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Session Usage</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-foreground">{detailMembership.sessionsUsed}</span>
                  <span className="text-[14px] text-text-tertiary mb-0.5">/ {plan?.sessionsPerPeriod ?? "---"}</span>
                </div>
                {plan && (
                  <div className="mt-2 w-full bg-border-light rounded-full h-2">
                    <div className="bg-foreground rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, (detailMembership.sessionsUsed / plan.sessionsPerPeriod) * 100)}%` }} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <DetailRow label="Status" value={detailMembership.status} />
                <DetailRow label="Period Start" value={formatDate(detailMembership.currentPeriodStart)} />
                {detailMembership.nextRenewalDate && <DetailRow label="Next Renewal" value={formatDate(detailMembership.nextRenewalDate)} />}
                <DetailRow label="Member Since" value={formatDate(detailMembership.createdAt)} />
              </div>

              <div className="space-y-2 pt-3 border-t border-border-light">
                {detailMembership.status === "active" && (
                  <>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => recordSession(detailMembership.id)}>
                      <Zap className="w-4 h-4 mr-2" /> Record Session
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" onClick={() => {
                      updateMembership(detailMembership.id, { status: "paused" });
                      toast("Membership paused");
                    }}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Pause Membership
                    </Button>
                    <Button variant="danger" className="w-full justify-start" onClick={() => {
                      updateMembership(detailMembership.id, { status: "cancelled" });
                      toast("Membership cancelled");
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Cancel Membership
                    </Button>
                  </>
                )}
                {detailMembership.status === "paused" && (
                  <Button variant="secondary" className="w-full justify-start" onClick={() => {
                    updateMembership(detailMembership.id, { status: "active" });
                    toast("Membership resumed");
                  }}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Resume Membership
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </SlideOver>
    </div>
  );
}

// ── Helpers ──

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px] font-medium text-text-tertiary">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
