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
export async function fetchGoldRate(): Promise<{ 
  rate: number; 
  silverRatePerGram: number;
  updatedAt: string;
}> {
  const { data } = await apiClient.get("/gold-rate/latest");
  
  console.log("rates object:", data.rates);
  console.log("INR value:", data.rates?.INR);

  return {
    rate: Number(data.rates?.INR ?? 0),  // force to number, safe fallback
    silverRatePerGram: 95,
    updatedAt: data.timestamp,
  };
}