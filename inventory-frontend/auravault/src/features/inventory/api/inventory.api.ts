import { apiClient } from "../../../lib/api-client";

export interface Variant {
  id: string;
  weight: number;
  stock: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  mainCategory: string;
  subCategory: string;
  material: string;
  purity: "18K" | "22K" | "24K";
  baseWeight: number;
  stockQuantity: number;
  price: number;
  variants?: Variant[];
}

export const fetchProducts = async (
  mainCategory?: string,
  subCategory?: string,
  purity?: string,
  maxWeight?: number
): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>("/inventory/products", {
    params: { mainCategory, subCategory, purity, maxWeight },
  });
  return response.data ?? [];
};

export const createProduct = async (payload: Omit<Product, "id">): Promise<Product> => {
  const response = await apiClient.post<Product>("/inventory/products", payload);
  return response.data;
};

export const updateStock = async (productId: string, variantId: string, qty: number): Promise<void> => {
  await apiClient.patch(`/inventory/products/${productId}/variants/${variantId}/stock`, { qty });
};