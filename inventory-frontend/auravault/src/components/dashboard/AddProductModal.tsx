import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Product } from "@/lib/api/inventory";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (p: Product) => void;
  onUpdate?: (p: Product) => void; // Add this!
  productToEdit?: Product | null;  // Add this!
};

const EMPTY: Omit<Product, 'id'> = { // Use Omit to say "everything except ID"
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


const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-all";

export const AddProductModal = ({ open, onClose, onCreate,onUpdate,       // Add this
  productToEdit }: Props) => {
  const [form, setForm] = useState<Product | Omit<Product, 'id'>>(EMPTY);

  useEffect(() => {
  if (open) {
    if (productToEdit) {
      setForm(productToEdit); // Fill form with existing data
    } else {
      setForm(EMPTY); // Clear form for new item
    }
  }
}, [open, productToEdit]);

  if (!open) return null;

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (productToEdit) {
      // For updates, we spread the existing ID into the form
      const productWithId = { ...productToEdit, ...form } as Product;
      onUpdate?.(productWithId);
    } else {
      // For new items, we cast to Product
      // (This assumes your backend handles the ID assignment)
      onCreate(form as Product);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl rounded-2xl bg-surface p-6"
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Add new product</h3>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              Add an item to your shop inventory.
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
                onChange={(e) => update("purity", e.target.value)}
              >
                <option>18K</option>
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
                onChange={(e) => update("baseWeight", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-1.5">
              <label className={fieldLabel}>Stock quantity</label>
              <input
                type="number"
                className={fieldInput}
                value={form.stockQuantity || ""}
                onChange={(e) => update("stockQuantity", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className={fieldLabel}>Price (₹)</label>
              <input
                type="number"
                className={fieldInput}
                value={form.price || ""}
                onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
              />
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
              Add product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
