import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Product } from "@/lib/api/inventory";
import { fetchGoldRate } from "@/lib/api/dashboard";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (p: Product) => void;
  onUpdate?: (p: Product) => void;
  productToEdit?: Product | null;
};

const EMPTY: Omit<Product, "id"> = {
  name: "",
  sku: "",
  mainCategory: "",
  subCategory: "",
  material: "Gold",
  purity: "22K",
  baseWeight: 0,
  stockQuantity: 0,
  price: 0,
};

// Purity multipliers (fraction of 24K pure gold)
const PURITY_MULTIPLIER: Record<string, number> = {
  "24K": 1.0,
  "20K": 20 / 24,   // 0.8333 
  "22K": 22 / 24,   // 0.9167
  "18K": 18 / 24,   // 0.75
};

// Making charge as % of gold value (adjust to your shop's rate)
const MAKING_CHARGE_PERCENT = 0.12; // 12%

const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all";

export const AddProductModal = ({
  open,
  onClose,
  onCreate,
  onUpdate,
  productToEdit,
}: Props) => {
  const [form, setForm] = useState<Product | Omit<Product, "id">>(EMPTY);
  const [priceOverridden, setPriceOverridden] = useState(false);

  const { data: goldRate } = useQuery({
  queryKey: ["dashboard-gold-rate"],
  queryFn: fetchGoldRate,
  enabled: open,
  staleTime: 1000 * 60 * 5,
});

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setForm(productToEdit);
        setPriceOverridden(true); // editing existing — don't auto-calc
      } else {
        setForm(EMPTY);
        setPriceOverridden(false);
      }
    }
  }, [open, productToEdit]);

  // Auto-calculate price whenever weight, purity, or gold rate changes
  useEffect(() => {
  const weight = Number(form.baseWeight);
  
  console.log("calc check:", { priceOverridden, rate: goldRate?.rate, weight });
  
  if (priceOverridden || !goldRate?.rate || !weight) return;

  if (form.material?.toLowerCase() === "gold") {
    const perGram = goldRate.rate / 10;
    const purityFactor = PURITY_MULTIPLIER[form.purity] ?? (22 / 24);
    const goldValue = perGram * weight * purityFactor;
    const making = goldValue * 0.12;
    setForm((p) => ({ ...p, price: Math.round(goldValue + making) }));

  } else {
    const silverValue = (goldRate.silverRatePerGram ?? 95) * weight;
    const making = silverValue * 0.08;
    setForm((p) => ({ ...p, price: Math.round(silverValue + making) }));
  }

}, [form.baseWeight, form.purity, form.material, goldRate, priceOverridden]);

  if (!open) return null;

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (productToEdit) {
      onUpdate?.({ ...productToEdit, ...form } as Product);
    } else {
      onCreate(form as Product);
    }
    onClose();
  };

  // What the live rate works out to per gram for the selected purity
  const perGramForPurity = goldRate
    ? (goldRate.rate / 10) * (PURITY_MULTIPLIER[form.purity] ?? 1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-2xl bg-surface p-6"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              {productToEdit ? "Edit product" : "Add new product"}
            </h3>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              {goldRate ? (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Live gold rate: ₹{Math.round(goldRate.rate).toLocaleString("en-IN")}
                  /10g · {form.purity} @ ₹
                  {perGramForPurity
                    ? Math.round(perGramForPurity).toLocaleString("en-IN")
                    : "—"}
                  /g
                </span>
              ) : (
                "Add an item to your shop inventory."
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className={fieldLabel}>Product name</label>
              <input
                className={fieldInput}
                placeholder="e.g. Classic Solitaire Ring"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>SKU</label>
              <input
                className={fieldInput}
                placeholder="KK-R-001"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Category</label>
              <select
                className={fieldInput}
                value={form.mainCategory}
                onChange={(e) => update("mainCategory", e.target.value)}
              >
                <option value="rings">Rings</option>
                <option value="necklaces">Necklaces</option>
                <option value="earrings">Earrings</option>
                <option value="bangles">Bangles</option>
                <option value="bracelets">Bracelets</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Purity</label>
              <select
                className={fieldInput}
                value={form.purity}
                onChange={(e) => {
                  update("purity", e.target.value);
                  setPriceOverridden(false); // recalculate when purity changes
                }}
              >
                <option>18K</option>
                <option>20K</option>
                <option>22K</option>
                <option>24K</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Material</label>
              <input
                className={fieldInput}
                value={form.material}
                onChange={(e) => update("material", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Base weight (g)</label>
              <input
                type="number"
                step="0.01"
                className={fieldInput}
                value={form.baseWeight || ""}
                onChange={(e) => {
  const val = parseFloat(e.target.value) || 0;
  setPriceOverridden(false);   // ← must come first
  update("baseWeight", val);
}}
              />
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Stock quantity</label>
              <input
                type="number"
                className={fieldInput}
                value={form.stockQuantity || ""}
                onChange={(e) =>
                  update("stockQuantity", parseInt(e.target.value) || 0)
                }
              />
            </div>

            {/* Price — auto-calculated but overridable */}
            <div className="col-span-2 space-y-1.5">
  <div className="flex items-center justify-between">
    <label className={fieldLabel}>Price per piece (₹)</label>
    {!priceOverridden && goldRate?.rate && form.baseWeight > 0 && (
      <span className="text-[10.5px] text-amber-400 flex items-center gap-1">
        <Zap className="w-3 h-3" />
        Auto-calculated · gold value + {form.material?.toLowerCase() === "gold" ? "13" : "8"}% making
      </span>
    )}
    {priceOverridden && !productToEdit && (
      <button
        type="button"
        onClick={() => setPriceOverridden(false)}
        className="text-[10.5px] text-primary hover:underline"
      >
        Reset to auto
      </button>
    )}
  </div>
  <input
    type="number"
    className={cn(
      fieldInput,
      !priceOverridden && goldRate?.rate && form.baseWeight > 0
        ? "border-amber-500/30 ring-1 ring-amber-500/20"
        : ""
    )}
    value={form.price || ""}
    onChange={(e) => {
      update("price", parseFloat(e.target.value) || 0);
      setPriceOverridden(true);
    }}
  />

  {/* Breakdown */}
  {form.baseWeight > 0 && form.price > 0 && (
    <div className="rounded-lg bg-surface-2 px-3 py-2 space-y-1 text-[11.5px] text-muted-foreground">
      
      {/* Per piece breakdown */}
      {form.material?.toLowerCase() === "gold" && goldRate?.rate ? (
        <>
          <div className="flex justify-between">
            <span>
              Gold value ({form.baseWeight}g × ₹
              {Math.round(
                (goldRate.rate / 10) * (PURITY_MULTIPLIER[form.purity] ?? (22 / 24))
              ).toLocaleString("en-IN")}/g)
            </span>
            <span className="tabular-nums">
              ₹{Math.round(
                (goldRate.rate / 10) * Number(form.baseWeight) * (PURITY_MULTIPLIER[form.purity] ?? (22 / 24))
              ).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Making charge (12%)</span>
            <span className="tabular-nums">
              ₹{Math.round(
                (goldRate.rate / 10) * Number(form.baseWeight) *
                (PURITY_MULTIPLIER[form.purity] ?? (22 / 24)) * 0.12
              ).toLocaleString("en-IN")}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <span>Silver value ({form.baseWeight}g × ₹{goldRate?.silverRatePerGram ?? 95}/g)</span>
            <span className="tabular-nums">
              ₹{Math.round((goldRate?.silverRatePerGram ?? 95) * Number(form.baseWeight)).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Making charge (8%)</span>
            <span className="tabular-nums">
              ₹{Math.round((goldRate?.silverRatePerGram ?? 95) * Number(form.baseWeight) * 0.08).toLocaleString("en-IN")}
            </span>
          </div>
        </>
      )}

      <div className="flex justify-between border-t border-border pt-1 mt-1">
        <span className="font-medium text-foreground">Price per piece</span>
        <span className="tabular-nums font-medium text-foreground">
          ₹{form.price.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Stock total — the key addition */}
      {form.stockQuantity > 0 && (
        <div className="flex justify-between border-t border-border pt-1 mt-1">
          <span className="font-semibold text-foreground">
            Total value ({form.stockQuantity} × ₹{form.price.toLocaleString("en-IN")})
          </span>
          <span className="tabular-nums font-semibold text-amber-400 text-[13px]">
            ₹{(form.price * form.stockQuantity).toLocaleString("en-IN")}
          </span>
        </div>
      )}
    </div>
  )}
</div>
</div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold",
                "bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              )}
            >
              {productToEdit ? "Update product" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};