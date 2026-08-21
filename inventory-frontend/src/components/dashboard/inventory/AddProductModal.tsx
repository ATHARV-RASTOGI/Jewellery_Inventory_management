import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Plus, Save } from "lucide-react";
import { type Product } from "@/lib/api/inventory";
import { fetchGoldRate, fetchSilverRate } from "@/lib/api/dashboard";
import { useCategories } from "@/lib/categories";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fieldLabel, selectClass } from "@/lib/styles";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (p: Product) => void;
  onUpdate?: (p: Product) => void;
  productToEdit?: Product | null;
  activeCategory: string;
};

const EMPTY: Omit<Product, "id"> = {
  name: "",
  sku: "",
  mainCategory: "rings",
  subCategory: "",
  material: "Gold",
  purity: "22K",
  baseWeight: 0,
  stockQuantity: 0,
};

export const AddProductModal = ({
  open,
  onClose,
  onCreate,
  onUpdate,
  productToEdit,
  activeCategory,
}: Props) => {
  const [form, setForm] = useState<Product | Omit<Product, "id">>(EMPTY);
  const { gold: goldCategories, silver: silverCategories } = useCategories();

  const currentCategories =
    form.material?.toLowerCase() === "silver"
      ? silverCategories
      : goldCategories;
  const currentMainCat = currentCategories.find(
    (c) => c.id === form.mainCategory
  );
  const currentSubcategories = currentMainCat?.subcategories ?? [];

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

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setForm(productToEdit);
      } else {
        const isSilver = activeCategory.startsWith("silver");
        const categoryParts = activeCategory.split("-");

        const cleanMainCategory =
          categoryParts.length > 1 ? categoryParts[1] : activeCategory;
        const cleanSubCategory =
          categoryParts.length > 2
            ? `${categoryParts[1]}-${categoryParts[2]}`
            : "";

        setForm({
          ...EMPTY,
          material: isSilver ? "Silver" : "Gold",
          purity: isSilver ? "NA" : "22K",
          mainCategory: cleanMainCategory,
          subCategory: cleanSubCategory,
        });
      }
    }
  }, [open, productToEdit, activeCategory]);

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={productToEdit ? "Edit Jewelry Item" : "Add New Jewelry Item"}
      subtitle={
        goldRate ? (
          <span className="flex items-center gap-1.5 text-warning font-medium">
            <Zap className="w-3.5 h-3.5" />
            Live Gold: ₹{Math.round(goldRate.rate).toLocaleString("en-IN")}/10g
            · Silver: ₹{Math.round(silverRate?.rate ?? 0).toLocaleString("en-IN")}/10g
          </span>
        ) : (
          "Record piece details into store inventory."
        )
      }
      maxWidth="xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-modal-form"
            variant="primary"
            size="sm"
            leftIcon={
              productToEdit ? (
                <Save className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )
            }
          >
            {productToEdit ? "Save Changes" : "Create Item"}
          </Button>
        </>
      }
    >
      <form id="product-modal-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Product Title"
              required
              placeholder="e.g. 22K Traditional Kundan Bangle"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <Input
            label="SKU / Barcode ID"
            required
            placeholder="KK-R-001"
            value={form.sku}
            onChange={(e) => update("sku", e.target.value)}
          />

          <div className="space-y-1.5">
            <label className={fieldLabel}>Material</label>
            <select
              className={selectClass}
              value={form.material}
              onChange={(e) => {
                const selectedMaterial = e.target.value;
                update("material", selectedMaterial);
                if (selectedMaterial.toLowerCase() === "silver") {
                  update("purity", "NA");
                } else {
                  update("purity", "22K");
                }
              }}
            >
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={fieldLabel}>Primary Category</label>
            <select
              className={selectClass}
              value={form.mainCategory}
              onChange={(e) => {
                update("mainCategory", e.target.value);
                update("subCategory", "");
              }}
            >
              {currentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={fieldLabel}>Subcategory</label>
            <select
              className={selectClass}
              value={form.subCategory || ""}
              onChange={(e) => update("subCategory", e.target.value)}
            >
              <option value="">None / General</option>
              {currentSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          {form.material?.toLowerCase() === "gold" && (
            <div className="space-y-1.5">
              <label className={fieldLabel}>Gold Purity</label>
              <select
                className={selectClass}
                value={form.purity}
                onChange={(e) => {
                  update("purity", e.target.value);
                }}
              >
                <option value="18K">18K (75.0%)</option>
                <option value="20K">20K (83.3%)</option>
                <option value="22K">22K (91.6%)</option>
                <option value="24K">24K (99.9%)</option>
              </select>
            </div>
          )}

          <Input
            label="Base Weight (g)"
            type="number"
            step="0.01"
            required
            value={form.baseWeight || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              update("baseWeight", val);
            }}
            placeholder="0.00"
          />

          <Input
            label="Stock Quantity (pcs)"
            type="number"
            min={0}
            required
            value={form.stockQuantity || ""}
            onChange={(e) =>
              update("stockQuantity", parseInt(e.target.value, 10) || 0)
            }
            placeholder="0"
          />
        </div>
      </form>
    </Modal>
  );
};