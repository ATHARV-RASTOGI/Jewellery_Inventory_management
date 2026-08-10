import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus, ImageIcon, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatINR, formatWeight, getStockStatus } from "@/lib/utils";
import { createProduct, fetchProducts, Product, updateProduct } from "@/lib/api/inventory";

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

// ── Sort config ─────────────────────────────────────────────────────────────
type SortKey = "weight" | "purity" | "price" | null;
type SortDir = "asc" | "desc";

// "22K" -> 22, "18k" -> 18, "925" (silver) -> 925 — adjust regex if your format differs
function parsePurity(purity: string): number {
  const match = purity?.match(/\d+/);
  return match ? parseFloat(match[0]) : 0;
}

export const InventoryView = ({ activeView }: { activeView: string }) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeView],
    queryFn: () => {
      // 1. If we are on the dashboard, fetch everything as usual
      if (!activeView || activeView === "dashboard" || activeView === "all") {
        return fetchProducts(activeView);
      }
      
      // 2. Strip the "gold-" or "silver-" prefix for the backend
      const parts = activeView.split("-");
      
      // e.g., "silver-anklets-daily" becomes just "anklets"
      const cleanCategoryForBackend = parts.length > 1 ? parts[1] : activeView;
      
      // 3. Ask Java for all "anklets"
      return fetchProducts(cleanCategoryForBackend);
    },
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProduct: Product) => {
      return updateProduct(updatedProduct.id.toString(), updatedProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAdd(false);
      setEditingProduct(null);
    },
  });

  // Click a column header — first click sorts ascending, second click on the
  // same column flips to descending, clicking a different column resets to asc.
  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    let result = products.filter((p: Product) => {
      // 1. Text Search Filter (Name or SKU)
      const qMatch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      if (!qMatch) return false;

      // 2. Category Filter (Skip if viewing everything on the dashboard)
      if (!activeView || activeView === "dashboard" || activeView === "all") {
        return true;
      }

      // 3. Parse the Gold/Silver prefix from the sidebar
      const categoryParts = activeView.split("-");
      const expectedMaterial = activeView.startsWith("silver") ? "Silver" : "Gold";
      
      // If the sidebar ID is something like "gold-rings" or "silver-anklets-daily"
      if (categoryParts.length > 1) {
        const expectedMainCategory = categoryParts[1];
        const expectedSubCategory = categoryParts.length > 2 
          ? `${categoryParts[1]}-${categoryParts[2]}` 
          : null;

        if (p.material !== expectedMaterial) return false;
        if (p.mainCategory !== expectedMainCategory) return false;
        if (expectedSubCategory && p.subCategory !== expectedSubCategory) return false;
      }

      return true;
    });

    // 4. Sorting Logic
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let av: number, bv: number;
        if (sortKey === "weight") {
          av = a.baseWeight ?? 0;
          bv = b.baseWeight ?? 0;
        } else if (sortKey === "purity") {
          av = parsePurity(a.purity);
          bv = parsePurity(b.purity);
        } else {
          av = a.price ?? 0;
          bv = b.price ?? 0;
        }
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }

    return result;
  }, [products, search, sortKey, sortDir, activeView]); // <-- Added activeView here!  

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

  // Small helper to render the sort icon for a header
  const SortIcon = ({ column }: { column: Exclude<SortKey, null> }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-foreground" />
    ) : (
      <ArrowDown className="w-3 h-3 text-foreground" />
    );
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

        {sortKey && (
          <button
            onClick={() => setSortKey(null)}
            className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear sort
          </button>
        )}

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
            {sortKey && (
              <>
                {" "}· sorted by {sortKey} ({sortDir === "asc" ? "low → high" : "high → low"})
              </>
            )}
          </p>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-surface py-20 text-center">
          <p className="text-sm text-muted-foreground">No items found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
             
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Item
                </th>

                {/* Purity — sortable */}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    onClick={() => toggleSort("purity")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Purity <SortIcon column="purity" />
                  </button>
                </th>

                {/* Weight — sortable */}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    onClick={() => toggleSort("weight")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Weight <SortIcon column="weight" />
                  </button>
                </th>

                {/* Price — sortable */}
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    onClick={() => toggleSort("price")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Price <SortIcon column="price" />
                  </button>
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const status = getStockStatus(p.stockQuantity);
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer hover:bg-surface-2/50 transition-colors"
                  >

                    {/* SKU */}
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground/80 uppercase tracking-wider whitespace-nowrap">
                      {p.sku}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-2.5">
                      <p className="text-[13.5px] font-medium text-foreground truncate max-w-[220px]">
                        {p.name}
                      </p>
                    </td>

                    {/* Purity */}
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-gold-soft text-gold whitespace-nowrap">
                        {p.purity}
                      </span>
                    </td>

                    {/* Weight */}
                    <td className="px-4 py-2.5 text-[12.5px] text-muted-foreground whitespace-nowrap">
                      {formatWeight(p.baseWeight)}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-[13.5px] whitespace-nowrap">
                      {formatINR(p.price)}
                    </td>

                    {/* Stock qty */}
                    <td className="px-4 py-2.5 text-[12.5px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {p.stockQuantity} pcs
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap",
                          stockClass[status],
                        )}
                      >
                        {stockLabel[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddProductModal
        open={showAdd}
        productToEdit={editingProduct}
        onClose={() => {
          setShowAdd(false);
          setEditingProduct(null);
        }}
        onCreate={(p) => createMutation.mutate(p)}
        onUpdate={(p) => updateMutation.mutate(p)}
        activeCategory={activeView} /* <-- Add this line! */
      />

      <ProductDrawer
        product={selected}
        onClose={() => setSelected(null)}
        onEdit={(productToEdit) => {
          setSelected(null);
          setEditingProduct(productToEdit);
          setShowAdd(true);
        }}
      />
    </div>
  );
};