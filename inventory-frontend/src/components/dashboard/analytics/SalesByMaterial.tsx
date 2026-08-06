import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { fetchSalesByMaterial } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";

const COLORS: Record<string, string> = {
  Gold: "oklch(0.82 0.13 86)",
  Silver: "oklch(0.75 0.01 270)",
  Other: "oklch(0.6 0.01 270)",
};

export const SalesByMaterial = () => {
  const { data = [], isError, refetch } = useQuery({
    queryKey: ["sales-by-material"],
    queryFn: fetchSalesByMaterial,
  });

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl bg-surface p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-base font-semibold tracking-tight">Sales by Material</h3>
      <p className="text-[12.5px] text-muted-foreground mt-0.5">Revenue split by material</p>

      {isError ? (
        <div className="h-48 flex flex-col items-center justify-center text-sm text-muted-foreground">
          <div>Failed to load sales by material.</div>
          <button className="mt-3 px-3 py-1 rounded bg-surface-2" onClick={() => refetch()}>Retry</button>
        </div>
      ) : total > 0 ? (
        <>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="material" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                  {data.map((entry) => (
                    <Cell key={entry.material} fill={COLORS[entry.material] ?? COLORS.Other} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatINR(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            {data.map((d) => (
              <div key={d.material} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[d.material] ?? COLORS.Other }} />
                <span className="text-[12px] text-foreground">{d.material}</span>
                <span className="text-[12px] text-muted-foreground ml-auto">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          No sales data yet.
        </div>
      )}
    </div>
  );
};