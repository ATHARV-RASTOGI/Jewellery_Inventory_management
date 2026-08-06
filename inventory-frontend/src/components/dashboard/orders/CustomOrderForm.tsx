import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Printer, Trash2, ClipboardList, FileText,
  ChevronDown, X, Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatINR } from "@/lib/utils";
import {
  fetchCustomOrders, createCustomOrder, markOrderPickedUp, deleteCustomOrder, updateCustomOrder,
  type CustomOrder, type CreateCustomOrderInput, type MaterialType, type GoldCarat,
} from "@/lib/api/customOrders";
import {
  fetchProducts, type Product,
} from "@/lib/api/inventory";
import { createSale, type Sale } from "@/lib/api/sales";
import { GST_RATE } from "@/lib/constants";

// ─── Shared style tokens (mirrors SalesLedger) ───────────────────────────────
const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const today = () => new Date().toISOString().slice(0, 10);

// ─── Order Slip (printable) ───────────────────────────────────────────────────
const OrderSlip = ({ order }: { order: CustomOrder }) => (
  <div className="font-mono text-[12px] text-black bg-white p-6 w-[320px]">
    {/* Header */}
    <div className="text-center mb-4">
      <p className="text-[18px] font-bold">K.K Jewelers</p>
      <p className="text-[11px]">Custom Order Slip</p>
      <p className="text-[11px]">Order #{order.id} · {fmtDate(order.orderDate)}</p>
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Customer */}
    <div className="mb-3 space-y-0.5">
      <p><span className="font-bold">Name:</span> {order.customerName}</p>
      <p><span className="font-bold">Phone:</span> {order.customerPhone}</p>
      {order.customerAddress && (
        <p><span className="font-bold">Address:</span> {order.customerAddress}</p>
      )}
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Item details */}
    <div className="mb-3 space-y-0.5">
      <p><span className="font-bold">Item:</span> {order.itemName}</p>
      <p>
        <span className="font-bold">Material:</span>{" "}
        {order.materialType === "GOLD" ? "Gold" :
         order.materialType === "DIAMOND" ? "Diamond" : "Gold + Diamond"}
        {order.goldCarat ? ` (${order.goldCarat})` : ""}
        {order.diamondCarat ? ` · Diamond ${order.diamondCarat}` : ""}
      </p>
      {order.remarks && (
        <p><span className="font-bold">Remarks:</span> {order.remarks}</p>
      )}
    </div>

    <div className="border-t border-dashed border-black my-2" />

    {/* Dates & Amounts */}
    <div className="mb-3 space-y-0.5">
      <p><span className="font-bold">Order Date:</span> {fmtDate(order.orderDate)}</p>
      <p><span className="font-bold">Pickup Date:</span> {fmtDate(order.pickupDate)}</p>
    </div>

    <div className="border-t border-dashed border-black my-2" />

    <div className="space-y-1">
      <div className="flex justify-between">
        <span>Total Amount</span>
        <span>{formatINR(order.totalAmount)}</span>
      </div>
      <div className="flex justify-between">
        <span>Advance Paid</span>
        <span>{formatINR(order.advanceAmount)}</span>
      </div>
      <div className="flex justify-between font-bold text-[14px] border-t border-black pt-1 mt-1">
        <span>BALANCE DUE</span>
        <span>{formatINR(Math.max(0, order.totalAmount - order.advanceAmount))}</span>
      </div>
    </div>

    <div className="border-t border-dashed border-black my-2" />

    <div className="text-center text-[10px] mt-2 space-y-0.5">
      <p>Thank you for your custom order!</p>
      <p>Please bring this slip at pickup time.</p>
    </div>
  </div>
);

// ─── Material Selector ────────────────────────────────────────────────────────
const GOLD_CARATS: GoldCarat[] = ["14K", "18K", "22K", "24K"];

const MaterialSelector = ({
  value,
  goldCarat,
  diamondCarat,
  onChange,
  onGoldCaratChange,
  onDiamondCaratChange,
}: {
  value: MaterialType;
  goldCarat: string;
  diamondCarat: string;
  onChange: (v: MaterialType) => void;
  onGoldCaratChange: (v: string) => void;
  onDiamondCaratChange: (v: string) => void;
}) => {
  const types: { value: MaterialType; label: string; color: string }[] = [
    { value: "GOLD", label: "Gold", color: "amber" },
    { value: "DIAMOND", label: "Diamond", color: "sky" },
    { value: "GOLD_DIAMOND", label: "Gold + Diamond", color: "purple" },
  ];

  const showGold = value === "GOLD" || value === "GOLD_DIAMOND";
  const showDiamond = value === "DIAMOND" || value === "GOLD_DIAMOND";

  return (
    <div className="space-y-3">
      {/* Segmented control */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-2 rounded-xl">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "py-2 px-2 rounded-lg text-[12px] font-semibold transition-all duration-200",
              value === t.value
                ? t.value === "GOLD"
                  ? "bg-amber-500/20 text-amber-400 shadow-sm ring-1 ring-amber-500/30"
                  : t.value === "DIAMOND"
                  ? "bg-sky-500/20 text-sky-400 shadow-sm ring-1 ring-sky-500/30"
                  : "bg-purple-500/20 text-purple-400 shadow-sm ring-1 ring-purple-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conditional sub-fields */}
      <div className="grid grid-cols-2 gap-3">
        {showGold && (
          <div className="space-y-1.5">
            <label className={fieldLabel}>
              Gold Carat <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {GOLD_CARATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onGoldCaratChange(goldCarat === c ? "" : c)}
                  className={cn(
                    "py-1.5 rounded-md text-[12px] font-medium transition-all",
                    goldCarat === c
                      ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {showDiamond && (
          <div className="space-y-1.5">
            <label className={fieldLabel}>
              Diamond Carat <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              className={fieldInput}
              placeholder="e.g. 0.50 ct"
              value={diamondCarat}
              onChange={(e) => onDiamondCaratChange(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── New Order Form ───────────────────────────────────────────────────────────
const NewOrderForm = ({ onCreated }: { onCreated: (order: CustomOrder) => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<CreateCustomOrderInput, "materialType" | "goldCarat" | "diamondCarat">>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    itemName: "",
    remarks: "",
    orderDate: today(),
    pickupDate: "",
    advanceAmount: 0,
    totalAmount: 0,
  });
  const [materialType, setMaterialType] = useState<MaterialType>("GOLD");
  const [goldCarat, setGoldCarat] = useState("");
  const [diamondCarat, setDiamondCarat] = useState("");

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: createCustomOrder,
    onSuccess: (order) => {
      toast.success("Custom order created!");
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
      onCreated(order);
      // Reset form
      setForm({
        customerName: "", customerPhone: "", customerAddress: "",
        itemName: "", remarks: "", orderDate: today(), pickupDate: "",
        advanceAmount: 0, totalAmount: 0,
      });
      setMaterialType("GOLD");
      setGoldCarat("");
      setDiamondCarat("");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create order"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupDate) { toast.error("Please set an estimated pickup date"); return; }
    mutation.mutate({
      ...form,
      materialType,
      goldCarat: goldCarat as GoldCarat || undefined,
      diamondCarat: diamondCarat || undefined,
      advanceAmount: Number(form.advanceAmount),
      totalAmount: Number(form.totalAmount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Section: Customer Details */}
      <div className="rounded-xl bg-surface border border-border/40 p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-foreground">Customer Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className={fieldLabel}>Customer Name *</label>
            <input required className={fieldInput} placeholder="e.g. Ramesh Kumar" value={form.customerName} onChange={set("customerName")} />
          </div>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Phone Number *</label>
            <input required className={fieldInput} placeholder="9876543210" type="tel" value={form.customerPhone} onChange={set("customerPhone")} />
          </div>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Address <span className="text-muted-foreground/50">(optional)</span></label>
            <input className={fieldInput} placeholder="Street, City" value={form.customerAddress} onChange={set("customerAddress")} />
          </div>
        </div>
      </div>

      {/* Section: Item Details */}
      <div className="rounded-xl bg-surface border border-border/40 p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-foreground">Item Details</h3>

        <div className="space-y-1.5">
          <label className={fieldLabel}>Item Name *</label>
          <input required className={fieldInput} placeholder="e.g. Gents Gold Ring with Diamond Setting" value={form.itemName} onChange={set("itemName")} />
        </div>

        <div className="space-y-1.5">
          <label className={fieldLabel}>Material Composition *</label>
          <MaterialSelector
            value={materialType}
            goldCarat={goldCarat}
            diamondCarat={diamondCarat}
            onChange={setMaterialType}
            onGoldCaratChange={setGoldCarat}
            onDiamondCaratChange={setDiamondCarat}
          />
        </div>

        <div className="space-y-1.5">
          <label className={fieldLabel}>Special Instructions / Remarks <span className="text-muted-foreground/50">(optional)</span></label>
          <textarea
            rows={3}
            className={cn(fieldInput, "resize-none")}
            placeholder="e.g. Size 18, engraving: 'AR', floral design on band…"
            value={form.remarks}
            onChange={set("remarks")}
          />
        </div>
      </div>

      {/* Section: Dates & Payment */}
      <div className="rounded-xl bg-surface border border-border/40 p-5 space-y-4">
        <h3 className="text-[13px] font-semibold text-foreground">Dates & Payment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={fieldLabel}>Order Date</label>
            <input
              type="date"
              className={fieldInput}
              value={form.orderDate}
              onChange={set("orderDate")}
            />
          </div>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Estimated Pickup Date *</label>
            <input
              required
              type="date"
              min={form.orderDate}
              className={fieldInput}
              value={form.pickupDate}
              onChange={set("pickupDate")}
            />
          </div>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Total Order Amount (₹) *</label>
            <input
              required
              type="number"
              min={0}
              className={fieldInput}
              placeholder="0"
              value={form.totalAmount || ""}
              onChange={set("totalAmount")}
            />
          </div>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Advance Paid (₹) <span className="text-muted-foreground/50">(optional)</span></label>
            <input
              type="number"
              min={0}
              className={fieldInput}
              placeholder="0"
              value={form.advanceAmount || ""}
              onChange={set("advanceAmount")}
            />
          </div>
        </div>

        {/* Balance due preview */}
        {Number(form.totalAmount) > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
            <span className="text-[12.5px] text-muted-foreground">Balance due at pickup</span>
            <span className="text-[14px] font-semibold text-primary tabular-nums">
              {formatINR(Math.max(0, Number(form.totalAmount) - Number(form.advanceAmount)))}
            </span>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {mutation.isPending ? "Creating…" : "Create Order"}
        </button>
      </div>
    </form>
  );
};

// ─── Convert-to-Sale Modal ────────────────────────────────────────────────────
type CartItem = {
  sku: string;
  productName: string;
  material: string;
  purity: string;
  weight: number;
  quantity: number;
  pricePerPiece: number;
};

const ConvertToSaleModal = ({
  order,
  open,
  onClose,
  onConverted,
}: {
  order: CustomOrder;
  open: boolean;
  onClose: () => void;
  onConverted: (saleId: number) => void;
}) => {
  const qc = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [skuError, setSkuError] = useState("");

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    enabled: open,
  });

  const saleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale: Sale) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      onConverted(sale.id);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to record sale"),
  });

  if (!open) return null;

  const subtotal = cart.reduce((s, c) => s + c.pricePerPiece * c.quantity, 0);
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst;

  const addToCart = () => {
    const product = products.find(
      (p: Product) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) { setSkuError("Product not found for this SKU"); return; }
    if (product.stockQuantity <= 0) { setSkuError("This item is out of stock"); return; }
    const existing = cart.find((c) => c.sku === product.sku);
    if (existing) {
      setCart((prev) => prev.map((c) => c.sku === product.sku ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart((prev) => [...prev, {
        sku: product.sku, productName: product.name, material: product.material,
        purity: product.purity, weight: product.baseWeight, quantity: 1, pricePerPiece: product.price,
      }]);
    }
    setSkuInput(""); setSkuError("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) { toast.error("Add at least one item to the sale"); return; }
    saleMutation.mutate({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: cart.map(({ sku, quantity, pricePerPiece }) => ({ sku, quantity, pricePerPiece })),
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
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Convert to Sale</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Order #{order.id} · {order.customerName} · {order.itemName}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pre-filled customer info banner */}
        <div className="rounded-lg bg-surface-2 px-4 py-3 text-[12.5px] space-y-0.5">
          <p className="font-medium text-foreground">Customer auto-filled from order</p>
          <p className="text-muted-foreground">{order.customerName} · {order.customerPhone}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* SKU search */}
          <div className="space-y-2">
            <label className={fieldLabel}>Add item by SKU</label>
            <div className="flex gap-2">
              <input
                className={fieldInput}
                placeholder="e.g. KK-R-001"
                value={skuInput}
                onChange={(e) => { setSkuInput(e.target.value); setSkuError(""); }}
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
                      onClick={() => { setSkuInput(p.sku); setSkuError(""); }}
                      className="w-full flex justify-between items-center px-3 py-2 text-[12px] hover:bg-surface text-left"
                    >
                      <span><span className="font-medium">{p.sku}</span>{" · "}{p.name}</span>
                      <span className="text-muted-foreground">{p.material} · Stock: {p.stockQuantity}</span>
                    </button>
                  ))}
              </div>
            )}
            {skuError && <p className="text-[11.5px] text-destructive">{skuError}</p>}
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
                      <p className="text-[11px] text-muted-foreground">{item.sku} · {item.material} {item.purity}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => setCart((prev) => prev.map((c) => c.sku === item.sku ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))}
                        className="w-6 h-6 rounded bg-surface-2 text-sm font-bold hover:bg-surface flex items-center justify-center">−</button>
                      <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                      <button type="button" onClick={() => setCart((prev) => prev.map((c) => c.sku === item.sku ? { ...c, quantity: c.quantity + 1 } : c))}
                        className="w-6 h-6 rounded bg-surface-2 text-sm font-bold hover:bg-surface flex items-center justify-center">+</button>
                    </div>
                    <div className="text-right shrink-0 w-24">
                      <p className="text-[13px] font-semibold tabular-nums">{formatINR(item.pricePerPiece * item.quantity)}</p>
                      <p className="text-[10px] text-muted-foreground">{formatINR(item.pricePerPiece)} each</p>
                    </div>
                    <button type="button" onClick={() => setCart((prev) => prev.filter((c) => c.sku !== item.sku))}
                      className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="tabular-nums">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST @ 3%</span><span className="tabular-nums">{formatINR(gst)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground border-t border-border pt-1.5 mt-1">
                  <span>Grand Total</span><span className="tabular-nums text-primary">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-2">
              Cancel
            </button>
            <button type="submit" disabled={saleMutation.isPending || cart.length === 0}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saleMutation.isPending ? "Recording…" : "Confirm Sale & Close Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Orders List (Ledger tab) ─────────────────────────────────────────────────
const MaterialBadge = ({ type }: { type: MaterialType }) => {
  const map = {
    GOLD: { label: "Gold", cls: "bg-amber-500/15 text-amber-400" },
    DIAMOND: { label: "Diamond", cls: "bg-sky-500/15 text-sky-400" },
    GOLD_DIAMOND: { label: "Gold + Diamond", cls: "bg-purple-500/15 text-purple-400" },
  };
  const { label, cls } = map[type];
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", cls)}>{label}</span>;
};

const StatusBadge = ({ status }: { status: CustomOrder["status"] }) => {
  const isPending = status === "PENDING";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
      isPending ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", isPending ? "bg-amber-400" : "bg-emerald-400")} />
      {isPending ? "Pending" : "Picked Up"}
    </span>
  );
};

// ─── Update Order Modal ───────────────────────────────────────────────────────
const UpdateOrderModal = ({
  order,
  onClose,
  onSave,
  isPending,
}: {
  order: CustomOrder;
  onClose: () => void;
  onSave: (patch: Partial<CustomOrder>) => void;
  isPending: boolean;
}) => {
  const [status, setStatus] = useState<"PENDING" | "PICKED_UP">(order.status);
  const [balanceDue, setBalanceDue] = useState<number>(Math.max(0, order.totalAmount - order.advanceAmount));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // back-calculate advanceAmount from the edited balance
    const newAdvance = Math.max(0, order.totalAmount - balanceDue);
    onSave({ ...order, status, advanceAmount: newAdvance });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-elevated)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Update Order</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Order #{order.id} · {order.customerName} · {order.itemName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status toggle */}
          <div className="space-y-2">
            <p className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
              Order Status
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-xl">
              {(["PENDING", "PICKED_UP"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "py-2.5 rounded-lg text-[12.5px] font-semibold transition-all duration-200",
                    status === s
                      ? s === "PENDING"
                        ? "bg-amber-500/20 text-amber-400 shadow-sm ring-1 ring-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle",
                      status === s
                        ? s === "PENDING"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                        : "bg-muted-foreground/40"
                    )}
                  />
                  {s === "PENDING" ? "Pending" : "Completed / Picked Up"}
                </button>
              ))}
            </div>
          </div>

          {/* Amount fields — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Advance Paid — fixed, read-only */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                Advance Paid (₹)
              </label>
              <div className="w-full bg-surface-2/50 border border-transparent rounded-lg py-2.5 px-3 text-sm text-muted-foreground tabular-nums cursor-not-allowed">
                {formatINR(order.advanceAmount)}
              </div>
            </div>

            {/* Balance Due — editable */}
            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                Balance Due (₹)
              </label>
              <input
                type="number"
                min={0}
                value={balanceDue || ""}
                onChange={(e) => setBalanceDue(Number(e.target.value))}
                className={cn(
                  "w-full border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/60",
                  balanceDue === 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-surface-2 border-transparent text-foreground"
                )}
                placeholder="0"
              />
            </div>
          </div>

          {/* Summary row */}
          <div className="rounded-lg bg-surface-2 px-4 py-3 flex items-center justify-between text-[12.5px]">
            <span className="text-muted-foreground">Order Total</span>
            <span className="font-semibold tabular-nums text-foreground">{formatINR(order.totalAmount)}</span>
          </div>

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
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OrdersListTab = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [slipOrder, setSlipOrder] = useState<CustomOrder | null>(null);
  const [convertOrder, setConvertOrder] = useState<CustomOrder | null>(null);
  const [updateOrder, setUpdateOrder] = useState<CustomOrder | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["custom-orders"],
    queryFn: fetchCustomOrders,
  });

  const deleteMut = useMutation({
    mutationFn: deleteCustomOrder,
    onSuccess: () => { toast.success("Order deleted"); qc.invalidateQueries({ queryKey: ["custom-orders"] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<CustomOrder> }) =>
      updateCustomOrder(id, patch),
    onSuccess: () => {
      toast.success("Order updated!");
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
      setUpdateOrder(null);
    },
    onError: () => toast.error("Failed to update order"),
  });

  const markPickedUp = useMutation({
    mutationFn: ({ id, saleId }: { id: number; saleId?: number }) =>
      markOrderPickedUp(id, saleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-orders"] }); },
  });

  const filtered = orders.filter((o: CustomOrder) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.itemName.toLowerCase().includes(q) ||
      String(o.id).includes(q)
    );
  });

  const handlePrintSlip = (order: CustomOrder) => {
    setSlipOrder(order);
    // give DOM time to render then trigger print
    setTimeout(() => {
      const content = slipRef.current;
      if (!content) return;
      const win = window.open("", "_blank", "width=400,height=700");
      if (!win) return;
      win.document.write(`<html><head><title>K.K Jewelers - Order #${order.id}</title>
        <style>body{margin:0;font-family:monospace;}</style>
        </head><body>${content.innerHTML}</body></html>`);
      win.document.close(); win.focus(); win.print(); win.close();
    }, 100);
  };


  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-[12px] text-muted-foreground">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {["#", "Customer", "Item", "Material", "Pickup Date", "Total", "Advance", "Balance", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((order: CustomOrder) => (
              <tr key={order.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3.5 text-muted-foreground text-xs">#{order.id}</td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[13px]">{order.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">{order.customerPhone}</p>
                </td>
                <td className="px-4 py-3.5 text-[13px] max-w-[160px]">
                  <p className="truncate">{order.itemName}</p>
                </td>
                <td className="px-4 py-3.5"><MaterialBadge type={order.materialType} /></td>
                <td className="px-4 py-3.5 text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(order.pickupDate)}</td>
                <td className="px-4 py-3.5 tabular-nums font-semibold text-[13px]">{formatINR(order.totalAmount)}</td>
                <td className="px-4 py-3.5 tabular-nums text-[13px] text-muted-foreground">{formatINR(order.advanceAmount)}</td>
                <td className="px-4 py-3.5 tabular-nums text-[13px] font-medium text-primary">
                  {formatINR(Math.max(0, order.totalAmount - order.advanceAmount))}
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {/* Print slip */}
                    <button
                      onClick={() => handlePrintSlip(order)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      title="Print order slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Convert to Sale */}
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => setConvertOrder(order)}
                        className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors whitespace-nowrap"
                        title="Convert to sale"
                      >
                        Convert to Sale
                      </button>
                    )}

                    {/*Update the order — only while pending*/}
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => setUpdateOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors whitespace-nowrap"
                        title="Update order"
                      >
                        ✎ Update
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete Order #${order.id}? This cannot be undone.`))
                          deleteMut.mutate(order.id);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-surface-2"
                      title="Delete order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No custom orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden print target */}
      {slipOrder && (
        <div className="hidden">
          <div ref={slipRef}>
            <OrderSlip order={slipOrder} />
          </div>
        </div>
      )}

      {/* Convert to Sale Modal */}
      {convertOrder && (
        <ConvertToSaleModal
          order={convertOrder}
          open={!!convertOrder}
          onClose={() => setConvertOrder(null)}
          onConverted={(saleId) => {
            markPickedUp.mutate({ id: convertOrder.id, saleId });
            toast.success("Order marked as Picked Up & sale recorded!");
            setConvertOrder(null);
          }}
        />
      )}

      {/* Update Order Modal */}
      {updateOrder && (
        <UpdateOrderModal
          order={updateOrder}
          onClose={() => setUpdateOrder(null)}
          onSave={(patch) => updateMut.mutate({ id: updateOrder.id, patch })}
          isPending={updateMut.isPending}
        />
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = "new-order" | "orders-list";

export const CustomOrderForm = () => {
  const [activeTab, setActiveTab] = useState<Tab>("new-order");
  const [slipOrder, setSlipOrder] = useState<CustomOrder | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrintSlip = (order: CustomOrder) => {
    setSlipOrder(order);
    setTimeout(() => {
      const content = slipRef.current;
      if (!content) return;
      const win = window.open("", "_blank", "width=400,height=700");
      if (!win) return;
      win.document.write(`<html><head><title>K.K Jewelers - Order #${order.id}</title>
        <style>body{margin:0;font-family:monospace;}</style>
        </head><body>${content.innerHTML}</body></html>`);
      win.document.close(); win.focus(); win.print(); win.close();
    }, 100);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "new-order", label: "New Order", icon: <Plus className="w-3.5 h-3.5" /> },
    { id: "orders-list", label: "Orders List", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl w-fit border border-border/40">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "new-order" ? (
        <NewOrderForm
          onCreated={(order) => {
            // Show slip then switch to list
            setSlipOrder(order);
            setActiveTab("orders-list");
          }}
        />
      ) : (
        <OrdersListTab />
      )}

      {/* Order Slip modal — shown after creation */}
      {slipOrder && activeTab === "orders-list" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
          onClick={() => setSlipOrder(null)}
        >
          <div
            className="rounded-2xl bg-white overflow-hidden"
            style={{ boxShadow: "var(--shadow-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={slipRef}>
              <OrderSlip order={slipOrder} />
            </div>
            <div className="flex gap-2 p-3 bg-white border-t border-gray-200">
              <button
                onClick={() => setSlipOrder(null)}
                className="flex-1 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintSlip(slipOrder)}
                className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:opacity-80 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
