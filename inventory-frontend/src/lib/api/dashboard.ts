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

// POST /api/gold-rate/update
export async function updateGoldRate(rate: number): Promise<void> {
  await apiClient.post("/gold-rate/update", { rate });
}

// POST /api/silver-rates/update
export async function updateSilverRate(rate: number): Promise<void> {
  await apiClient.post("/silver-rates/update", { rate });
}

// GET /api/silver-rates/latest
export async function fetchSilverRate() {
  const { data } = await apiClient.get("/silver-rates/latest");
  return data;
}

// GET /api/gold-rate/latest
export async function fetchGoldRate(): Promise<{
  rate: number;
  silverRatePerGram: number;
  updatedAt: string;
}> {
  const { data } = await apiClient.get("/gold-rate/latest");
  return {
    rate: Number(data.rates?.INR ?? 0),
    silverRatePerGram: 95,
    updatedAt: data.timestamp,
  };
}