import { useState } from "react";
import { toast } from "sonner";
import { GST_RATE } from "@/lib/constants";
import { type Product } from "@/lib/api/inventory";

export interface CartItem {
  sku: string;
  productName: string;
  material: string;
  purity: string;
  weight: number;
  quantity: number;
  pricePerPiece: number;
}

export function useCartManager() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [skuError, setSkuError] = useState("");

  const addToCart = (products: Product[]) => {
    const product = products.find(
      (p) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) {
      setSkuError("No inventory piece found for this SKU");
      return false;
    }
    if (product.stockQuantity <= 0) {
      setSkuError("This piece is currently out of stock");
      return false;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.sku === product.sku);
      if (existing) {
        return prev.map((c) =>
          c.sku === product.sku ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          sku: product.sku,
          productName: product.name,
          material: product.material,
          purity: product.purity,
          weight: product.baseWeight,
          quantity: 1,
          pricePerPiece: product.price,
        },
      ];
    });
    setSkuInput("");
    setSkuError("");
    return true;
  };

  const removeFromCart = (sku: string) =>
    setCart((prev) => prev.filter((c) => c.sku !== sku));

  const updateQty = (sku: string, qty: number, maxStock?: number) => {
    if (maxStock !== undefined && qty > maxStock) {
      toast.error(`Only ${maxStock} pieces in stock`);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.sku === sku ? { ...c, quantity: Math.max(1, qty) } : c))
    );
  };

  const resetCart = () => {
    setCart([]);
    setSkuInput("");
    setSkuError("");
  };

  const subtotal = cart.reduce((s, c) => s + c.pricePerPiece * c.quantity, 0);
  const gst = subtotal * GST_RATE;
  const grandTotal = subtotal + gst;

  return {
    cart,
    setCart,
    skuInput,
    setSkuInput,
    skuError,
    setSkuError,
    addToCart,
    removeFromCart,
    updateQty,
    resetCart,
    subtotal,
    gst,
    grandTotal,
  };
}
