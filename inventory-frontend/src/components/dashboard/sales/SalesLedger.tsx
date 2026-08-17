import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Printer,
  Trash2,
  Receipt as ReceiptIcon,
  ShoppingCart,
  User,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatINR } from "@/lib/utils";
import {
  fetchSales,
  fetchSaleItems,
  createSale,
  type Sale,
  type SaleItem,
} from "@/lib/api/sales";
import { fetchProducts, type Product } from "@/lib/api/inventory";
import { GST_RATE } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TableSkeleton } from "@/components/feedback/Skeleton";
import { SalesInvoiceSlip } from "@/components/receipts/SalesInvoiceSlip";

type CartItem = {
  sku: string;
  productName: string;
  material: string;
  purity: string;
  weight: number;
  quantity: number;
  pricePerPiece: number;
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [skuError, setSkuError] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale) => {
      toast.success("Sale recorded successfully!");
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onCreated(sale);
      onClose();
      setCart([]);
      setCustomer({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
      });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to record sale"),
  });

  if (!open) return null;

  const addToCart = () => {
    const product = products.find(
      (p: Product) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) {
      setSkuError("No inventory piece found for this SKU");
      return;
    }
    if (product.stockQuantity <= 0) {
      setSkuError("This piece is currently out of stock");
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
      toast.error(`Only ${product.stockQuantity} pieces in stock`);
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.sku === sku ? { ...c, quantity: Math.max(1, qty) } : c
      )
    );
  };

  const subtotal = cart.reduce(
    (s, c) => s + c.pricePerPiece * c.quantity,
    0
  );
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst;

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
      items: cart.map(({ sku, quantity, pricePerPiece }) => ({
        sku,
        quantity,
        pricePerPiece,
      })),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Counter Sale"
      subtitle="Scan items by SKU, record customer details, and calculate GST invoice."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="new-sale-form"
            variant="primary"
            size="sm"
            isLoading={mutation.isPending}
            disabled={cart.length === 0}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Complete Sale &amp; Invoice
          </Button>
        </>
      }
    >
      <form id="new-sale-form" onSubmit={submit} className="space-y-5">
        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Customer Name"
              required
              placeholder="e.g. Ramesh Kumar"
              value={customer.customerName}
              onChange={(e) =>
                setCustomer((p) => ({ ...p, customerName: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Mobile Number"
              required
              placeholder="10-digit number"
              value={customer.customerPhone}
              onChange={(e) =>
                setCustomer((p) => ({ ...p, customerPhone: e.target.value }))
              }
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Address (Optional)"
              placeholder="Street, City"
              value={customer.customerAddress}
              onChange={(e) =>
                setCustomer((p) => ({
                  ...p,
                  customerAddress: e.target.value,
                }))
              }
            />
          </div>
        </div>

        {/* Item Entry by SKU */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="Add Item to Cart by SKU"
                placeholder="e.g. KK-R-001"
                value={skuInput}
                onChange={(e) => {
                  setSkuInput(e.target.value);
                  setSkuError("");
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addToCart())
                }
                error={skuError}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={addToCart}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Cart Item Listing */}
        {cart.length > 0 ? (
          <div className="rounded-xl border border-border/80 bg-surface-2/60 overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-surface-2 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {cart.map((c) => (
                  <tr key={c.sku} className="hover:bg-surface-2/40">
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {c.sku}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {c.productName}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        value={c.quantity}
                        onChange={(e) =>
                          updateQty(
                            c.sku,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-12 text-center bg-surface border border-border/80 rounded py-1 text-xs font-semibold focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatINR(c.pricePerPiece)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold font-mono text-foreground">
                      {formatINR(c.pricePerPiece * c.quantity)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.sku)}
                        className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="p-3 bg-surface border-t border-border/60 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (3%)</span>
                <span className="font-mono">{formatINR(gst)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/40">
                <span>Grand Total</span>
                <span className="text-primary font-mono">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl">
            No jewelry pieces added to this sale yet. Enter SKU above.
          </div>
        )}
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
      setTimeout(() => {
        window.print();
      }, 300);
    } catch {
      toast.error("Failed to load invoice items for printing");
    }
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
            placeholder="Search sales by customer name, phone, or invoice #…"
            className="w-full bg-surface-2 border border-border/60 hover:border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Counter Sale
        </Button>
      </div>

      {/* Info metric */}
      <div className="px-1 text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> recorded invoice{filtered.length === 1 ? "" : "s"}
      </div>

      {/* Sales Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
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
      ) : (
        <div className="rounded-xl border border-border/80 bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Subtotal
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  GST (3%)
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Grand Total
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-surface-2/50 transition-colors"
                >
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Sale Modal */}
      <NewSaleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(sale) => printReceipt(sale)}
      />

      {/* Invoice Slip Preview & Print Modal */}
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
                onClick={() => {
                  setTimeout(() => window.print(), 200);
                }}
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

      {/* Hidden printable receipt for direct window.print() */}
      <div className="hidden print:block" ref={printRef}>
        {receiptSale && (
          <SalesInvoiceSlip sale={receiptSale} items={receiptItems} />
        )}
      </div>
    </div>
  );
};