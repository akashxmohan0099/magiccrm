"use client";

import { useState } from "react";
import { Plus, Store, Star } from "lucide-react";
import { useVendorManagementStore } from "@/store/vendor-management";
import { Vendor } from "@/types/models";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const VENDOR_CATEGORIES = [
  "Photographer",
  "Florist",
  "Caterer",
  "DJ / Music",
  "Venue",
  "Decorator",
  "Videographer",
  "Bakery",
  "Rental",
  "Other",
];

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-text-tertiary text-[12px]">&mdash;</span>;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-border-light"
          }`}
        />
      ))}
    </div>
  );
}

export function VendorManagementPage() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useVendorManagementStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState(VENDOR_CATEGORIES[0]);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);

  const resetForm = () => {
    setName("");
    setCategory(VENDOR_CATEGORIES[0]);
    setContactName("");
    setEmail("");
    setPhone("");
    setWebsite("");
    setNotes("");
    setRating(0);
    setEditingVendor(null);
  };

  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setCategory(vendor.category);
    setContactName(vendor.contactName || "");
    setEmail(vendor.email || "");
    setPhone(vendor.phone || "");
    setWebsite(vendor.website || "");
    setNotes(vendor.notes);
    setRating(vendor.rating || 0);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      category,
      contactName: contactName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      notes: notes.trim(),
      rating: rating || undefined,
    };

    if (editingVendor) {
      updateVendor(editingVendor.id, data);
    } else {
      addVendor(data);
    }

    resetForm();
    setFormOpen(false);
  };

  const columns: Column<Vendor>[] = [
    { key: "name", label: "Name", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (v) => (
        <span className="text-[12px] px-2 py-0.5 rounded-full bg-surface font-medium text-text-secondary">
          {v.category}
        </span>
      ),
    },
    {
      key: "contactName",
      label: "Contact",
      render: (v) => v.contactName || "\u2014",
    },
    {
      key: "email",
      label: "Email",
      render: (v) => v.email || "\u2014",
    },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (v) => <RatingStars rating={v.rating} />,
    },
  ];

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        }
      />

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Store className="w-10 h-10" />}
          title="No vendors yet"
          description="Keep track of your preferred vendors, their contact info, and ratings all in one place."
          setupSteps={[
            {
              label: "Add your first vendor",
              description: "Add a photographer, florist, caterer, or any vendor",
              action: () => setFormOpen(true),
            },
          ]}
        />
      ) : (
        <DataTable<Vendor>
          storageKey="magic-crm-vendors-columns"
          columns={columns}
          data={vendors}
          keyExtractor={(v) => v.id}
          onRowClick={openEdit}
        />
      )}

      <SlideOver
        open={formOpen}
        onClose={() => {
          resetForm();
          setFormOpen(false);
        }}
        title={editingVendor ? "Edit Vendor" : "Add Vendor"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Vendor Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Bloom"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Contact Name
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Primary contact"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1 === rating ? 0 : i + 1)}
                  className="cursor-pointer p-0.5"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-border-light hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this vendor..."
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="pt-2 space-y-2">
            <Button type="submit" className="w-full">
              {editingVendor ? "Save Changes" : "Add Vendor"}
            </Button>
            {editingVendor && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                className="w-full"
              >
                Delete Vendor
              </Button>
            )}
          </div>
        </form>
      </SlideOver>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          if (editingVendor) {
            deleteVendor(editingVendor.id);
            resetForm();
            setFormOpen(false);
          }
        }}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${editingVendor?.name || ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
