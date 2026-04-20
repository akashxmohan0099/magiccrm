"use client";

import { useState, useMemo } from "react";
import {
  Gift,
  Star,
  Users,
  Settings,
  Plus,
  Trophy,
  Award,
  Copy,
  Link,
} from "lucide-react";
import { useLoyaltyStore } from "@/store/loyalty";
import { useClientsStore } from "@/store/clients";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { SlideOver } from "@/components/ui/SlideOver";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

const PAGE_TABS = [
  { id: "loyalty", label: "Loyalty" },
  { id: "referrals", label: "Referrals" },
];

export function LoyaltyPage() {
  const {
    config,
    balances,
    referralCodes,
    updateConfig,
    awardPoints,
    createReferralCode,
  } = useLoyaltyStore();
  const { clients } = useClientsStore();

  const [activeTab, setActiveTab] = useState("loyalty");
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [referralSearch, setReferralSearch] = useState("");

  // Config editing
  const [editingConfig, setEditingConfig] = useState(false);
  const [configPointsPerBooking, setConfigPointsPerBooking] = useState(String(config.pointsPerBooking));
  const [configRedemptionThreshold, setConfigRedemptionThreshold] = useState(String(config.redemptionThreshold));

  // Award points slide-over
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardClientId, setAwardClientId] = useState("");
  const [awardPointsValue, setAwardPointsValue] = useState("");

  // Create referral code slide-over
  const [createCodeOpen, setCreateCodeOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  // --- Computed ---

  const leaderboard = useMemo(() => {
    // Build a list of all clients that have loyalty balances, merged with client info
    const entries: {
      clientId: string;
      name: string;
      email: string;
      totalEarned: number;
      totalRedeemed: number;
      balance: number;
    }[] = [];

    // Include clients with balances
    for (const [clientId, bal] of Object.entries(balances)) {
      const client = clients.find((c) => c.id === clientId);
      entries.push({
        clientId,
        name: client?.name || "Unknown Client",
        email: client?.email || "",
        totalEarned: bal.totalEarned,
        totalRedeemed: bal.totalRedeemed,
        balance: bal.balance,
      });
    }

    // Sort by balance descending
    entries.sort((a, b) => b.balance - a.balance);

    // Apply search filter
    if (loyaltySearch.trim()) {
      const q = loyaltySearch.toLowerCase();
      return entries.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [balances, clients, loyaltySearch]);

  const filteredReferralCodes = useMemo(() => {
    let result = [...referralCodes];
    if (referralSearch.trim()) {
      const q = referralSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q)
      );
    }
    // Sort by referrals made descending
    result.sort((a, b) => b.referralsMade - a.referralsMade);
    return result;
  }, [referralCodes, referralSearch]);

  // Clients who don't already have a referral code
  const clientsWithoutCode = useMemo(() => {
    const existingIds = new Set(referralCodes.map((r) => r.clientId));
    return clients.filter((c) => !existingIds.has(c.id));
  }, [clients, referralCodes]);

  // --- Handlers ---

  const handleSaveConfig = () => {
    const ppb = Number(configPointsPerBooking);
    const rt = Number(configRedemptionThreshold);
    if (ppb < 0 || rt < 1) {
      toast("Please enter valid values", "error");
      return;
    }
    updateConfig({ pointsPerBooking: ppb, redemptionThreshold: rt });
    setEditingConfig(false);
  };

  const handleCancelConfig = () => {
    setConfigPointsPerBooking(String(config.pointsPerBooking));
    setConfigRedemptionThreshold(String(config.redemptionThreshold));
    setEditingConfig(false);
  };

  const openAwardForClient = (clientId: string) => {
    setAwardClientId(clientId);
    setAwardPointsValue("");
    setAwardOpen(true);
  };

  const handleAwardPoints = () => {
    const points = Number(awardPointsValue);
    if (!awardClientId || !points || points <= 0) {
      toast("Please select a client and enter valid points", "error");
      return;
    }
    awardPoints(awardClientId, points);
    const client = clients.find((c) => c.id === awardClientId);
    toast(`Awarded ${points} points to ${client?.name || "client"}`);
    setAwardOpen(false);
    setAwardClientId("");
    setAwardPointsValue("");
  };

  const handleCreateCode = () => {
    if (!selectedClientId) {
      toast("Please select a client", "error");
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    createReferralCode(client.id, client.name, "");
    setCreateCodeOpen(false);
    setSelectedClientId("");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast("Referral code copied");
  };

  // --- Render ---

  return (
    <div>
      <PageHeader
        title="Loyalty & Referrals"
        description="Reward loyal clients and track referral programs."
      />

      <Tabs tabs={PAGE_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "loyalty" && (
        <div className="space-y-6">
          {/* Config Section */}
          <div className="bg-card-bg border border-border-light rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-[14px] font-semibold text-foreground">Loyalty Settings</h3>
              </div>
              {!editingConfig ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfigPointsPerBooking(String(config.pointsPerBooking));
                    setConfigRedemptionThreshold(String(config.redemptionThreshold));
                    setEditingConfig(true);
                  }}
                >
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelConfig}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveConfig}>
                    Save
                  </Button>
                </div>
              )}
            </div>

            {editingConfig ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Points Per Booking
                  </label>
                  <input
                    type="number"
                    value={configPointsPerBooking}
                    onChange={(e) => setConfigPointsPerBooking(e.target.value)}
                    min={0}
                    className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Redemption Threshold (pts)
                  </label>
                  <input
                    type="number"
                    value={configRedemptionThreshold}
                    onChange={(e) => setConfigRedemptionThreshold(e.target.value)}
                    min={1}
                    className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                  />
                  <p className="text-[11px] text-text-tertiary mt-1">
                    Clients need this many points before they can redeem.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Points Per Booking
                  </p>
                  <p className="text-xl font-bold text-foreground">{config.pointsPerBooking}</p>
                </div>
                <div className="bg-surface rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                    Redemption Threshold
                  </p>
                  <p className="text-xl font-bold text-foreground">{config.redemptionThreshold} pts</p>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-[14px] font-semibold text-foreground">Points Leaderboard</h3>
              </div>
              <div className="flex items-center gap-2">
                <SearchInput
                  value={loyaltySearch}
                  onChange={setLoyaltySearch}
                  placeholder="Search clients..."
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAwardClientId("");
                    setAwardPointsValue("");
                    setAwardOpen(true);
                  }}
                >
                  <Award className="w-4 h-4 mr-1.5" /> Award Points
                </Button>
              </div>
            </div>

            {leaderboard.length === 0 && !loyaltySearch ? (
              <EmptyState
                icon={<Star className="w-6 h-6" />}
                title="No loyalty points yet"
                description="Award points to your clients when they complete bookings."
                actionLabel="Award Points"
                onAction={() => setAwardOpen(true)}
              />
            ) : leaderboard.length === 0 ? (
              <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
                <p className="text-[14px] text-text-tertiary">No clients match your search.</p>
              </div>
            ) : (
              <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-[40px_1fr_100px_100px_100px_80px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">#</span>
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</span>
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Earned</span>
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Redeemed</span>
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Balance</span>
                  <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider"></span>
                </div>

                <div className="divide-y divide-border-light">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={entry.clientId}
                      className="grid grid-cols-1 sm:grid-cols-[40px_1fr_100px_100px_100px_80px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors group"
                    >
                      <div className="flex items-center">
                        <span className={`text-[13px] font-bold ${
                          idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-text-tertiary"
                        }`}>
                          {idx + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-foreground truncate">{entry.name}</p>
                        {entry.email && (
                          <p className="text-[12px] text-text-tertiary truncate">{entry.email}</p>
                        )}
                      </div>
                      <span className="text-[13px] text-text-secondary text-right">{entry.totalEarned}</span>
                      <span className="text-[13px] text-text-secondary text-right">{entry.totalRedeemed}</span>
                      <span className="text-[13px] font-semibold text-foreground text-right">{entry.balance}</span>
                      <div className="flex justify-end">
                        <button
                          onClick={() => openAwardForClient(entry.clientId)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-foreground hover:bg-surface cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Award points"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "referrals" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-text-tertiary" />
              <h3 className="text-[14px] font-semibold text-foreground">Referral Codes</h3>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                value={referralSearch}
                onChange={setReferralSearch}
                placeholder="Search by name or code..."
              />
              <Button
                size="sm"
                onClick={() => {
                  setSelectedClientId("");
                  setCreateCodeOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Code
              </Button>
            </div>
          </div>

          {/* Referral Codes List */}
          {referralCodes.length === 0 && !referralSearch ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No referral codes yet"
              description="Create referral codes for your clients to share with friends."
              actionLabel="Create Code"
              onAction={() => setCreateCodeOpen(true)}
            />
          ) : filteredReferralCodes.length === 0 ? (
            <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
              <p className="text-[14px] text-text-tertiary">No referral codes match your search.</p>
            </div>
          ) : (
            <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="hidden sm:grid sm:grid-cols-[40px_1fr_140px_120px_120px_60px] gap-4 px-5 py-3 border-b border-border-light bg-surface/50">
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">#</span>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Client</span>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Code</span>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Referrals</span>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-right">Rewards</span>
                <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider"></span>
              </div>

              <div className="divide-y divide-border-light">
                {filteredReferralCodes.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className="grid grid-cols-1 sm:grid-cols-[40px_1fr_140px_120px_120px_60px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors group"
                  >
                    <div className="flex items-center">
                      <span className={`text-[13px] font-bold ${
                        idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-text-tertiary"
                      }`}>
                        {idx + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-foreground truncate">{ref.clientName}</p>
                      <p className="text-[11px] text-text-tertiary">
                        Created {new Date(ref.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-mono font-semibold text-foreground tracking-wide">
                        {ref.code}
                      </span>
                      <button
                        onClick={() => copyCode(ref.code)}
                        className="p-1 rounded text-text-tertiary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[13px] font-semibold text-foreground text-right">
                      {ref.referralsMade}
                    </span>
                    <span className="text-[13px] text-text-secondary text-right">
                      {ref.rewardsCredited}
                    </span>
                    <div />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referral Leaderboard Summary */}
          {referralCodes.length > 0 && (
            <div className="bg-card-bg border border-border-light rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-[14px] font-semibold text-foreground">Top Referrers</h3>
              </div>
              <div className="space-y-2">
                {[...referralCodes]
                  .sort((a, b) => b.referralsMade - a.referralsMade)
                  .slice(0, 5)
                  .map((ref, idx) => (
                    <div key={ref.id} className="flex items-center gap-3 py-2">
                      <span className={`w-6 text-center text-[13px] font-bold ${
                        idx === 0 ? "text-amber-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-700" : "text-text-tertiary"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{ref.clientName}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                        <Users className="w-3.5 h-3.5" />
                        {ref.referralsMade} referral{ref.referralsMade !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Award Points SlideOver ── */}
      <SlideOver
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
        title="Award Points"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              value={awardClientId}
              onChange={(e) => setAwardClientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Points <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={awardPointsValue}
              onChange={(e) => setAwardPointsValue(e.target.value)}
              placeholder="e.g. 50"
              min={1}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-foreground/10"
            />
            <p className="text-[11px] text-text-tertiary mt-1.5">
              Points will be added to the client&apos;s balance immediately.
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Quick Add</p>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((pts) => (
                <button
                  key={pts}
                  onClick={() => setAwardPointsValue(String(pts))}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    awardPointsValue === String(pts)
                      ? "bg-foreground text-background"
                      : "bg-surface text-text-secondary hover:text-foreground border border-border-light"
                  }`}
                >
                  {pts} pts
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => setAwardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAwardPoints}>
              <Award className="w-4 h-4 mr-1.5" /> Award Points
            </Button>
          </div>
        </div>
      </SlideOver>

      {/* ── Create Referral Code SlideOver ── */}
      <SlideOver
        open={createCodeOpen}
        onClose={() => setCreateCodeOpen(false)}
        title="Create Referral Code"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Client <span className="text-red-500">*</span>
            </label>
            {clientsWithoutCode.length > 0 ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
              >
                <option value="">Select a client...</option>
                {clientsWithoutCode.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-surface rounded-xl p-4 text-center">
                <p className="text-[13px] text-text-tertiary">
                  {clients.length === 0
                    ? "No clients found. Clients are created when bookings are made."
                    : "All clients already have referral codes."}
                </p>
              </div>
            )}
            <p className="text-[11px] text-text-tertiary mt-1.5">
              A unique referral code will be generated for the selected client.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button variant="ghost" onClick={() => setCreateCodeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCode} disabled={!selectedClientId}>
              <Gift className="w-4 h-4 mr-1.5" /> Generate Code
            </Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
