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
    <div className="rounded border border-border bg-surface shadow-xs overflow-hidden">
      {/* Barometer Header */}
      <div className="px-3.5 py-2 bg-surface-2/70 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <h2 className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground select-none">
            Live Market Barometer &amp; Operational Health
          </h2>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setRateModalOpen(true)}
          leftIcon={<Pencil className="w-3 h-3 text-primary" />}
          className="text-xs h-6.5 font-semibold px-2"
        >
          Update Rates
        </Button>
      </div>

      {/* Integrated Metrics Grid with Clean Dividers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 sm:divide-x divide-border/60">
        {/* Metric 1: Gold Rate */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold">Today's Gold (24K)</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
            {formatINR(s.goldRatePerGram * 10)}
            <span className="text-xs font-normal text-muted-foreground font-sans ml-1">/ 10g</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            ≈ {formatINR(s.goldRatePerGram)} / gram
          </p>
        </div>

        {/* Metric 2: Silver Rate */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold">Today's Silver</span>
            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
            {formatINR(s.silverRatePerGram * 10)}
            <span className="text-xs font-normal text-muted-foreground font-sans ml-1">/ 10g</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            ≈ {formatINR((s.silverRatePerGram * 1000))} / kg
          </p>
        </div>

        {/* Metric 3: Active Loans Portfolio */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold">Active Loan Portfolio</span>
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
            {formatINR(s.totalOutstandingAmount)}
          </div>
          <p className="text-[11px] text-primary font-medium">
            {s.activeLoansCount} active collateral pledges
          </p>
        </div>

        {/* Metric 4: Stock Status */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10.5px] uppercase tracking-wider font-semibold">Catalog Stock</span>
            <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
            {formatNum(s.totalItemsInStock)}
            <span className="text-xs font-normal text-muted-foreground font-sans ml-1">pieces</span>
          </div>
          <p className={cn("text-[11px] font-medium", s.lowStockItemsCount > 0 ? "text-warning" : "text-success")}>
            {s.lowStockItemsCount > 0 ? `${s.lowStockItemsCount} items low stock` : "Stock levels optimal"}
          </p>
        </div>
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