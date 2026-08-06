import { apiClient } from "./client";

export type Product = {
  id: string;
  name: string;
  sku: string;
  mainCategory: string;
  subCategory: string;
  material: string;
  baseWeight: number;
  purity: string;
  stockQuantity: number;
  price: number;
};

// GET /api/inventory/products?category=...
export async function fetchProducts(category?: string): Promise<Product[]> {
  const params: Record<string, string> = {};

  if (category && category !== "all" && category !== "dashboard") {
    const isSubCategory = category.includes("-");
    params.mainCategory = isSubCategory ? category.split("-")[0] : category;
    if (isSubCategory) params.subCategory = category;
  }

  const { data } = await apiClient.get<Product[]>("/inventory/products", { params });
  return data;
}

// POST /api/inventory/products
export async function createProduct(
  input: Omit<Product, "id">,
): Promise<Product> {
  const { data } = await apiClient.post<Product>("/inventory/products", input);
  return data;
}

// PUT /api/inventory/products/{id}
export async function updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/inventory/products/${id}`, patch);
  return data;
}

// DELETE /api/inventory/products/{id}
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/inventory/products/${id}`);
}