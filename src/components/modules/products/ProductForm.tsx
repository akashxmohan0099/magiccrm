"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useProductsStore } from "@/store/products";
import { Button } from "@/components/ui/Button";
import { FeatureSection } from "@/components/modules/FeatureSection";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
}

export function ProductForm({ open, onClose }: ProductFormProps) {
  const { addProduct } = useProductsStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("");
  const [variants, setVariants] = useState<{ name: string; price: string }[]>([]);
  const [costPrice, setCostPrice] = useState("");

  const addVariant = () => setVariants((prev) => [...prev, { name: "", price: "" }]);
  const updateVariant = (index: number, field: "name" | "price", value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  if (!open) return null;

  const inputClass = "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProduct({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      category: category.trim() || "General",
      sku: sku.trim() || undefined,
      inStock: true,
      quantity: quantity ? parseInt(quantity) : undefined,
    });
    setName(""); setDescription(""); setPrice(""); setCategory(""); setSku(""); setQuantity("");
    setVariants([]); setCostPrice("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-card-bg border-l border-border-light overflow-y-auto">
        <div className="sticky top-0 bg-card-bg border-b border-border-light px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[16px] font-bold text-foreground">Add Product</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-foreground rounded-lg hover:bg-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gel Manicure" required
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Price</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Optional"
                className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
            </div>
          </div>
          <FeatureSection moduleId="products" featureId="cost-margins" featureLabel="Cost Price & Margins">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Cost Price</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
              {costPrice && price && parseFloat(price) > 0 && (
                <p className="text-[11px] text-text-tertiary mt-1">
                  Margin: {((1 - parseFloat(costPrice) / parseFloat(price)) * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </FeatureSection>
          <FeatureSection moduleId="products" featureId="price-variants" featureLabel="Price Variants">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Price Variants</label>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(i, "name", e.target.value)}
                      placeholder="e.g. Small"
                      className={`flex-1 ${inputClass}`}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      placeholder="$"
                      className={`w-24 ${inputClass}`}
                    />
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="text-[12px] text-primary hover:underline cursor-pointer">+ Add variant</button>
              </div>
            </div>
          </FeatureSection>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Nails, Hair, Accessories"
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-foreground mb-1.5">SKU</label>
            <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional product code"
              className="w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full">Add Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
