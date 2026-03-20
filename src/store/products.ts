import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";

interface ProductsStore {
  products: Product[];
  addProduct: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductsByCategory: (category: string) => Product[];
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (data) => {
        const now = new Date().toISOString();
        const product: Product = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ products: [...s.products, product] }));
        logActivity("create", "products", `Added product "${data.name}"`);
        toast(`Added "${data.name}"`);
        return product;
      },

      updateProduct: (id, data) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        const product = get().products.find((p) => p.id === id);
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        if (product) logActivity("delete", "products", `Removed "${product.name}"`);
      },

      getProductsByCategory: (category) =>
        get().products.filter((p) => p.category === category),
    }),
    { name: "magic-crm-products" }
  )
);
