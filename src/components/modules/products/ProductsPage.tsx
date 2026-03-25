"use client";

import { useState } from "react";
import { Plus, Package, Upload } from "lucide-react";
import { useProductsStore } from "@/store/products";
import { Product } from "@/types/models";
import { FeatureSection } from "@/components/modules/FeatureSection";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ProductForm } from "./ProductForm";
import { CSVImportWizard } from "@/components/modules/shared/CSVImportWizard";

export function ProductsPage() {
  const { products } = useProductsStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);

  const columns: Column<Product>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (p) => `$${p.price.toFixed(2)}`,
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (p) =>
        p.quantity !== undefined ? (
          <span className={p.quantity <= 0 ? "text-red-500 font-medium" : ""}>
            {p.quantity}
          </span>
        ) : (
          <span className="text-text-tertiary">—</span>
        ),
    },
    {
      key: "inStock",
      label: "Status",
      render: (p) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            p.inStock
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {p.inStock ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products & Services"
        description="Manage your product and service catalog."
        actions={
          <div className="flex items-center gap-2">
            <FeatureSection moduleId="client-database" featureId="import-export" featureLabel="Import / Export">
              <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-1.5" />
                Import
              </Button>
            </FeatureSection>
            <Button variant="primary" size="sm" onClick={() => { setEditingProduct(undefined); setFormOpen(true); }}>
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </div>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title="No products yet"
          description="Add your products and services to start building your catalog."
          setupSteps={[
            { label: "Add your first product or service", description: "Name, price, and category", action: () => { setEditingProduct(undefined); setFormOpen(true); } },
          ]}
        />
      ) : (
        <div className="bg-card-bg rounded-xl border border-border-light overflow-hidden">
          <DataTable<Product>
            storageKey="magic-crm-products-columns"
            columns={columns}
            data={products}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => { setEditingProduct(p); setFormOpen(true); }}
          />
        </div>
      )}

      <CSVImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        defaultTarget="products"
      />

      <ProductForm open={formOpen} onClose={() => { setFormOpen(false); setEditingProduct(undefined); }} product={editingProduct} />
    </div>
  );
}
