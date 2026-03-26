import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types/models";
import { generateId } from "@/lib/id";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "@/components/ui/Toast";
import {
  fetchProducts,
  dbCreateProduct,
  dbUpdateProduct,
  dbDeleteProduct,
  dbUpsertProducts,
  mapProductFromDB,
} from "@/lib/db/products";

interface ProductsStore {
  products: Product[];
  addProduct: (
    data: Omit<Product, "id" | "createdAt" | "updatedAt">,
    workspaceId?: string
  ) => Product;
  updateProduct: (
    id: string,
    data: Partial<Product>,
    workspaceId?: string
  ) => void;
  deleteProduct: (id: string, workspaceId?: string) => void;
  getProductsByCategory: (category: string) => Product[];

  // Supabase sync
  syncToSupabase: (workspaceId: string) => Promise<void>;
  loadFromSupabase: (workspaceId: string) => Promise<void>;
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (data, workspaceId?) => {
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

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbCreateProduct(workspaceId, product).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "saving product" }));
          });
        }

        return product;
      },

      updateProduct: (id, data, workspaceId?) => {
        const updatedData = { ...data, updatedAt: new Date().toISOString() };
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...updatedData } : p
          ),
        }));
        logActivity("update", "products", "Updated product");
        toast("Product updated");

        // Sync to Supabase if workspaceId available
        if (workspaceId) {
          dbUpdateProduct(workspaceId, id, updatedData).catch((err) => {
            import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "updating product" }));
          });
        }
      },

      deleteProduct: (id, workspaceId?) => {
        const product = get().products.find((p) => p.id === id);
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
        if (product) {
          logActivity("delete", "products", `Removed "${product.name}"`);
          toast(`"${product.name}" deleted`, "info");

          // Sync to Supabase if workspaceId available
          if (workspaceId) {
            dbDeleteProduct(workspaceId, id).catch((err) => {
              import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "deleting product" }));
            });
          }
        }
      },

      getProductsByCategory: (category) =>
        get().products.filter((p) => p.category === category),

      // ---------------------------------------------------------------
      // Supabase sync
      // ---------------------------------------------------------------

      syncToSupabase: async (workspaceId: string) => {
        try {
          const { products } = get();
          await dbUpsertProducts(workspaceId, products);
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "syncing products to Supabase" }));
        }
      },

      loadFromSupabase: async (workspaceId: string) => {
        try {
          const rows = await fetchProducts(workspaceId);
          const mappedProducts = (rows ?? []).map((row: Record<string, unknown>) =>
            mapProductFromDB(row)
          );
          set({ products: mappedProducts });
        } catch (err) {
          import("@/lib/sync-error-handler").then(m => m.handleSyncError(err, { context: "loading products from Supabase" }));
        }
      },
    }),
    { name: "magic-crm-products" }
  )
);
