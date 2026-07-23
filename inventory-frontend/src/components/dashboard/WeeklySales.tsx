import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { fetchWeeklySales } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";

export const WeeklySales = () => {
  const { data = [], isError, refetch } = useQuery({
    queryKey: ["weekly-sales"],
    queryFn: fetchWeeklySales,
  });

  return (
    <div className="rounded-xl bg-surface p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-base font-semibold tracking-tight">Weekly Sales</h3>
      <p className="text-[12.5px] text-muted-foreground mt-0.5">Daily revenue across the past 7 days</p>

      <div className="h-56 mt-4">
        {isError ? (
          <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
            <div>Failed to load weekly sales.</div>
            <button className="mt-3 px-3 py-1 rounded bg-surface-2" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.68 0.01 270)" fontSize={11} tickLine={false} axisLine={false} />
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
              formatter={(value: number) => [formatINR(value), "Sales"]}
              cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
            />
            <Bar dataKey="sales" fill="oklch(0.82 0.13 86)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
