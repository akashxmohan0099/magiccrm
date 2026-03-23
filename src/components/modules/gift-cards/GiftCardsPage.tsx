"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
import { useGiftCardStore } from "@/store/gift-cards";
import { GiftCard } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const STATUS_BADGE: Record<GiftCard["status"], string> = {
  active: "bg-green-100 text-green-700",
  redeemed: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-600",
};

export function GiftCardsPage() {
  const { giftCards, addGiftCard, updateGiftCard, redeemGiftCard, deleteGiftCard } = useGiftCardStore();
  const [formOpen, setFormOpen] = useState(false);
  const [detailCard, setDetailCard] = useState<GiftCard | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Create form state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [purchasedBy, setPurchasedBy] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Detail/edit form state
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editRecipientEmail, setEditRecipientEmail] = useState("");
  const [editPurchasedBy, setEditPurchasedBy] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const resetForm = () => {
    setAmount("");
    setRecipientName("");
    setRecipientEmail("");
    setPurchasedBy("");
    setExpiresAt("");
    setErrors({});
    setSaving(false);
  };

  const openDetail = (card: GiftCard) => {
    setDetailCard(card);
    setEditRecipientName(card.recipientName || "");
    setEditRecipientEmail(card.recipientEmail || "");
    setEditPurchasedBy(card.purchasedBy || "");
    setEditExpiresAt(card.expiresAt || "");
    setRedeemAmount("");
    setIsEditing(false);
    setDetailOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const newErrors: Record<string, string> = {};
    const val = parseFloat(amount);
    if (!amount.trim() || isNaN(val) || val <= 0) newErrors.amount = "Amount must be greater than 0";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    addGiftCard({
      amount: val,
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      purchasedBy: purchasedBy.trim() || undefined,
      expiresAt: expiresAt || undefined,
    });
    resetForm();
    setFormOpen(false);
  };

  const handleSaveEdit = () => {
    if (!detailCard) return;
    updateGiftCard(detailCard.id, {
      recipientName: editRecipientName.trim() || undefined,
      recipientEmail: editRecipientEmail.trim() || undefined,
      purchasedBy: editPurchasedBy.trim() || undefined,
      expiresAt: editExpiresAt || undefined,
    });
    // Refresh the detail card from store
    const updated = useGiftCardStore.getState().giftCards.find((c) => c.id === detailCard.id);
    if (updated) setDetailCard(updated);
    setIsEditing(false);
  };

  const handleRedeem = () => {
    if (!detailCard) return;
    const val = parseFloat(redeemAmount);
    if (!val || val <= 0 || val > detailCard.balance) return;
    redeemGiftCard(detailCard.id, val);
    const updated = useGiftCardStore.getState().giftCards.find((c) => c.id === detailCard.id);
    if (updated) setDetailCard(updated);
    setRedeemAmount("");
  };

  const handleDelete = () => {
    if (!detailCard) return;
    deleteGiftCard(detailCard.id);
    setDetailOpen(false);
    setDetailCard(null);
  };

  const columns: Column<GiftCard>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (c) => (
        <span className="font-mono text-[13px] bg-surface px-2 py-0.5 rounded">
          {c.code}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (c) => `$${c.amount.toFixed(2)}`,
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (c) => `$${c.balance.toFixed(2)}`,
    },
    {
      key: "purchasedBy",
      label: "Purchased By",
      sortable: true,
      render: (c) => c.purchasedBy || "\u2014",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (c) => (
        <span
          className={`text-[12px] px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[c.status]}`}
        >
          {c.status}
        </span>
      ),
    },
  ];

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div>
      <PageHeader
        title="Gift Cards"
        description={`${giftCards.length} gift card${giftCards.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4" /> New Gift Card
          </Button>
        }
      />

      {giftCards.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-10 h-10" />}
          title="No gift cards yet"
          description="Create and manage gift cards for your clients. Track balances and redemptions in one place."
          setupSteps={[
            {
              label: "Create your first gift card",
              description: "Set an amount, add a recipient, and start selling",
              action: () => setFormOpen(true),
            },
          ]}
        />
      ) : (
        <DataTable<GiftCard>
          columns={columns}
          data={giftCards}
          keyExtractor={(c) => c.id}
          onRowClick={openDetail}
        />
      )}

      {/* Create Gift Card SlideOver */}
      <SlideOver
        open={formOpen}
        onClose={() => {
          resetForm();
          setFormOpen(false);
        }}
        title="New Gift Card"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Amount" required error={errors.amount}>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors((prev) => { const next = { ...prev }; delete next.amount; return next; }); }}
              placeholder="e.g. 50.00"
              className={inputClass}
            />
          </FormField>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Purchased By
            </label>
            <input
              type="text"
              value={purchasedBy}
              onChange={(e) => setPurchasedBy(e.target.value)}
              placeholder="Client name"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Who is this for?"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              Create Gift Card
            </Button>
          </div>
        </form>
      </SlideOver>

      {/* Detail / Edit / Redeem SlideOver */}
      <SlideOver
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailCard(null);
          setIsEditing(false);
        }}
        title={detailCard ? `Gift Card ${detailCard.code}` : "Gift Card"}
      >
        {detailCard && (
          <div className="space-y-5">
            {/* Card summary */}
            <div className="bg-surface rounded-xl border border-border-light p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Code</span>
                <span className="font-mono text-[14px] text-foreground">{detailCard.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Amount</span>
                <span className="text-[14px] text-foreground">${detailCard.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Balance</span>
                <span className="text-[14px] font-semibold text-foreground">${detailCard.balance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Status</span>
                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[detailCard.status]}`}>
                  {detailCard.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Created</span>
                <span className="text-[13px] text-text-secondary">
                  {new Date(detailCard.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Editable fields */}
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">Purchased By</label>
                  <input type="text" value={editPurchasedBy} onChange={(e) => setEditPurchasedBy(e.target.value)} placeholder="Client name" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">Recipient Name</label>
                  <input type="text" value={editRecipientName} onChange={(e) => setEditRecipientName(e.target.value)} placeholder="Who is this for?" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">Recipient Email</label>
                  <input type="email" value={editRecipientEmail} onChange={(e) => setEditRecipientEmail(e.target.value)} placeholder="recipient@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">Expiry Date</label>
                  <input type="date" value={editExpiresAt} onChange={(e) => setEditExpiresAt(e.target.value)} className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleSaveEdit} className="flex-1">Save Changes</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-surface rounded-xl border border-border-light p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Purchased By</span>
                    <span className="text-[13px] text-foreground">{detailCard.purchasedBy || "\u2014"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Recipient</span>
                    <span className="text-[13px] text-foreground">{detailCard.recipientName || "\u2014"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Email</span>
                    <span className="text-[13px] text-foreground">{detailCard.recipientEmail || "\u2014"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-text-tertiary uppercase tracking-wider font-semibold">Expires</span>
                    <span className="text-[13px] text-foreground">
                      {detailCard.expiresAt
                        ? new Date(detailCard.expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                        : "No expiry"}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="w-full">
                  Edit Details
                </Button>
              </div>
            )}

            {/* Redeem section */}
            {detailCard.status === "active" && (
              <div className="bg-surface rounded-xl border border-border-light p-4 space-y-3">
                <h4 className="text-[13px] font-semibold text-foreground">Redeem</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.01"
                    max={detailCard.balance}
                    step="0.01"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    placeholder={`Max $${detailCard.balance.toFixed(2)}`}
                    className={inputClass}
                  />
                  <Button
                    onClick={handleRedeem}
                    disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > detailCard.balance}
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            )}

            {/* Delete */}
            <div className="pt-2 border-t border-border-light">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                className="w-full"
              >
                Delete Gift Card
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Gift Card"
        message={`Are you sure you want to delete gift card ${detailCard?.code || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
