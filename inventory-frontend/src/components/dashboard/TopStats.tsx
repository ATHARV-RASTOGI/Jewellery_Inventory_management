import { IndianRupee, Package, FileText, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR, formatNum, cn } from "@/lib/utils";

type Stat = {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendPositive: boolean;
  showTrendIcon?: boolean;
};

// Uses the real type from your API file instead of the mock data
const buildStats = (s: DashboardStats): Stat[] => [
   {
    title: "Todays Silver Rate ",
     value: `${formatINR(s.totalInventoryValue)} / g`,
    icon: TrendingUp,
    trend: "Silver Rate",
    trendPositive: true,
  },
  {
    title: "Today's Gold Rate",
    value: `${formatINR(s.goldRatePerGram)} / g`,
    icon: TrendingUp,
    trend: "24K Gold Rate",
    trendPositive: true,
  },
  {
    title: "Items In Stock",
    value: formatNum(s.totalItemsInStock),
    icon: Package,
    trend: `${s.lowStockItemsCount} low stock items`,
    trendPositive: s.lowStockItemsCount === 0,
  },
  {
    title: "Active Loans",
    value: formatNum(s.activeLoansCount),
    icon: FileText,
    trend:" Active Loans", 
    trendPositive: true,
  },
 
];

// A safe fallback to display zero-values while Spring Boot is loading
const EMPTY_STATS: DashboardStats = {
  totalInventoryValue: 0,
  totalItemsInStock: 0,
  activeLoansCount: 0,
  totalOutstandingAmount: 0,
  goldRatePerGram: 0,
  lowStockItemsCount: 0,
  inventoryChangePercent: 0,
};

export const TopStats = () => {
  const { data } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
  });

  // Passes the real data, or the empty fallback if still fetching
  const stats = buildStats(data || EMPTY_STATS);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.title}
            className="group relative rounded-xl bg-surface p-5 transition-colors hover:bg-surface-2/70"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-medium text-muted-foreground tracking-wide">
                {s.title}
              </p>
              <div className="w-8 h-8 rounded-lg bg-surface-2 text-muted-foreground/80 flex items-center justify-center group-hover:text-gold group-hover:bg-gold-soft transition-colors">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 text-[26px] font-semibold tracking-tight text-foreground leading-none">
              {s.value}
            </div>

            <div
              className={cn(
                "mt-3 flex items-center gap-1 text-[11.5px] font-medium",
                s.trendPositive ? "text-success" : "text-warning",
              )}
            >
              {s.showTrendIcon &&
                (s.trendPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ))}
              <span className="text-muted-foreground font-normal">{s.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
