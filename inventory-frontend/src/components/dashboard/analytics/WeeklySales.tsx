import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchWeeklySales } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ChartSkeleton } from "@/components/feedback/Skeleton";
import { Calendar } from "lucide-react";

export const WeeklySales = () => {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["weekly-sales"],
    queryFn: fetchWeeklySales,
  });

  if (isLoading) return <ChartSkeleton height="h-56" />;

  const hasData = data.some((d) => d.sales > 0);

  return (
    <div className="flex flex-col justify-between p-5 rounded-lg border border-border/60 bg-surface/50 h-full">
      <div className="pb-2 border-b border-border/40 mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Weekly Sales
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Daily transaction revenue across the past 7 days
        </p>
      </div>

      <div className="h-56 mt-2">
        {isError ? (
          <ErrorState
            title="Failed to load weekly trends"
            message="Could not retrieve past 7-day revenue."
            onRetry={() => refetch()}
            className="h-full"
          />
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(1 0 0 / 0.07)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
                        {item.day}
                      </p>
                      <p className="text-primary font-bold font-mono mt-0.5">
                        {formatINR(item.sales)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="sales"
                fill="oklch(0.65 0.18 265)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              No recent weekly sales
            </p>
            <p className="text-[11.5px] text-muted-foreground max-w-xs mt-0.5">
              Daily revenue comparison chart will populate as orders are completed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
