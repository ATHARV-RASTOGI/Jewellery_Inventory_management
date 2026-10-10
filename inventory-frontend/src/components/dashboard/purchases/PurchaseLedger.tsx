import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, PackagePlus, Eye, Building2, Layers } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { fetchPurchases, fetchPurchaseItems, type Purchase, type PurchaseItem } from "@/lib/api/purchases";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { NewPurchaseModal } from "./NewPurchaseModal";

export const PurchaseLedger = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const { data: purchases = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: fetchPurchases });
  const { data: selectedItems = [], isLoading: isLoadingItems } = useQuery<PurchaseItem[]>({
    queryKey: ["purchase-items", selectedPurchase?.id],
    queryFn: () => (selectedPurchase ? fetchPurchaseItems(selectedPurchase.id) : []),
    enabled: !!selectedPurchase,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return purchases;
    const q = search.toLowerCase();
    return purchases.filter((p) =>
      p.supplierName?.toLowerCase().includes(q) ||
      p.supplierInvoiceNo?.toLowerCase().includes(q) ||
      p.supplierPhone?.includes(q) ||
      p.supplierGstin?.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const summary = useMemo(() => ({
    invoiceCount: filtered.length,
    supplierCount: new Set(filtered.map((p) => p.supplierName?.toLowerCase().trim())).size,
    totalUnits: filtered.reduce((acc, p) => acc + (p.itemCount || 0), 0),
  }), [filtered]);

  const drawerTotals = useMemo(() => ({
    totalPcs: selectedItems.reduce((acc, it) => acc + (it.quantity || 0), 0),
    totalWeight: selectedItems.reduce((acc, it) => acc + (it.weight || 0), 0),
  }), [selectedItems]);

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <SearchToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search purchases by supplier, invoice #, GSTIN…" className="max-w-md" />
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Record Inward Purchase
        </Button>
      </SearchToolbar>

      {/* Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y md:divide-y-0 divide-border bg-surface border border-border text-xs">
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Inward Invoices</div>
          <div className="text-base font-bold font-mono text-foreground mt-0.5">{summary.invoiceCount} invoices</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Active Suppliers</div>
          <div className="text-base font-bold font-mono text-primary mt-0.5">{summary.supplierCount} vendors</div>
        </div>
        <div className="px-4 py-2.5 bg-surface-2/40">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Total Articles Stocked</div>
          <div className="text-base font-bold font-mono text-foreground mt-0.5">{summary.totalUnits} pcs inward</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-40">Supplier Invoice #</th>
                <th className="py-2.5 px-3 min-w-[200px]">Supplier Name</th>
                <th className="py-2.5 px-3 w-36">GSTIN</th>
                <th className="py-2.5 px-3 w-28">Inward Date</th>
                <th className="py-2.5 px-3 text-center w-28">Stock Items</th>
                <th className="py-2.5 px-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Loading procurement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8"><EmptyState icon={PackagePlus} title="No purchases recorded" description="Record wholesale inward purchases." /></td></tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPurchase(p)}
                    className={`cursor-pointer transition-colors ${selectedPurchase?.id === p.id ? "bg-primary/5 font-medium" : "hover:bg-surface-2/60"}`}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-foreground">{p.supplierInvoiceNo}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-foreground text-xs leading-tight">{p.supplierName}</div>
                      {p.supplierPhone && <div className="text-[11px] text-muted-foreground font-mono">{p.supplierPhone}</div>}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground text-xs">{p.supplierGstin || "—"}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(p.purchaseDate)}</td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-2 text-foreground border border-border font-mono">{p.itemCount} pcs</span>
                    </td>
                    <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setSelectedPurchase(p)} leftIcon={<Eye className="w-3 h-3" />}>
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title={selectedPurchase ? `Invoice ${selectedPurchase.supplierInvoiceNo}` : ""}
        subtitle={selectedPurchase ? `${selectedPurchase.supplierName} · Received ${fmtDate(selectedPurchase.purchaseDate)}` : undefined}
      >
        {selectedPurchase && (
          <div className="space-y-4 text-xs">
            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Supplier Profile
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
                <div><span className="text-muted-foreground block text-[11px]">Vendor</span><span className="font-semibold text-foreground">{selectedPurchase.supplierName}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Phone</span><span className="font-mono text-foreground">{selectedPurchase.supplierPhone || "—"}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">GSTIN</span><span className="font-mono text-foreground">{selectedPurchase.supplierGstin || "—"}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Date</span><span className="font-mono text-foreground">{fmtDate(selectedPurchase.purchaseDate)}</span></div>
              </div>
            </div>

            <div className="border border-border overflow-hidden bg-surface">
              <div className="bg-surface-2 p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-foreground">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Inward Manifest ({selectedItems.length})
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {drawerTotals.totalPcs} pcs · {drawerTotals.totalWeight.toFixed(3)}g
                </span>
              </div>

              {isLoadingItems ? (
                <div className="py-8 text-center text-muted-foreground">Loading line items…</div>
              ) : selectedItems.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No line items attached.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-surface-2/60 text-muted-foreground font-medium uppercase tracking-wider text-[10.5px]">
                      <tr>
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Purity</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {selectedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-2/40">
                          <td className="py-2 px-3 font-medium text-foreground">{item.productName || item.sku || "Jewelry Article"}</td>
                          <td className="py-2 px-3 text-muted-foreground">{item.purity || "—"}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium text-foreground tabular-nums">{item.quantity} pcs</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-foreground tabular-nums">{item.weight ? `${Number(item.weight).toFixed(3)} g` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      <NewPurchaseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
