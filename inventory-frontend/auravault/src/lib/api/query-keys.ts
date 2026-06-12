export const queryKeys = {
  products: (category?: string) =>
    category && category !== "dashboard" && category !== "all"
      ? (["products", category] as const)
      : (["products"] as const),
  product: (id: string) => ["products", id] as const,
  dashboardStats: ["dashboard", "stats"] as const,
  goldRate: ["dashboard", "gold-rate"] as const,
  loans: ["loans"] as const,
};
