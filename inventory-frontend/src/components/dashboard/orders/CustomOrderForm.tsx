import { useMemo, useRef, useState } from "react";
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
  Eye,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatINR, fmtDate, todayIso } from "@/lib/utils";
import {
  fetchCustomOrders,
  createCustomOrder,
  markOrderPickedUp,
  deleteCustomOrder,
  type CustomOrder,
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
import { SearchToolbar, SearchInput, FilterTabs } from "@/components/ui/SearchToolbar";
import { DetailDrawer } from "@/components/ui/DetailDrawer";
import { PrintSlip } from "@/components/receipts/PrintSlip";
import { useCartManager } from "@/lib/hooks/useCartManager";
import { CartTable } from "@/components/ui/CartTable";

const MaterialBadge = ({ type }: { type: MaterialType }) => {
  if (type === "GOLD") return <StatusBadge variant="gold">Gold</StatusBadge>;
  if (type === "DIAMOND") return <StatusBadge variant="info">Diamond</StatusBadge>;
  return <StatusBadge variant="warning">Gold + Diamond</StatusBadge>;
};

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
      <div className="py-3 border-b border-gray-300 text-xs space-y-1.5">
        <p className="font-bold uppercase tracking-wider text-gray-800">Piece Specification</p>
        <div className="bg-gray-50 p-2.5 rounded border border-gray-200 space-y-1">
          <p className="font-bold text-sm text-black">{order.itemName}</p>
          <p className="text-gray-700">
            <span className="font-semibold">Composition: </span>
            {order.materialType === "GOLD" ? "Gold" : order.materialType === "DIAMOND" ? "Diamond" : "Gold + Diamond"}
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
          <span className="text-base font-extrabold font-mono">{formatINR(balanceDue)}</span>
        </div>
        <p className="text-[11px] font-medium text-gray-800 pt-1 italic">
          Agreed Amount in words: <span className="font-bold not-italic">{numberToIndianWords(order.totalAmount)}</span>
        </p>
      </div>
    </PrintSlip>
  );
};

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
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-surface-2 border border-border rounded text-xs font-medium">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "py-1.5 px-2 text-center rounded transition-all cursor-pointer select-none",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {showGold && (
            <div className="space-y-1">
              <label className={fieldLabel}>Gold Carat</label>
              <div className="flex gap-1 p-0.5 bg-surface-2 border border-border rounded">
                {GOLD_CARATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onGoldCaratChange(goldCarat === c ? "" : c)}
                    className={cn(
                      "flex-1 py-1 rounded text-xs font-medium transition-all",
                      goldCarat === c ? "bg-primary text-primary-foreground font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {showDiamond && (
            <div className="space-y-1">
              <Input
                label="Diamond Carat"
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

const NewOrderWorkstation = ({ onCreated }: { onCreated: (order: CustomOrder) => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState(INITIAL_ORDER_FORM);
  const [materialType, setMaterialType] = useState<MaterialType>("GOLD");
  const [goldCarat, setGoldCarat] = useState("");
  const [diamondCarat, setDiamondCarat] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleReset = () => {
    setForm(INITIAL_ORDER_FORM);
    setMaterialType("GOLD");
    setGoldCarat("");
    setDiamondCarat("");
  };

  const mutation = useMutation({
    mutationFn: createCustomOrder,
    onSuccess: (order) => {
      toast.success(`Custom order #${order.id} registered!`);
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
      onCreated(order);
      handleReset();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create custom order"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupDate) return toast.error("Please set an estimated delivery date");
    if (!/^\d{10}$/.test(form.customerPhone)) return toast.error("Phone number must be exactly 10 digits");
    mutation.mutate({
      ...form,
      materialType,
      goldCarat: (goldCarat as GoldCarat) || undefined,
      diamondCarat: diamondCarat || undefined,
      advanceAmount: Number(form.advanceAmount) || 0,
      totalAmount: Number(form.totalAmount) || 0,
    });
  };

  const totalNum = Number(form.totalAmount) || 0;
  const advanceNum = Number(form.advanceAmount) || 0;
  const balanceDue = Math.max(0, totalNum - advanceNum);
  const paidPercent = totalNum > 0 ? Math.min(100, Math.round((advanceNum / totalNum) * 100)) : 0;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
      <div className="lg:col-span-8 space-y-4">
        {/* Customer Information */}
        <div className="bg-surface border border-border p-4 space-y-3">
          <div className="pb-2 border-b border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">1. Customer Identification</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified patron contact and delivery details.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input label="Customer Full Name" required placeholder="e.g. Anjali Verma" leftIcon={<User className="w-3.5 h-3.5 text-muted-foreground" />} value={form.customerName} onChange={set("customerName")} />
            <Input label="Mobile Contact" required placeholder="10-digit number" type="tel" leftIcon={<Phone className="w-3.5 h-3.5 text-muted-foreground" />} value={form.customerPhone} onChange={set("customerPhone")} />
            <div className="sm:col-span-2">
              <Input label="Residence Address (Optional)" placeholder="Street, city, landmark" leftIcon={<MapPin className="w-3.5 h-3.5 text-muted-foreground" />} value={form.customerAddress} onChange={set("customerAddress")} />
            </div>
          </div>
        </div>

        {/* Piece Specification */}
        <div className="bg-surface border border-border p-4 space-y-3">
          <div className="pb-2 border-b border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">2. Piece Specification</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Article design, precious metal composition, and notes.</p>
          </div>
          <div className="space-y-3 pt-1">
            <Input label="Article / Design Name" required placeholder="e.g. 22K Solid Gold Bangles, Floral Solitaire Ring" leftIcon={<Gem className="w-3.5 h-3.5 text-muted-foreground" />} value={form.itemName} onChange={set("itemName")} />
            <div className="space-y-1">
              <label className={fieldLabel}>Precious Metal <span className="text-danger">*</span></label>
              <MaterialSelector value={materialType} goldCarat={goldCarat} diamondCarat={diamondCarat} onChange={setMaterialType} onGoldCaratChange={setGoldCarat} onDiamondCaratChange={setDiamondCarat} />
            </div>
            <div className="space-y-1">
              <label className={fieldLabel}>Design &amp; Hallmarking Instructions</label>
              <textarea rows={3} className={cn(fieldInput, "resize-y pl-3 min-h-[70px] text-xs")} placeholder="e.g. Size 18, laser hallmark BIS 916, custom engraving..." value={form.remarks} onChange={set("remarks")} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-surface border border-border p-4 space-y-3">
          <div className="pb-2 border-b border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">3. Production Schedule</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Booking and promised delivery dates.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input label="Order Date" type="date" required leftIcon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} value={form.orderDate} onChange={set("orderDate")} />
            <Input label="Committed Delivery Date" required type="date" min={form.orderDate} leftIcon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} value={form.pickupDate} onChange={set("pickupDate")} />
          </div>
        </div>
      </div>

      {/* Sticky Financial Rail */}
      <div className="lg:col-span-4 sticky top-16 space-y-3 text-xs">
        <div className="bg-surface border border-border overflow-hidden">
          <div className="bg-surface-2 p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Agreed Settlement
            </div>
            <StatusBadge variant={paidPercent >= 100 ? "success" : "warning"} withDot>{paidPercent}% Covered</StatusBadge>
          </div>

          <div className="p-3.5 space-y-3">
            <Input label="Agreed Total Price (₹)" required type="number" min={0} placeholder="₹ 0" leftIcon={<IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />} value={form.totalAmount || ""} onChange={set("totalAmount")} />
            <Input label="Advance Deposit Collected (₹)" type="number" min={0} placeholder="₹ 0" leftIcon={<IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />} value={form.advanceAmount || ""} onChange={set("advanceAmount")} />

            <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground"><span>Agreed Total</span><span className="font-mono font-bold text-foreground">{formatINR(totalNum)}</span></div>
              <div className="flex justify-between items-center text-success"><span>Advance Received</span><span className="font-mono font-bold">− {formatINR(advanceNum)}</span></div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border/60 font-bold"><span className="text-foreground">Balance on Delivery</span><span className="font-mono text-primary text-sm font-extrabold">{formatINR(balanceDue)}</span></div>
              <div className="w-full h-1.5 bg-surface-2 border border-border rounded-xs overflow-hidden mt-1">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${paidPercent}%` }} />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" variant="primary" size="md" isLoading={mutation.isPending} className="w-full justify-center" leftIcon={<Plus className="w-4 h-4" />}>
                {mutation.isPending ? "Registering…" : "Register Custom Order"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="w-full justify-center text-xs" leftIcon={<RotateCcw className="w-3 h-3" />}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

const ConvertToSaleModal = ({ order, open, onClose, onConverted }: { order: CustomOrder; open: boolean; onClose: () => void; onConverted: (saleId: number) => void }) => {
  const qc = useQueryClient();
  const { cart, skuInput, setSkuInput, skuError, addToCart, removeFromCart, updateQty, subtotal, gst, grandTotal } = useCartManager();
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => fetchProducts(), enabled: open });

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert Order to Final Sale"
      subtitle={`Order #${order.id} · ${order.customerName} · ${order.itemName}`}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
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
      <form
        id="convert-sale-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (cart.length === 0) return toast.error("Add at least one item from inventory");
          saleMutation.mutate({
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress ?? "",
            items: cart.map(({ sku, quantity, pricePerPiece }) => ({ sku, quantity, pricePerPiece })),
          });
        }}
        className="space-y-4"
      >
        <div className="bg-surface-2 p-3 border border-border text-xs">
          <p className="font-semibold text-foreground">Customer: {order.customerName} ({order.customerPhone})</p>
          <p className="text-muted-foreground mt-0.5">Bespoke Article: {order.itemName} · Agreed: {formatINR(order.totalAmount)} (Advance: {formatINR(order.advanceAmount)})</p>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Select Finished Piece (SKU)"
              placeholder="e.g. KK-R-001"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToCart(products))}
              error={skuError}
            />
          </div>
          <Button type="button" variant="secondary" size="md" onClick={() => addToCart(products)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add
          </Button>
        </div>

        {cart.length > 0 && (
          <CartTable
            cart={cart}
            subtotal={subtotal}
            gst={gst}
            grandTotal={grandTotal}
            onUpdateQty={(sku, qty) => updateQty(sku, qty, products.find((p) => p.sku === sku)?.stockQuantity)}
            onRemove={removeFromCart}
          />
        )}
      </form>
    </Modal>
  );
};

const OrdersListTab = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [convertOrder, setConvertOrder] = useState<CustomOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PICKED_UP">("ALL");

  const { data: orders = [], isLoading } = useQuery({ queryKey: ["custom-orders"], queryFn: fetchCustomOrders });

  const deleteMut = useMutation({
    mutationFn: deleteCustomOrder,
    onSuccess: () => {
      toast.success("Order removed");
      setSelectedOrder(null);
      qc.invalidateQueries({ queryKey: ["custom-orders"] });
    },
  });

  const markPickedUp = useMutation({
    mutationFn: ({ id, saleId }: { id: number; saleId?: number }) => markOrderPickedUp(id, saleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-orders"] }),
  });

  const filtered = useMemo(() => {
    return orders.filter((o: CustomOrder) => {
      const statusMatch = statusFilter === "ALL" || o.status === statusFilter;
      const q = search.trim().toLowerCase();
      const match = !q || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q) || o.itemName.toLowerCase().includes(q) || String(o.id).includes(q);
      return statusMatch && match;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = filtered.filter((o) => o.status === "PENDING");
    const totalAdvance = filtered.reduce((s, o) => s + (o.advanceAmount || 0), 0);
    const totalDue = filtered.reduce((s, o) => s + Math.max(0, (o.totalAmount || 0) - (o.advanceAmount || 0)), 0);
    return { pendingCount: pending.length, totalAdvance, totalDue, totalCount: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <SearchToolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search orders by customer, phone, design…" className="max-w-md" />
        <FilterTabs
          options={[
            { id: "ALL", label: `All (${orders.length})` },
            { id: "PENDING", label: "In Crafting" },
            { id: "PICKED_UP", label: "Delivered" },
          ]}
          active={statusFilter}
          onChange={(s) => setStatusFilter(s as any)}
        />
      </SearchToolbar>

      {/* Financial Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border bg-surface border border-border text-xs">
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Total Orders</div>
          <div className="text-base font-bold font-mono text-foreground mt-0.5">{summary.totalCount}</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">In Crafting</div>
          <div className="text-base font-bold font-mono text-amber-600 mt-0.5">{summary.pendingCount} pcs</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Advance Collected</div>
          <div className="text-base font-bold font-mono text-success mt-0.5">{formatINR(summary.totalAdvance)}</div>
        </div>
        <div className="px-4 py-2.5 bg-surface-2/40">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Receivable Balance</div>
          <div className="text-base font-bold font-mono text-primary mt-0.5">{formatINR(summary.totalDue)}</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-16">Order #</th>
                <th className="py-2.5 px-3 min-w-[170px]">Customer</th>
                <th className="py-2.5 px-3 min-w-[180px]">Piece Design</th>
                <th className="py-2.5 px-3 w-28">Metal</th>
                <th className="py-2.5 px-3 w-24">Delivery</th>
                <th className="py-2.5 px-3 text-right w-28">Total</th>
                <th className="py-2.5 px-3 text-right w-24">Advance</th>
                <th className="py-2.5 px-3 text-right w-28">Due</th>
                <th className="py-2.5 px-3 text-center w-24">Status</th>
                <th className="py-2.5 px-3 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Loading orders…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8"><EmptyState icon={ClipboardList} title="No custom orders match" description="Create a new bespoke order." /></td></tr>
              ) : (
                filtered.map((order) => {
                  const balance = Math.max(0, order.totalAmount - order.advanceAmount);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? "bg-primary/5 font-medium" : "hover:bg-surface-2/60"}`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-primary">#{order.id}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-foreground text-xs">{order.customerName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="py-2 px-3 text-foreground font-medium truncate max-w-[200px]">{order.itemName}</td>
                      <td className="py-2 px-3"><MaterialBadge type={order.materialType} /></td>
                      <td className="py-2 px-3 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(order.pickupDate)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">{formatINR(order.totalAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground tabular-nums whitespace-nowrap">{formatINR(order.advanceAmount)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-primary tabular-nums whitespace-nowrap">{formatINR(balance)}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <StatusBadge variant={order.status === "PICKED_UP" ? "success" : "warning"} withDot>
                          {order.status === "PICKED_UP" ? "Delivered" : "In Crafting"}
                        </StatusBadge>
                      </td>
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelectedOrder(order)} leftIcon={<Eye className="w-3 h-3" />}>Inspect</Button>
                          {order.status === "PENDING" && (
                            <Button variant="secondary" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setConvertOrder(order)}>Deliver</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide-over Drawer */}
      <DetailDrawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.id}` : ""}
        subtitle={selectedOrder ? `${selectedOrder.customerName} · ${selectedOrder.itemName}` : undefined}
        badge={selectedOrder && <StatusBadge variant={selectedOrder.status === "PICKED_UP" ? "success" : "warning"} withDot>{selectedOrder.status === "PICKED_UP" ? "Delivered" : "In Crafting"}</StatusBadge>}
        actions={
          selectedOrder && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setTimeout(() => window.print(), 200)} leftIcon={<Printer className="w-3.5 h-3.5" />}>Print Voucher</Button>
              {selectedOrder.status === "PENDING" && (
                <Button variant="primary" size="sm" onClick={() => setConvertOrder(selectedOrder)} leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}>Deliver &amp; Bill</Button>
              )}
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-primary" /> Customer Contact
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
                <div><span className="text-muted-foreground block text-[11px]">Patron</span><span className="font-semibold text-foreground">{selectedOrder.customerName}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Mobile</span><span className="font-mono text-foreground">{selectedOrder.customerPhone}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground block text-[11px]">Address</span><span className="text-foreground">{selectedOrder.customerAddress || "—"}</span></div>
              </div>
            </div>

            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                <Gem className="w-3.5 h-3.5 text-amber-600" /> Piece Specification
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div><span className="text-muted-foreground block text-[11px]">Article Design</span><span className="font-bold text-foreground text-sm">{selectedOrder.itemName}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[11px]">Composition:</span>
                  <MaterialBadge type={selectedOrder.materialType} />
                  {selectedOrder.goldCarat && <span className="font-mono font-medium text-foreground">({selectedOrder.goldCarat})</span>}
                  {selectedOrder.diamondCarat && <span className="font-mono text-muted-foreground">· {selectedOrder.diamondCarat}</span>}
                </div>
                {selectedOrder.remarks && (
                  <div className="bg-surface-2 p-2.5 rounded border border-border">
                    <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold block mb-0.5">Artisan Notes</span>
                    <p className="text-foreground italic">{selectedOrder.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
                <IndianRupee className="w-3.5 h-3.5 text-primary" /> Financial Settlement
              </div>
              <div className="divide-y divide-border/60 text-xs font-mono pt-1">
                <div className="py-1.5 flex justify-between"><span className="text-muted-foreground font-sans">Agreed Order Total</span><span className="font-bold text-foreground tabular-nums">{formatINR(selectedOrder.totalAmount)}</span></div>
                <div className="py-1.5 flex justify-between text-success"><span className="font-sans">Advance Received</span><span className="font-bold tabular-nums">− {formatINR(selectedOrder.advanceAmount)}</span></div>
                <div className="py-1.5 flex justify-between font-bold text-primary"><span className="font-sans">Balance on Delivery</span><span className="text-sm font-extrabold tabular-nums">{formatINR(Math.max(0, selectedOrder.totalAmount - selectedOrder.advanceAmount))}</span></div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
              <span>Delete this custom order?</span>
              <Button
                variant="danger"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  if (confirm(`Delete Order #${selectedOrder.id}?`)) deleteMut.mutate(selectedOrder.id);
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>

      <div className="hidden print:block">
        {selectedOrder && <OrderSlip order={selectedOrder} />}
      </div>

      {convertOrder && (
        <ConvertToSaleModal
          order={convertOrder}
          open={!!convertOrder}
          onClose={() => setConvertOrder(null)}
          onConverted={(saleId) => {
            markPickedUp.mutate({ id: convertOrder.id, saleId });
            toast.success("Delivered & sale recorded!");
            setConvertOrder(null);
            if (selectedOrder?.id === convertOrder.id) {
              setSelectedOrder((prev) => (prev ? { ...prev, status: "PICKED_UP" } : null));
            }
          }}
        />
      )}
    </div>
  );
};

export const CustomOrderForm = () => {
  const [activeTab, setActiveTab] = useState<"new-order" | "orders-list">("new-order");

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-1 border-b border-border bg-surface px-1 pt-1">
        {[
          { id: "new-order", label: "New Bespoke Formulation", icon: Plus },
          { id: "orders-list", label: "Custom Orders Register", icon: ClipboardList },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-all border-b-2 select-none -mb-px cursor-pointer",
              activeTab === id ? "border-primary text-primary font-bold bg-surface-2/40" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "new-order" ? <NewOrderWorkstation onCreated={() => setActiveTab("orders-list")} /> : <OrdersListTab />}
    </div>
  );
};
