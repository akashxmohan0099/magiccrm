"use client";

import { useState, useMemo } from "react";
import { Plus, Clock, DollarSign, Trash2, ChevronDown, ChevronRight, Pencil, X, Check, FolderPlus, ImagePlus, Upload } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { Service } from "@/types/models";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";
import type { ImportedService } from "@/lib/csv-import";
import { toast } from "@/components/ui/Toast";

export function ServicesPage() {
  const { services, addService, updateService, deleteService, bulkImportServices } = useServicesStore();
  const { workspaceId } = useAuth();

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Form state for add/edit
  const [form, setForm] = useState({
    name: "", description: "", price: "", duration: "60", category: "",
    bufferMinutes: "0", minNoticeHours: "", maxAdvanceDays: "",
    requiresConfirmation: false,
    depositType: "none" as "none" | "percentage" | "fixed", depositAmount: "0", cancellationWindowHours: "",
    locationType: "studio" as "studio" | "mobile" | "both",
  });

  const categories = useMemo(() => {
    const cats = new Map<string, Service[]>();
    for (const s of services) {
      const cat = s.category || "Uncategorized";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(s);
    }
    // Sort services within each category by sortOrder
    for (const [, svcs] of cats) {
      svcs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return cats;
  }, [services]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const startAdd = (category: string) => {
    setAddingToCategory(category);
    setEditingId(null);
    setForm({
      name: "", description: "", price: "", duration: "60", category,
      bufferMinutes: "0", minNoticeHours: "", maxAdvanceDays: "",
      requiresConfirmation: false,
      depositType: "none", depositAmount: "0", cancellationWindowHours: "",
      locationType: "studio",
    });
  };

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setAddingToCategory(null);
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      duration: String(service.duration),
      category: service.category || "Uncategorized",
      bufferMinutes: String(service.bufferMinutes || 0),
      minNoticeHours: service.minNoticeHours != null ? String(service.minNoticeHours) : "",
      maxAdvanceDays: service.maxAdvanceDays != null ? String(service.maxAdvanceDays) : "",
      requiresConfirmation: service.requiresConfirmation,
      depositType: service.depositType || "none",
      depositAmount: String(service.depositAmount || 0),
      cancellationWindowHours: service.cancellationWindowHours != null ? String(service.cancellationWindowHours) : "",
      locationType: service.locationType || "studio",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingToCategory(null);
  };

  const saveNew = () => {
    if (!form.name.trim()) { toast("Service name is required"); return; }
    const cat = form.category === "Uncategorized" ? undefined : form.category;
    addService({
      workspaceId: workspaceId ?? "",
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price) || 0,
      duration: Number(form.duration) || 60,
      category: cat,
      enabled: true,
      sortOrder: services.length,
      bufferMinutes: Number(form.bufferMinutes) || 0,
      minNoticeHours: form.minNoticeHours ? Number(form.minNoticeHours) : undefined,
      maxAdvanceDays: form.maxAdvanceDays ? Number(form.maxAdvanceDays) : undefined,
      requiresConfirmation: form.requiresConfirmation,
      depositType: form.depositType,
      depositAmount: Number(form.depositAmount) || 0,
      cancellationWindowHours: form.cancellationWindowHours ? Number(form.cancellationWindowHours) : undefined,
      locationType: form.locationType,
    }, workspaceId || undefined);
    setAddingToCategory(null);
    setForm({
      name: "", description: "", price: "", duration: "60", category: "",
      bufferMinutes: "0", minNoticeHours: "", maxAdvanceDays: "",
      requiresConfirmation: false,
      depositType: "none", depositAmount: "0", cancellationWindowHours: "",
      locationType: "studio",
    });
  };

  const saveEdit = () => {
    if (!editingId || !form.name.trim()) return;
    const cat = form.category === "Uncategorized" ? undefined : form.category;
    updateService(editingId, {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price) || 0,
      duration: Number(form.duration) || 60,
      category: cat,
      bufferMinutes: Number(form.bufferMinutes) || 0,
      minNoticeHours: form.minNoticeHours ? Number(form.minNoticeHours) : undefined,
      maxAdvanceDays: form.maxAdvanceDays ? Number(form.maxAdvanceDays) : undefined,
      requiresConfirmation: form.requiresConfirmation,
      depositType: form.depositType,
      depositAmount: Number(form.depositAmount) || 0,
      cancellationWindowHours: form.cancellationWindowHours ? Number(form.cancellationWindowHours) : undefined,
      locationType: form.locationType,
    }, workspaceId || undefined);
    setEditingId(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    // Just open the add form for this new category
    setNewCategoryOpen(false);
    startAdd(newCategoryName.trim());
    setNewCategoryName("");
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteService(deleteTarget.id, workspaceId || undefined);
      setDeleteTarget(null);
    }
  };

  const allCategories = Array.from(categories.keys());

  return (
    <div>
      <PageHeader
        title="Services"
        description="Service menu that feeds into your booking form."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setNewCategoryOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
            </Button>
            <Button variant="primary" size="sm" onClick={() => startAdd("Uncategorized")}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Service
            </Button>
          </div>
        }
      />

      {/* New category inline */}
      {newCategoryOpen && (
        <div className="mb-4 flex items-center gap-2 bg-card-bg border border-primary/30 rounded-xl p-3">
          <input
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setNewCategoryOpen(false); }}
            placeholder="Category name (e.g. Hair, Nails, Skin)"
            className="flex-1 px-3 py-2 bg-surface border border-border-light rounded-lg text-[14px] text-foreground outline-none"
          />
          <button onClick={handleAddCategory} className="p-2 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"><Check className="w-4 h-4" /></button>
          <button onClick={() => setNewCategoryOpen(false)} className="p-2 text-text-tertiary hover:text-foreground rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-4">
        {allCategories.map((cat) => {
          const catServices = categories.get(cat) || [];
          const isCollapsed = collapsedCategories.has(cat);

          return (
            <div key={cat} className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
              {/* Category header */}
              <div
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface/50 transition-colors"
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
                  <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">{cat}</h3>
                  <span className="text-[12px] text-text-tertiary">({catServices.length})</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); startAdd(cat); }}
                  className="p-1.5 text-text-tertiary hover:text-foreground hover:bg-surface rounded-lg cursor-pointer transition-colors"
                  title={`Add service to ${cat}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Services list */}
              {!isCollapsed && (
                <div className="border-t border-border-light divide-y divide-border-light">
                  {catServices.map((service) => (
                    editingId === service.id ? (
                      <ServiceForm
                        key={service.id}
                        form={form}
                        setForm={setForm}
                        categories={allCategories}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        saveLabel="Save"
                      />
                    ) : (
                      <div
                        key={service.id}
                        className="flex items-center px-5 py-4 hover:bg-surface/30 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium text-foreground">{service.name}</p>
                            {service.requiresConfirmation && <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Approval</span>}
                            {service.depositType !== "none" && <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Deposit</span>}
                            {service.locationType === "mobile" && <span className="text-[9px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">Mobile</span>}
                            {service.locationType === "both" && <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Studio + Mobile</span>}
                          </div>
                          {service.description && <p className="text-[12px] text-text-tertiary mt-0.5 truncate">{service.description}</p>}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="flex items-center gap-1 text-[13px] text-text-secondary">
                            <Clock className="w-3.5 h-3.5" /> {service.duration}min{service.bufferMinutes > 0 && `+${service.bufferMinutes}`}
                          </span>
                          <span className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
                            <DollarSign className="w-3.5 h-3.5" /> {service.price}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(service)} className="p-1.5 text-text-tertiary hover:text-foreground rounded-lg cursor-pointer">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(service)} className="p-1.5 text-text-tertiary hover:text-red-500 rounded-lg cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ))}

                  {/* Inline add form for this category */}
                  {addingToCategory === cat && (
                    <ServiceForm
                      form={form}
                      setForm={setForm}
                      categories={allCategories}
                      onSave={saveNew}
                      onCancel={cancelEdit}
                      saveLabel="Add Service"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Show add form for a new category that doesn't exist yet */}
        {addingToCategory && !allCategories.includes(addingToCategory) && (
          <div className="bg-card-bg border border-border-light rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4">
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">{addingToCategory}</h3>
              <span className="text-[12px] text-text-tertiary">(0)</span>
            </div>
            <div className="border-t border-border-light">
              <ServiceForm
                form={form}
                setForm={setForm}
                categories={[...allCategories, addingToCategory]}
                onSave={saveNew}
                onCancel={cancelEdit}
                saveLabel="Add Service"
              />
            </div>
          </div>
        )}

        {services.length === 0 && !addingToCategory && (
          <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center">
            <DollarSign className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-tertiary text-sm mb-3">No services yet. Add a category and start building your menu.</p>
            <Button variant="primary" size="sm" onClick={() => setNewCategoryOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />

      <CSVImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        type="services"
        onImportServices={(imported) => {
          if (!workspaceId) return;
          bulkImportServices(imported, workspaceId);
        }}
      />
    </div>
  );
}

// ── Inline Service Form ──

function ServiceForm({
  form,
  setForm,
  categories,
  onSave,
  onCancel,
  saveLabel,
}: {
  form: {
    name: string; description: string; price: string; duration: string; category: string;
    bufferMinutes: string; minNoticeHours: string; maxAdvanceDays: string;
    requiresConfirmation: boolean;
    depositType: "none" | "percentage" | "fixed"; depositAmount: string; cancellationWindowHours: string;
    locationType: "studio" | "mobile" | "both";
  };
  setForm: (fn: (prev: typeof form) => typeof form) => void;
  categories: string[];
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  return (
    <div className="px-5 py-4 bg-primary/[0.03] border-t border-primary/20">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Name</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
            placeholder="Service name"
            className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="What's included in this service..."
            rows={2}
            className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Price ($)</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            placeholder="0"
            min={0}
            className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Duration (min)</label>
          <input
            type="number"
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
            placeholder="60"
            min={5}
            step={5}
            className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-lg text-[14px] text-foreground outline-none"
          />
        </div>
        {/* Image upload placeholder */}
        <div className="col-span-2">
          <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-1">Image (1:1)</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-card-bg border-2 border-dashed border-border-light rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors">
              <ImagePlus className="w-5 h-5 text-text-tertiary" />
            </div>
            <div>
              <p className="text-[12px] text-text-secondary">Square image for your service menu</p>
              <p className="text-[11px] text-text-tertiary">Recommended: 400x400px, JPG or PNG</p>
            </div>
          </div>
        </div>

        {/* Advanced settings */}
        <div className="col-span-2 border-t border-border-light pt-3 mt-1">
          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Scheduling</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Buffer (min)</label>
              <input type="number" value={form.bufferMinutes} min={0} step={5} placeholder="0"
                onChange={(e) => setForm((p) => ({ ...p, bufferMinutes: e.target.value }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Min notice (hrs)</label>
              <input type="number" value={form.minNoticeHours} min={0} placeholder="Default"
                onChange={(e) => setForm((p) => ({ ...p, minNoticeHours: e.target.value }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Max advance (days)</label>
              <input type="number" value={form.maxAdvanceDays} min={1} placeholder="Default"
                onChange={(e) => setForm((p) => ({ ...p, maxAdvanceDays: e.target.value }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
              <input type="checkbox" checked={form.requiresConfirmation}
                onChange={(e) => setForm((p) => ({ ...p, requiresConfirmation: e.target.checked }))}
                className="rounded" />
              Requires confirmation (pending until approved)
            </label>
          </div>

          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Deposit</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Type</label>
              <select value={form.depositType}
                onChange={(e) => setForm((p) => ({ ...p, depositType: e.target.value as "none" | "percentage" | "fixed" }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[12px] text-foreground outline-none">
                <option value="none">No deposit</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Amount</label>
              <input type="number" value={form.depositAmount} min={0} placeholder="0"
                onChange={(e) => setForm((p) => ({ ...p, depositAmount: e.target.value }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-text-tertiary block mb-1">Cancel window (hrs)</label>
              <input type="number" value={form.cancellationWindowHours} min={0} placeholder="Default"
                onChange={(e) => setForm((p) => ({ ...p, cancellationWindowHours: e.target.value }))}
                className="w-full px-2.5 py-2 bg-card-bg border border-border-light rounded-lg text-[13px] text-foreground outline-none" />
            </div>
          </div>

          <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Location</p>
          <div className="flex items-center gap-2">
            {(["studio", "mobile", "both"] as const).map((loc) => (
              <button key={loc} type="button"
                onClick={() => setForm((p) => ({ ...p, locationType: loc }))}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border cursor-pointer capitalize transition-colors ${
                  form.locationType === loc
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-secondary border-border-light hover:text-foreground"
                }`}>
                {loc === "both" ? "Studio + Mobile" : loc}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-text-secondary hover:text-foreground cursor-pointer transition-colors">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-[13px] font-medium cursor-pointer hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> {saveLabel}
        </button>
      </div>
    </div>
  );
}
