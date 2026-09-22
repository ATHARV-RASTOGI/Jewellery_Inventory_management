import { apiClient } from "./client";

export type PurchaseItem = {
  id: number;
  purchaseId: number;
  sku: string;
  productName: string;
  material: string;
  purity: string;
  quantity: number;
  weight: number;
  costPerGram: number;
  lineTotal: number;
  hsnCode?: string;
};

export type Purchase = {
  id: number;
  supplierName: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplierInvoiceNo: string;
  purchaseDate: string;
  itemCount: number;
  items?: PurchaseItem[];
};

export type CreatePurchaseItemInput = {
  sku: string;
  quantity: number;
  weight: number;
  costPerGram?: number;
  lineTotal?: number;
};

export type CreatePurchaseInput = {
  supplierName: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplierInvoiceNo: string;
  purchaseDate?: string;
  items: CreatePurchaseItemInput[];
};

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data } = await apiClient.get<Purchase[]>("/purchases");
  return data;
}

export async function fetchPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
  const { data } = await apiClient.get<PurchaseItem[]>(`/purchases/${purchaseId}/items`);
  return data;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const { data } = await apiClient.post<Purchase>("/purchases", input);
  return data;
}
