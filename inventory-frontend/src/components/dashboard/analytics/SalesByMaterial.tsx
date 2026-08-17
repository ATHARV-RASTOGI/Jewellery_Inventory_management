import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetchSalesByMaterial } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";
import { ErrorState } from "@/components/feedback/ErrorState";
import { ChartSkeleton } from "@/components/feedback/Skeleton";
import { PieChart as PieIcon } from "lucide-react";

const COLORS: Record<string, string> = {
  Gold: "oklch(0.82 0.13 86)",      // Brand Gold
  Silver: "oklch(0.75 0.02 240)",   // Polished Silver
  Diamond: "oklch(0.70 0.15 200)",  // Ice Blue
  Other: "oklch(0.60 0.01 265)",
};

export const SalesByMaterial = () => {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["sales-by-material"],
    queryFn: fetchSalesByMaterial,
  });

  if (isLoading) return <ChartSkeleton height="h-48" />;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col justify-between p-5 rounded-lg border border-border/60 bg-surface/50 h-full">
      <div className="pb-2 border-b border-border/40 mb-3">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Sales by Material
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Revenue split across jewelry categories
        </p>
      </div>

      <div className="min-h-[220px] mt-2 flex flex-col justify-center">
        {isError ? (
          <ErrorState
            title="Failed to load material split"
            message="Could not retrieve sales breakdown."
            onRetry={() => refetch()}
            className="py-6"
          />
        ) : total > 0 ? (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="material"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.material] || COLORS.Other}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-popover-foreground">
                            {item.material}
                          </p>
                          <p className="text-primary font-bold font-mono">
                            {formatINR(item.value)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{pct}% of total sales</p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-border/40 text-xs">
              {data.map((d) => (
                <div key={d.material} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: COLORS[d.material] || COLORS.Other }}
                  />
                  <span className="text-muted-foreground">{d.material}</span>
                  <span className="font-semibold text-foreground font-mono">
                    {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center text-muted-foreground mb-2">
              <PieIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              No sales breakdown
            </p>
            <p className="text-[11.5px] text-muted-foreground max-w-xs mt-0.5">
              Material split will calculate once counter sales occur.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};