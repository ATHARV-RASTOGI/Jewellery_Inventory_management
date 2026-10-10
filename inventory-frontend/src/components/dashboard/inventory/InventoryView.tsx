import { useMemo, useState } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Package,
  Layers,
  AlertTriangle,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatWeight, getStockStatus } from "@/lib/utils";
import { createProduct, fetchProducts, Product, updateProduct } from "@/lib/api/inventory";
import { getSidebarCategories } from "@/lib/categories";
import { AddProductModal } from "./AddProductModal";
import { ProductDrawer } from "./ProductDrawer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SearchToolbar, SearchInput, FilterTabs } from "@/components/ui/SearchToolbar";

type SortKey = "weight" | "purity" | "stock" | null;
type SortDir = "asc" | "desc";

const parsePurity = (p: string) => {
  const m = p?.match(/\d+/);
  return m ? parseFloat(m[0]) : 0;
};

export const InventoryView = ({ activeView }: { activeView: string }) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">("all");
  const [activeMetal, setActiveMetal] = useState<"gold" | "silver">(activeView.startsWith("silver") ? "silver" : "gold");

  const categories = useMemo(() => [
    { id: "all", label: "All Items" },
    ...getSidebarCategories(activeMetal).map((c) => ({ id: c.id, label: c.label })),
  ], [activeMetal]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", activeView, activeMetal],
    queryFn: () => {
      if (!activeView || activeView === "dashboard" || activeView === "all") return fetchProducts(activeView);
      const parts = activeView.split("-");
      return fetchProducts(parts.length > 1 ? parts[1] : activeView);
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
    mutationFn: (p: Product) => updateProduct(p.id.toString(), p),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAdd(false);
      setEditingProduct(null);
    },
  });

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const metalProducts = useMemo(() => {
    const expected = activeMetal === "silver" ? "Silver" : "Gold";
    return products.filter((p: Product) => !p.material || p.material.toLowerCase() === expected.toLowerCase());
  }, [products, activeMetal]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: metalProducts.length };
    metalProducts.forEach((p) => {
      const cat = p.mainCategory?.toLowerCase() || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [metalProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let res = metalProducts.filter((p: Product) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (selectedCategory !== "all" && p.mainCategory?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (stockFilter !== "all" && getStockStatus(p.stockQuantity) !== stockFilter) return false;
      return true;
    });

    if (sortKey) {
      res = [...res].sort((a, b) => {
        const av = sortKey === "weight" ? a.totalWeight ?? a.baseWeight ?? 0 : sortKey === "purity" ? parsePurity(a.purity) : a.stockQuantity ?? 0;
        const bv = sortKey === "weight" ? b.totalWeight ?? b.baseWeight ?? 0 : sortKey === "purity" ? parsePurity(b.purity) : b.stockQuantity ?? 0;
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }
    return res;
  }, [metalProducts, search, sortKey, sortDir, selectedCategory, stockFilter]);

  const metrics = useMemo(() => {
    const totalWeight = filtered.reduce((s, p) => s + (p.totalWeight ?? p.baseWeight ?? 0) * (p.stockQuantity ?? 1), 0);
    const lowStockCount = filtered.filter((p) => getStockStatus(p.stockQuantity) === "low").length;
    const outOfStockCount = filtered.filter((p) => getStockStatus(p.stockQuantity) === "out").length;
    return { totalWeight, lowStockCount, outOfStockCount };
  }, [filtered]);

  const SortIcon = ({ column }: { column: Exclude<SortKey, null> }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 ml-1 inline" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-primary ml-1 inline" /> : <ArrowDown className="w-3 h-3 text-primary ml-1 inline" />;
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Toolbar */}
      <SearchToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter catalog by SKU, design name, barcode…" className="max-w-md" />
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <FilterTabs
            options={[
              { id: "all", label: "All Stock" },
              { id: "in-stock", label: "In Stock" },
              { id: "low", label: "Low Stock" },
              { id: "out", label: "Out of Stock" },
            ]}
            active={stockFilter}
            onChange={(s) => setStockFilter(s as any)}
          />
          {sortKey && (
            <Button variant="ghost" size="sm" onClick={() => setSortKey(null)} className="text-xs">Reset Sort</Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add New Item
          </Button>
        </div>
      </SearchToolbar>

      {/* 2-Pane Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-3 items-start">
        {/* LEFT PANE: Category Rail */}
        <div className="bg-surface border border-border p-3 space-y-3">
          <div>
            <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5 flex justify-between">
              <span>Catalog Metal</span>
              <span className="font-mono text-[10px]">{products.length} total</span>
            </div>
            <div className="grid grid-cols-2 p-0.5 bg-surface-2 border border-border rounded text-xs font-medium">
              <button
                type="button"
                onClick={() => { setActiveMetal("gold"); setSelectedCategory("all"); }}
                className={`py-1.5 px-2 text-center rounded transition-all cursor-pointer ${activeMetal === "gold" ? "bg-surface font-semibold text-amber-700 shadow-xs border border-border/80" : "text-muted-foreground hover:text-foreground"}`}
              >
                Gold Catalog
              </button>
              <button
                type="button"
                onClick={() => { setActiveMetal("silver"); setSelectedCategory("all"); }}
                className={`py-1.5 px-2 text-center rounded transition-all cursor-pointer ${activeMetal === "silver" ? "bg-surface font-semibold text-slate-800 shadow-xs border border-border/80" : "text-muted-foreground hover:text-foreground"}`}
              >
                Silver Catalog
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Jewelry Categories</span>
            </div>
            <div className="space-y-0.5">
              {categories.map((cat) => {
                const count = categoryCounts[cat.id] ?? 0;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${isActive ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-surface-2"}`}
                  >
                    <span className="truncate">{cat.label}</span>
                    <span className={`text-[10.5px] font-mono px-1.5 rounded ${isActive ? "bg-white/20 text-white font-bold" : "bg-surface-2 text-muted-foreground font-medium"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {(metrics.lowStockCount > 0 || metrics.outOfStockCount > 0) && (
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="text-[10.5px] uppercase font-semibold tracking-wider text-muted-foreground">Stock Attention</div>
              {metrics.lowStockCount > 0 && (
                <button type="button" onClick={() => setStockFilter("low")} className="w-full flex justify-between items-center text-xs px-2 py-1 bg-amber-500/10 text-amber-800 rounded border border-amber-500/20 hover:bg-amber-500/15 cursor-pointer">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" />Low Stock</span>
                  <span className="font-mono font-bold">{metrics.lowStockCount}</span>
                </button>
              )}
              {metrics.outOfStockCount > 0 && (
                <button type="button" onClick={() => setStockFilter("out")} className="w-full flex justify-between items-center text-xs px-2 py-1 bg-red-500/10 text-red-800 rounded border border-red-500/20 hover:bg-red-500/15 cursor-pointer">
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-600" />Out of Stock</span>
                  <span className="font-mono font-bold">{metrics.outOfStockCount}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANE: Catalog Metrics & Table */}
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-3 divide-x divide-border bg-surface border border-border text-xs">
            <div className="px-3.5 py-2">
              <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Listed Articles</div>
              <div className="text-sm font-bold font-mono text-foreground mt-0.5">{filtered.length}</div>
            </div>
            <div className="px-3.5 py-2">
              <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Condition Alert</div>
              <div className="text-sm font-bold font-mono mt-0.5">
                {metrics.lowStockCount === 0 && metrics.outOfStockCount === 0 ? (
                  <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Healthy</span>
                ) : (
                  <span className="text-warning">{metrics.lowStockCount} Low · {metrics.outOfStockCount} Out</span>
                )}
              </div>
            </div>
            <div className="px-3.5 py-2 bg-surface-2/40">
              <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Estimated Net Weight</div>
              <div className="text-sm font-bold font-mono text-foreground mt-0.5">{formatWeight(metrics.totalWeight)}</div>
            </div>
          </div>

          <div className="bg-surface border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-surface-2 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-28">SKU</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Product / Design Name</th>
                    <th className="py-2.5 px-3 w-28">
                      <button type="button" onClick={() => toggleSort("purity")} className="inline-flex items-center uppercase cursor-pointer hover:text-foreground font-medium">
                        Purity <SortIcon column="purity" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3 text-right w-28">
                      <button type="button" onClick={() => toggleSort("weight")} className="inline-flex items-center uppercase cursor-pointer hover:text-foreground font-medium ml-auto">
                        Weight <SortIcon column="weight" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3 text-right w-24">
                      <button type="button" onClick={() => toggleSort("stock")} className="inline-flex items-center uppercase cursor-pointer hover:text-foreground font-medium ml-auto">
                        Stock <SortIcon column="stock" />
                      </button>
                    </th>
                    <th className="py-2.5 px-3 text-center w-28">Status</th>
                    <th className="py-2.5 px-3 text-right w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Loading catalog…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="p-8"><EmptyState icon={Package} title="No inventory articles found" description="Try switching category or search query." /></td></tr>
                  ) : (
                    filtered.map((p) => {
                      const status = getStockStatus(p.stockQuantity);
                      const badgeMap: Record<string, { variant: "success" | "warning" | "danger"; label: string }> = {
                        "in-stock": { variant: "success", label: "In Stock" },
                        low: { variant: "warning", label: "Low Stock" },
                        out: { variant: "danger", label: "Out of Stock" },
                      };
                      const currentBadge = badgeMap[status] ?? { variant: "neutral", label: status };

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={`cursor-pointer transition-colors ${selected?.id === p.id ? "bg-primary/5 font-medium" : "hover:bg-surface-2/60"}`}
                        >
                          <td className="py-2 px-3 font-mono font-medium text-primary">{p.sku}</td>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-foreground text-xs leading-tight">{p.name}</div>
                            <div className="text-[10.5px] text-muted-foreground capitalize">
                              {p.mainCategory ? p.mainCategory.replace(/-/g, " ") : "General"}
                              {p.subCategory ? ` · ${p.subCategory.replace(/-/g, " ")}` : ""}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <StatusBadge variant={p.material.toLowerCase() === "gold" ? "gold" : "info"}>{p.purity}</StatusBadge>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">
                            {formatWeight(p.totalWeight ?? p.baseWeight)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-foreground tabular-nums whitespace-nowrap">
                            <span className={p.stockQuantity <= 2 ? "text-warning font-bold" : "text-foreground"}>{p.stockQuantity} pcs</span>
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <StatusBadge variant={currentBadge.variant} withDot>{currentBadge.label}</StatusBadge>
                          </td>
                          <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelected(p)} leftIcon={<Eye className="w-3 h-3" />}>View</Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AddProductModal open={showAdd} productToEdit={editingProduct} onClose={() => { setShowAdd(false); setEditingProduct(null); }} onCreate={(p) => createMutation.mutate(p)} onUpdate={(p) => updateMutation.mutate(p)} activeCategory={activeView} />
      <ProductDrawer product={selected} onClose={() => setSelected(null)} onEdit={(productToEdit) => { setSelected(null); setEditingProduct(productToEdit); setShowAdd(true); }} />
    </div>
  );
};