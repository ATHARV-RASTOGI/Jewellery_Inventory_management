import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Package, FileText, TrendingUp, Loader2 } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import { BASE_GOLD_RATE_24K } from "../../lib/constants";
import { apiClient } from "../../lib/api-client";

interface DashboardStats {
  totalInventoryValue: number;
  totalItemsInStock: number;
  activeLoansCount: number;
  totalOutstandingAmount: number;
  goldRatePerGram: number;
  lowStockItemsCount: number;
  inventoryChangePercent: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>("/dashboard/stats");
  return response.data;
};

const AnimatedCounter = ({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="data-number text-2xl font-bold">
      {isCurrency ? formatCurrency(displayValue) : displayValue.toLocaleString("en-IN")}
    </span>
  );
};

type Stat = {
  title: string;
  value: number;
  isCurrency: boolean;
  icon: React.ElementType;
  trend: string;
  trendPositive: boolean;
};

const buildStats = (data: DashboardStats): Stat[] => [
  {
    title: "Total Inventory Value",
    value: data.totalInventoryValue,
    isCurrency: true,
    icon: IndianRupee,
    trend: `${data.inventoryChangePercent >= 0 ? "+" : ""}${data.inventoryChangePercent.toFixed(1)}% from last month`,
    trendPositive: data.inventoryChangePercent >= 0,
  },
  {
    title: "Items In Stock",
    value: data.totalItemsInStock,
    isCurrency: false,
    icon: Package,
    trend: `${data.lowStockItemsCount} low stock ${data.lowStockItemsCount === 1 ? "item" : "items"}`,
    trendPositive: data.lowStockItemsCount === 0,
  },
  {
    title: "Active Loans",
    value: data.activeLoansCount,
    isCurrency: false,
    icon: FileText,
    trend: `${formatCurrency(data.totalOutstandingAmount)} outstanding`,
    trendPositive: true,
  },
  {
    title: "Today's Gold Rate",
    value: data.goldRatePerGram,
    isCurrency: true,
    icon: TrendingUp,
    trend: "Live 24K Rate / gram",
    trendPositive: true,
  },
];

export const TopStatsBar = () => {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    placeholderData: {
      totalInventoryValue: 0,
      totalItemsInStock: 0,
      activeLoansCount: 0,
      totalOutstandingAmount: 0,
      goldRatePerGram: BASE_GOLD_RATE_24K,
      lowStockItemsCount: 0,
      inventoryChangePercent: 0,
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6 relative overflow-hidden">
            <div className="animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-32 bg-gold-muted/20 rounded" />
                <div className="h-8 w-8 bg-gold-muted/20 rounded-md" />
              </div>
              <div className="h-8 w-24 bg-gold-muted/20 rounded" />
              <div className="h-3 w-20 bg-gold-muted/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mb-8 p-4 bg-red-950/30 border border-red-900/40 rounded-lg text-red-400 text-sm">
        Failed to load dashboard stats — is Spring Boot running on :8080?
      </div>
    );
  }

  const stats = buildStats(data!);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="glass-card p-6 relative overflow-hidden group hover:border-gold transition-colors duration-300"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
          >
            <div className="absolute -inset-2 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-full" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-slate-400">{stat.title}</h3>
                <div className="p-2 bg-obsidian border border-gold-muted rounded-md group-hover:border-gold/50 transition-colors">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
              </div>

              <AnimatedCounter value={stat.value} isCurrency={stat.isCurrency} />

              <div className="mt-3 text-xs">
                <span className={cn("font-medium", stat.trendPositive ? "text-emerald-400" : "text-amber-400")}>
                  {stat.trend}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};