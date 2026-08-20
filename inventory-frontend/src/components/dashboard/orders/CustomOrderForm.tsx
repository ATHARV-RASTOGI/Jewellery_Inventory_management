import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Printer,
  Trash2,
  ClipboardList,
  ShoppingCart,
  Calendar,
  IndianRupee,
  User,
  Phone,
  MapPin,
  Gem,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatINR, fmtDate, todayIso } from "@/lib/utils";
import {
  fetchCustomOrders,
  createCustomOrder,
  markOrderPickedUp,
  deleteCustomOrder,
  type CustomOrder,
  type CreateCustomOrderInput,
  type MaterialType,
  type GoldCarat,
} from "@/lib/api/customOrders";
import { fetchProducts } from "@/lib/api/inventory";
import { createSale, type Sale } from "@/lib/api/sales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { numberToIndianWords } from "@/lib/numberToWords";
import { fieldLabel, fieldInput } from "@/lib/styles";
import { FormSection } from "@/components/ui/FormSection";
import { SearchToolbar, SearchInput } from "@/components/ui/SearchToolbar";
import { DataTable } from "@/components/ui/DataTable";
import { PrintSlip } from "@/components/receipts/PrintSlip";
import { useCartManager } from "@/lib/hooks/useCartManager";
import { CartTable } from "@/components/ui/CartTable";

// ─── Material Badge ──────────────────────────────────────────────────────────
const MaterialBadge = ({ type }: { type: MaterialType }) => {
  if (type === "GOLD") return <StatusBadge variant="gold">Gold</StatusBadge>;
  if (type === "DIAMOND")
    return <StatusBadge variant="info">Diamond</StatusBadge>;
  return <StatusBadge variant="warning">Gold + Diamond</StatusBadge>;
};

// ─── Official Printable Order Slip ────────────────────────────────────────────
const OrderSlip = ({ order }: { order: CustomOrder }) => {
  const balanceDue = Math.max(0, order.totalAmount - order.advanceAmount);

  return (
    <PrintSlip
      title="Bespoke Custom Order Slip"
      idLabel="Order No"
      id={order.id}
      customer={{
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        date: order.orderDate,
        dateLabel: "Order Date",
        statusBadge: (
          <span className="font-semibold uppercase text-[11px]">
            {order.status === "PICKED_UP" ? "Delivered" : "In Progress"}
          </span>
        ),
        additionalInfo: (
          <p>
            <span className="font-bold text-gray-700">Estimated Delivery: </span>
            <span className="font-bold">{fmtDate(order.pickupDate)}</span>
          </p>
        ),
      }}
    >
      {/* Piece Specification */}
      <div className="py-3 border-b border-gray-300 text-xs space-y-1.5">
        <p className="font-bold uppercase tracking-wider text-gray-800">
          Piece Specification
        </p>
        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
          <p className="font-bold text-sm text-black">{order.itemName}</p>
          <p className="text-gray-700">
            <span className="font-semibold">Composition: </span>
            {order.materialType === "GOLD"
              ? "Gold"
              : order.materialType === "DIAMOND"
                ? "Diamond"
                : "Gold + Diamond"}
            {order.goldCarat ? ` (${order.goldCarat})` : ""}
            {order.diamondCarat ? ` · Diamond: ${order.diamondCarat}` : ""}
          </p>
          {order.remarks && (
            <p className="text-gray-600 italic">
              <span className="font-semibold not-italic">Design Notes: </span>
              {order.remarks}
            </p>
          )}
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="py-3 border-b border-gray-300 bg-gray-50/70 p-3 rounded my-2 border border-gray-200 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">Total Agreed Price:</span>
          <span className="font-mono font-bold">{formatINR(order.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-green-800">
          <span className="font-medium">Advance Deposit Paid:</span>
          <span className="font-mono font-bold">− {formatINR(order.advanceAmount)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-black text-black">
          <span className="font-extrabold uppercase">Balance Due Upon Delivery:</span>
          <span className="text-base font-extrabold font-mono">
            {formatINR(balanceDue)}
          </span>
        </div>
        <p className="text-[11px] font-medium text-gray-800 pt-1 italic">
          Agreed Amount in words:{" "}
          <span className="font-bold not-italic">
            {numberToIndianWords(order.totalAmount)}
          </span>
        </p>
      </div>
    </PrintSlip>
  );
};

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
  const types: { value: MaterialType; label: string }[] = [
    { value: "GOLD", label: "Gold" },
    { value: "DIAMOND", label: "Diamond" },
    { value: "GOLD_DIAMOND", label: "Gold + Diamond" },
  ];

  const showGold = value === "GOLD" || value === "GOLD_DIAMOND";
  const showDiamond = value === "DIAMOND" || value === "GOLD_DIAMOND";

  return (
    <div className="space-y-4">
      <div className="inline-flex p-1 bg-surface-2 border border-border/70 rounded-lg w-full sm:w-auto">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 select-none",
              value === t.value
                ? "bg-surface text-primary font-bold shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(showGold || showDiamond) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {showGold && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>
                Gold Carat <span className="text-muted-foreground/60">(Optional)</span>
              </label>
              <div className="inline-flex gap-1.5 p-1 bg-surface-2 border border-border/60 rounded-lg w-full sm:w-auto">
                {GOLD_CARATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onGoldCaratChange(goldCarat === c ? "" : c)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all select-none",
                      goldCarat === c
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-3/60"
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
              <Input
                label="Diamond Carat (Optional)"
                placeholder="e.g. 0.50 ct, VVS-EF"
                value={diamondCarat}
                onChange={(e) => onDiamondCaratChange(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Initial Form State Constant ──────────────────────────────────────────────
const INITIAL_ORDER_FORM = {
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  itemName: "",
  remarks: "",
  orderDate: todayIso(),
  pickupDate: "",
  advanceAmount: 0,
  totalAmount: 0,
};

// ─── Single-Column ERP Document Form ──────────────────────────────────────────
const NewOrderFormVariationA = ({
  onCreated,
}: {
  onCreated: (order: CustomOrder) => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState(INITIAL_ORDER_FORM);
  const [materialType, setMaterialType] = useState<MaterialType>("GOLD");
  const [goldCarat, setGoldCarat] = useState("");
  const [diamondCarat, setDiamondCarat] = useState("");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleReset = () => {
    setForm(INITIAL_ORDER_FORM);
    setMaterialType("GOLD");
    setGoldCarat("");
    setDiamondCarat("");
  };

  const mutation = useMutation({
    mutationFn: createCustomOrder,
    onSuccess: (order) => {
      toast.success(`Custom order #${order.id} created successfully!`);
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
      onCreated(order);
      handleReset();
    },
    onError: (e: any) =>
      toast.error(e.message ?? "Failed to create custom order"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupDate) {
      toast.error("Please set an estimated delivery date");
      return;
    }
    if (form.customerPhone.length !== 10 || !/^\d+$/.test(form.customerPhone)) {
      toast.error("Customer phone number must be exactly 10 digits");
      return;
    }
    mutation.mutate({
      ...form,
      materialType,
      goldCarat: (goldCarat as GoldCarat) || undefined,
      diamondCarat: diamondCarat || undefined,
      advanceAmount: Number(form.advanceAmount) || 0,
      totalAmount: Number(form.totalAmount) || 0,
    });
  };

  const totalAmountNum = Number(form.totalAmount) || 0;
  const advanceAmountNum = Number(form.advanceAmount) || 0;
  const balanceDue = Math.max(0, totalAmountNum - advanceAmountNum);
  const paidPercent =
    totalAmountNum > 0
      ? Math.min(100, Math.round((advanceAmountNum / totalAmountNum) * 100))
      : 0;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-8 pt-2">
      <FormSection
        title="Customer Information"
        description="Primary contact details and residence address for order tracking."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            required
            placeholder="e.g. Ramesh Kumar"
            leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
            value={form.customerName}
            onChange={set("customerName")}
          />
          <Input
            label="Phone Number"
            required
            placeholder="10-digit mobile number"
            type="tel"
            leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
            value={form.customerPhone}
            onChange={set("customerPhone")}
          />
          <div className="sm:col-span-2">
            <Input
              label="Residence Address (Optional)"
              placeholder="Street name, landmark, city, PIN code"
              leftIcon={<MapPin className="w-4 h-4 text-muted-foreground" />}
              value={form.customerAddress}
              onChange={set("customerAddress")}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Jewellery Specification & Design"
        description="Precious metal, stone parameters, and custom craftsmanship requirements."
      >
        <div className="space-y-4">
          <Input
            label="Item Name / Design"
            required
            placeholder="e.g. 22K Solid Gold Bangles, Floral Solitaire Ring"
            leftIcon={<Gem className="w-4 h-4 text-muted-foreground" />}
            value={form.itemName}
            onChange={set("itemName")}
          />
          <div className="space-y-1.5">
            <label className={fieldLabel}>
              Material Composition <span className="text-danger">*</span>
            </label>
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
            <label className={fieldLabel}>
              Design Instructions &amp; Engraving{" "}
              <span className="text-muted-foreground/60">(Optional)</span>
            </label>
            <textarea
              rows={3}
              className={cn(fieldInput, "resize-y pl-3 min-h-[80px]")}
              placeholder="e.g. Size 18, custom initial engraving: 'AR', floral filigree center-piece, BIS 916 laser hallmark required…"
              value={form.remarks}
              onChange={set("remarks")}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Delivery Schedule & Financial Terms"
        description="Pickup commitment date, agreed total pricing, and advance deposit."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Order Booking Date"
            type="date"
            required
            leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
            value={form.orderDate}
            onChange={set("orderDate")}
          />
          <Input
            label="Estimated Delivery Date"
            required
            type="date"
            min={form.orderDate}
            leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
            value={form.pickupDate}
            onChange={set("pickupDate")}
          />
          <Input
            label="Total Agreed Price (₹)"
            required
            type="number"
            min={0}
            placeholder="₹ 0"
            leftIcon={<IndianRupee className="w-4 h-4 text-muted-foreground" />}
            value={form.totalAmount || ""}
            onChange={set("totalAmount")}
          />
          <Input
            label="Advance Deposit Paid (₹)"
            type="number"
            min={0}
            placeholder="₹ 0"
            leftIcon={<IndianRupee className="w-4 h-4 text-muted-foreground" />}
            value={form.advanceAmount || ""}
            onChange={set("advanceAmount")}
          />
        </div>

        {totalAmountNum > 0 && (
          <div className="p-4 rounded-lg bg-surface-2 border border-border/70 space-y-2.5 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment Balance Summary
                </p>
                <p className="text-xs text-foreground">
                  Agreed Total: <span className="font-bold font-mono">{formatINR(totalAmountNum)}</span> · Advance Received:{" "}
                  <span className="font-bold font-mono text-success">{formatINR(advanceAmountNum)}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-muted-foreground">Balance Due Upon Delivery:</span>
                <p className="text-lg font-extrabold text-primary font-mono tabular-nums">
                  {formatINR(balanceDue)}
                </p>
              </div>
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        )}
      </FormSection>

      <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={handleReset}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={mutation.isPending}
          className="font-bold px-6 shadow-sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {mutation.isPending ? "Creating Order…" : "Create Custom Order"}
        </Button>
      </div>
    </form>
  );
};

// ─── Convert-to-Sale Modal ────────────────────────────────────────────────────
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
  const {
    cart,
    skuInput,
    setSkuInput,
    skuError,
    addToCart,
    removeFromCart,
    updateQty,
    subtotal,
    gst,
    grandTotal,
  } = useCartManager();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error("Add at least one item from inventory");
      return;
    }
    saleMutation.mutate({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress ?? "",
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
      title="Convert Order to Final Sale"
      subtitle={`Order #${order.id} · ${order.customerName} · ${order.itemName}`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="convert-sale-form"
            variant="primary"
            size="sm"
            isLoading={saleMutation.isPending}
            disabled={cart.length === 0}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Complete Sale &amp; Mark Delivered
          </Button>
        </>
      }
    >
      <form id="convert-sale-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-surface-2 p-3.5 border border-border/60 text-xs space-y-1">
          <p className="font-semibold text-foreground">
            Customer: {order.customerName} ({order.customerPhone})
          </p>
          <p className="text-muted-foreground">
            Bespoke Item: {order.itemName} · Agreed Total:{" "}
            {formatINR(order.totalAmount)} (Advance:{" "}
            {formatINR(order.advanceAmount)})
          </p>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Select Finished Inventory Piece (SKU)"
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
            Add
          </Button>
        </div>

        {cart.length > 0 && (
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
        )}
      </form>
    </Modal>
  );
};

// ─── Orders List Tab ──────────────────────────────────────────────────────────
const OrdersListTab = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [slipOrder, setSlipOrder] = useState<CustomOrder | null>(null);
  const [convertOrder, setConvertOrder] = useState<CustomOrder | null>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["custom-orders"],
    queryFn: fetchCustomOrders,
  });

  const deleteMut = useMutation({
    mutationFn: deleteCustomOrder,
    onSuccess: () => {
      toast.success("Custom order deleted");
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
    },
  });

  const markPickedUp = useMutation({
    mutationFn: ({ id, saleId }: { id: number; saleId?: number }) =>
      markOrderPickedUp(id, saleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
    },
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
    setTimeout(() => window.print(), 200);
  };

  const columns = [
    { header: "#" },
    { header: "Customer" },
    { header: "Piece Description" },
    { header: "Composition" },
    { header: "Delivery" },
    { header: "Total", align: "right" as const },
    { header: "Advance", align: "right" as const },
    { header: "Due", align: "right" as const },
    { header: "Status", align: "center" as const },
    { header: "Actions", align: "right" as const },
  ];

  return (
    <div className="space-y-4">
      <SearchToolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search custom orders…"
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> order{filtered.length !== 1 ? "s" : ""}
        </p>
      </SearchToolbar>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyExtractor={(order) => order.id}
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title="No custom orders found"
            description="Create your first bespoke jewelry order using the 'New Bespoke Order' tab."
          />
        }
        renderRow={(order) => (
          <tr className="hover:bg-surface-2/50 transition-colors">
            <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
              #{order.id}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <p className="font-semibold text-[13px] text-foreground">
                {order.customerName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {order.customerPhone}
              </p>
            </td>
            <td className="px-4 py-3 text-[13px] max-w-[180px]">
              <p className="truncate text-foreground font-medium">{order.itemName}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <MaterialBadge type={order.materialType} />
            </td>
            <td className="px-4 py-3 text-[12.5px] text-muted-foreground whitespace-nowrap">
              {fmtDate(order.pickupDate)}
            </td>
            <td className="px-4 py-3 tabular-nums font-semibold text-right text-[13px] whitespace-nowrap">
              {formatINR(order.totalAmount)}
            </td>
            <td className="px-4 py-3 tabular-nums text-right text-[13px] text-muted-foreground whitespace-nowrap">
              {formatINR(order.advanceAmount)}
            </td>
            <td className="px-4 py-3 tabular-nums text-right text-[13px] font-semibold text-primary whitespace-nowrap">
              {formatINR(Math.max(0, order.totalAmount - order.advanceAmount))}
            </td>
            <td className="px-4 py-3 text-center whitespace-nowrap">
              <StatusBadge
                variant={order.status === "PICKED_UP" ? "success" : "warning"}
                withDot
              >
                {order.status === "PICKED_UP" ? "Delivered" : "Pending"}
              </StatusBadge>
            </td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePrintSlip(order)}
                  title="Print order slip"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <Printer className="w-4 h-4" />
                </Button>

                {order.status === "PENDING" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConvertOrder(order)}
                    className="text-xs h-8"
                  >
                    Convert to Sale
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete Custom Order #${order.id}? This cannot be undone.`
                      )
                    )
                      deleteMut.mutate(order.id);
                  }}
                  title="Delete order"
                  className="h-8 w-8 text-muted-foreground hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </td>
          </tr>
        )}
      />

      <div className="hidden print:block" ref={slipRef}>
        {slipOrder && <OrderSlip order={slipOrder} />}
      </div>

      {convertOrder && (
        <ConvertToSaleModal
          order={convertOrder}
          open={!!convertOrder}
          onClose={() => setConvertOrder(null)}
          onConverted={(saleId) => {
            markPickedUp.mutate({ id: convertOrder.id, saleId });
            toast.success("Order marked as Delivered & sale recorded!");
            setConvertOrder(null);
          }}
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
    setTimeout(() => window.print(), 200);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "new-order",
      label: "New Bespoke Order",
      icon: <Plus className="w-3.5 h-3.5" />,
    },
    {
      id: "orders-list",
      label: "Orders Ledger",
      icon: <ClipboardList className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 border-b border-border/60 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 select-none -mb-px",
              activeTab === t.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "new-order" ? (
        <NewOrderFormVariationA
          onCreated={(order) => {
            setSlipOrder(order);
            setActiveTab("orders-list");
          }}
        />
      ) : (
        <OrdersListTab />
      )}

      {slipOrder && activeTab === "orders-list" && (
        <Modal
          open={!!slipOrder}
          onClose={() => setSlipOrder(null)}
          title={`Order #${slipOrder.id} Voucher`}
          subtitle="Nehru Road, Farrukhabad official bespoke order voucher"
          maxWidth="2xl"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSlipOrder(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePrintSlip(slipOrder)}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Voucher (A5)
              </Button>
            </>
          }
        >
          <div ref={slipRef} className="overflow-x-auto py-2 flex justify-center">
            <OrderSlip order={slipOrder} />
          </div>
        </Modal>
      )}
    </div>
  );
};
