import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchRevenueOverview } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export const RevenueOverview = () => {
  const { data = [], isError, refetch } = useQuery({
    queryKey: ["revenue-overview"],
    queryFn: fetchRevenueOverview,
  });

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <div className="rounded-xl bg-surface p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Revenue Overview</h3>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            Monthly performance for {new Date().getFullYear()}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-soft text-gold text-[11px] font-medium">
          <TrendingUp className="w-3 h-3" />
          Live
        </span>
      </div>

      <div className="h-64 mt-4">
        {isError ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
            <div>Failed to load revenue overview.</div>
            <button className="mt-3 px-3 py-1 rounded bg-surface-2" onClick={() => refetch()}>Retry</button>
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="oklch(0.82 0.13 86)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.68 0.01 270)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="oklch(0.68 0.01 270)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatINR(value), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="oklch(0.82 0.13 86)" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No sales recorded yet this year.
          </div>
        )}
      </div>
    </div>
  );
};