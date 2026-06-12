import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus, ImageIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatINR, formatWeight, getStockStatus } from "@/lib/utils";
import { createProduct, fetchProducts, Product, updateProduct } from "@/lib/api/inventory";
import { queryKeys } from "@/lib/api/query-keys";
import { AddProductModal } from "./AddProductModal";
import { ProductDrawer } from "./ProductDrawer";

type Props = {
  activeCategory: string;
};

const stockClass = {
  "in-stock": "bg-success/10 text-success",
  low: "bg-warning/10 text-warning",
  out: "bg-danger/10 text-danger",
} as const;

const stockLabel = {
  "in-stock": "In stock",
  low: "Low stock",
  out: "Out",
} as const;

export const InventoryView = ({ activeView }: { activeView: string }) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null); // Add this
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: products = [] } = useQuery({
    // Safely pass the activeView into the query key array
    queryKey: ["products", activeView],
    queryFn: () => fetchProducts(activeView),
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate the base "products" key to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Close the modal after a successful save!
      setShowAdd(false);
    },
  });

  // Add this in your InventoryView.tsx file
const updateMutation = useMutation({
    // React Query expects (data: Product) here
    mutationFn: (updatedProduct: Product) => {
      // You extract the ID from the product object itself
      return updateProduct(updatedProduct.id.toString(), updatedProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAdd(false);
      setEditingProduct(null); // Clean up
    },
  });

 

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p: Product) => {
      const qMatch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return qMatch;
    });
  }, [products, search]);

  const handleOpenAddModal = () => {
    let mainCat = "rings";
    let subCat = "";

    if (activeView && activeView !== "all" && activeView !== "dashboard") {
      const isSubCategory = activeView.includes("-");
      mainCat = isSubCategory ? activeView.split("-")[0] : activeView;
      subCat = isSubCategory ? activeView : "";
    }
    setShowAdd(true);
  };
  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            className="w-full bg-surface rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="flex-1" />

        <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-surface text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          Filter
        </button>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add new item
        </button>
      </div>

      {/* Header row */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Inventory</h2>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            {filtered.length} {filtered.length === 1 ? "item" : "items"} ·{" "}
            {activeView === "dashboard" ? "All categories" : activeView}
          </p>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface py-20 text-center">
          <p className="text-sm text-muted-foreground">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const status = getStockStatus(p.stockQuantity);
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="group text-left rounded-xl bg-surface p-3 transition-all hover:bg-surface-2/70 hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="aspect-square rounded-lg bg-surface-2 flex items-center justify-center mb-3">
                  <ImageIcon className="w-7 h-7 text-muted-foreground/40" />
                </div>

                <div className="px-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
                        {p.sku}
                      </p>
                      <h3 className="text-[13.5px] font-medium text-foreground mt-0.5 truncate">
                        {p.name}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        stockClass[status],
                      )}
                    >
                      {stockLabel[status]}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gold-soft text-gold">
                        {p.purity}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {formatWeight(p.baseWeight)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border-subtle flex items-baseline justify-between">
                    <span className="text-[14px] font-semibold tracking-tight">
                      {formatINR(p.price)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{p.stockQuantity} pcs</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AddProductModal
  open={showAdd}
  productToEdit={editingProduct} // Pass the product state we created
  onClose={() => {
    setShowAdd(false);
    setEditingProduct(null); // Clear it
  }}
  onCreate={(p) => createMutation.mutate(p)}
  onUpdate={(p) => updateMutation.mutate(p)} // Pass your PUT mutation here
/>

      <ProductDrawer
        product={selected}
        onClose={() => setSelected(null)}
        onEdit={(productToEdit) => {
          setSelected(null); // Close drawer
          setEditingProduct(productToEdit); // Store the product in the new state
          setShowAdd(true); // Open the modal
        }}
      />
    </div>
  );
};
