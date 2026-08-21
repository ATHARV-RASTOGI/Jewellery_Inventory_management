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
  appliedRatePer10g?: number;
  makingChargePercent?: number;
  makingChargeAmount?: number;
  pricePerPiece: number;
  lineTotal: number;
};

export type Sale = {
  id: number;
  customerName: string;
  customerPhoneNo: string;
  customerAddress: string;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  saleDate: string;
  itemCount: number;
};

export type CreateSaleInput = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    sku: string;
    quantity: number;
    pricePerPiece: number;
    appliedRatePer10g?: number;
    makingChargePercent?: number;
    makingChargeAmount?: number;
  }[];
};

export type RevenuePoint = { month: string; revenue: number };
export type MaterialSales = { material: string; value: number };
export type WeeklyPoint = { day: string; sales: number };

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

//Dashboard API functions

export async function fetchRevenueOverview(): Promise<RevenuePoint[]> {
  const { data } = await apiClient.get<RevenuePoint[]>("/sales/analytics/revenue-overview");
  return data;
}

export async function fetchSalesByMaterial(): Promise<MaterialSales[]> {
  const { data } = await apiClient.get<MaterialSales[]>("/sales/analytics/by-material");
  return data;
}

export async function fetchRecentSales(limit = 5): Promise<Sale[]> {
  const { data } = await apiClient.get<Sale[]>("/sales/analytics/recent", { params: { limit } });
  return data;
}

export async function fetchWeeklySales(): Promise<WeeklyPoint[]> {
  const { data } = await apiClient.get<WeeklyPoint[]>("/sales/analytics/weekly");
  return data;
}