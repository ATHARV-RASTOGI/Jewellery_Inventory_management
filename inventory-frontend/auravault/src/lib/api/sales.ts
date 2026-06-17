import { apiClient } from "./client";

export type SaleItem = {
  id: number;
  saleId: number;
  sku: string;
  productName: string;
  material: string;
  purity: string;
  weight: number;
  quantity: number;
  pricePerPiece: number;
  lineTotal: number;
};

export type Sale = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  saleDate: string;
};

export type CreateSaleInput = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    sku: string;
    quantity: number;
    pricePerPiece: number;
  }[];
};

export async function fetchSales(): Promise<Sale[]> {
  const { data } = await apiClient.get<Sale[]>("/sales");
  return data;
}

export async function fetchSaleItems(saleId: number): Promise<SaleItem[]> {
  const { data } = await apiClient.get<SaleItem[]>(`/sales/${saleId}/items`);
  return data;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data } = await apiClient.post<Sale>("/sales", input);
  return data;
}