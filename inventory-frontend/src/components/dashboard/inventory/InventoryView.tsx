import { useMemo, useState } from "react";
import { Plus, ArrowUp, ArrowDown, ArrowUpDown, Package } from "lucide-react";
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
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";

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
    mutationFn: (updatedProduct: Product) =>
      updateProduct(updatedProduct.id.toString(), updatedProduct),
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

  const columns = [
    { header: "SKU" },
    { header: "Product Name" },
    {
      header: (
        <button
          onClick={() => toggleSort("purity")}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors uppercase"
        >
          Purity <SortIcon column="purity" />
        </button>
      ),
    },
    {
      header: (
        <button
          onClick={() => toggleSort("weight")}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto uppercase"
        >
          Weight <SortIcon column="weight" />
        </button>
      ),
      align: "right" as const,
    },
    {
      header: (
        <button
          onClick={() => toggleSort("price")}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto uppercase"
        >
          Est. Price <SortIcon column="price" />
        </button>
      ),
      align: "right" as const,
    },
    { header: "Stock", align: "right" as const },
    { header: "Status", align: "center" as const },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <SearchToolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter items by title or SKU…"
          className="max-w-md"
        />

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
            onClick={() => setShowAdd(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Item
          </Button>
        </div>
      </SearchToolbar>

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

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyExtractor={(p) => p.id}
        emptyState={
          <EmptyState
            icon={Package}
            title="No inventory items found"
            description="Try selecting another category from the sidebar or adding a new jewelry product."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAdd(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Item
              </Button>
            }
          />
        }
        renderRow={(p) => {
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
        }}
      />

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