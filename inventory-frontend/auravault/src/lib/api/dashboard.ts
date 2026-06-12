import { apiClient } from "./client";

export type DashboardStats = {
  totalInventoryValue: number;
  totalItemsInStock: number;
  activeLoansCount: number;
  totalOutstandingAmount: number;
  goldRatePerGram: number;
  lowStockItemsCount: number;
  inventoryChangePercent: number;
};

// GET /api/dashboard/stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
  return data;
}

// GET /api/dashboard/gold-rate
export async function fetchGoldRate(): Promise<{ rate: number; updatedAt: string }> {
  const { data } = await apiClient.get<{ rate: number; updatedAt: string }>(
    "/dashboard/gold-rate",
  );
  return data;
}