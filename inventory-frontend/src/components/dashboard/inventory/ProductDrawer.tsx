import { ImageIcon, Pencil, Tag, Scale, Package, ShieldCheck } from "lucide-react";
import { formatWeight, getStockStatus } from "@/lib/utils";
import { type Product } from "@/lib/api/inventory";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DetailDrawer } from "@/components/ui/DetailDrawer";

type Props = {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
};

export const ProductDrawer = ({ product, onClose, onEdit }: Props) => {
  if (!product) return null;

  const status = getStockStatus(product.stockQuantity);
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

  const isGold = product.material.toLowerCase() === "gold";

  return (
    <DetailDrawer
      open={!!product}
      onClose={onClose}
      title={product.name}
      subtitle={`SKU: ${product.sku} · ${product.material.toUpperCase()} · ${product.purity}`}
      badge={
        <StatusBadge variant={currentBadge.variant} withDot>
          {currentBadge.label}
        </StatusBadge>
      }
      actions={
        <Button
          onClick={() => onEdit(product)}
          variant="primary"
          size="sm"
          leftIcon={<Pencil className="w-3.5 h-3.5" />}
        >
          Edit Product
        </Button>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Product Visual / Image Container */}
        <div className="aspect-[16/9] bg-surface-2 border border-border flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-8 h-8 stroke-[1.25] text-muted-foreground/60" />
          <span className="text-[11px] font-medium mt-1.5">No catalog photo uploaded</span>
        </div>

        {/* Stock & Material Overview Strip */}
        <div className="grid grid-cols-3 divide-x divide-border bg-surface-2 border border-border text-center">
          <div className="p-2.5">
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground block font-medium">
              Purity
            </span>
            <span className="font-mono font-bold text-foreground mt-0.5 block text-xs">
              {product.purity}
            </span>
          </div>
          <div className="p-2.5">
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground block font-medium">
              Unit Weight
            </span>
            <span className="font-mono font-bold text-foreground mt-0.5 block text-xs">
              {formatWeight(product.totalWeight ?? product.baseWeight)}
            </span>
          </div>
          <div className="p-2.5">
            <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground block font-medium">
              Stock On Hand
            </span>
            <span
              className={`font-mono font-bold mt-0.5 block text-xs ${
                product.stockQuantity <= 2 ? "text-warning" : "text-foreground"
              }`}
            >
              {product.stockQuantity} pcs
            </span>
          </div>
        </div>

        {/* Technical Asset Specifications */}
        <div className="border border-border p-3.5 space-y-2.5 bg-surface">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-primary" />
            Article Specifications
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
            <div>
              <span className="text-muted-foreground block text-[11px]">SKU / Barcode ID</span>
              <span className="font-mono font-semibold text-primary">{product.sku}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Precious Metal</span>
              <span
                className={`font-semibold uppercase ${
                  isGold ? "text-amber-700" : "text-slate-700"
                }`}
              >
                {product.material}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Primary Category</span>
              <span className="font-medium text-foreground capitalize">
                {product.mainCategory ? product.mainCategory.replace(/-/g, " ") : "General"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Sub-Classification</span>
              <span className="font-medium text-foreground capitalize">
                {product.subCategory ? product.subCategory.replace(/-/g, " ") : "Standard"}
              </span>
            </div>
          </div>
        </div>

        {/* Weights & Calculation Breakdown */}
        <div className="border border-border p-3.5 space-y-2.5 bg-surface">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5 text-amber-600" />
            Weight &amp; Purity Ledger
          </div>
          <div className="divide-y divide-border/60 text-xs font-mono">
            <div className="py-1.5 flex justify-between">
              <span className="text-muted-foreground font-sans">Gross / Total Weight</span>
              <span className="font-bold text-foreground tabular-nums">
                {formatWeight(product.totalWeight ?? product.baseWeight)}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-muted-foreground font-sans">Net Metal Weight</span>
              <span className="text-foreground tabular-nums">
                {formatWeight(product.baseWeight ?? product.totalWeight)}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-muted-foreground font-sans">Alloy / Stone Deduction</span>
              <span className="text-muted-foreground tabular-nums">
                {product.totalWeight && product.baseWeight && product.totalWeight > product.baseWeight
                  ? formatWeight(product.totalWeight - product.baseWeight)
                  : "0.000 g"}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Inventory Status */}
        <div className="border border-border p-3.5 space-y-2 bg-surface">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" />
              Stock Availability
            </span>
            <StatusBadge variant={currentBadge.variant} withDot>
              {currentBadge.label}
            </StatusBadge>
          </div>
          <p className="text-[11.5px] text-muted-foreground pt-1">
            Current showroom and back-office stock count is{" "}
            <strong className="text-foreground font-mono">{product.stockQuantity} pieces</strong>.
            {product.stockQuantity <= 2 && (
              <span className="block text-warning font-medium mt-1">
                Low stock alert: Consider placing reorder or custom casting batch.
              </span>
            )}
          </p>
        </div>
      </div>
    </DetailDrawer>
  );
};