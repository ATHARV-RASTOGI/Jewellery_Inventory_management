import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Layers,
} from "lucide-react";
import {
  useCategories,
  type Category,
  type SubCategory,
} from "@/lib/categories";
import { fetchProducts } from "@/lib/api/inventory";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FilterTabs } from "@/components/ui/SearchToolbar";

function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CategorySettings = () => {
  const { gold, silver, setGold, setSilver } = useCategories();
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const categories = metal === "gold" ? gold : silver;
  const setCategories = metal === "gold" ? setGold : setSilver;

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => fetchProducts("all"),
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubLabel, setNewSubLabel] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "subcategory";
    catId: string;
    subId?: string;
    label: string;
    productCount: number;
  } | null>(null);

  const productCountForCategory = (catId: string) =>
    allProducts.filter(
      (p) => p.material.toLowerCase() === metal && p.mainCategory === catId
    ).length;

  const productCountForSubcategory = (subId: string) =>
    allProducts.filter(
      (p) => p.material.toLowerCase() === metal && p.subCategory === subId
    ).length;

  const addCategory = () => {
    const label = newCatLabel.trim();
    if (!label) return;
    const id = slug(label);
    if (categories.some((c) => c.id === id)) return;
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
          ? { ...c, subcategories: [...c.subcategories, { id, label }] }
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
          ? {
              ...c,
              subcategories: c.subcategories.filter((s) => s.id !== subId),
            }
          : c
      )
    );
    setDeleteConfirm(null);
  };

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
    <div className="space-y-4">
      <FilterTabs
        options={[
          { id: "gold", label: `Gold Categories (${gold.length})` },
          { id: "silver", label: `Silver Categories (${silver.length})` },
        ]}
        active={metal}
        onChange={(m) => {
          setMetal(m as any);
          setExpandedId(null);
        }}
      />

      {/* Category Tree Items */}
      <div className="rounded-xl border border-border/80 bg-surface divide-y divide-border/50 overflow-hidden shadow-xs">
        {categories.map((cat) => {
          const isExpanded = expandedId === cat.id;
          const isEditing = editingId === cat.id;
          const prodCount = productCountForCategory(cat.id);

          return (
            <div key={cat.id} className="p-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                <Layers className="w-4 h-4 text-primary shrink-0" />

                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      className="bg-surface-2 border border-border rounded-lg py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameCategory(cat.id, editValue);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => renameCategory(cat.id, editValue)}
                      className="h-7 px-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="h-7 px-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-foreground">
                      {cat.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      ({cat.id})
                    </span>
                    {prodCount > 0 && (
                      <StatusBadge variant="neutral">
                        {prodCount} item{prodCount > 1 ? "s" : ""}
                      </StatusBadge>
                    )}
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Rename category"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditValue(cat.label);
                      }}
                      className="h-7 w-7"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete category"
                      onClick={() => tryDeleteCategory(cat)}
                      className="h-7 w-7 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Subcategories list */}
              {isExpanded && (
                <div className="ml-8 mt-3 pl-4 border-l border-border/60 space-y-2 animate-in fade-in duration-150">
                  {cat.subcategories.map((sub) => {
                    const isSubEditing = editingId === sub.id;
                    const subProdCount = productCountForSubcategory(sub.id);

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-2 text-xs py-1"
                      >
                        {isSubEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              className="bg-surface-2 border border-border rounded py-1 px-2 text-xs text-foreground focus:ring-1 focus:ring-ring"
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
                              className="p-1 rounded text-success"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded text-muted-foreground"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-muted-foreground font-medium flex-1">
                              {sub.label}
                            </span>
                            {subProdCount > 0 && (
                              <span className="text-[10px] font-mono text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded">
                                {subProdCount}
                              </span>
                            )}
                            <button
                              title="Edit subcategory"
                              onClick={() => {
                                setEditingId(sub.id);
                                setEditValue(sub.label);
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              title="Delete subcategory"
                              onClick={() => tryDeleteSubcategory(cat.id, sub)}
                              className="p-1 rounded text-muted-foreground hover:text-danger"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Subcategory row */}
                  {addingSubFor === cat.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        autoFocus
                        placeholder="Subcategory name…"
                        className="bg-surface-2 border border-border/80 rounded-lg py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        value={newSubLabel}
                        onChange={(e) => setNewSubLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addSubcategory(cat.id);
                          if (e.key === "Escape") setAddingSubFor(null);
                        }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => addSubcategory(cat.id)}
                        className="h-7 px-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAddingSubFor(null)}
                        className="h-7 px-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingSubFor(cat.id);
                        setNewSubLabel("");
                      }}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline mt-2 pt-1"
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

      {/* Add Category Trigger */}
      {addingCat ? (
        <div className="flex items-center gap-2 p-3 bg-surface border border-border/80 rounded-xl">
          <input
            autoFocus
            placeholder="New category name (e.g. Bangles, Anklets)…"
            className="flex-1 bg-surface-2 border border-border rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory();
              if (e.key === "Escape") setAddingCat(false);
            }}
          />
          <Button variant="primary" size="sm" onClick={addCategory}>
            <Check className="w-4 h-4 mr-1" /> Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingCat(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setAddingCat(true);
            setNewCatLabel("");
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full border-dashed"
        >
          Add {metal === "gold" ? "Gold" : "Silver"} Category
        </Button>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() =>
            deleteConfirm.type === "category"
              ? removeCategory(deleteConfirm.catId)
              : removeSubcategory(deleteConfirm.catId, deleteConfirm.subId!)
          }
          title={`Delete "${deleteConfirm.label}"?`}
          description={
            <>
              {deleteConfirm.productCount} product
              {deleteConfirm.productCount > 1 ? "s" : ""} currently use this{" "}
              {deleteConfirm.type}. They will remain in database records but will
              no longer appear in sidebar filters.
            </>
          }
          confirmText="Delete Category"
          isDestructive={true}
        />
      )}
    </div>
  );
};
