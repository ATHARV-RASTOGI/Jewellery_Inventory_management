import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Printer, Trash2, ShoppingCart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatINR, fmtDate } from "@/lib/utils";
import {
  fetchSales,
  fetchSaleItems,
  createSale,
  type Sale,
  type SaleItem,
} from "@/lib/api/sales";
import { fetchProducts, Product } from "@/lib/api/inventory";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SalesInvoiceSlip } from "@/components/receipts/SalesInvoiceSlip";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";
import { useCartManager } from "@/lib/hooks/useCartManager";
import { CartTable } from "@/components/ui/CartTable";

import { fetchGoldRate, fetchSilverRate } from "@/lib/api/dashboard";
import { Zap } from "lucide-react";

// ─── New Sale Modal ───────────────────────────────────────────────────────────
const NewSaleModal = ({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (sale: Sale) => void;
}) => {
  const qc = useQueryClient();
  const [customer, setCustomer] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
  });
  const [isSkuFocused, setIsSkuFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const skuContainerRef = useRef<HTMLDivElement>(null);

  const {
    cart,
    skuInput,
    setSkuInput,
    skuError,
    setSkuError,
    addToCart,
    addProductToCart,
    removeFromCart,
    updateQty,
    updateRate,
    updateMakingPercent,
    resetCart,
    subtotal,
    gst,
    grandTotal,
  } = useCartManager();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    enabled: open,
  });

  const { data: goldRate } = useQuery({
    queryKey: ["dashboard-gold-rate"],
    queryFn: fetchGoldRate,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const { data: silverRate } = useQuery({
    queryKey: ["dashboard-silver-rate"],
    queryFn: fetchSilverRate,
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  const suggestions = useMemo(() => {
    const q = skuInput.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.mainCategory?.toLowerCase().includes(q) ||
          p.purity?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [products, skuInput]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [skuInput]);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        skuContainerRef.current &&
        !skuContainerRef.current.contains(e.target as Node)
      ) {
        setIsSkuFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale) => {
      toast.success("Sale recorded successfully!");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onCreated(sale);
      onClose();
      resetCart();
      setCustomer({ customerName: "", customerPhone: "", customerAddress: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to record sale"),
  });

  if (!open) return null;

  const handleAddItem = () => {
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const chosen = suggestions[selectedIndex];
      addProductToCart(chosen, goldRate?.rate, silverRate?.rate);
      setSkuInput("");
      setIsSkuFocused(false);
      return;
    }
    const success = addToCart(products, goldRate?.rate, silverRate?.rate);
    if (success) {
      setIsSkuFocused(false);
    }
  };

  const handleSelectProduct = (p: Product) => {
    const success = addProductToCart(p, goldRate?.rate, silverRate?.rate);
    if (success) {
      setSkuInput("");
      setIsSkuFocused(false);
      setSelectedIndex(-1);
    }
  };

  const handleSkuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0 && isSkuFocused) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Escape") {
        setIsSkuFocused(false);
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Please add at least one item to the cart");
      return;
    }
    if (
      customer.customerPhone.length !== 10 ||
      !/^\d+$/.test(customer.customerPhone)
    ) {
      toast.error("Customer mobile number must be exactly 10 digits");
      return;
    }
    mutation.mutate({
      ...customer,
      items: cart.map(({ sku, quantity, pricePerPiece, appliedRatePer10g, makingChargePercent, makingChargeAmount }) => ({
        sku,
        quantity,
        pricePerPiece,
        appliedRatePer10g,
        makingChargePercent,
        makingChargeAmount,
      })),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Counter Sale"
      subtitle={
        goldRate ? (
          <span className="flex items-center gap-2 text-warning font-medium text-xs sm:text-sm">
            <Zap className="w-4 h-4 text-warning animate-pulse" />
            Live Gold: ₹{Math.round(goldRate.rate).toLocaleString("en-IN")}/10g · Silver: ₹{Math.round(silverRate?.rate ?? 0).toLocaleString("en-IN")}/10g
          </span>
        ) : (
          "Scan items by SKU, record customer details, and calculate GST invoice."
        )
      }
      maxWidth="5xl"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-sale-form"
            variant="primary"
            size="md"
            isLoading={mutation.isPending}
            disabled={cart.length === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            className="px-5 text-sm font-semibold shadow-md"
          >
            Complete Sale &amp; Print Invoice
          </Button>
        </>
      }
    >
      <form id="new-sale-form" onSubmit={submit} className="space-y-6">
        {/* Customer Information Panel */}
        <div className="bg-surface-2/40 border border-border/70 rounded-2xl p-4 sm:p-5">
          <h4 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
            Customer Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Customer Name"
                required
                placeholder="e.g. Ramesh Kumar"
                value={customer.customerName}
                onChange={(e) =>
                  setCustomer((p) => ({ ...p, customerName: e.target.value }))
                }
                className="py-2.5 text-sm"
              />
            </div>
            <div>
              <Input
                label="Mobile Number"
                required
                placeholder="10-digit number"
                value={customer.customerPhone}
                onChange={(e) =>
                  setCustomer((p) => ({ ...p, customerPhone: e.target.value }))
                }
                className="py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <Input
                label="Address (Optional)"
                placeholder="City, Area"
                value={customer.customerAddress}
                onChange={(e) =>
                  setCustomer((p) => ({
                    ...p,
                    customerAddress: e.target.value,
                  }))
                }
                className="py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Item Entry by SKU & Autocomplete Search */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Add Inventory Item to Sale
            </label>
            <span className="text-[11px] text-muted-foreground">
              Type SKU or product name to search
            </span>
          </div>

          <div ref={skuContainerRef} className="relative">
            <div className="flex gap-3 items-stretch">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type or scan SKU code (e.g. KK-R-001 or Ring)…"
                  value={skuInput}
                  onChange={(e) => {
                    setSkuInput(e.target.value);
                    setIsSkuFocused(true);
                  }}
                  onFocus={() => setIsSkuFocused(true)}
                  onKeyDown={handleSkuKeyDown}
                  error={skuError}
                  className="py-3 px-4 text-sm sm:text-base font-mono bg-surface border-border hover:border-primary/60 focus:border-primary shadow-xs rounded-xl"
                  autoComplete="off"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAddItem}
                leftIcon={<Plus className="w-4 h-4" />}
                className="px-5 font-semibold shrink-0 rounded-xl"
              >
                Add Piece
              </Button>
            </div>

            {/* Live SKU / Product Autocomplete Dropdown */}
            {isSkuFocused && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-98 duration-150">
                <div className="px-3.5 py-2 bg-surface-2/80 border-b border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {suggestions.length} matching item{suggestions.length === 1 ? "" : "s"} found
                  </span>
                  <span>Use ↑ ↓ to navigate · ↵ or Click to add</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-border/30">
                  {suggestions.map((p, idx) => {
                    const isSelected = idx === selectedIndex;
                    const inStock = (p.stockQuantity ?? 0) > 0;
                    return (
                      <div
                        key={p.sku}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectProduct(p);
                        }}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${isSelected
                            ? "bg-primary/10 text-primary-foreground"
                            : "hover:bg-surface-2/70"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-border/80 text-xs font-mono font-bold text-foreground">
                            {p.sku}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {p.mainCategory} · {p.subCategory || "Standard"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div className="text-right">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-warning/15 text-warning">
                              {p.material} {p.purity}
                            </span>
                            <p className="text-xs font-mono font-medium text-foreground mt-0.5">
                              {p.baseWeight} g
                            </p>
                          </div>

                          <div className="w-24 text-right">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block ${inStock
                                  ? "bg-success/15 text-success"
                                  : "bg-danger/15 text-danger"
                                }`}
                            >
                              {inStock ? `${p.stockQuantity} in stock` : "Out of stock"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Item Listing Table */}
        <div>
          {cart.length > 0 ? (
            <CartTable
              cart={cart}
              subtotal={subtotal}
              gst={gst}
              grandTotal={grandTotal}
              onUpdateQty={(sku, qty) =>
                updateQty(
                  sku,
                  qty,
                  products.find((p) => p.sku === sku)?.stockQuantity
                )
              }
              onUpdateRate={updateRate}
              onUpdateMaking={updateMakingPercent}
              onRemove={removeFromCart}
            />
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border/70 rounded-2xl bg-surface-2/20 space-y-1">
              <p className="font-semibold text-foreground">Cart is currently empty</p>
              <p className="text-xs text-muted-foreground">
                Type an SKU or product keyword in the search box above to add jewelry pieces.
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};


// ─── Main Sales Ledger Component ─────────────────────────────────────────────
export const SalesLedger = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptItems, setReceiptItems] = useState<SaleItem[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });

  const filtered = sales.filter(
    (s) =>
      !search ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.customerPhoneNo.includes(search) ||
      String(s.id).includes(search)
  );

  const printReceipt = async (sale: Sale) => {
    try {
      const items = await fetchSaleItems(sale.id);
      setReceiptSale(sale);
      setReceiptItems(items);
      setTimeout(() => window.print(), 300);
    } catch {
      toast.error("Failed to load invoice items for printing");
    }
  };

  const columns = [
    { header: "Invoice #" },
    { header: "Customer" },
    { header: "Date" },
    { header: "Subtotal", align: "right" as const },
    { header: "GST (3%)", align: "right" as const },
    { header: "Grand Total", align: "right" as const },
    { header: "Receipt", align: "right" as const },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <SearchToolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sales by customer name, phone, or invoice #…"
          className="max-w-md"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Counter Sale
        </Button>
      </SearchToolbar>

      <div className="px-1 text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> recorded invoice{filtered.length === 1 ? "" : "s"}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyExtractor={(sale) => sale.id}
        emptyState={
          <EmptyState
            icon={ShoppingBag}
            title="No sales transactions recorded"
            description="Log counter invoices using the 'New Counter Sale' button."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Sale
              </Button>
            }
          />
        }
        renderRow={(sale) => (
          <tr className="hover:bg-surface-2/50 transition-colors">
            <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
              #{sale.id}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <p className="font-semibold text-[13px] text-foreground">
                {sale.customerName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {sale.customerPhoneNo}
              </p>
            </td>
            <td className="px-4 py-3 text-[12.5px] text-muted-foreground whitespace-nowrap">
              {fmtDate(sale.saleDate)}
            </td>
            <td className="px-4 py-3 text-right text-[12.5px] font-mono whitespace-nowrap">
              {formatINR(sale.subtotal)}
            </td>
            <td className="px-4 py-3 text-right text-[12.5px] text-muted-foreground font-mono whitespace-nowrap">
              {formatINR(sale.gstAmount)}
            </td>
            <td className="px-4 py-3 text-right font-semibold font-mono text-foreground whitespace-nowrap">
              {formatINR(sale.grandTotal)}
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => printReceipt(sale)}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print
              </Button>
            </td>
          </tr>
        )}
      />

      <NewSaleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(sale) => printReceipt(sale)}
      />

      {receiptSale && (
        <Modal
          open={!!receiptSale}
          onClose={() => setReceiptSale(null)}
          title={`Tax Invoice & Cash Receipt #${receiptSale.id}`}
          subtitle={`${receiptSale.customerName} · Nehru Road, Farrukhabad official tax voucher`}
          maxWidth="3xl"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReceiptSale(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTimeout(() => window.print(), 200)}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Invoice (A5)
              </Button>
            </>
          }
        >
          <div className="overflow-x-auto py-2 flex justify-center">
            <SalesInvoiceSlip sale={receiptSale} items={receiptItems} />
          </div>
        </Modal>
      )}

      <div className="hidden print:block" ref={printRef}>
        {receiptSale && (
          <SalesInvoiceSlip sale={receiptSale} items={receiptItems} />
        )}
      </div>
    </div>
  );
};