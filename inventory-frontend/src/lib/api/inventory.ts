import { apiClient } from "./client";

export type Product = {
  id: string; // or number, depending on your Spring Boot ID type
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

/**
 * Inventory API service.
 * Cleaned up to connect directly to the Spring Boot Backend.
 */

// GET /api/inventory/products?category=...
export const fetchProducts = async (category?: string): Promise<Product[]> => {
  let url = "/api/inventory/products";

  if (category && category !== "all" && category !== "dashboard") {
    // 1. Figure out main vs sub category from the sidebar ID
    // Example: "rings-gents" -> main: "rings", sub: "rings-gents"
    // Example: "necklaces" -> main: "necklaces", sub: ""
    const isSubCategory = category.includes("-");
    const mainCategory = isSubCategory ? category.split("-")[0] : category;
    const subCategory = isSubCategory ? category : "";

    // 2. Build the exact query parameters Spring Boot expects
    const params = new URLSearchParams();
    params.append("mainCategory", mainCategory);
    
    if (subCategory) {
      params.append("subCategory", subCategory);
    }

    // 3. Attach them to the URL
    url += `?${params.toString()}`; 
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  
  return response.json();
};

// GET /api/inventory/products/{id}
export async function fetchProduct(id: string): Promise<Product | undefined> {
  const response = await apiClient.get<Product>(`/inventory/products/${id}`);
  return response.data;
}

// POST /api/inventory/products
export async function createProduct(
  input: Omit<Product, "id" | "variants">,
): Promise<Product> {
  // Ensure that the weight data matches your Java variable names (e.g., baseWeight)
  const response = await apiClient.post<Product>("/inventory/products", input);
  return response.data;
}

// PUT /api/inventory/products/{id}
export const updateProduct = async (id: string, patch: Partial<Product>): Promise<Product> => {
  const response = await fetch(`/api/inventory/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error("Failed to update");
  return response.json();
};

// DELETE /api/inventory/products/{id}
export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/inventory/products/${id}`);
}