import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, Building2, Receipt, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { fetchProducts, Product } from "@/lib/api/inventory";
import { createPurchase, type Purchase, type CreatePurchaseInput } from "@/lib/api/purchases";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

type PurchaseDraftItem = {
  product: Product;
  sku: string;
  quantity: number;
  weight: number;
  costPerGram: number;
  lineTotal: number;
  manualTotal: boolean;
};

interface NewPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (purchase: Purchase) => void;
}

export const NewPurchaseModal = ({
  open,
  onClose,
  onCreated,
}: NewPurchaseModalProps) => {
  const qc = useQueryClient();

  const [supplier, setSupplier] = useState({
    supplierName: "",
    supplierInvoiceNo: "",
    supplierPhone: "",
    supplierGstin: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const [items, setItems] = useState<PurchaseDraftItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [isSkuFocused, setIsSkuFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const skuContainerRef = useRef<HTMLDivElement>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    enabled: open,
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
          p.material?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, skuInput]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [skuInput]);

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

  const handleSelectProduct = (product: Product) => {
    // Check if already in items list
    const existingIndex = items.findIndex((i) => i.sku === product.sku);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
      toast.info(`Increased quantity for SKU: ${product.sku}`);
    } else {
      const defaultWeight = product.totalWeight ?? product.baseWeight ?? 0;
      setItems((prev) => [
        ...prev,
        {
          product,
          sku: product.sku,
          quantity: 1,
          weight: defaultWeight,
          costPerGram: 0,
          lineTotal: 0,
          manualTotal: false,
        },
      ]);
    }

    setSkuInput("");
    setIsSkuFocused(false);
    setSelectedIndex(-1);
  };

  const handleUpdateItem = (
    index: number,
    field: "quantity" | "weight" | "costPerGram" | "lineTotal",
    val: number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: val };

        if (field === "lineTotal") {
          updated.manualTotal = true;
          updated.lineTotal = Math.max(0, val);
        } else if (!updated.manualTotal) {
          const w = field === "weight" ? val : updated.weight;
          const c = field === "costPerGram" ? val : updated.costPerGram;
          const q = field === "quantity" ? val : updated.quantity;

          if (w > 0 && c > 0) {
            updated.lineTotal = Math.round(w * c * 100) / 100;
          } else if (c > 0) {
            updated.lineTotal = Math.round(q * c * 100) / 100;
          } else {
            updated.lineTotal = 0;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalQuantity = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const totalWeight = items.reduce((acc, it) => acc + (it.weight || 0), 0);

  const mutation = useMutation({
    mutationFn: (input: CreatePurchaseInput) => createPurchase(input),
    onSuccess: (saved) => {
      toast.success(
        `Purchase entry ${saved.supplierInvoiceNo} recorded & stock updated!`
      );
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_metrics"] });
      if (onCreated) onCreated(saved);
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to record purchase");
    },
  });

  const resetForm = () => {
    setSupplier({
      supplierName: "",
      supplierInvoiceNo: "",
      supplierPhone: "",
      supplierGstin: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
    setItems([]);
    setSkuInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.supplierName.trim()) {
      toast.error("Please enter the supplier name");
      return;
    }
    if (!supplier.supplierInvoiceNo.trim()) {
      toast.error("Please enter the supplier invoice number");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one product to the purchase");
      return;
    }

    // Validate line items
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Quantity must be > 0 for item ${item.sku}`);
        return;
      }
    }

    const payload: CreatePurchaseInput = {
      supplierName: supplier.supplierName.trim(),
      supplierInvoiceNo: supplier.supplierInvoiceNo.trim(),
      supplierPhone: supplier.supplierPhone.trim() || undefined,
      supplierGstin: supplier.supplierGstin.trim() || undefined,
      purchaseDate: supplier.purchaseDate || undefined,
      items: items.map((it) => ({
        sku: it.sku,
        quantity: it.quantity,
        weight: it.weight,
        costPerGram: it.costPerGram,
        lineTotal: it.lineTotal,
      })),
    };

    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Supplier Purchase"
      subtitle="Enter wholesale invoice details. Stock will be auto-incremented into inventory."
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Total Items: <strong className="text-foreground">{totalQuantity}</strong>
            </span>
            <span>
              Total Weight:{" "}
              <strong className="text-foreground">{totalWeight.toFixed(3)} g</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Recording..." : "Save & Stock-In"}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Details */}
        <div className="rounded-xl border border-border/70 bg-surface-2/30 p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Supplier & Invoice Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Supplier Name"
              placeholder="e.g. Mangalam Bullion"
              value={supplier.supplierName}
              onChange={(e) =>
                setSupplier((s) => ({ ...s, supplierName: e.target.value }))
              }
              required
            />
            <Input
              label="Supplier Invoice #"
              placeholder="e.g. MB/2026/892"
              value={supplier.supplierInvoiceNo}
              onChange={(e) =>
                setSupplier((s) => ({ ...s, supplierInvoiceNo: e.target.value }))
              }
              required
            />
            <Input
              label="Supplier Contact"
              placeholder="10-digit mobile"
              value={supplier.supplierPhone}
              onChange={(e) =>
                setSupplier((s) => ({
                  ...s,
                  supplierPhone: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
            />
            <Input
              label="Supplier GSTIN"
              placeholder="15-digit GSTIN (optional)"
              value={supplier.supplierGstin}
              onChange={(e) =>
                setSupplier((s) => ({
                  ...s,
                  supplierGstin: e.target.value.toUpperCase().slice(0, 15),
                }))
              }
            />
          </div>

          <div className="pt-1 max-w-xs">
            <Input
              label="Purchase Date"
              type="date"
              value={supplier.purchaseDate}
              onChange={(e) =>
                setSupplier((s) => ({ ...s, purchaseDate: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Product Search & Autocomplete */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary" />
              <span>Select Products to Stock-In</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {items.length} product{items.length === 1 ? "" : "s"} added
            </span>
          </div>

          <div ref={skuContainerRef} className="relative">
            <Input
              placeholder="Search by SKU, product name, or category to add items..."
              value={skuInput}
              onChange={(e) => {
                setSkuInput(e.target.value);
                setIsSkuFocused(true);
              }}
              onFocus={() => setIsSkuFocused(true)}
              leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            />

            {isSkuFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-150">
                {suggestions.map((p, idx) => (
                  <div
                    key={p.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectProduct(p);
                    }}
                    className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      idx === selectedIndex
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
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-warning/15 text-warning">
                        {p.material} {p.purity}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {p.stockQuantity} currently in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Table */}
        {items.length > 0 ? (
          <div className="border border-border/80 rounded-xl overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/70 border-b border-border/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Product & SKU</th>
                    <th className="px-3 py-2.5 w-24 text-center">Add Qty</th>
                    <th className="px-3 py-2.5 w-28 text-center">Weight (g)</th>
                    <th className="px-3 py-2.5 w-32 text-right">Cost / g (₹)</th>
                    <th className="px-3 py-2.5 w-36 text-right">Line Total (₹)</th>
                    <th className="px-3 py-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {items.map((item, idx) => (
                    <tr key={item.sku} className="hover:bg-surface-2/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border/60 text-[11px] font-mono font-bold">
                            {item.sku}
                          </span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {item.product.name}
                          </span>
                          <span className="px-1 py-0.2 rounded text-[10px] bg-warning/10 text-warning font-semibold">
                            {item.product.material} {item.product.purity}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 text-center py-1 px-1.5 bg-surface-2 border border-border/60 rounded text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.weight}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              "weight",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 text-center py-1 px-1.5 bg-surface-2 border border-border/60 rounded text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.costPerGram || ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              "costPerGram",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 text-right py-1 px-1.5 bg-surface-2 border border-border/60 rounded text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.lineTotal || ""}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              "lineTotal",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28 text-right py-1 px-1.5 bg-surface-2 border border-border/60 rounded text-xs font-mono font-semibold text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 h-7 w-7 text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed border-border/70 rounded-2xl bg-surface-2/20 space-y-1">
            <Receipt className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="font-semibold text-foreground">No purchase items added yet</p>
            <p className="text-xs text-muted-foreground">
              Search an SKU or product above to add items to this wholesale invoice.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
};
