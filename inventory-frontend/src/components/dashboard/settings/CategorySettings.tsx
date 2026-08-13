import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCategories,
  type CategoryConfig,
  type Category,
  type SubCategory,
} from "@/lib/categories";
import { fetchProducts } from "@/lib/api/inventory";

/* ── Helpers ──────────────────────────────────────────────── */
function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sectionBtn =
  "px-4 py-2.5 text-sm font-medium rounded-lg transition-colors";

const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all";

export const CategorySettings = () => {
  const { gold, silver, setGold, setSilver } = useCategories();
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const categories = metal === "gold" ? gold : silver;
  const setCategories = metal === "gold" ? setGold : setSilver;

  // Fetch products to check for orphans on delete
  const { data: allProducts = [] } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => fetchProducts("all"),
  });

  // Which category is expanded in the editor
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Adding state
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubLabel, setNewSubLabel] = useState("");

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "subcategory";
    catId: string;
    subId?: string;
    label: string;
    productCount: number;
  } | null>(null);

  /* ── Product count helpers ──────────────────────────────── */
  const productCountForCategory = (catId: string) =>
    allProducts.filter(
      (p) =>
        p.material.toLowerCase() === metal &&
        p.mainCategory === catId
    ).length;

  const productCountForSubcategory = (subId: string) =>
    allProducts.filter(
      (p) =>
        p.material.toLowerCase() === metal &&
        p.subCategory === subId
    ).length;

  /* ── Mutations ──────────────────────────────────────────── */
  const addCategory = () => {
    const label = newCatLabel.trim();
    if (!label) return;
    const id = slug(label);
    if (categories.some((c) => c.id === id)) return; // duplicate guard
    setCategories([...categories, { id, label, subcategories: [] }]);
    setNewCatLabel("");
    setAddingCat(false);
  };

  const renameCategory = (catId: string, newLabel: string) => {
    setCategories(
      categories.map((c) => (c.id === catId ? { ...c, label: newLabel } : c))
    );
    setEditingId(null);
  };

  const removeCategory = (catId: string) => {
    setCategories(categories.filter((c) => c.id !== catId));
    setDeleteConfirm(null);
    if (expandedId === catId) setExpandedId(null);
  };

  const addSubcategory = (catId: string) => {
    const label = newSubLabel.trim();
    if (!label) return;
    const id = `${catId}-${slug(label)}`;
    setCategories(
      categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: [
                ...c.subcategories,
                { id, label },
              ],
            }
          : c
      )
    );
    setNewSubLabel("");
    setAddingSubFor(null);
  };

  const renameSubcategory = (
    catId: string,
    subId: string,
    newLabel: string
  ) => {
    setCategories(
      categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, label: newLabel } : s
              ),
            }
          : c
      )
    );
    setEditingId(null);
  };

  const removeSubcategory = (catId: string, subId: string) => {
    setCategories(
      categories.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
          : c
      )
    );
    setDeleteConfirm(null);
  };

  /* ── Try delete with product-count warning ─────────────── */
  const tryDeleteCategory = (cat: Category) => {
    const count = productCountForCategory(cat.id);
    if (count > 0) {
      setDeleteConfirm({
        type: "category",
        catId: cat.id,
        label: cat.label,
        productCount: count,
      });
    } else {
      removeCategory(cat.id);
    }
  };

  const tryDeleteSubcategory = (catId: string, sub: SubCategory) => {
    const count = productCountForSubcategory(sub.id);
    if (count > 0) {
      setDeleteConfirm({
        type: "subcategory",
        catId,
        subId: sub.id,
        label: sub.label,
        productCount: count,
      });
    } else {
      removeSubcategory(catId, sub.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Metal tabs ────────────────────────────────────── */}
      <div className="flex gap-2">
        <button
          onClick={() => setMetal("gold")}
          className={cn(
            sectionBtn,
            metal === "gold"
              ? "bg-amber-500/15 text-amber-500 shadow-[0_0_0_1px_oklch(0.82_0.13_86/0.2)]"
              : "text-muted-foreground hover:bg-surface-2"
          )}
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 mr-2" />
          Gold
        </button>
        <button
          onClick={() => setMetal("silver")}
          className={cn(
            sectionBtn,
            metal === "silver"
              ? "bg-slate-400/15 text-slate-300 shadow-[0_0_0_1px_oklch(0.7_0.01_250/0.2)]"
              : "text-muted-foreground hover:bg-surface-2"
          )}
        >
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 mr-2" />
          Silver
        </button>
      </div>

      {/* ── Category list ─────────────────────────────────── */}
      <div className="space-y-1">
        {categories.map((cat) => {
          const isExpanded = expandedId === cat.id;
          const isEditingCat = editingId === `cat-${cat.id}`;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-border/40 bg-surface overflow-hidden"
            >
              {/* Category row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isEditingCat ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      className={fieldInput}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameCategory(cat.id, editValue);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => renameCategory(cat.id, editValue)}
                      className="p-1.5 rounded-md text-success hover:bg-success/10"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{cat.label}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums mr-2">
                      {cat.subcategories.length} sub
                    </span>
                    <button
                      title="Rename"
                      onClick={() => {
                        setEditingId(`cat-${cat.id}`);
                        setEditValue(cat.label);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete category"
                      onClick={() => tryDeleteCategory(cat)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Subcategories */}
              {isExpanded && (
                <div className="px-4 pb-3 ml-6 space-y-1">
                  {cat.subcategories.map((sub) => {
                    const isEditingSub = editingId === `sub-${sub.id}`;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 py-1.5 text-[13px]"
                      >
                        {isEditingSub ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              className={fieldInput}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  renameSubcategory(cat.id, sub.id, editValue);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() =>
                                renameSubcategory(cat.id, sub.id, editValue)
                              }
                              className="p-1 rounded-md text-success hover:bg-success/10"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-md text-muted-foreground hover:bg-surface-2"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-muted-foreground">
                              {sub.label}
                            </span>
                            <button
                              title="Rename"
                              onClick={() => {
                                setEditingId(`sub-${sub.id}`);
                                setEditValue(sub.label);
                              }}
                              className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-surface-2 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              title="Delete subcategory"
                              onClick={() => tryDeleteSubcategory(cat.id, sub)}
                              className="p-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add subcategory */}
                  {addingSubFor === cat.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        autoFocus
                        placeholder="Subcategory name…"
                        className={fieldInput}
                        value={newSubLabel}
                        onChange={(e) => setNewSubLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addSubcategory(cat.id);
                          if (e.key === "Escape") setAddingSubFor(null);
                        }}
                      />
                      <button
                        onClick={() => addSubcategory(cat.id)}
                        className="p-1.5 rounded-md text-success hover:bg-success/10"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAddingSubFor(null)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingSubFor(cat.id);
                        setNewSubLabel("");
                      }}
                      className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mt-1 py-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add subcategory
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add category ──────────────────────────────────── */}
      {addingCat ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            placeholder="New category name…"
            className={fieldInput}
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
              if (e.key === "Escape") setAddingCat(false);
            }}
          />
          <button
            onClick={addCategory}
            className="p-2 rounded-lg text-success hover:bg-success/10 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAddingCat(false)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setAddingCat(true);
            setNewCatLabel("");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors w-full"
        >
          <Plus className="w-4 h-4" />
          Add {metal === "gold" ? "gold" : "silver"} category
        </button>
      )}

      {/* ── Delete confirmation modal ─────────────────────── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 space-y-4 animate-in zoom-in-95"
            style={{ boxShadow: "var(--shadow-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Delete "{deleteConfirm.label}"?</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {deleteConfirm.productCount} product{deleteConfirm.productCount > 1 ? "s" : ""}{" "}
                  currently use this {deleteConfirm.type}. They will remain in the database but
                  won't appear in the sidebar navigation.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm.type === "category"
                    ? removeCategory(deleteConfirm.catId)
                    : removeSubcategory(deleteConfirm.catId, deleteConfirm.subId!)
                }
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90"
              >
                Delete anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
