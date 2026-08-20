import React from "react";
import { Trash2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { CartItem } from "@/lib/hooks/useCartManager";

interface CartTableProps {
  cart: CartItem[];
  subtotal: number;
  gst: number;
  grandTotal: number;
  onUpdateQty: (sku: string, qty: number) => void;
  onRemove: (sku: string) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  subtotal,
  gst,
  grandTotal,
  onUpdateQty,
  onRemove,
}) => {
  if (cart.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-surface-2/60 overflow-hidden shadow-xs">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 bg-surface-2 text-muted-foreground font-semibold uppercase tracking-wider">
            <th className="px-3 py-2 text-left">SKU</th>
            <th className="px-3 py-2 text-left">Item</th>
            <th className="px-3 py-2 text-center">Qty</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-2 py-2 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {cart.map((c) => (
            <tr key={c.sku} className="hover:bg-surface-2/40">
              <td className="px-3 py-2 font-mono text-muted-foreground">{c.sku}</td>
              <td className="px-3 py-2 font-medium text-foreground">{c.productName}</td>
              <td className="px-3 py-2 text-center">
                <input
                  type="number"
                  min={1}
                  value={c.quantity}
                  onChange={(e) =>
                    onUpdateQty(c.sku, parseInt(e.target.value, 10) || 1)
                  }
                  className="w-12 text-center bg-surface border border-border/80 rounded py-0.5 text-xs font-semibold focus:ring-1 focus:ring-ring"
                />
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatINR(c.pricePerPiece)}</td>
              <td className="px-3 py-2 text-right font-semibold font-mono text-foreground">
                {formatINR(c.pricePerPiece * c.quantity)}
              </td>
              <td className="px-2 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onRemove(c.sku)}
                  className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 bg-surface border-t border-border/60 space-y-1 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST (3%)</span>
          <span className="font-mono">{formatINR(gst)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border/40">
          <span>Grand Total</span>
          <span className="text-primary font-mono">{formatINR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
};
