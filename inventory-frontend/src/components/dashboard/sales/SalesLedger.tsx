import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Printer, ShoppingBag, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatINR, fmtDate } from "@/lib/utils";
import { fetchSales, fetchSaleItems, createSale, type Sale, type SaleItem } from "@/lib/api/sales";
import { fetchProducts, Product } from "@/lib/api/inventory";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SalesInvoiceSlip } from "@/components/receipts/SalesInvoiceSlip";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { useCartManager } from "@/lib/hooks/useCartManager";
import { CartTable } from "@/components/ui/CartTable";

const formatPhone = (val: string) => {
  const d = val.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
};

const NewSaleModal = ({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (sale: Sale) => void }) => {
  const qc = useQueryClient();
  const [customer, setCustomer] = useState({ customerName: "", customerPhone: "", customerAddress: "", customerGstin: "" });
  const [isSkuFocused, setIsSkuFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const skuContainerRef = useRef<HTMLDivElement>(null);

  const {
    cart, skuInput, setSkuInput, skuError, setSkuError, addToCart, addProductToCart,
    removeFromCart, updateQty, updateWeight, updateRate, updateMakingPercent,
    resetCart, subtotal, gst, grandTotal,
  } = useCartManager();

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts(), enabled: open });

  const suggestions = useMemo(() => {
    const q = skuInput.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.mainCategory?.toLowerCase().includes(q)).slice(0, 7);
  }, [products, skuInput]);

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: (newSale: Sale) => {
      toast.success(`Invoice #${newSale.id} created!`);
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onCreated(newSale);
      resetCart();
      setCustomer({ customerName: "", customerPhone: "", customerAddress: "", customerGstin: "" });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create invoice"),
  });

  const handleSelectProduct = (p: Product) => {
    addProductToCart(p);
    setIsSkuFocused(false);
    setSelectedIndex(-1);
  };

  const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) handleSelectProduct(suggestions[selectedIndex]);
      else addToCart(products);
    } else if (e.key === "Escape") {
      setIsSkuFocused(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = customer.customerPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) return toast.error("Mobile number must be exactly 10 digits");
    if (cart.length === 0) return toast.error("Please add at least one item");
    mutation.mutate({
      customerName: customer.customerName,
      customerPhone: cleanPhone,
      customerAddress: customer.customerAddress || "",
      customerGstin: customer.customerGstin || undefined,
      items: cart.map((it) => ({
        sku: it.sku,
        quantity: it.quantity,
        pricePerPiece: it.pricePerPiece,
        weight: it.weight,
        appliedRatePer10g: it.appliedRatePer10g,
        makingChargePercent: it.makingChargePercent,
        makingChargeAmount: it.makingChargeAmount,
      })),
    });
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="POS Counter Sales Register"
      subtitle="Issue GST tax invoice, deduct catalog stock, and calculate making charges."
      maxWidth="4xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="new-sale-form" variant="primary" size="sm" isLoading={mutation.isPending} disabled={cart.length === 0} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Finalize Invoice
          </Button>
        </>
      }
    >
      <form id="new-sale-form" onSubmit={submit} className="space-y-4 text-xs">
        <div className="bg-surface-2 p-3.5 border border-border">
          <div className="text-[10.5px] uppercase font-bold text-muted-foreground mb-2">Customer Profile</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input label="Name" required placeholder="Patron Name" value={customer.customerName} onChange={(e) => setCustomer((p) => ({ ...p, customerName: e.target.value }))} />
            <Input label="Phone" required placeholder="10-digit mobile" value={customer.customerPhone} onChange={(e) => setCustomer((p) => ({ ...p, customerPhone: formatPhone(e.target.value) }))} />
            <Input label="Address" placeholder="City, Area" value={customer.customerAddress} onChange={(e) => setCustomer((p) => ({ ...p, customerAddress: e.target.value }))} />
            <Input label="GSTIN" placeholder="09AAAAA0000A1Z5" value={customer.customerGstin} onChange={(e) => setCustomer((p) => ({ ...p, customerGstin: e.target.value.toUpperCase() }))} />
          </div>
        </div>

        <div ref={skuContainerRef} className="relative">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Input
                placeholder="Type SKU or product name to search inventory…"
                value={skuInput}
                onChange={(e) => { setSkuInput(e.target.value); setIsSkuFocused(true); }}
                onFocus={() => setIsSkuFocused(true)}
                onKeyDown={handleSkuKeyDown}
                error={skuError}
                autoComplete="off"
              />
            </div>
            <Button type="button" variant="secondary" size="md" onClick={() => addToCart(products)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Item
            </Button>
          </div>

          {isSkuFocused && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg overflow-hidden max-h-56 overflow-y-auto divide-y divide-border/40 text-xs">
              {suggestions.map((p, idx) => (
                <div
                  key={p.sku}
                  onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(p); }}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer ${idx === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-surface-2"}`}
                >
                  <div>
                    <span className="font-mono font-bold">{p.sku}</span> · <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted-foreground ml-1">({p.material} {p.purity})</span>
                  </div>
                  <div className="font-mono text-muted-foreground">{p.totalWeight ?? p.baseWeight}g · {p.stockQuantity} in stock</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 ? (
          <CartTable
            cart={cart}
            subtotal={subtotal}
            gst={gst}
            grandTotal={grandTotal}
            onUpdateQty={(sku, qty) => updateQty(sku, qty, products.find((p) => p.sku === sku)?.stockQuantity)}
            onUpdateWeight={updateWeight}
            onUpdateRate={updateRate}
            onUpdateMaking={updateMakingPercent}
            onRemove={removeFromCart}
          />
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border bg-surface-2/20">
            Cart is empty. Type an SKU to add items.
          </div>
        )}
      </form>
    </Modal>
  );
};

export const SalesLedger = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptItems, setReceiptItems] = useState<SaleItem[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sales = [], isLoading } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });
  const { data: drawerItems = [], isLoading: isLoadingDrawerItems } = useQuery({
    queryKey: ["sale-items", selectedSale?.id],
    queryFn: () => (selectedSale ? fetchSaleItems(selectedSale.id) : []),
    enabled: !!selectedSale,
  });

  const filtered = useMemo(() => {
    if (!search) return sales;
    const q = search.toLowerCase();
    return sales.filter((s) => s.customerName.toLowerCase().includes(q) || s.customerPhoneNo.includes(q) || String(s.id).includes(q));
  }, [sales, search]);

  const totals = useMemo(() => {
    const rev = filtered.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const tax = filtered.reduce((acc, s) => acc + (s.gstAmount || 0), 0);
    return { count: filtered.length, revenue: rev, gst: tax, taxable: Math.max(0, rev - tax) };
  }, [filtered]);

  const printReceipt = async (sale: Sale) => {
    try {
      const items = await fetchSaleItems(sale.id);
      setReceiptSale(sale);
      setReceiptItems(items);
      setTimeout(() => window.print(), 300);
    } catch {
      toast.error("Failed to load invoice items");
    }
  };

  const columns = [
    { header: "Invoice #" },
    { header: "Customer & Phone" },
    { header: "Date" },
    { header: "Taxable Subtotal", align: "right" as const },
    { header: "GST (3%)", align: "right" as const },
    { header: "Grand Total", align: "right" as const },
    { header: "Actions", align: "right" as const },
  ];

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <SearchToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, phone, or invoice #…" className="max-w-md" />
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          New Counter Sale
        </Button>
      </SearchToolbar>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border bg-surface border border-border text-xs">
        <div className="p-3"><p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Invoices Issued</p><p className="text-base font-bold font-mono text-foreground mt-0.5">{totals.count}</p></div>
        <div className="p-3"><p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Taxable Value</p><p className="text-base font-bold font-mono text-foreground mt-0.5">{formatINR(totals.taxable)}</p></div>
        <div className="p-3"><p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">GST 3% Realized</p><p className="text-base font-bold font-mono text-muted-foreground mt-0.5">{formatINR(totals.gst)}</p></div>
        <div className="p-3 bg-surface-2/40"><p className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Gross Sales Revenue</p><p className="text-base font-bold font-mono text-primary mt-0.5">{formatINR(totals.revenue)}</p></div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          keyExtractor={(s) => s.id}
          emptyState={<EmptyState icon={ShoppingBag} title="No sales invoices" description="Create a new sale invoice." />}
          renderRow={(sale) => (
            <tr key={sale.id} onClick={() => setSelectedSale(sale)} className={`cursor-pointer transition-colors ${selectedSale?.id === sale.id ? "bg-primary/5 font-medium" : "hover:bg-surface-2/60"}`}>
              <td className="px-3 py-2 text-xs font-mono font-bold text-foreground">{sale.invoiceNumber ?? `#${sale.id}`}</td>
              <td className="px-3 py-2"><p className="font-semibold text-xs text-foreground">{sale.customerName}</p><p className="text-[10.5px] text-muted-foreground font-mono">{sale.customerPhoneNo}</p></td>
              <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{fmtDate(sale.saleDate)}</td>
              <td className="px-3 py-2 text-right text-xs font-mono tabular-nums text-muted-foreground">{formatINR(sale.subtotal)}</td>
              <td className="px-3 py-2 text-right text-xs font-mono tabular-nums text-muted-foreground">{formatINR(sale.gstAmount)}</td>
              <td className="px-3 py-2 text-right text-xs font-mono font-bold tabular-nums text-foreground">{formatINR(sale.grandTotal)}</td>
              <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelectedSale(sale)} leftIcon={<Eye className="w-3 h-3" />}>Inspect</Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => printReceipt(sale)}><Printer className="w-3.5 h-3.5" /></Button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        width="lg"
        title={selectedSale?.invoiceNumber ? `Invoice ${selectedSale.invoiceNumber}` : `Invoice #${selectedSale?.id}`}
        subtitle={selectedSale ? `${selectedSale.customerName} · ${fmtDate(selectedSale.saleDate)}` : ""}
        actions={
          selectedSale && (
            <Button variant="primary" size="sm" onClick={() => printReceipt(selectedSale)} leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Print Invoice (A5)
            </Button>
          )
        }
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            <div className="p-3 border border-border bg-surface space-y-1">
              <div className="font-semibold text-foreground text-sm">{selectedSale.customerName}</div>
              <div className="font-mono text-muted-foreground">📱 {selectedSale.customerPhoneNo}</div>
              {selectedSale.customerAddress && <div className="text-muted-foreground">📍 {selectedSale.customerAddress}</div>}
              {selectedSale.customerGstin && <div className="font-mono text-muted-foreground">GSTIN: {selectedSale.customerGstin}</div>}
            </div>

            <div className="border border-border bg-surface overflow-hidden">
              <div className="bg-surface-2 p-2.5 font-bold uppercase tracking-wider text-[10.5px]">Itemized Billed Breakdown</div>
              {isLoadingDrawerItems ? (
                <div className="py-6 text-center text-muted-foreground">Loading items…</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2/60 text-muted-foreground font-semibold uppercase text-[10px]">
                    <tr><th className="px-2.5 py-1.5">Item</th><th className="px-2 py-1.5 text-right">Wt</th><th className="px-2 py-1.5 text-center">Qty</th><th className="px-2.5 py-1.5 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono">
                    {drawerItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-2/40">
                        <td className="px-2.5 py-1.5 font-sans"><p className="font-semibold text-foreground">{item.productName ?? item.sku}</p><p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p></td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{item.weight ? `${item.weight}g` : "—"}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums font-sans">{item.quantity}</td>
                        <td className="px-2.5 py-1.5 text-right font-bold text-foreground tabular-nums">{formatINR(item.pricePerPiece * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3 bg-surface border border-border space-y-1 font-mono">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span><span>{formatINR(selectedSale.subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>GST (3%):</span><span>{formatINR(selectedSale.gstAmount)}</span></div>
              <div className="flex justify-between pt-1 border-t border-border font-bold text-foreground"><span className="font-sans">Grand Total:</span><span className="text-primary text-sm">{formatINR(selectedSale.grandTotal)}</span></div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <NewSaleModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(sale) => printReceipt(sale)} />

      {receiptSale && (
        <Modal open={!!receiptSale} onClose={() => setReceiptSale(null)} title={`Tax Invoice ${receiptSale.invoiceNumber ?? `#${receiptSale.id}`}`} subtitle="Official sales invoice" maxWidth="3xl" footer={<Button variant="primary" size="sm" onClick={() => setTimeout(() => window.print(), 200)} leftIcon={<Printer className="w-4 h-4" />}>Print (A5)</Button>}>
          <div className="overflow-x-auto py-2 flex justify-center"><SalesInvoiceSlip sale={receiptSale} items={receiptItems} /></div>
        </Modal>
      )}

      <div className="hidden print:block" ref={printRef}>
        {receiptSale && <SalesInvoiceSlip sale={receiptSale} items={receiptItems} />}
      </div>
    </div>
  );
};