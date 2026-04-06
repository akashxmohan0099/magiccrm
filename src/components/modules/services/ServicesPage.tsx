"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Clock, DollarSign, Trash2, ChevronDown, ChevronRight, Save, X, Sparkles } from "lucide-react";
import { useServicesStore } from "@/store/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ServiceDefinition } from "@/types/industry-config";

const DEFAULT_CATEGORIES = ["Bridal", "Event", "Editorial", "Lessons"];

interface EditingState {
  name: string;
  price: string;
  duration: string;
  category: string;
}

function emptyEditing(): EditingState {
  return { name: "", price: "", duration: "60", category: "" };
}

function editingFromService(service: ServiceDefinition): EditingState {
  return {
    name: service.name,
    price: String(service.price),
    duration: String(service.duration),
    category: service.category ?? "",
  };
}

export function ServicesPage() {
  const { services, addService, updateService, deleteService } = useServicesStore();
  const { workspaceId } = useAuth();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditingState>(emptyEditing());
  const [addingForCategory, setAddingForCategory] = useState<string | null>(null);
  const [newServiceState, setNewServiceState] = useState<EditingState>(emptyEditing());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const nameInputRef = useRef<HTMLInputElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);

  // Collect all categories used by services + defaults
  const allCategories = useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATEGORIES);
    for (const s of services) {
      if (s.category) cats.add(s.category);
    }
    return Array.from(cats);
  }, [services]);

  // Group services by category
  const grouped = useMemo(() => {
    const map: Record<string, ServiceDefinition[]> = {};
    for (const cat of allCategories) {
      map[cat] = [];
    }
    map["Uncategorized"] = [];

    for (const service of services) {
      const cat = service.category || "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(service);
    }

    // Sort services within each category by name
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => a.name.localeCompare(b.name));
    }

    return map;
  }, [services, allCategories]);

  // Categories to display (only show categories that have services or are being added to)
  const visibleCategories = useMemo(() => {
    return Object.entries(grouped)
      .filter(([cat, items]) => items.length > 0 || addingForCategory === cat)
      .map(([cat]) => cat);
  }, [grouped, addingForCategory]);

  // Focus name input when expanding a card
  useEffect(() => {
    if (expandedId && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [expandedId]);

  // Focus name input when adding a new service
  useEffect(() => {
    if (addingForCategory && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [addingForCategory]);

  const handleExpand = (service: ServiceDefinition) => {
    if (expandedId === service.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(service.id);
    setEditState(editingFromService(service));
  };

  const handleSave = (id: string) => {
    if (!editState.name.trim()) return;
    updateService(
      id,
      {
        name: editState.name.trim(),
        price: Number(editState.price) || 0,
        duration: Number(editState.duration) || 60,
        category: editState.category || undefined,
      },
      workspaceId ?? undefined
    );
    setExpandedId(null);
  };

  const handleDelete = (id: string) => {
    deleteService(id, workspaceId ?? undefined);
    if (expandedId === id) setExpandedId(null);
  };

  const handleAddNew = (category: string) => {
    setAddingForCategory(category);
    setNewServiceState({
      ...emptyEditing(),
      category: category === "Uncategorized" ? "" : category,
    });
  };

  const handleSaveNew = () => {
    if (!newServiceState.name.trim()) return;
    addService(
      {
        name: newServiceState.name.trim(),
        price: Number(newServiceState.price) || 0,
        duration: Number(newServiceState.duration) || 60,
        category: newServiceState.category || undefined,
      },
      workspaceId ?? undefined
    );
    setAddingForCategory(null);
    setNewServiceState(emptyEditing());
  };

  const handleCancelNew = () => {
    setAddingForCategory(null);
    setNewServiceState(emptyEditing());
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const categoryDropdownOptions = [...allCategories.filter((c) => c !== "Uncategorized"), ""];

  return (
    <div>
      <PageHeader
        title="Services"
        description="Your service menu — pricing, categories, and duration."
        actions={
          <Button variant="primary" size="sm" onClick={() => handleAddNew("Uncategorized")}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Service
          </Button>
        }
      />

      {/* Summary line */}
      {services.length > 0 && (
        <p className="text-xs text-text-secondary mb-4">
          {services.length} service{services.length !== 1 ? "s" : ""} across {visibleCategories.length} categor{visibleCategories.length !== 1 ? "ies" : "y"}
        </p>
      )}

      {/* Service groups */}
      <div className="space-y-4">
        {visibleCategories.map((category) => {
          const items = grouped[category] ?? [];
          const isCollapsed = collapsedCategories.has(category);

          return (
            <div key={category} className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full px-5 py-3.5 cursor-pointer hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                  )}
                  <h3 className="text-[13px] font-semibold text-text-tertiary uppercase tracking-wider">
                    {category}
                  </h3>
                  <span className="text-[11px] text-text-tertiary ml-1">
                    ({items.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNew(category);
                  }}
                  className="text-text-secondary hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface cursor-pointer"
                  title={`Add service to ${category}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </button>

              {/* Service cards */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-2">
                  {items.map((service) => {
                    const isExpanded = expandedId === service.id;

                    return (
                      <div
                        key={service.id}
                        className={`rounded-lg border transition-all ${
                          isExpanded
                            ? "border-foreground/20 bg-surface/50"
                            : "border-border-light bg-surface/30 hover:border-foreground/10"
                        }`}
                      >
                        {/* Card summary row */}
                        <button
                          type="button"
                          onClick={() => handleExpand(service)}
                          className="flex items-center justify-between w-full px-4 py-3 text-left cursor-pointer group"
                        >
                          <span className="text-sm font-medium text-foreground">
                            {service.name}
                          </span>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {service.duration}min
                            </span>
                            <span className="flex items-center gap-0.5 font-medium">
                              <DollarSign className="w-3 h-3" />
                              {service.price}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(service.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-red-500 transition-all p-1 rounded cursor-pointer"
                              title="Delete service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </button>

                        {/* Inline editor */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-border-light space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                                  Name
                                </label>
                                <input
                                  ref={nameInputRef}
                                  type="text"
                                  value={editState.name}
                                  onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(service.id)}
                                  className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                                  placeholder="Service name"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                                  Category
                                </label>
                                <select
                                  value={editState.category}
                                  onChange={(e) => setEditState((s) => ({ ...s, category: e.target.value }))}
                                  className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all cursor-pointer"
                                >
                                  <option value="">Uncategorized</option>
                                  {categoryDropdownOptions
                                    .filter((c) => c !== "")
                                    .map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                                  Price ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={editState.price}
                                  onChange={(e) => setEditState((s) => ({ ...s, price: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(service.id)}
                                  className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                                  Duration (min)
                                </label>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  value={editState.duration}
                                  onChange={(e) => setEditState((s) => ({ ...s, duration: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleSave(service.id)}
                                  className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                                  placeholder="60"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedId(null)}
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSave(service.id)}
                                disabled={!editState.name.trim()}
                              >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Inline "Add new service" form for this category */}
                  {addingForCategory === category && (
                    <div className="rounded-lg border border-foreground/20 bg-surface/50 px-4 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                            Name
                          </label>
                          <input
                            ref={newNameInputRef}
                            type="text"
                            value={newServiceState.name}
                            onChange={(e) => setNewServiceState((s) => ({ ...s, name: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
                            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                            placeholder="Service name"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                            Category
                          </label>
                          <select
                            value={newServiceState.category}
                            onChange={(e) => setNewServiceState((s) => ({ ...s, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all cursor-pointer"
                          >
                            <option value="">Uncategorized</option>
                            {categoryDropdownOptions
                              .filter((c) => c !== "")
                              .map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={newServiceState.price}
                            onChange={(e) => setNewServiceState((s) => ({ ...s, price: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
                            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1 block">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            min="5"
                            step="5"
                            value={newServiceState.duration}
                            onChange={(e) => setNewServiceState((s) => ({ ...s, duration: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleSaveNew()}
                            className="w-full px-3 py-2 bg-card-bg border border-border-light rounded-lg text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all"
                            placeholder="60"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={handleCancelNew}>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveNew}
                          disabled={!newServiceState.name.trim()}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Service
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Empty state within a category */}
                  {items.length === 0 && addingForCategory !== category && (
                    <p className="text-xs text-text-tertiary text-center py-4">
                      No services in this category.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state when no services exist at all */}
      {services.length === 0 && !addingForCategory && (
        <div className="text-center py-12">
          <Sparkles className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No services yet</p>
          <p className="text-xs text-text-secondary mb-4">
            Add your first service to start building your menu.
          </p>
          <Button variant="primary" size="sm" onClick={() => handleAddNew("Bridal")}>
            <Plus className="w-4 h-4 mr-1" />
            Add Your First Service
          </Button>
        </div>
      )}
    </div>
  );
}
