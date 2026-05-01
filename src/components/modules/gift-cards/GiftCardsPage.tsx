"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Ticket,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { useGiftCardStore } from "@/store/gift-cards";
import { useAuth } from "@/hooks/useAuth";
import { GiftCardStatus } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SlideOver } from "@/components/ui/SlideOver";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

const PRESET_AMOUNTS = [50, 100, 150];

const STATUS_FILTERS: { value: GiftCardStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "redeemed", label: "Redeemed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GiftCardsPage() {
  const { cards, addCard, redeemCard, getCard } = useGiftCardStore();
  const { workspaceId } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<GiftCardStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCardId, setDetailCardId] = useState<string | null>(null);

  // Create form state
  const [selectedPreset, setSelectedPreset] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Redeem state
  const [redeemAmount, setRedeemAmount] = useState("");

  // --- Computed ---

  const filteredCards = useMemo(() => {
    let result = cards;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          (c.purchaserName && c.purchaserName.toLowerCase().includes(q)) ||
          (c.recipientName && c.recipientName.toLowerCase().includes(q)) ||
          (c.purchaserEmail && c.purchaserEmail.toLowerCase().includes(q))
      );
    }
    return result;
  }, [cards, search, statusFilter]);

  const activeCards = cards.filter((c) => c.status === "active");
  const totalActiveValue = activeCards.reduce((sum, c) => sum + c.remainingBalance, 0);
  const redeemedCards = cards.filter((c) => c.status === "redeemed");

  const detailCard = detailCardId ? getCard(detailCardId) : null;

  // --- Handlers ---

  const resetCreateForm = () => {
    setSelectedPreset(100);
    setCustomAmount("");
    setPurchaserName("");
    setPurchaserEmail("");
    setRecipientName("");
    setRecipientEmail("");
    setExpiryDate("");
  };

  const handleCreate = () => {
    const amount = selectedPreset ?? Number(customAmount);
    if (!amount || amount <= 0) {
      toast("Please enter a valid amount", "error");
      return;
    }
    if (!purchaserName.trim()) {
      toast("Purchaser name is required", "error");
      return;
    }

    addCard(
      {
        workspaceId: workspaceId ?? "",
        originalAmount: amount,
        purchaserName: purchaserName.trim(),
        purchaserEmail: purchaserEmail.trim() || undefined,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        expiresAt: expiryDate || undefined,
      },
      workspaceId || undefined,
    );

    setCreateOpen(false);
    resetCreateForm();
  };

  const handleRedeem = () => {
    if (!detailCard) return;
    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) {
      toast("Please enter a valid amount", "error");
      return;
    }
    if (amount > detailCard.remainingBalance) {
      toast("Amount exceeds remaining balance", "error");
      return;
    }
    const result = redeemCard(detailCard.code, amount, workspaceId || undefined);
    if (result.success) {
      setRedeemAmount("");
      if (result.remaining <= 0) {
        setDetailCardId(null);
      }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast("Gift card code copied");
  };

  // --- Render ---

  return (
    <div>
      <PageHeader
        title="Gift Cards"
        description="Create and manage gift cards for your clients."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Gift Card
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          icon={<CreditCard className="w-5 h-5" />}
          label="Total Active"
          value={String(activeCards.length)}
          color="text-emerald-500"
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Total Value"
          value={formatCurrency(totalActiveValue)}
          color="text-blue-500"
        />
        <SummaryCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Redeemed"
          value={String(redeemedCards.length)}
          color="text-violet-500"
        />
      </div>

      {/* Filters */}
      {cards.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by code, name, or email..."
          />
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer ${
                  statusFilter === f.value
                    ? "bg-foreground text-background"
                    : "bg-surface text-text-secondary hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gift Cards List */}
      {cards.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-6 h-6" />}
          title="No gift cards yet"
          description="Create your first gift card to get started."
          actionLabel="Create Gift Card"
          onAction={() => setCreateOpen(true)}
        />
      ) : filteredCards.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
          <p className="text-[14px] text-text-tertiary">No gift cards match your search.</p>
        </div>
      ) : (
        <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
          {/* Table Header — px-5 py-4 to match the shared DataTable header. */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_100px_1fr_120px] gap-4 px-5 py-4 border-b border-border-light bg-surface/50">
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Code</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Amount</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Balance</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Status</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Purchaser</span>
            <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">Date</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-light">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  setDetailCardId(card.id);
                  setRedeemAmount("");
                }}
                className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_1fr_120px] gap-2 sm:gap-4 px-5 py-4 hover:bg-surface/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-mono font-semibold text-foreground tracking-wide">
                    {card.code}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(card.code);
                    }}
                    className="p-1 rounded text-text-tertiary hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[13px] font-medium text-foreground">
                  {formatCurrency(card.originalAmount)}
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {formatCurrency(card.remainingBalance)}
                </span>
                <div>
                  <StatusBadge status={card.status} />
                </div>
                <span className="text-[13px] text-text-secondary truncate">
                  {card.purchaserName || "---"}
                </span>
                <span className="text-[12px] text-text-tertiary">
                  {formatDate(card.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Gift Card SlideOver ── */}
      <SlideOver
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title="Create Gift Card"
      >
        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedPreset(amt);
                    setCustomAmount("");
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                    selectedPreset === amt
                      ? "bg-foreground text-background"
                      : "bg-surface text-text-secondary hover:text-foreground border border-border-light"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="Custom amount"
                min={1}
                className="w-full pl-9 pr-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10"
              />
            </div>
          </div>

          {/* Purchaser */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Purchaser Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={purchaserName}
                  onChange={(e) => setPurchaserName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={purchaserEmail}
                  onChange={(e) => setPurchaserEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>
          </div>

          {/* Recipient (optional) */}
          <div>
            <h3 className="text-[13px] font-semibold text-foreground mb-1">Recipient Details</h3>
            <p className="text-[11px] text-text-tertiary mb-3">Optional -- leave blank if same as purchaser</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient name"
                  className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Recipient email"
                  className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Expiry Date
            </label>
            <p className="text-[11px] text-text-tertiary mb-2">Optional -- card never expires if left blank</p>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
            <Button
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              <Ticket className="w-4 h-4 mr-1.5" /> Create Gift Card
            </Button>
          </div>
        </div>
      </SlideOver>

      {/* ── Gift Card Detail SlideOver ── */}
      <SlideOver
        open={!!detailCard}
        onClose={() => setDetailCardId(null)}
        title="Gift Card Details"
      >
        {detailCard && (
          <div className="space-y-6">
            {/* Code */}
            <div className="bg-surface rounded-xl p-5 text-center">
              <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Gift Card Code</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-foreground tracking-widest">
                  {detailCard.code}
                </span>
                <button
                  onClick={() => copyCode(detailCard.code)}
                  className="p-2 rounded-lg hover:bg-card-bg text-text-secondary cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3">
                <StatusBadge status={detailCard.status} />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl p-4">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Original Amount</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(detailCard.originalAmount)}</p>
              </div>
              <div className="bg-surface rounded-xl p-4">
                <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">Remaining</p>
                <p className={`text-xl font-bold ${detailCard.remainingBalance > 0 ? "text-emerald-600" : "text-text-tertiary"}`}>
                  {formatCurrency(detailCard.remainingBalance)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <DetailRow label="Purchaser" value={detailCard.purchaserName || "---"} />
              {detailCard.purchaserEmail && (
                <DetailRow label="Purchaser Email" value={detailCard.purchaserEmail} />
              )}
              {detailCard.recipientName && (
                <DetailRow label="Recipient" value={detailCard.recipientName} />
              )}
              {detailCard.recipientEmail && (
                <DetailRow label="Recipient Email" value={detailCard.recipientEmail} />
              )}
              <DetailRow label="Created" value={formatDate(detailCard.createdAt)} />
              {detailCard.expiresAt && (
                <DetailRow label="Expires" value={formatDate(detailCard.expiresAt)} />
              )}
              <DetailRow label="Last Updated" value={formatDate(detailCard.updatedAt)} />
            </div>

            {/* Redeem Section */}
            {detailCard.status === "active" && (
              <div className="border-t border-border-light pt-5">
                <h3 className="text-[13px] font-semibold text-foreground mb-3">Redeem</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      placeholder={`Max ${formatCurrency(detailCard.remainingBalance)}`}
                      min={0.01}
                      max={detailCard.remainingBalance}
                      step={0.01}
                      className="w-full pl-9 pr-4 py-2.5 bg-card-bg border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10"
                    />
                  </div>
                  <Button onClick={handleRedeem} size="md">
                    Redeem
                  </Button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-2">
                  Enter the amount to redeem from this gift card.
                </p>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}

// ── Helper Components ──

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-card-bg border border-border-light rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-surface flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[12px] font-medium text-text-tertiary">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}
