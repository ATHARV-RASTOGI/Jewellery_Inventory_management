import { useState } from "react";
import { IndianRupee, Package, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR, formatNum, cn } from "@/lib/utils";
import { RateUpdateModal } from "./RateUpdateModal";

type Stat = {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendPositive: boolean;
  showTrendIcon?: boolean;
};

const buildStats = (s: DashboardStats): Stat[] => [
  {
    title: "Today's Silver Rate",
    value: `${formatINR(s.totalInventoryValue)} / 10 g`,
    icon: TrendingUp,
    trend: "Silver Rate",
    trendPositive: true,
  },
  {
    title: "Today's Gold Rate",
    value: `${formatINR(s.goldRatePerGram)} / 10 g`,
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
    trend: "Active Loans",
    trendPositive: true,
  },
];

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
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
  });

  const stats = buildStats(data || EMPTY_STATS);

  return (
    <>
      {/* Header row with Update Rates button */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-muted-foreground tracking-wide">
          Live rates · updated today
        </p>
        <button
          onClick={() => setRateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Update rates
        </button>
      </div>

      {/* Stat cards */}
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

      {/* Rate update modal */}
      <RateUpdateModal
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        currentGold={data?.goldRatePerGram ? data.goldRatePerGram * 10 : 0}
        currentSilver={data?.totalInventoryValue ?? 0}
      />
    </>
  );
};