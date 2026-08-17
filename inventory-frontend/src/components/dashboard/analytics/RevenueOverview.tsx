import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchRevenueOverview } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ChartSkeleton } from "@/components/feedback/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const RevenueOverview = () => {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["revenue-overview"],
    queryFn: fetchRevenueOverview,
  });

  if (isLoading) return <ChartSkeleton height="h-64" />;

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="flex flex-col justify-between p-5 rounded-lg border border-border/60 bg-surface/50 h-full">
      <div className="flex items-start justify-between mb-3 pb-2 border-b border-border/40">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Revenue Overview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly performance for {new Date().getFullYear()}
          </p>
        </div>
        <StatusBadge variant="info" withDot>
          Live
        </StatusBadge>
      </div>

      <div className="h-64 mt-2">
        {isError ? (
          <ErrorState
            title="Failed to load revenue"
            message="Could not retrieve monthly revenue data from server."
            onRetry={() => refetch()}
            className="h-full"
          />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.65 0.18 265)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.65 0.18 265)"
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 0.07)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="oklch(1 0 0 / 0.4)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(1 0 0 / 0.4)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-popover-foreground">
                        {item.month}
                      </p>
                      <p className="text-primary font-bold font-mono mt-0.5">
                        {formatINR(item.revenue)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.orders} transactions
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.65 0.18 265)"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground mb-2">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              No sales recorded yet
            </p>
            <p className="text-[11.5px] text-muted-foreground max-w-xs mt-0.5">
              Monthly sales analytics will automatically appear here as counter invoices are logged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};