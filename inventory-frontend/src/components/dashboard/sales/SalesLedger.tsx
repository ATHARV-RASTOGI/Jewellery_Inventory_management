import { useRef, useState } from "react";
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
import { fetchProducts } from "@/lib/api/inventory";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SalesInvoiceSlip } from "@/components/receipts/SalesInvoiceSlip";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";
import { useCartManager } from "@/lib/hooks/useCartManager";
import { CartTable } from "@/components/ui/CartTable";

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

  const {
    cart,
    skuInput,
    setSkuInput,
    skuError,
    addToCart,
    removeFromCart,
    updateQty,
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
                onChange={(e) => setSkuInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addToCart(products))
                }
                error={skuError}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => addToCart(products)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Item
            </Button>
          </div>
        </div>

        {/* Cart Item Listing */}
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
            onRemove={removeFromCart}
          />
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