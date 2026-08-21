import { X, ImageIcon, Pencil } from "lucide-react";
import { formatINR, formatWeight, getStockStatus, cn } from "@/lib/utils";
import { type Product } from "@/lib/api/inventory";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";

type Props = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
};

const Chip = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-xl bg-surface-2 p-3 border border-border/60 min-w-0">
    <p className="text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground">
      {label}
    </p>
    <p className="text-[13.5px] font-semibold text-foreground mt-1 truncate">
      {value}
    </p>
  </div>
);

export const ProductDrawer = ({ product, onClose, onEdit }: Props) => {
  const open = !!product;

  const status = product ? getStockStatus(product.stockQuantity) : "in-stock";
  const statusMap: Record<
    string,
    { variant: "success" | "warning" | "danger"; label: string }
  > = {
    "in-stock": { variant: "success", label: "In Stock" },
    low: { variant: "warning", label: "Low Stock" },
    out: { variant: "danger", label: "Out of Stock" },
  };
  const currentBadge = statusMap[status] ?? {
    variant: "neutral",
    label: status,
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface border-l border-border/80 flex flex-col transition-transform duration-300 ease-out shadow-[var(--shadow-elevated)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {product && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                Product Details
              </h3>
              <button
                onClick={onClose}
                aria-label="Close product drawer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Product Hero Image / Placeholder */}
              <div className="aspect-[4/3] rounded-2xl bg-surface-2 border border-border/60 flex flex-col items-center justify-center text-muted-foreground/60 shadow-inner">
                <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs font-medium mt-2">No photo attached</span>
              </div>

              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  {product.sku}
                </p>
                <h2 className="text-lg font-bold tracking-tight text-foreground mt-0.5">
                  {product.name}
                </h2>
                <div className="mt-2.5 flex items-center gap-2">
                  <StatusBadge variant={currentBadge.variant} withDot>
                    {currentBadge.label}
                  </StatusBadge>
                  <StatusBadge
                    variant={
                      product.material.toLowerCase() === "gold"
                        ? "gold"
                        : "info"
                    }
                  >
                    {product.material} · {product.purity}
                  </StatusBadge>
                </div>
              </div>

              {/* Summary metadata chips */}
              <div className="grid grid-cols-3 gap-2.5">
                <Chip label="Purity" value={product.purity} />
                <Chip
                  label="Net Weight"
                  value={formatWeight(product.baseWeight)}
                />
                <Chip label="In Stock" value={`${product.stockQuantity} pcs`} />
              </div>
            </div>

            <div className="border-t border-border/50 px-6 py-4 flex items-center gap-3">
              <Button
                onClick={() => onEdit(product)}
                variant="secondary"
                size="md"
                className="flex-1"
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
              >
                Edit Product
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};