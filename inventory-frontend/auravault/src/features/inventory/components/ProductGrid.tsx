import { useState, useEffect } from "react"; // <-- Add useEffect here!
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  X,
  ImageIcon,
  IndianRupee,
  Plus,
  Search,
  SlidersHorizontal,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  formatCurrency,
  formatWeight,
  getStockStatus,
  cn,
} from "../../../lib/utils";
import {
  fetchProducts,
  createProduct,
  type Product,
} from "../api/inventory.api";
import { apiClient } from "../../../lib/api-client";
import { INVENTORY_CATEGORIES } from "../../../lib/constants";

type Props = {
  activeCategory: string;
};

const stockConfig = {
  "in-stock": {
    label: "In Stock",
    classes: "bg-green-950/50 border-green-900/50 text-green-400",
  },
  low: {
    label: "Low Stock",
    classes: "bg-amber-950/50 border-amber-900/50 text-amber-400",
  },
  out: {
    label: "Out of Stock",
    classes: "bg-red-950/50   border-red-900/50   text-red-400",
  },
} as const;

type ProductFormData = {
  name: string;
  sku: string;
  mainCategory: string;
  subCategory: string;
  material: string;
  purity: Product["purity"];
  baseWeight: number;
  stockQuantity: number;
  price: number;
};

const EMPTY_FORM: ProductFormData = {
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

const inputClass =
  "w-full bg-obsidian border border-gold-muted rounded-md py-2 px-3 text-sm text-slate-200 focus:border-gold focus:outline-none placeholder:text-slate-600 transition-colors";

export const ProductGrid = ({ activeCategory }: Props) => {
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<ProductFormData>(EMPTY_FORM);
  const [addForm, setAddForm] = useState<ProductFormData>(EMPTY_FORM);
// --- PASTE STARTING HERE ---
  const [live24kRatePerGram, setLive24kRatePerGram] = useState(0);

  // Fetch the live rate from the backend
  useEffect(() => {
    const fetchLiveRate = async () => {
      try {
        const response = await apiClient.get("/gold-rate/latest");
        const perGramRate = response.data.rates.INR / 10.0;
        setLive24kRatePerGram(perGramRate);
      } catch (error) {
        console.error("Failed to fetch live gold rate", error);
      }
    };
    fetchLiveRate();
  }, []);

  // The Math Engine that watches the Add Form
  useEffect(() => {
    if (!showAddModal || live24kRatePerGram === 0 || !addForm.baseWeight) return;

    let purityMultiplier = 1.0; 
    if (addForm.purity === "22K") {
      purityMultiplier = 22 / 24;
    } else if (addForm.purity === "18K") {
      purityMultiplier = 18 / 24;
    }
    const calculatedPrice = Math.round(live24kRatePerGram * purityMultiplier * addForm.baseWeight);

    // Update the form automatically!
    if (addForm.price !== calculatedPrice) {
      setAddForm((prev) => ({ ...prev, price: calculatedPrice }));
    }
  }, [addForm.purity, addForm.baseWeight, live24kRatePerGram, showAddModal]);
  // --- PASTE ENDING HERE ---
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: ["products", activeCategory],
    queryFn: () => {
      const parentCategory = INVENTORY_CATEGORIES.find(
        (c) =>
          c.id === activeCategory ||
          c.subcategories?.some((s) => s.id === activeCategory),
      );
      const mainCat = parentCategory?.id ?? activeCategory;
      const subCat = parentCategory?.subcategories?.some(
        (s) => s.id === activeCategory,
      )
        ? activeCategory
        : undefined;
      return fetchProducts(mainCat, subCat);
    },
  });
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const addMutation = useMutation({
    mutationFn: (data: Omit<Product, "id">) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeCategory] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<Product> }) =>
      apiClient
        .put(`/inventory/products/${data.id}`, data.payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeCategory] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowEditModal(false);
      setSelectedProductId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/inventory/products/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", activeCategory] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowDeleteConfirm(false);
      setSelectedProductId(null);
    },
  });

  const openEditModal = (product: Product) => {
    setEditForm({
      name: product.name,
      sku: product.sku,
      mainCategory: product.mainCategory ?? "",
      subCategory: product.subCategory ?? "",
      material: product.material ?? "Gold",
      purity: product.purity,
      baseWeight: product.baseWeight,
      stockQuantity: product.stockQuantity,
      price: product.price,
    });
    setShowEditModal(true);
  };

  const handleAddChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: ["baseWeight", "stockQuantity", "price"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: ["baseWeight", "stockQuantity", "price"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-obsidian">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian gap-3">
        <p className="text-red-400 font-medium">Failed to load inventory</p>
        <p className="text-slate-600 text-sm">
          Is the Spring Boot server running on :8080?
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-obsidian">
      <div className="h-full overflow-y-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif text-gold-light">Inventory</h1>
            <p className="text-slate-400 mt-1 text-sm">
              {filtered.length} items in selected category
            </p>
          </div>
          <button
            onClick={() => {
              const parentCategory = INVENTORY_CATEGORIES.find(
                (c) =>
                  c.id === activeCategory ||
                  c.subcategories?.some((s) => s.id === activeCategory),
              );
              const mainCat = parentCategory?.id ?? activeCategory;
              const subCat = parentCategory?.subcategories?.some(
                (s) => s.id === activeCategory,
              )
                ? activeCategory
                : "";
              setAddForm({
                ...EMPTY_FORM,
                mainCategory: mainCat,
                subCategory: subCat,
              });
              setShowAddModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Add New Item
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full bg-obsidian-light border border-gold-muted/40 rounded-md pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-gold-muted transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2.5 bg-obsidian-light border border-gold-muted/40 rounded-md text-slate-400 hover:text-gold hover:border-gold-muted text-sm transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ImageIcon className="w-12 h-12 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">No items found</p>
            <p className="text-slate-600 text-sm mt-1">
              Try a different name or SKU
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => {
              const status = getStockStatus(product.stockQuantity ?? 0);
              const config = stockConfig[status];
              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="glass-card cursor-pointer group hover:border-gold transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="h-44 bg-obsidian-light flex items-center justify-center border-b border-gold-muted group-hover:bg-obsidian transition-colors relative">
                    <ImageIcon className="w-10 h-10 text-slate-700 group-hover:text-gold-muted transition-colors" />
                    <div className="absolute top-3 right-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-md",
                          config.classes,
                        )}
                      >
                        {status === "low"
                          ? `Low (${product.stockQuantity})`
                          : config.label}
                      </span>
                    </div>
                    <span className="absolute bottom-3 left-3 text-xs font-mono text-slate-600">
                      {product.sku}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-slate-200 text-base group-hover:text-gold-light transition-colors leading-snug">
                        {product.name}
                      </h3>
                      <span className="text-xs font-mono bg-obsidian border border-gold-muted px-1.5 py-0.5 rounded text-gold ml-2 shrink-0">
                        {product.purity}
                      </span>
                    </div>
                    <div className="mt-auto pt-3 flex justify-between items-center border-t border-gold-muted/30">
                      <span className="text-xs text-slate-500 font-mono">
                        {formatWeight(product.baseWeight)}
                      </span>
                      <span className="text-gold text-sm font-medium">
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={cn(
          "fixed inset-y-0 right-0 w-[420px] glass-card border-r-0 border-y-0 border-l border-gold-muted z-50 transform transition-transform duration-300 ease-out flex flex-col",
          selectedProductId ? "translate-x-0" : "translate-x-full",
        )}
      >
        {selectedProduct &&
          (() => {
            const status = getStockStatus(selectedProduct.stockQuantity ?? 0);
            const config = stockConfig[status];
            return (
              <>
                <div className="p-6 border-b border-gold-muted flex justify-between items-start bg-obsidian/90">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-obsidian border border-gold-muted px-1.5 py-0.5 rounded text-gold">
                        {selectedProduct.purity}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full border",
                          config.classes,
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <h2 className="text-xl font-serif text-gold-light leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-slate-500 font-mono text-xs mt-1">
                      {selectedProduct.sku}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProductId(null)}
                    className="p-2 hover:bg-obsidian rounded-full text-slate-500 hover:text-gold transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Purity", value: selectedProduct.purity },
                      {
                        label: "Base Weight",
                        value: formatWeight(selectedProduct.baseWeight),
                      },
                      {
                        label: "Total Stock",
                        value: `${selectedProduct.stockQuantity ?? 0} units`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-obsidian-light p-3 rounded-lg border border-gold-muted/40 text-center"
                      >
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className="text-sm text-gold font-mono">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gold-light mb-3 uppercase tracking-widest">
                      Weight Variants
                    </h3>
                    <div className="rounded-lg border border-gold-muted/30 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gold-muted/30 bg-obsidian-light/50">
                            <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">
                              Weight
                            </th>
                            <th className="text-center px-4 py-2.5 text-xs text-slate-500 font-medium">
                              Stock
                            </th>
                            <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.variants &&
                          selectedProduct.variants.length > 0 ? (
                            selectedProduct.variants.map((v, i) => {
                              const vStatus = getStockStatus(v.stock);
                              const vConfig = stockConfig[vStatus];
                              return (
                                <tr
                                  key={v.id}
                                  className={cn(
                                    "border-b border-gold-muted/20 transition-colors hover:bg-obsidian-light/30",
                                    i ===
                                      selectedProduct.variants!.length - 1 &&
                                      "border-b-0",
                                  )}
                                >
                                  <td className="px-4 py-3 font-mono text-slate-300">
                                    {formatWeight(v.weight)}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span
                                      className={cn(
                                        "px-2 py-0.5 text-xs rounded-full border",
                                        vConfig.classes,
                                      )}
                                    >
                                      {v.stock === 0 ? "—" : v.stock}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-gold text-xs">
                                    {formatCurrency(v.price)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-6 text-center text-slate-600 text-xs"
                              >
                                No weight variants defined
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-obsidian-light/40 rounded-lg border border-gold-muted/20 p-4">
                    <p className="text-xs text-slate-500 mb-1">
                      Total Inventory Value
                    </p>
                    <p className="text-2xl font-serif text-gold">
                      {formatCurrency(
                        selectedProduct.price *
                          (selectedProduct.stockQuantity ?? 0),
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-gold-muted bg-obsidian/90 grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      openEditModal(selectedProduct);
                    }}
                    className="py-2.5 border border-gold-muted text-slate-300 hover:text-gold hover:border-gold rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="py-2.5 border border-red-900/50 text-red-400 hover:bg-red-950/30 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button className="py-2.5 bg-gold-gradient text-obsidian rounded-md font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                    <IndianRupee className="w-4 h-4" />
                    Loan
                  </button>
                </div>
              </>
            );
          })()}
      </div>

      {selectedProductId && (
        <div
          className="absolute inset-0 bg-obsidian/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setSelectedProductId(null)}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg border border-gold-muted rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gold-muted flex justify-between items-center bg-obsidian/90">
              <h2 className="text-xl font-serif text-gold-light">
                Add New Product
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-obsidian rounded-full text-slate-500 hover:text-gold transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-slate-400">Product Name</label>
                  <input
                    name="name"
                    value={addForm.name}
                    onChange={handleAddChange}
                    placeholder="e.g. Royal Gold Band"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">SKU</label>
                  <input
                    name="sku"
                    value={addForm.sku}
                    onChange={handleAddChange}
                    placeholder="e.g. RNG-001"
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Purity</label>
                  <select
                    name="purity"
                    value={addForm.purity}
                    onChange={handleAddChange}
                    className={inputClass}
                  >
                    <option value="24K">24K</option>
                    <option value="22K">22K</option>
                    <option value="18K">18K</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Main Category
                  </label>
                  <input
                    name="mainCategory"
                    value={addForm.mainCategory}
                    readOnly
                    className={cn(inputClass, "opacity-50 cursor-not-allowed")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Sub Category</label>
                  <input
                    name="subCategory"
                    value={addForm.subCategory}
                    readOnly
                    className={cn(inputClass, "opacity-50 cursor-not-allowed")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Base Weight (g)
                  </label>
                  <input
                    name="baseWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={addForm.baseWeight || ""}
                    onChange={handleAddChange}
                    placeholder="0.00"
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Stock Quantity
                  </label>
                  <input
                    name="stockQuantity"
                    type="number"
                    min="0"
                    value={addForm.stockQuantity || ""}
                    onChange={handleAddChange}
                    placeholder="0"
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-slate-400">price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={addForm.price || ""}
                    onChange={handleAddChange}
                    placeholder="0"
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>

              {addMutation.isError && (
                <p className="text-red-400 text-xs">
                  Failed to save. Is Spring Boot running?
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gold-muted text-slate-400 hover:text-gold rounded-md transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    addMutation.mutate(
                      addForm as unknown as Omit<Product, "id">,
                    )
                  }
                  disabled={
                    addMutation.isPending || !addForm.name || !addForm.sku
                  }
                  className="flex-1 py-2.5 bg-gold-gradient text-obsidian font-semibold rounded-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg border border-gold-muted rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gold-muted flex justify-between items-center bg-obsidian/90">
              <h2 className="text-xl font-serif text-gold-light">
                Edit Product
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-obsidian rounded-full text-slate-500 hover:text-gold transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-slate-400">Product Name</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">SKU</label>
                  <input
                    name="sku"
                    value={editForm.sku}
                    onChange={handleEditChange}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Purity</label>
                  <select
                    name="purity"
                    value={editForm.purity}
                    onChange={handleEditChange}
                    className={inputClass}
                  >
                    <option value="24K">24K</option>
                    <option value="22K">22K</option>
                    <option value="22KT">22KT</option>
                    <option value="18K">18K</option>
                    <option value="14K">14K</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Base Weight (g)
                  </label>
                  <input
                    name="baseWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={editForm.baseWeight || ""}
                    onChange={handleEditChange}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Stock Quantity
                  </label>
                  <input
                    name="stockQuantity"
                    type="number"
                    min="0"
                    value={editForm.stockQuantity || ""}
                    onChange={handleEditChange}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-slate-400">price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={editForm.price || ""}
                    onChange={handleEditChange}
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              </div>

              {editMutation.isError && (
                <p className="text-red-400 text-xs">
                  Failed to update. Is Spring Boot running?
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 border border-gold-muted text-slate-400 hover:text-gold rounded-md transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    editMutation.mutate({
                      id: selectedProduct.id,
                      payload: editForm,
                    })
                  }
                  disabled={editMutation.isPending}
                  className="flex-1 py-2.5 bg-gold-gradient text-obsidian font-semibold rounded-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm border border-red-900/50 rounded-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-serif text-red-400 mb-2">
                Delete Product
              </h2>
              <p className="text-slate-400 text-sm">
                Are you sure you want to delete{" "}
                <span className="text-slate-200 font-medium">
                  {selectedProduct.name}
                </span>
                ? This cannot be undone.
              </p>

              {deleteMutation.isError && (
                <p className="text-red-400 text-xs mt-3">
                  Failed to delete. Is Spring Boot running?
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 border border-gold-muted text-slate-400 hover:text-gold rounded-md transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(selectedProduct.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 bg-red-900/50 border border-red-900 text-red-400 hover:bg-red-900/80 rounded-md transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
