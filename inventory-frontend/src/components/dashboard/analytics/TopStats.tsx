import { useState } from "react";
import {
  TrendingUp,
  Pencil,
  Coins,
  Package,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR, formatNum, cn } from "@/lib/utils";
import { RateUpdateModal } from "./RateUpdateModal";
import { Button } from "@/components/ui/Button";

const EMPTY_STATS: DashboardStats = {
  silverRatePerGram: 0,
  totalItemsInStock: 0,
  activeLoansCount: 0,
  totalOutstandingAmount: 0,
  goldRatePerGram: 0,
  lowStockItemsCount: 0,
  inventoryChangePercent: 0,
};

export const TopStats = () => {
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: fetchDashboardStats,
  });

  const s = data || EMPTY_STATS;

  const stats = [
    {
      title: "Today's Silver Rate",
      value: `${formatINR(s.silverRatePerGram * 10)} / 10 g`,
      icon: Coins,
      trend: "Live Silver Rate",
      trendColor: "text-slate-400",
    },
    {
      title: "Today's Gold Rate",
      value: `${formatINR(s.goldRatePerGram * 10)} / 10 g`,
      icon: TrendingUp,
      trend: "24K Pure Gold",
      trendColor: "text-amber-400",
    },
    {
      title: "Total Stock Items",
      value: formatNum(s.totalItemsInStock),
      icon: Package,
      trend: s.lowStockItemsCount > 0 ? `${s.lowStockItemsCount} Low Stock` : "Stock Healthy",
      trendColor: s.lowStockItemsCount > 0 ? "text-warning" : "text-success",
    },
    {
      title: "Active Loans Portfolio",
      value: formatINR(s.totalOutstandingAmount),
      icon: FileText,
      trend: `${s.activeLoansCount} Active Pledges`,
      trendColor: "text-primary",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header bar with Rate Update trigger */}
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <div>
          <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
            Market Rates &amp; Operational Overview
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRateModalOpen(true)}
          leftIcon={<Pencil className="w-3.5 h-3.5 text-primary" />}
          className="text-xs h-7.5 font-semibold"
        >
          Update Today's Rates
        </Button>
      </div>

      {/* Seamless Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-lg bg-surface/50 border border-border/60 hover:bg-surface/80 hover:border-border transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="w-7 h-7 rounded-md bg-surface-2 text-muted-foreground flex items-center justify-center border border-border/40">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-2 text-xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {stat.value}
              </div>

              <div className={cn("mt-2 text-[11px] font-semibold", stat.trendColor)}>
                {stat.trend}
              </div>
            </div>
          );
        })}
      </div>

      <RateUpdateModal
        open={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        currentGold={s.goldRatePerGram * 10}
        currentSilver={s.silverRatePerGram * 10}
      />
    </div>
  );
};