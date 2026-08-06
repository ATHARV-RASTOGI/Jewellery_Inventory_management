import { X, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { formatINR, formatWeight, getStockStatus, cn } from "@/lib/utils";
import { type Product } from "@/lib/api/inventory";

type Props = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
};

const stockClass = {
  "in-stock": "bg-success/10 text-success",
  low: "bg-warning/10 text-warning",
  out: "bg-danger/10 text-danger",
} as const;

const stockLabel = {
  "in-stock": "In stock",
  low: "Low stock",
  out: "Out of stock",
} as const;

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-surface-2 px-3 py-2.5 min-w-0">
    <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
      {label}
    </p>
    <p className="text-[13.5px] font-medium text-foreground mt-1 truncate">
      {value}
    </p>
  </div>
);

export const ProductDrawer = ({ product, onClose ,onEdit}: Props) => {
  const open = !!product;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface flex flex-col transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ boxShadow: "var(--shadow-elevated)" }}
      >
        {product && (
          <>
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-[15px] font-semibold tracking-tight">
                Product details
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* Hero */}
              <div className="aspect-[4/3] rounded-xl bg-surface-2 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  {product.sku}
                </p>
                <h2 className="text-xl font-semibold tracking-tight mt-1">
                  {product.name}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full",
                      stockClass[getStockStatus(product.stockQuantity)]
                    )}
                  >
                    {stockLabel[getStockStatus(product.stockQuantity)]}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {product.mainCategory}
                  </span>
                </div>
              </div>

              {/* Summary chips */}
              <div className="grid grid-cols-3 gap-2">
                <Chip label="Purity" value={product.purity} />
                <Chip label="Base weight" value={formatWeight(product.baseWeight)} />
                <Chip label="Total stock" value={String(product.stockQuantity)} />
              </div>

              <div className="rounded-xl bg-surface-2/60 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-muted-foreground">Base price</span>
                  <span className="text-lg font-semibold tracking-tight">
                    {formatINR(product.price)}
                  </span>
                </div>
                
              </div>
              <div className="rounded-xl bg-surface-2/60 p-4">
               <div className="flex items-baseline justify-between">
                  <span className="text-[12px] text-muted-foreground">Total Inventory Price</span>
                  <span className="text-lg font-semibold tracking-tight">
                    {formatINR(product.price * product.stockQuantity)}
                  </span>
                </div>
              </div>
            </div>

            

            <div className="border-t border-border-subtle px-6 py-4 flex items-center gap-2">
              <button 
                onClick={() => onEdit(product)} 
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 text-sm font-medium hover:bg-surface-3 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-2 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
};