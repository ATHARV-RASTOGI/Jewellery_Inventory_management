import React from "react";
import { Trash2 } from "lucide-react";
import { formatINR, formatWeight } from "@/lib/utils";
import { CartItem } from "@/lib/hooks/useCartManager";

interface CartTableProps {
  cart: CartItem[];
  subtotal: number;
  gst: number;
  grandTotal: number;
  onUpdateQty: (sku: string, qty: number) => void;
  onUpdateRate?: (sku: string, rate: number) => void;
  onUpdateMaking?: (sku: string, percent: number) => void;
  onRemove: (sku: string) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  subtotal,
  gst,
  grandTotal,
  onUpdateQty,
  onUpdateRate,
  onUpdateMaking,
  onRemove,
}) => {
  if (cart.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/80 bg-surface-2/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/70 bg-surface-2 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] sm:text-xs">
              <th className="px-4 py-3 text-left">Item Details</th>
              <th className="px-3 py-3 text-right">Net Wt</th>
              <th className="px-3 py-3 text-center">Metal Rate (₹/10g)</th>
              <th className="px-3 py-3 text-center">Making %</th>
              <th className="px-3 py-3 text-right">Unit Rate</th>
              <th className="px-3 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Line Total</th>
              <th className="px-3 py-3 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {cart.map((c) => (
              <tr key={c.sku} className="hover:bg-surface-2/40 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[13.5px] sm:text-sm text-foreground">{c.productName}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {c.sku} · <span className="text-warning font-semibold">{c.material} {c.purity}</span>
                  </p>
                </td>
                <td className="px-3 py-3.5 text-right font-mono font-medium text-foreground whitespace-nowrap text-xs sm:text-sm">
                  {formatWeight(c.weight)}
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                  <input
                    type="number"
                    min={0}
                    value={c.appliedRatePer10g || ""}
                    onChange={(e) =>
                      onUpdateRate?.(c.sku, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-center bg-surface border border-border/80 rounded-lg py-1 px-1.5 text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-ring focus:border-transparent"
                    title="Applied metal rate per 10g"
                  />
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={c.makingChargePercent || ""}
                      onChange={(e) =>
                        onUpdateMaking?.(c.sku, parseFloat(e.target.value) || 0)
                      }
                      className="w-16 text-center bg-surface border border-border/80 rounded-lg py-1 px-1.5 text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-ring focus:border-transparent"
                      title="Making charge percentage"
                    />
                    <span className="text-muted-foreground font-mono font-semibold text-xs">%</span>
                  </div>
                </td>
                <td className="px-3 py-3.5 text-right font-mono whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
                  {formatINR(c.pricePerPiece)}
                </td>
                <td className="px-3 py-3.5 text-center whitespace-nowrap">
                  <input
                    type="number"
                    min={1}
                    value={c.quantity}
                    onChange={(e) =>
                      onUpdateQty(c.sku, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-14 text-center bg-surface border border-border/80 rounded-lg py-1 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-ring focus:border-transparent font-mono"
                  />
                </td>
                <td className="px-4 py-3.5 text-right font-bold font-mono text-foreground whitespace-nowrap text-sm sm:text-base">
                  {formatINR(c.pricePerPiece * c.quantity)}
                </td>
                <td className="px-3 py-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(c.sku)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-surface border-t border-border/60 space-y-1.5 text-xs sm:text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Taxable Subtotal</span>
          <span className="font-mono font-bold text-foreground text-sm sm:text-base">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST (3%)</span>
          <span className="font-mono font-medium">{formatINR(gst)}</span>
        </div>
        <div className="flex justify-between items-baseline font-bold text-foreground pt-2 border-t border-border/40">
          <span className="text-sm uppercase tracking-wider font-extrabold text-foreground">Grand Total (Net Payable)</span>
          <span className="text-primary font-mono text-lg sm:text-2xl font-extrabold">{formatINR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
};
