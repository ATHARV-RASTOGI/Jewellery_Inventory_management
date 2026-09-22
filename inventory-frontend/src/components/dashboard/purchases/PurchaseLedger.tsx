import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, PackagePlus, Eye, Building2, Receipt, FileText, Tag, Hash } from "lucide-react";
import { formatINR, fmtDate } from "@/lib/utils";
import {
  fetchPurchases,
  fetchPurchaseItems,
  type Purchase,
  type PurchaseItem,
} from "@/lib/api/purchases";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";
import { NewPurchaseModal } from "./NewPurchaseModal";

export const PurchaseLedger = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: fetchPurchases,
  });

  const { data: selectedItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["purchase-items", selectedPurchase?.id],
    queryFn: () => (selectedPurchase ? fetchPurchaseItems(selectedPurchase.id) : []),
    enabled: !!selectedPurchase,
  });

  const filtered = purchases.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.supplierName?.toLowerCase().includes(q) ||
      p.supplierInvoiceNo?.toLowerCase().includes(q) ||
      p.supplierPhone?.includes(q) ||
      p.supplierGstin?.toLowerCase().includes(q)
    );
  });

  const totalItemsCount = filtered.reduce((acc, p) => acc + (p.itemCount || 0), 0);

  const columns = [
    { header: "Supplier Invoice #" },
    { header: "Supplier Name" },
    { header: "GSTIN" },
    { header: "Date" },
    { header: "Items", align: "center" as const },
    { header: "Action", align: "right" as const },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <SearchToolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search purchases by supplier, invoice #, phone, or GSTIN…"
          className="max-w-md"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Purchase
        </Button>
      </SearchToolbar>

      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <div>
          Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          purchase invoice{filtered.length === 1 ? "" : "s"}
        </div>
        <div>
          Total Items Stocked:{" "}
          <span className="font-mono font-semibold text-foreground">
            {totalItemsCount}
          </span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyExtractor={(p) => p.id}
        emptyState={
          <EmptyState
            icon={PackagePlus}
            title="No purchase transactions recorded"
            description="Record wholesale jewelry purchases to track acquisition costs and auto-increment inventory stock."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Record First Purchase
              </Button>
            }
          />
        }
        renderRow={(purchase) => (
          <tr key={purchase.id} className="hover:bg-surface-2/50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono font-semibold text-foreground">
              {purchase.supplierInvoiceNo}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <p className="font-semibold text-[13px] text-foreground">
                {purchase.supplierName}
              </p>
              {purchase.supplierPhone && (
                <p className="text-[11px] text-muted-foreground">
                  {purchase.supplierPhone}
                </p>
              )}
            </td>
            <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
              {purchase.supplierGstin ? (
                <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border/70 text-[11px]">
                  {purchase.supplierGstin}
                </span>
              ) : (
                <span className="text-muted-foreground/60">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-[12.5px] text-muted-foreground whitespace-nowrap">
              {fmtDate(purchase.purchaseDate)}
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {purchase.itemCount} item{purchase.itemCount === 1 ? "" : "s"}
              </span>
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPurchase(purchase)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                View Items
              </Button>
            </td>
          </tr>
        )}
      />

      {/* New Purchase Modal */}
      <NewPurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <Modal
          open={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Invoice: ${selectedPurchase.supplierInvoiceNo}`}
          subtitle={`${selectedPurchase.supplierName} · Recorded on ${fmtDate(
            selectedPurchase.purchaseDate
          )}`}
          maxWidth="3xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                Total Items:{" "}
                <span className="font-semibold text-foreground">
                  {selectedItems.reduce((acc, it) => acc + (it.quantity || 0), 0)} pcs (
                  {selectedItems.reduce((acc, it) => acc + (it.weight || 0), 0).toFixed(3)} g)
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPurchase(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Supplier Summary Header */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-surface-2/40 border border-border/60 rounded-xl text-xs">
              <div>
                <p className="text-muted-foreground text-[11px]">Supplier</p>
                <p className="font-semibold text-foreground">{selectedPurchase.supplierName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Contact Phone</p>
                <p className="font-medium text-foreground">
                  {selectedPurchase.supplierPhone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Supplier GSTIN</p>
                <p className="font-mono text-foreground">
                  {selectedPurchase.supplierGstin || "Unregistered"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Invoice Date</p>
                <p className="font-medium text-foreground">
                  {fmtDate(selectedPurchase.purchaseDate)}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border/70 rounded-xl overflow-hidden bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/70 border-b border-border/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">SKU & Item</th>
                    <th className="px-3 py-2.5">Purity</th>
                    <th className="px-3 py-2.5 text-center">HSN</th>
                    <th className="px-3 py-2.5 text-center">Qty</th>
                    <th className="px-3 py-2.5 text-right">Weight (g)</th>
                    <th className="px-3 py-2.5 text-right">Cost / g</th>
                    <th className="px-3 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoadingItems ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-muted-foreground">
                        Loading invoice items...
                      </td>
                    </tr>
                  ) : selectedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-muted-foreground">
                        No items found for this invoice.
                      </td>
                    </tr>
                  ) : (
                    selectedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-2/30">
                        <td className="px-3 py-2.5">
                          <p className="font-mono font-semibold text-foreground">
                            {item.sku}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.productName}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-warning/15 text-warning">
                            {item.material} {item.purity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-[11px] text-muted-foreground">
                          {item.hsnCode || "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {item.weight != null ? `${item.weight.toFixed(3)} g` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {item.costPerGram != null ? formatINR(item.costPerGram) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                          {formatINR(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
