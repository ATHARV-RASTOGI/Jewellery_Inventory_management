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
  onUpdateWeight?: (sku: string, weight: number) => void;
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
  onUpdateWeight,
  onUpdateRate,
  onUpdateMaking,
  onRemove,
}) => {
  if (cart.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-2/80 text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-3 py-2 text-left">Item Details</th>
              <th className="px-2.5 py-2 text-right">Weighed Wt (g)</th>
              <th className="px-2.5 py-2 text-center">Metal Rate (₹/10g)</th>
              <th className="px-2.5 py-2 text-center">Making %</th>
              <th className="px-2.5 py-2 text-right">Unit Rate</th>
              <th className="px-2.5 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Line Total</th>
              <th className="px-2 py-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {cart.map((c) => (
              <tr key={c.sku} className="hover:bg-surface-2/40 transition-colors">
                <td className="px-3 py-2">
                  <p className="font-semibold text-xs sm:text-[13px] text-foreground">{c.productName}</p>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {c.sku} · <span className="text-warning font-semibold">{c.material} {c.purity}</span>
                  </p>
                </td>
                <td className="px-2.5 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <input
                      type="number"
                      min={0}
                      step={0.001}
                      placeholder="0.000"
                      value={c.weight === 0 ? "" : c.weight}
                      onChange={(e) =>
                        onUpdateWeight?.(c.sku, parseFloat(e.target.value) || 0)
                      }
                      className={`w-20 text-right bg-surface-2 border rounded-md py-1 px-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-ring focus:outline-none ${
                        c.weight <= 0
                          ? "border-warning bg-warning/5"
                          : "border-border"
                      }`}
                      title="Enter measured weight on scale in grams"
                    />
                    <span className="text-muted-foreground font-mono text-[11px]">g</span>
                  </div>
                </td>
                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                  <input
                    type="number"
                    min={0}
                    value={c.appliedRatePer10g || ""}
                    onChange={(e) =>
                      onUpdateRate?.(c.sku, parseFloat(e.target.value) || 0)
                    }
                    className="w-20 text-center bg-surface-2 border border-border rounded-md py-1 px-1.5 text-xs font-mono font-semibold focus:ring-1 focus:ring-ring focus:outline-none"
                    title="Applied metal rate per 10g"
                  />
                </td>
                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={c.makingChargePercent || ""}
                      onChange={(e) =>
                        onUpdateMaking?.(c.sku, parseFloat(e.target.value) || 0)
                      }
                      className="w-14 text-center bg-surface-2 border border-border rounded-md py-1 px-1 text-xs font-mono font-semibold focus:ring-1 focus:ring-ring focus:outline-none"
                      title="Making charge percentage"
                    />
                    <span className="text-muted-foreground font-mono font-semibold text-xs">%</span>
                  </div>
                </td>
                <td className="px-2.5 py-2 text-right font-mono whitespace-nowrap text-muted-foreground text-xs">
                  {formatINR(c.pricePerPiece)}
                </td>
                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                  <input
                    type="number"
                    min={1}
                    value={c.quantity}
                    onChange={(e) =>
                      onUpdateQty(c.sku, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-12 text-center bg-surface-2 border border-border rounded-md py-1 text-xs font-semibold focus:ring-1 focus:ring-ring focus:outline-none font-mono"
                  />
                </td>
                <td className="px-3 py-2 text-right font-bold font-mono text-foreground whitespace-nowrap text-xs sm:text-sm">
                  {formatINR(c.pricePerPiece * c.quantity)}
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(c.sku)}
                    className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 bg-surface border-t border-border space-y-1 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Taxable Subtotal</span>
          <span className="font-mono font-bold text-foreground">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST (3%)</span>
          <span className="font-mono font-medium">{formatINR(gst)}</span>
        </div>
        <div className="flex justify-between items-baseline font-bold text-foreground pt-1.5 border-t border-border/40">
          <span className="text-xs uppercase tracking-wider font-bold text-foreground">Grand Total (Net Payable)</span>
          <span className="text-primary font-mono text-base sm:text-lg font-bold">{formatINR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
};
