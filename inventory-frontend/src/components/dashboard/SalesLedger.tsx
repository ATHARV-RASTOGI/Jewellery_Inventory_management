import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatINR } from "@/lib/utils";
import {
  fetchSales, fetchSaleItems, createSale,
  type Sale, type SaleItem,
} from "@/lib/api/sales";
import { fetchProducts, type Product } from "@/lib/api/inventory";

const GST_RATE = 0.03;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

// ─── Receipt component (printable) ───────────────────────────────────────────
const Receipt = ({
  sale,
  items,
}: {
  sale: Sale;
  items: SaleItem[];
}) => (
  <div className="font-mono text-[12px] text-black bg-white p-6 w-[320px]">
    {/* Header */}
    <div className="text-center mb-4">
      <p className="text-[18px] font-bold">K.K Jewelers</p>
      <p className="text-[11px]">GST Receipt</p>
      <p className="text-[11px]">Sale #{sale.id} · {fmtDate(sale.saleDate)}</p>
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Customer */}
    <div className="mb-3 space-y-0.5">
      <p><span className="font-bold">Name:</span> {sale.customerName}</p>
      <p><span className="font-bold">Phone:</span> {sale.customerPhone}</p>
      {sale.customerAddress && (
        <p><span className="font-bold">Address:</span> {sale.customerAddress}</p>
      )}
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Items */}
    <div className="mb-3 space-y-2">
      {items.map((item) => (
        <div key={item.id}>
          <div className="flex justify-between font-bold">
            <span>{item.productName}</span>
            <span>{formatINR(item.lineTotal)}</span>
          </div>
          <div className="text-[10px] text-gray-600">
            {item.sku} · {item.material} {item.purity} · {item.weight}g
            · Qty {item.quantity} × {formatINR(item.pricePerPiece)}
          </div>
        </div>
      ))}
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Totals */}
    <div className="space-y-1">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatINR(sale.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>GST @ 3%</span>
        <span>{formatINR(sale.gstAmount)}</span>
      </div>
      <div className="flex justify-between font-bold text-[14px] border-t border-black pt-1 mt-1">
        <span>TOTAL</span>
        <span>{formatINR(sale.grandTotal)}</span>
      </div>
    </div>

    <div className="border-t border-dashed border-black my-2" />

    <div className="text-center text-[10px] mt-2 space-y-0.5">
      <p>Thank you for shopping at K.K Jewelers!</p>
      <p>All sales are final. Exchange within 7 days.</p>
    </div>
  </div>
);

// ─── New Sale Modal ───────────────────────────────────────────────────────────
type CartItem = {
  sku: string;
  productName: string;
  material: string;
  purity: string;
  weight: number;
  quantity: number;
  pricePerPiece: number;
};

const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [skuError, setSkuError] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn:()=> fetchProducts(),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale) => {
      toast.success("Sale recorded!");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // refresh stock
      onCreated(sale);
      onClose();
      setCart([]);
      setCustomer({ customerName: "", customerPhone: "", customerAddress: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to record sale"),
  });

  if (!open) return null;

  const addToCart = () => {
    const product = products.find(
      (p: Product) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) {
      setSkuError("Product not found for this SKU");
      return;
    }
    if (product.stockQuantity <= 0) {
      setSkuError("This item is out of stock");
      return;
    }
    const existing = cart.find((c) => c.sku === product.sku);
    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          c.sku === product.sku
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          sku: product.sku,
          productName: product.name,
          material: product.material,
          purity: product.purity,
          weight: product.baseWeight,
          quantity: 1,
          pricePerPiece: product.price,
        },
      ]);
    }
    setSkuInput("");
    setSkuError("");
  };

  const removeFromCart = (sku: string) =>
    setCart((prev) => prev.filter((c) => c.sku !== sku));

  const updateQty = (sku: string, qty: number) => {
    const product = products.find((p: Product) => p.sku === sku);
    if (product && qty > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} in stock`);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.sku === sku ? { ...c, quantity: Math.max(1, qty) } : c))
    );
  };

  const subtotal = cart.reduce((s, c) => s + c.pricePerPiece * c.quantity, 0);
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    mutation.mutate({
      ...customer,
      items: cart.map(({ sku, quantity, pricePerPiece }) => ({
        sku, quantity, pricePerPiece,
      })),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-surface p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">New Sale</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">K.K Jewelers</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Customer details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className={fieldLabel}>Customer name</label>
              <input
                required
                className={fieldInput}
                placeholder="e.g. Ramesh Kumar"
                value={customer.customerName}
                onChange={(e) =>
                  setCustomer((p) => ({ ...p, customerName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className={fieldLabel}>Phone</label>
              <input
                required
                className={fieldInput}
                placeholder="9876543210"
                value={customer.customerPhone}
                onChange={(e) =>
                  setCustomer((p) => ({ ...p, customerPhone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className={fieldLabel}>Address (optional)</label>
              <input
                className={fieldInput}
                placeholder="Street, City"
                value={customer.customerAddress}
                onChange={(e) =>
                  setCustomer((p) => ({ ...p, customerAddress: e.target.value }))
                }
              />
            </div>
          </div>

          {/* SKU search */}
          <div className="space-y-2">
            <label className={fieldLabel}>Add item by SKU</label>
            <div className="flex gap-2">
              <input
                className={fieldInput}
                placeholder="e.g. KK-R-001"
                value={skuInput}
                onChange={(e) => {
                  setSkuInput(e.target.value);
                  setSkuError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToCart())}
              />
              <button
                type="button"
                onClick={addToCart}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0"
              >
                Add
              </button>
            </div>

            {/* SKU suggestions */}
            {skuInput && (
              <div className="rounded-lg bg-surface-2 border border-border divide-y divide-border max-h-36 overflow-y-auto">
                {products
                  .filter((p: Product) =>
                    p.sku.toLowerCase().includes(skuInput.toLowerCase()) ||
                    p.name.toLowerCase().includes(skuInput.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((p: Product) => (
                    <button
                      key={p.sku}
                      type="button"
                      onClick={() => {
                        setSkuInput(p.sku);
                        setSkuError("");
                      }}
                      className="w-full flex justify-between items-center px-3 py-2 text-[12px] hover:bg-surface text-left"
                    >
                      <span>
                        <span className="font-medium">{p.sku}</span>
                        {" · "}{p.name}
                      </span>
                      <span className="text-muted-foreground">
                        {p.material} · Stock: {p.stockQuantity}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            {skuError && (
              <p className="text-[11.5px] text-destructive">{skuError}</p>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <p className={fieldLabel}>Items in this sale</p>
              <div className="rounded-lg border border-border divide-y divide-border">
                {cart.map((item) => (
                  <div key={item.sku} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{item.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.sku} · {item.material} {item.purity} · {item.weight}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.sku, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-surface-2 text-sm font-bold hover:bg-surface flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.sku, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-surface-2 text-sm font-bold hover:bg-surface flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <p className="text-[13px] font-semibold tabular-nums">
                        {formatINR(item.pricePerPiece * item.quantity)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatINR(item.pricePerPiece)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.sku)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bill summary */}
              <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST @ 3%</span>
                  <span className="tabular-nums">{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5 mt-1">
                  <span>Grand Total</span>
                  <span className="tabular-nums text-primary">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || cart.length === 0}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Recording…" : "Confirm Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Sales Ledger Page ───────────────────────────────────────────────────
export const SalesLedger = () => {
  const [newSaleOpen, setNewSaleOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [receiptItems, setReceiptItems] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
  });

  const { data: selectedItems = [] } = useQuery({
    queryKey: ["sale-items", receiptSale?.id],
    queryFn: () => fetchSaleItems(receiptSale!.id),
    enabled: !!receiptSale,
  });

  const openReceipt = (sale: Sale) => setReceiptSale(sale);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>K.K Jewelers - Receipt #${receiptSale?.id}</title>
      <style>body { margin: 0; font-family: monospace; }</style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

const filtered = sales.filter((s: Sale) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      (s.customerName || "").toLowerCase().includes(q) ||
      (s.customerPhone || "").includes(q) ||
      String(s.id).includes(q)
    );
});

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sales…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setNewSaleOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {["Sale ID", "Customer", "Phone", "Date", "Items", "Subtotal", "GST", "Total", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((sale: Sale) => (
              <tr key={sale.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3.5 text-muted-foreground text-xs">#{sale.id}</td>
                <td className="px-4 py-3.5 font-semibold text-[13px]">{sale.customerName}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-[13px]">{sale.customerPhone}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-[13px]">{fmtDate(sale.saleDate)}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-[13px]">—</td>
                <td className="px-4 py-3.5 tabular-nums">{formatINR(sale.subtotal)}</td>
                <td className="px-4 py-3.5 tabular-nums text-muted-foreground">{formatINR(sale.gstAmount)}</td>
                <td className="px-4 py-3.5 tabular-nums font-semibold">{formatINR(sale.grandTotal)}</td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => openReceipt(sale)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
                    title="View receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Sale Modal */}
      <NewSaleModal
        open={newSaleOpen}
        onClose={() => setNewSaleOpen(false)}
        onCreated={(sale) => {
          setNewSaleOpen(false);
          openReceipt(sale);
        }}
      />

      {/* Receipt Modal */}
      {receiptSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
          onClick={() => setReceiptSale(null)}
        >
          <div
            className="rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: "var(--shadow-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={receiptRef}>
              <Receipt sale={receiptSale} items={selectedItems} />
            </div>
            <div className="flex gap-2 p-3 bg-white border-t border-gray-200">
              <button
                onClick={() => setReceiptSale(null)}
                className="flex-1 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:opacity-80 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};