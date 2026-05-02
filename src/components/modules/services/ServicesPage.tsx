"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Clock,
  DollarSign,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  FolderPlus,
  Upload,
  MoreHorizontal,
  Copy,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  Eye,
  GripVertical,
  Sparkles,
  ArrowRight,
  CheckSquare,
  FolderInput,
  MapPin,
  Box,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useServicesStore } from "@/store/services";
import { useTeamStore } from "@/store/team";
import { useAuth } from "@/hooks/useAuth";
import { Service, TeamMember } from "@/types/models";
import { minPrice, isFromPriced, resolveBuffer } from "@/lib/services/price";
import { resolveServiceCategoryName } from "@/lib/services/category";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";
import { toast } from "@/components/ui/Toast";
import { ServiceDrawer } from "./ServiceDrawer";
import { ServicesPreview } from "./ServicesPreview";
import { StarterMenuModal } from "./StarterMenuModal";
import { LocationsManagerModal } from "./LocationsManagerModal";
import { ResourcesManagerModal } from "./ResourcesManagerModal";

const UNCATEGORIZED = "Uncategorized";

function categoryHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash) % 360;
}

function categoryStripeColor(name: string): string {
  return `hsl(${categoryHue(name)} 70% 60%)`;
}

function categorySoftColor(name: string): string {
  return `hsl(${categoryHue(name)} 70% 92%)`;
}

function ServiceLetterCard({ name, category }: { name: string; category?: string }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const bg = categorySoftColor(category || UNCATEGORIZED);
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-semibold text-foreground/70 flex-shrink-0"
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function MemberAvatar({ member, ring = true }: { member: TeamMember; ring?: boolean }) {
  const initial = (member.name || "?").trim().charAt(0).toUpperCase();
  const hue = (() => {
    let h = 0;
    for (let i = 0; i < member.name.length; i++) h = (h * 31 + member.name.charCodeAt(i)) | 0;
    return Math.abs(h) % 360;
  })();
  const ringClass = ring ? "ring-2 ring-card-bg" : "";
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name}
        title={member.name}
        className={`w-6 h-6 rounded-full object-cover ${ringClass}`}
      />
    );
  }
  return (
    <div
      title={member.name}
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-foreground/80 ${ringClass}`}
      style={{ backgroundColor: `hsl(${hue} 60% 88%)` }}
    >
      {initial}
    </div>
  );
}

function MemberAvatarStack({
  members,
  isAnyone,
  max = 3,
}: {
  members: TeamMember[];
  isAnyone: boolean;
  max?: number;
}) {
  if (members.length === 0) return null;
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  return (
    <div
      className="flex items-center"
      title={
        isAnyone
          ? `Anyone (${members.length})`
          : members.map((m) => m.name).join(", ")
      }
    >
      <div className="flex -space-x-1.5">
        {visible.map((m) => (
          <MemberAvatar key={m.id} member={m} />
        ))}
        {overflow > 0 && (
          <div className="w-6 h-6 rounded-full ring-2 ring-card-bg bg-surface flex items-center justify-center text-[10px] font-semibold text-text-secondary">
            +{overflow}
          </div>
        )}
      </div>
      {isAnyone && (
        <span className="ml-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wide">
          Any
        </span>
      )}
    </div>
  );
}

export function ServicesPage() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    bulkImportServices,
    categories: storeCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useServicesStore();
  const { workspaceId } = useAuth();

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);
  const [drawerCategory, setDrawerCategory] = useState<string>(UNCATEGORIZED);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [starterOpen, setStarterOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [openCategoryMenu, setOpenCategoryMenu] = useState<string | null>(null);

  // Bulk select mode. Row drag-to-reorder is suppressed while active and
  // checkboxes replace the grip column. Cleared on Esc or Cancel.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Build a name-keyed grouping (still the rendering key — display, drawer
  // default, bulk-move dropdown all use names) plus an ordered list driven by
  // the ServiceCategory store rows. Orphan names (no store row yet) appear
  // after the persisted categories so nothing disappears mid-migration.
  const categories = useMemo(() => {
    const cats = new Map<string, Service[]>();
    for (const s of services) {
      const cat = resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED;
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(s);
    }
    for (const [, svcs] of cats) {
      svcs.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return cats;
  }, [services, storeCategories]);

  const allCategories = useMemo(() => {
    const orderedNames: string[] = [];
    const seen = new Set<string>();
    // First, persisted categories in their stored sortOrder.
    [...storeCategories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((c) => {
        orderedNames.push(c.name);
        seen.add(c.name);
      });
    // Then any categories that exist on services but haven't been promoted
    // to ServiceCategory rows yet (legacy data, in-memory adds).
    for (const name of categories.keys()) {
      if (name === UNCATEGORIZED) continue;
      if (!seen.has(name)) {
        orderedNames.push(name);
        seen.add(name);
      }
    }
    // Uncategorized goes last and only when there's something in it.
    if ((categories.get(UNCATEGORIZED)?.length ?? 0) > 0) {
      orderedNames.push(UNCATEGORIZED);
    }
    return orderedNames;
  }, [storeCategories, categories]);

  const categoryByName = useMemo(() => {
    const map = new Map<string, (typeof storeCategories)[number]>();
    for (const c of storeCategories) map.set(c.name, c);
    return map;
  }, [storeCategories]);

  useEffect(() => {
    if (!openCategoryMenu) return;
    const handler = () => setOpenCategoryMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openCategoryMenu]);

  useEffect(() => {
    if (!selectionMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectionMode(false);
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectionMode]);

  // Drop selections when leaving selection mode so re-entering is fresh.
  useEffect(() => {
    if (!selectionMode) setSelectedIds(new Set());
  }, [selectionMode]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategorySelected = (cat: string) => {
    const ids = (categories.get(cat) || []).map((s) => s.id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const bulkSetEnabled = (enabled: boolean) => {
    selectedIds.forEach((id) => {
      updateService(id, { enabled }, workspaceId || undefined);
    });
    toast(`${enabled ? "Enabled" : "Disabled"} ${selectedIds.size} service${selectedIds.size === 1 ? "" : "s"}`);
    setSelectionMode(false);
  };

  const bulkDelete = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => deleteService(id, workspaceId || undefined));
    toast(`Deleted ${count} service${count === 1 ? "" : "s"}`);
    setSelectionMode(false);
    setBulkDeleteOpen(false);
  };

  const bulkMoveTo = (targetCat: string) => {
    const cat = targetCat === UNCATEGORIZED ? undefined : targetCat;
    // Dual-write `category` (legacy display name used by every UI that
    // groups by service.category) and `categoryId` (canonical link).
    // Once consumers migrate to a `resolveServiceCategory()` helper the
    // legacy field can be dropped — until then both are needed in sync.
    const catId = cat ? categoryByName.get(cat)?.id : undefined;
    selectedIds.forEach((id) => {
      updateService(
        id,
        { category: cat, categoryId: catId ?? null },
        workspaceId || undefined,
      );
    });
    toast(`Moved ${selectedIds.size} service${selectedIds.size === 1 ? "" : "s"} to ${targetCat}`);
    setSelectionMode(false);
    setBulkMoveOpen(false);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const openAdd = (category: string) => {
    setEditingService(undefined);
    setDrawerCategory(category);
    setDrawerOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setDrawerCategory(resolveServiceCategoryName(service, storeCategories) || UNCATEGORIZED);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingService(undefined);
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast(`"${name}" already exists`);
      return;
    }
    // Persist as a first-class category row so it has stable identity, color,
    // and sortOrder even before any service is added to it.
    addCategory(
      {
        workspaceId: workspaceId ?? "",
        name,
        sortOrder: storeCategories.length,
      },
      workspaceId || undefined,
    );
    setNewCategoryOpen(false);
    setNewCategoryName("");
    openAdd(name);
  };

  const handleRenameCategory = (oldName: string) => {
    const newName = renameValue.trim();
    if (!newName || newName === oldName) {
      setRenamingCategory(null);
      return;
    }
    if (allCategories.includes(newName)) {
      toast(`"${newName}" already exists`);
      return;
    }
    // Update the canonical ServiceCategory row when one exists, then update
    // every service's free-text category for back-compat.
    const cat = categoryByName.get(oldName);
    if (cat) {
      updateCategory(cat.id, { name: newName }, workspaceId || undefined);
    }
    const targetCat = newName === UNCATEGORIZED ? undefined : newName;
    // The canonical category row keeps its id across renames, so categoryId
    // stays valid; we only sync the legacy free-text `category` field.
    services
      .filter((s) => (resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED) === oldName)
      .forEach((s) => updateService(s.id, { category: targetCat }, workspaceId || undefined));
    toast(`Renamed to "${newName}"`);
    setRenamingCategory(null);
    setRenameValue("");
  };

  const handleDeleteCategory = () => {
    if (!deleteCategoryTarget) return;
    const movingServices = services.filter(
      (s) => (resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED) === deleteCategoryTarget,
    );
    // Clear both fields so the row stops referencing the deleted category.
    movingServices.forEach((s) =>
      updateService(s.id, { category: undefined, categoryId: null }, workspaceId || undefined),
    );
    const cat = categoryByName.get(deleteCategoryTarget);
    if (cat) deleteCategory(cat.id, workspaceId || undefined);
    toast(
      movingServices.length
        ? `Moved ${movingServices.length} service${movingServices.length === 1 ? "" : "s"} to ${UNCATEGORIZED}`
        : `Removed "${deleteCategoryTarget}"`,
    );
    setDeleteCategoryTarget(null);
  };

  // Drag-reorder categories. Orphans (names that don't have a ServiceCategory
  // row yet) get promoted on the fly so the order persists.
  const handleReorderCategories = (newOrderedNames: string[]) => {
    const namesToPromote = newOrderedNames.filter(
      (n) => n !== UNCATEGORIZED && !categoryByName.has(n),
    );
    const now = new Date().toISOString();
    let basisIds = storeCategories.map((c) => c.id);
    if (namesToPromote.length > 0) {
      // Promote orphans first; gather their generated IDs.
      const newIds: string[] = [];
      for (const name of namesToPromote) {
        const created = addCategory(
          {
            workspaceId: workspaceId ?? "",
            name,
            sortOrder: storeCategories.length + newIds.length,
          },
          workspaceId || undefined,
        );
        newIds.push(created.id);
      }
      basisIds = [...basisIds, ...newIds];
    }
    // Build the new id order from the new name order.
    const idByName = new Map<string, string>();
    for (const c of storeCategories) idByName.set(c.name, c.id);
    namesToPromote.forEach((n, i) => {
      // Newly-promoted IDs come from the basisIds tail in the same order
      // they were created above.
      idByName.set(n, basisIds[storeCategories.length + i]);
    });
    const orderedIds = newOrderedNames
      .filter((n) => n !== UNCATEGORIZED)
      .map((n) => idByName.get(n))
      .filter((x): x is string => !!x);
    reorderCategories(orderedIds, workspaceId || undefined);
    void now;
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteService(deleteTarget.id, workspaceId || undefined);
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = (service: Service) => {
    // Spread the source so every advanced field (variants, tiers, addons,
    // addon groups, locationIds, requiredResourceIds, intakeQuestions,
    // intakeFormId, dynamicPriceRules, availableWeekdays, tags, featured,
    // promo*, isPackage, packageItems, requiresPatchTest, patch test
    // settings, rebookAfterDays, etc.) carries through. Only id / name /
    // sortOrder / timestamps are derived; the addService store action
    // strips id / timestamps for us.
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = service;
    void _id; void _c; void _u;
    addService(
      {
        ...rest,
        workspaceId: workspaceId ?? "",
        name: `${service.name} (Copy)`,
        sortOrder: services.length,
      },
      workspaceId || undefined,
    );
  };

  const toggleEnabled = (service: Service) => {
    updateService(service.id, { enabled: !service.enabled }, workspaceId || undefined);
  };

  // Reorder services within a category. We collect the sortOrder slots the
  // category currently occupies, then re-assign them in the new order. This
  // keeps the category in the same global position relative to other rows.
  const handleReorderServices = (_cat: string, newOrder: Service[]) => {
    const slots = newOrder.map((s) => s.sortOrder).slice().sort((a, b) => a - b);
    newOrder.forEach((svc, idx) => {
      const next = slots[idx];
      if (svc.sortOrder !== next) {
        updateService(svc.id, { sortOrder: next }, workspaceId || undefined);
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Services"
        description="Service menu that feeds into your booking form."
        actions={
          <div className="flex gap-2">
            {services.length > 0 && (
              <Button
                variant={selectionMode ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectionMode((v) => !v)}
              >
                <CheckSquare className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">{selectionMode ? "Done" : "Select"}</span>
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setLocationsOpen(true)}>
              <MapPin className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Locations</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setResourcesOpen(true)}>
              <Box className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Resources</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setStarterOpen(true)}>
              <Sparkles className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Starter menu</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => setNewCategoryOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
            </Button>
          </div>
        }
      />

      {newCategoryOpen && (
        <div className="mb-4 flex items-center gap-2 bg-card-bg border border-primary/30 rounded-xl p-3">
          <input
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddCategory();
              if (e.key === "Escape") {
                setNewCategoryOpen(false);
                setNewCategoryName("");
              }
            }}
            placeholder="Category name (e.g. Hair, Nails, Skin)"
            className="flex-1 px-3 py-2 bg-surface border border-border-light rounded-lg text-[14px] text-foreground outline-none"
          />
          <button
            onClick={handleAddCategory}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setNewCategoryOpen(false);
              setNewCategoryName("");
            }}
            className="p-2 text-text-tertiary hover:text-foreground rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-card-bg border border-border-light rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground mb-1">No services yet</h3>
          <p className="text-[13px] text-text-secondary mb-5">
            Add a category and start building your menu.
          </p>
          <Button variant="primary" size="sm" onClick={() => setNewCategoryOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-1.5" /> Add Category
          </Button>
          <p className="text-[12px] text-text-tertiary mt-3">
            or{" "}
            <button
              onClick={() => setStarterOpen(true)}
              className="text-primary font-medium hover:underline cursor-pointer inline-flex items-center gap-0.5"
            >
              start with a template
              <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>
      ) : (
        <CategoryDndContext
          orderedNames={allCategories}
          onReorder={handleReorderCategories}
          disabled={selectionMode}
        >
        <div className="space-y-3">
          {allCategories.map((cat) => {
            const catServices = categories.get(cat) || [];
            const isCollapsed = collapsedCategories.has(cat);
            const isRenaming = renamingCategory === cat;
            const menuOpen = openCategoryMenu === cat;
            const isUncategorized = cat === UNCATEGORIZED;
            const stripeColor =
              categoryByName.get(cat)?.color ?? categoryStripeColor(cat);

            return (
              <SortableCategory
                key={cat}
                id={cat}
                disabled={isUncategorized || isRenaming || selectionMode}
              >
                {({ attributes, listeners }) => (
              <div
                className="bg-card-bg border border-border-light rounded-xl overflow-hidden group/cat"
              >
                <div className="h-1" style={{ backgroundColor: stripeColor }} />

                {/* Category header */}
                <div className="flex items-center px-5 py-4 gap-3">
                  {!isUncategorized && !selectionMode && !isRenaming && (
                    <button
                      type="button"
                      {...attributes}
                      {...listeners}
                      title="Drag to reorder category"
                      aria-label="Drag to reorder category"
                      className="text-text-tertiary opacity-0 group-hover/cat:opacity-100 hover:text-foreground cursor-grab active:cursor-grabbing transition-opacity flex-shrink-0"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {selectionMode && catServices.length > 0 && (() => {
                    const ids = catServices.map((s) => s.id);
                    const allSelected = ids.every((id) => selectedIds.has(id));
                    const someSelected = !allSelected && ids.some((id) => selectedIds.has(id));
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategorySelected(cat);
                        }}
                        title={allSelected ? "Deselect all in category" : "Select all in category"}
                        aria-checked={allSelected}
                        role="checkbox"
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
                          allSelected
                            ? "bg-primary border-primary text-white"
                            : someSelected
                              ? "bg-primary/30 border-primary"
                              : "bg-surface border-border-light hover:border-text-tertiary"
                        }`}
                      >
                        {allSelected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => !isRenaming && toggleCategory(cat)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                    aria-expanded={!isCollapsed}
                    disabled={isRenaming}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      {isRenaming ? (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameCategory(cat);
                              if (e.key === "Escape") {
                                setRenamingCategory(null);
                                setRenameValue("");
                              }
                            }}
                            className="px-2.5 py-1.5 bg-surface border border-primary/30 rounded-lg text-[14px] font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <button
                            onClick={() => handleRenameCategory(cat)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRenamingCategory(null);
                              setRenameValue("");
                            }}
                            className="p-1.5 text-text-tertiary hover:text-foreground rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[14px] font-semibold text-foreground truncate">
                            {cat}
                          </p>
                          <p className="text-[12px] text-text-tertiary truncate">
                            {catServices.length === 0 ? (
                              <>No services yet</>
                            ) : (
                              <>
                                <span className="text-foreground font-medium">
                                  {catServices.length} service
                                  {catServices.length === 1 ? "" : "s"}
                                </span>
                                {(() => {
                                  const active = catServices.filter((s) => s.enabled).length;
                                  if (active === catServices.length) return null;
                                  return ` · ${active} active`;
                                })()}
                              </>
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </button>

                  {!isRenaming && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdd(cat);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
                        title={`Add service to ${cat}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Service</span>
                      </button>
                      {!isUncategorized && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenCategoryMenu(menuOpen ? null : cat);
                            }}
                            className="p-1.5 text-text-secondary hover:text-foreground hover:bg-surface rounded-lg cursor-pointer transition-colors"
                            title="Category options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {menuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 z-10 bg-card-bg border border-border-light rounded-lg shadow-lg py-1 min-w-[140px]"
                            >
                              <button
                                onClick={() => {
                                  setRenamingCategory(cat);
                                  setRenameValue(cat);
                                  setOpenCategoryMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-surface cursor-pointer flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Rename
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteCategoryTarget(cat);
                                  setOpenCategoryMenu(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Services list */}
                {!isCollapsed && (
                  <div className="border-t border-border-light bg-surface/30">
                    {catServices.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-[13px] text-text-tertiary mb-3">
                          No services yet in this category.
                        </p>
                        <button
                          onClick={() => openAdd(cat)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add a service
                        </button>
                      </div>
                    ) : (
                      <SortableServiceList
                        services={catServices}
                        onReorder={(newOrder) => handleReorderServices(cat, newOrder)}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                        onToggleSelected={toggleSelected}
                        renderItem={(service) => (
                          <ServiceRow
                            service={service}
                            selectionMode={selectionMode}
                            selected={selectedIds.has(service.id)}
                            onToggleSelected={() => toggleSelected(service.id)}
                            onEdit={() => openEdit(service)}
                            onDuplicate={() => handleDuplicate(service)}
                            onToggleEnabled={() => toggleEnabled(service)}
                            onDelete={() => setDeleteTarget(service)}
                          />
                        )}
                      />
                    )}
                  </div>
                )}
              </div>
                )}
              </SortableCategory>
            );
          })}
        </div>
        </CategoryDndContext>
      )}

      {/* Bulk action bar — sticky at bottom while in selection mode */}
      {selectionMode && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-40 bg-card-bg border border-border-light rounded-2xl shadow-lg flex items-center gap-1 px-2 py-2">
          <span className="text-[12px] font-medium text-foreground px-3 whitespace-nowrap">
            {selectedIds.size === 0
              ? "Select services"
              : `${selectedIds.size} selected`}
          </span>
          <div className="w-px h-6 bg-border-light" />
          <button
            disabled={selectedIds.size === 0}
            onClick={() => bulkSetEnabled(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ToggleRight className="w-3.5 h-3.5" /> Enable
          </button>
          <button
            disabled={selectedIds.size === 0}
            onClick={() => bulkSetEnabled(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ToggleLeft className="w-3.5 h-3.5" /> Disable
          </button>
          <button
            disabled={selectedIds.size === 0}
            onClick={() => setBulkMoveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FolderInput className="w-3.5 h-3.5" /> Move
          </button>
          <button
            disabled={selectedIds.size === 0}
            onClick={() => setBulkDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <div className="w-px h-6 bg-border-light" />
          <button
            onClick={() => setSelectionMode(false)}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
            title="Exit selection mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Move-to-category picker */}
      {bulkMoveOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setBulkMoveOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card-bg border border-border-light rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border-light">
              <p className="text-[14px] font-semibold text-foreground">Move to category</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                {selectedIds.size} service{selectedIds.size === 1 ? "" : "s"}
              </p>
            </div>
            <div className="max-h-72 overflow-auto py-2">
              {[...allCategories, UNCATEGORIZED]
                .filter((c, i, arr) => arr.indexOf(c) === i)
                .map((cat) => (
                  <button
                    key={cat}
                    onClick={() => bulkMoveTo(cat)}
                    className="w-full text-left px-5 py-2.5 text-[13px] text-foreground hover:bg-surface cursor-pointer flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryStripeColor(cat) }}
                    />
                    {cat}
                  </button>
                ))}
            </div>
            <div className="px-5 py-3 border-t border-border-light flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setBulkMoveOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={bulkDelete}
        title="Delete Services"
        message={`Delete ${selectedIds.size} service${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />

      <ConfirmDialog
        open={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={(() => {
          if (!deleteCategoryTarget) return "";
          const count = services.filter(
            (s) => (resolveServiceCategoryName(s, storeCategories) || UNCATEGORIZED) === deleteCategoryTarget,
          ).length;
          if (count === 0) return `Delete the "${deleteCategoryTarget}" category?`;
          return `Delete the "${deleteCategoryTarget}" category? Its ${count} service${count === 1 ? "" : "s"} will be moved to ${UNCATEGORIZED}.`;
        })()}
      />

      <ServiceDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        service={editingService}
        defaultCategory={drawerCategory}
        categories={allCategories}
      />

      <ServicesPreview
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFullscreen(false);
        }}
        fullscreen={previewFullscreen}
        onToggleFullscreen={() => setPreviewFullscreen((v) => !v)}
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

      <StarterMenuModal open={starterOpen} onClose={() => setStarterOpen(false)} />
      <LocationsManagerModal open={locationsOpen} onClose={() => setLocationsOpen(false)} />
      <ResourcesManagerModal open={resourcesOpen} onClose={() => setResourcesOpen(false)} />
    </div>
  );
}

function ServiceRow({
  service,
  selectionMode,
  selected,
  onToggleSelected,
  onEdit,
  onDuplicate,
  onToggleEnabled,
  onDelete,
}: {
  service: Service;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelected: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getServiceMembers, categories: storeCategories } = useServicesStore();
  const { members } = useTeamStore();
  const resolvedCategory = resolveServiceCategoryName(service, storeCategories);
  const assignedIds = getServiceMembers(service.id);
  const activeMembers = members.filter((m) => m.status !== "inactive");
  const isAnyone = assignedIds.length === 0;
  const displayMembers = isAnyone
    ? activeMembers
    : activeMembers.filter((m) => assignedIds.includes(m.id));

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  return (
    <div
      className={`flex items-center px-5 py-4 gap-4 hover:bg-surface/60 transition-colors group ${
        !service.enabled ? "opacity-60" : ""
      } ${selectionMode && selected ? "bg-primary/5" : ""}`}
    >
      {selectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelected();
          }}
          aria-checked={selected}
          role="checkbox"
          title={selected ? "Deselect" : "Select"}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
            selected
              ? "bg-primary border-primary text-white"
              : "bg-surface border-border-light hover:border-text-tertiary"
          }`}
        >
          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
      )}
      <button
        onClick={selectionMode ? onToggleSelected : onEdit}
        className="flex items-center gap-4 flex-1 min-w-0 text-left cursor-pointer"
      >
        <ServiceLetterCard name={service.name} category={resolvedCategory} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-5 gap-y-1 flex-wrap">
            <p className="text-[14px] font-medium text-foreground truncate">
              {service.name}
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-[12px] text-text-tertiary tabular-nums flex items-center gap-1">
                <Clock className="w-3 h-3" /> {service.duration}min
                {(() => {
                  const { before, after } = resolveBuffer(service);
                  const total = before + after;
                  return total > 0 ? `+${total}` : "";
                })()}
              </span>
              <span className="text-[12px] font-semibold text-foreground tabular-nums whitespace-nowrap">
                {isFromPriced(service) && (
                  <span className="text-[10px] text-text-tertiary font-medium mr-0.5">From</span>
                )}
                ${minPrice(service)}
              </span>
            </div>
            {displayMembers.length > 0 && (
              <MemberAvatarStack members={displayMembers} isAnyone={isAnyone} />
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              {!service.enabled && (
                <span className="text-[9px] font-semibold text-text-tertiary bg-surface px-1.5 py-0.5 rounded">
                  Inactive
                </span>
              )}
              {service.isPackage && (
                <span className="text-[9px] font-semibold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded">
                  Bundle
                </span>
              )}
              {service.requiresConfirmation && (
                <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  Approval
                </span>
              )}
              {service.depositType !== "none" && (
                <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Deposit
                </span>
              )}
              {/* Studio/Mobile badge dropped — Location.kind drives this now;
                  the badge would need a per-location join to be honest. */}
            </div>
          </div>
          {service.description && (
            <p className="text-[12px] text-text-tertiary truncate mt-1">
              {service.description}
            </p>
          )}
        </div>
      </button>

      {/* Settings — far right */}
      <div className={`flex items-center gap-1 flex-shrink-0 ${selectionMode ? "hidden" : ""}`}>
        <button
          onClick={onEdit}
          title="Edit service"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="More"
            className="p-1.5 rounded-lg text-text-secondary hover:text-foreground hover:bg-surface cursor-pointer transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-card-bg border border-border-light rounded-lg shadow-lg py-1 min-w-[160px]">
              <button
                onClick={() => {
                  onDuplicate();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-surface cursor-pointer flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onToggleEnabled}
          className="cursor-pointer p-1"
          aria-label={service.enabled ? "Mark inactive" : "Mark active"}
          title={service.enabled ? "Active — click to mark inactive" : "Inactive — click to mark active"}
        >
          {service.enabled ? (
            <ToggleRight className="w-6 h-6 text-emerald-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-text-tertiary" />
          )}
        </button>
      </div>
    </div>
  );
}

function SortableServiceList({
  services,
  onReorder,
  selectionMode,
  renderItem,
}: {
  services: Service[];
  onReorder: (newOrder: Service[]) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  renderItem: (service: Service) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = services.findIndex((s) => s.id === active.id);
    const newIdx = services.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    onReorder(arrayMove(services, oldIdx, newIdx));
  };

  // In selection mode, skip the dnd context entirely — drag conflicts with
  // checkbox clicks and the user is operating in a different mental mode.
  if (selectionMode) {
    return (
      <div className="divide-y divide-border-light">
        {services.map((service) => (
          <div key={service.id}>{renderItem(service)}</div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={services.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-border-light">
          {services.map((service) => (
            <SortableRow key={service.id} id={service.id}>
              {renderItem(service)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// DndContext for the outer category list. The Uncategorized bucket is fixed
// to the bottom and never reorders, so it's excluded from the SortableContext
// items list and its SortableCategory is disabled.
function CategoryDndContext({
  orderedNames,
  onReorder,
  disabled,
  children,
}: {
  orderedNames: string[];
  onReorder: (newOrder: string[]) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  // Only the non-Uncategorized names participate in sorting.
  const sortableIds = orderedNames.filter((n) => n !== UNCATEGORIZED);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = sortableIds.indexOf(String(active.id));
    const newIdx = sortableIds.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sortableIds, oldIdx, newIdx);
    // Append Uncategorized back if it was in the original list, so the caller
    // sees a complete name list in render order.
    const finalOrder = orderedNames.includes(UNCATEGORIZED)
      ? [...reordered, UNCATEGORIZED]
      : reordered;
    onReorder(finalOrder);
  };

  if (disabled) return <>{children}</>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// Drag wrapper for the category card. Render-prop exposes the drag handle
// props so the category header can attach them to a small grip icon — drag
// triggers from the grip only, leaving the rest of the header clickable.
function SortableCategory({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (handleProps: {
    attributes: React.HTMLAttributes<HTMLElement>;
    listeners: React.HTMLAttributes<HTMLElement> | undefined;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.7 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : undefined,
  };
  // Drag handle sits absolutely within the row's existing left padding (px-5
  // on ServiceRow = 20px) so it doesn't shift the row's content rightward.
  return (
    <div ref={setNodeRef} style={style} className="group/row relative">
      <button
        type="button"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-text-tertiary opacity-0 group-hover/row:opacity-100 hover:text-foreground cursor-grab active:cursor-grabbing transition-opacity z-10"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  );
}
