import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Package,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatINR, formatWeight, getStockStatus } from "@/lib/utils";
import {
  createProduct,
  fetchProducts,
  Product,
  updateProduct,
} from "@/lib/api/inventory";

import { AddProductModal } from "./AddProductModal";
import { ProductDrawer } from "./ProductDrawer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TableSkeleton } from "@/components/feedback/Skeleton";

type SortKey = "weight" | "purity" | "price" | null;
type SortDir = "asc" | "desc";

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

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", activeView],
    queryFn: () => {
      if (!activeView || activeView === "dashboard" || activeView === "all") {
        return fetchProducts(activeView);
      }
      const parts = activeView.split("-");
      const cleanCategoryForBackend =
        parts.length > 1 ? parts[1] : activeView;
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
      const qMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      if (!qMatch) return false;

      if (!activeView || activeView === "dashboard" || activeView === "all") {
        return true;
      }

      const categoryParts = activeView.split("-");
      const expectedMaterial = activeView.startsWith("silver")
        ? "Silver"
        : "Gold";

      if (categoryParts.length > 1) {
        const expectedMainCategory = categoryParts[1];
        const expectedSubCategory =
          categoryParts.length > 2
            ? `${categoryParts[1]}-${categoryParts[2]}`
            : null;

        if (p.material !== expectedMaterial) return false;
        if (p.mainCategory !== expectedMainCategory) return false;
        if (expectedSubCategory && p.subCategory !== expectedSubCategory)
          return false;
      }

      return true;
    });

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
  }, [products, search, sortKey, sortDir, activeView]);

  const handleOpenAddModal = () => {
    setShowAdd(true);
  };

  const SortIcon = ({ column }: { column: Exclude<SortKey, null> }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary" />
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter items by title or SKU…"
            className="w-full bg-surface-2 border border-border/60 hover:border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {sortKey && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortKey(null)}
              className="text-xs"
            >
              Reset Sort
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Item
          </Button>
        </div>
      </div>

      {/* Header Info Bar */}
      <div className="flex items-baseline justify-between px-1 text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">
            {filtered.length}
          </span>{" "}
          item{filtered.length === 1 ? "" : "s"} listed ·{" "}
          <span className="capitalize">
            {activeView === "dashboard" ? "All Categories" : activeView.replace(/-/g, " ")}
          </span>
          {sortKey && (
            <span className="text-primary font-medium">
              {" "}· Sorted by {sortKey} ({sortDir === "asc" ? "Ascending" : "Descending"})
            </span>
          )}
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <TableSkeleton rows={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No inventory items found"
          description="Try selecting another category from the sidebar or adding a new jewelry product."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Item
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  <button
                    onClick={() => toggleSort("purity")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors uppercase"
                  >
                    Purity <SortIcon column="purity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  <button
                    onClick={() => toggleSort("weight")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto uppercase"
                  >
                    Weight <SortIcon column="weight" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  <button
                    onClick={() => toggleSort("price")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto uppercase"
                  >
                    Est. Price <SortIcon column="price" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((p) => {
                const status = getStockStatus(p.stockQuantity);
                const statusMap: Record<
                  string,
                  { variant: "success" | "warning" | "danger"; label: string }
                > = {
                  "in-stock": { variant: "success", label: "In Stock" },
                  low: { variant: "warning", label: "Low Stock" },
                  out: { variant: "danger", label: "Out of Stock" },
                };
                const currentBadge = statusMap[status] ?? {
                  variant: "neutral",
                  label: status,
                };

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer hover:bg-surface-2/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13.5px] font-medium text-foreground truncate max-w-[240px]">
                        {p.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge
                        variant={
                          p.material.toLowerCase() === "gold" ? "gold" : "info"
                        }
                      >
                        {p.purity}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground tabular-nums text-right whitespace-nowrap font-mono">
                      {formatWeight(p.baseWeight)}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-right text-[13.5px] text-foreground whitespace-nowrap">
                      {formatINR(p.price)}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground tabular-nums text-right whitespace-nowrap">
                      {p.stockQuantity} pcs
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge variant={currentBadge.variant} withDot>
                        {currentBadge.label}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <AddProductModal
        open={showAdd}
        productToEdit={editingProduct}
        onClose={() => {
          setShowAdd(false);
          setEditingProduct(null);
        }}
        onCreate={(p) => createMutation.mutate(p)}
        onUpdate={(p) => updateMutation.mutate(p)}
        activeCategory={activeView}
      />

      {/* PRODUCT DETAILS DRAWER */}
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