import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Plus, Save, Layers, Package } from "lucide-react";
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
  totalWeight: 0,
  stockQuantity: 1,
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
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);

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

  // Helper to auto-generate Name and SKU
  const generateSuggestedValues = (
    mat: string,
    catId: string,
    subCatId: string,
    pur: string
  ) => {
    const isSilv = mat.toLowerCase() === "silver";
    const catObj = (isSilv ? silverCategories : goldCategories).find(
      (c) => c.id === catId
    );
    const catLabel = catObj ? catObj.label : catId;

    let subLabel = "";
    if (subCatId && catObj) {
      const subObj = catObj.subcategories.find((s) => s.id === subCatId);
      subLabel = subObj ? subObj.label : subCatId;
    }

    const titleParts = [];
    if (!isSilv && pur && pur !== "NA") titleParts.push(pur);
    titleParts.push(mat);
    if (subLabel) titleParts.push(subLabel);
    else if (catLabel) titleParts.push(catLabel);

    const generatedName = titleParts.join(" ");

    // Generate clean SKU
    const matPrefix = isSilv ? "SLV" : "GLD";
    const catPrefix = catId.slice(0, 3).toUpperCase();
    const subPrefix = subCatId ? subCatId.split("-").pop()?.slice(0, 3).toUpperCase() : "GEN";
    const purSuffix = isSilv ? "925" : (pur.replace(/[^0-9K]/g, "") || "22K");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `${matPrefix}-${catPrefix}-${subPrefix}-${purSuffix}-${randomSuffix}`;

    return { generatedName, generatedSku };
  };

  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setForm(productToEdit);
        setIsNameManuallyEdited(true);
        setIsSkuManuallyEdited(true);
      } else {
        const isSilver = activeCategory.startsWith("silver");
        const categoryParts = activeCategory.split("-");

        const cleanMainCategory =
          categoryParts.length > 1 ? categoryParts[1] : (isSilver ? "rings" : "rings");
        const cleanSubCategory =
          categoryParts.length > 2
            ? `${categoryParts[1]}-${categoryParts[2]}`
            : "";

        const defaultMaterial = isSilver ? "Silver" : "Gold";
        const defaultPurity = isSilver ? "NA" : "22K";

        const { generatedName, generatedSku } = generateSuggestedValues(
          defaultMaterial,
          cleanMainCategory,
          cleanSubCategory,
          defaultPurity
        );

        setForm({
          ...EMPTY,
          name: generatedName,
          sku: generatedSku,
          material: defaultMaterial,
          purity: defaultPurity,
          mainCategory: cleanMainCategory,
          subCategory: cleanSubCategory,
          stockQuantity: 1,
          totalWeight: 0,
        });
        setIsNameManuallyEdited(false);
        setIsSkuManuallyEdited(false);
      }
    }
  }, [open, productToEdit, activeCategory]);

  if (!open) return null;

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((p) => {
      const updated = { ...p, [k]: v };

      // If user changed classification and hasn't manually overridden name/SKU, regenerate them
      if (
        !productToEdit &&
        (k === "material" || k === "mainCategory" || k === "subCategory" || k === "purity")
      ) {
        const { generatedName, generatedSku } = generateSuggestedValues(
          updated.material,
          updated.mainCategory,
          updated.subCategory,
          updated.purity
        );
        if (!isNameManuallyEdited) updated.name = generatedName;
        if (!isSkuManuallyEdited) updated.sku = generatedSku;
      }

      return updated;
    });
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

  const isBulk = (form.stockQuantity || 0) > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={productToEdit ? "Edit Inventory Bucket" : "Add Inventory Stock"}
      subtitle={
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            {isBulk ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
            {isBulk ? `Bulk Lot (${form.stockQuantity} pcs)` : "Single Piece (1 pc)"}
          </span>
          {goldRate && (
            <span className="flex items-center gap-1.5 text-warning font-medium text-xs">
              <Zap className="w-3.5 h-3.5" />
              Gold: ₹{Math.round(goldRate.rate).toLocaleString("en-IN")}/10g · Silver: ₹{Math.round(silverRate?.rate ?? 0).toLocaleString("en-IN")}/10g
            </span>
          )}
        </div>
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
            {productToEdit ? "Save Changes" : isBulk ? "Add Bulk Lot to Inventory" : "Add Piece to Inventory"}
          </Button>
        </>
      }
    >
      <form id="product-modal-form" onSubmit={submit} className="space-y-4">
        {/* Category & Metal Section */}
        <div className="bg-surface-2/40 border border-border/70 rounded-2xl p-4 space-y-3.5">
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Metal &amp; Category Classification
          </p>

          <div className="grid grid-cols-2 gap-3.5">
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
              <label className={fieldLabel}>Subcategory (Optional)</label>
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

            {form.material?.toLowerCase() === "gold" ? (
              <div className="space-y-1.5">
                <label className={fieldLabel}>Gold Purity</label>
                <select
                  className={selectClass}
                  value={form.purity}
                  onChange={(e) => update("purity", e.target.value)}
                >
                  <option value="18K">18K (75.0%)</option>
                  <option value="20K">20K (83.3%)</option>
                  <option value="22K">22K (91.6%)</option>
                  <option value="24K">24K (99.9%)</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className={fieldLabel}>Silver Grade</label>
                <select
                  className={selectClass}
                  value={form.purity}
                  onChange={(e) => update("purity", e.target.value)}
                >
                  <option value="925">925 Sterling Silver</option>
                  <option value="NA">Standard Silver</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Title & SKU (Auto-suggested, customizable) */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Item / Bucket Title"
              required
              placeholder="e.g. 22K Gold Gents Ring"
              value={form.name}
              onChange={(e) => {
                setIsNameManuallyEdited(true);
                update("name", e.target.value);
              }}
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <Input
              label="SKU Identifier"
              required
              placeholder="GLD-RNG-GNT-22K"
              value={form.sku}
              onChange={(e) => {
                setIsSkuManuallyEdited(true);
                update("sku", e.target.value);
              }}
            />
          </div>
        </div>

        {/* Lot Details: Quantity and Scale Weight */}
        <div className="bg-surface-2/40 border border-border/70 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Stock Lot &amp; Weight Details
            </p>
            <span className="text-[11px] text-muted-foreground">
              {isBulk ? "Bulk batch lot entry" : "Single item entry"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <Input
                label="Quantity (pcs)"
                type="number"
                min={1}
                required
                value={form.stockQuantity || ""}
                onChange={(e) =>
                  update("stockQuantity", parseInt(e.target.value, 10) || 1)
                }
                placeholder="1 for single, or e.g. 20 for bulk lot"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Enter 1 for single piece, or total pieces in bulk box.
              </p>
            </div>

            <div>
              <Input
                label="Total Scale Weight (g)"
                type="number"
                step="0.001"
                min={0.001}
                required
                value={form.totalWeight || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  update("totalWeight", val);
                  update("baseWeight", val);
                }}
                placeholder="0.000"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Total weighed weight for this piece/lot on scale.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};