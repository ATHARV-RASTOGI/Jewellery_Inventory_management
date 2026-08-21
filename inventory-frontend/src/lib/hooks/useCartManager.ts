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
  appliedRatePer10g: number;
  makingChargePercent: number;
  makingChargeAmount: number;
  pricePerPiece: number;
}

const PURITY_FACTORS: Record<string, number> = {
  "24K": 1.0,
  "22K": 22 / 24,
  "20K": 20 / 24,
  "18K": 18 / 24,
  "14K": 14 / 24,
};

function calculateItemPrice(
  weight: number,
  material: string,
  purity: string,
  appliedRatePer10g: number,
  makingChargePercent: number
) {
  const isSilver = material?.toLowerCase() === "silver";
  const purityFactor = isSilver ? 1.0 : PURITY_FACTORS[purity] ?? 22 / 24;
  const ratePerGram = appliedRatePer10g / 10;
  const metalValue = weight * ratePerGram * purityFactor;
  const makingChargeAmount = Math.round(metalValue * (makingChargePercent / 100));
  const pricePerPiece = Math.round(metalValue + makingChargeAmount);

  return { makingChargeAmount, pricePerPiece };
}

export function useCartManager() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [skuInput, setSkuInput] = useState("");
  const [skuError, setSkuError] = useState("");

  const addProductToCart = (
    product: Product,
    liveGoldRate10g?: number,
    liveSilverRate10g?: number
  ) => {
    if (!product) return false;
    if (product.stockQuantity <= 0) {
      setSkuError("This piece is currently out of stock");
      toast.error(`${product.name} (${product.sku}) is out of stock`);
      return false;
    }

    const isSilver = product.material?.toLowerCase() === "silver";
    const appliedRatePer10g = isSilver
      ? (liveSilverRate10g && liveSilverRate10g > 0 ? liveSilverRate10g : 950)
      : (liveGoldRate10g && liveGoldRate10g > 0 ? liveGoldRate10g : 75000);

    const makingChargePercent = isSilver ? 8 : 12;
    const weight = Number(product.baseWeight) || 0;

    const { makingChargeAmount, pricePerPiece } = calculateItemPrice(
      weight,
      product.material,
      product.purity,
      appliedRatePer10g,
      makingChargePercent
    );

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
          weight,
          quantity: 1,
          appliedRatePer10g,
          makingChargePercent,
          makingChargeAmount,
          pricePerPiece,
        },
      ];
    });
    setSkuInput("");
    setSkuError("");
    return true;
  };

  const addToCart = (
    products: Product[],
    liveGoldRate10g?: number,
    liveSilverRate10g?: number
  ) => {
    const product = products.find(
      (p) => p.sku.toLowerCase() === skuInput.trim().toLowerCase()
    );
    if (!product) {
      setSkuError("No inventory piece found for this SKU");
      return false;
    }
    return addProductToCart(product, liveGoldRate10g, liveSilverRate10g);
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

  const updateRate = (sku: string, newRatePer10g: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.sku !== sku) return c;
        const { makingChargeAmount, pricePerPiece } = calculateItemPrice(
          c.weight,
          c.material,
          c.purity,
          newRatePer10g,
          c.makingChargePercent
        );
        return {
          ...c,
          appliedRatePer10g: newRatePer10g,
          makingChargeAmount,
          pricePerPiece,
        };
      })
    );
  };

  const updateMakingPercent = (sku: string, newPercent: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.sku !== sku) return c;
        const { makingChargeAmount, pricePerPiece } = calculateItemPrice(
          c.weight,
          c.material,
          c.purity,
          c.appliedRatePer10g,
          newPercent
        );
        return {
          ...c,
          makingChargePercent: newPercent,
          makingChargeAmount,
          pricePerPiece,
        };
      })
    );
  };

  const updatePricePerPiece = (sku: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((c) => (c.sku === sku ? { ...c, pricePerPiece: newPrice } : c))
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
    addProductToCart,
    removeFromCart,
    updateQty,
    updateRate,
    updateMakingPercent,
    updatePricePerPiece,
    resetCart,
    subtotal,
    gst,
    grandTotal,
  };
}
