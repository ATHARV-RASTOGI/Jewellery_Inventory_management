import { useQuery } from "@tanstack/react-query";
import { fetchRecentSales } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export const RecentSales = () => {
  const { data = [], isError, refetch } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => fetchRecentSales(5),
  });

  return (
    <div className="rounded-xl bg-surface p-6" style={{ boxShadow: "var(--shadow-card)" }}>
      <h3 className="text-base font-semibold tracking-tight">Recent Sales</h3>
      <p className="text-[12.5px] text-muted-foreground mt-0.5">
        {data.length} sale{data.length === 1 ? "" : "s"} recorded recently
      </p>

      <div className="mt-4 space-y-1">
        {isError ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Failed to load recent sales.
            <div>
              <button className="mt-2 px-3 py-1 rounded bg-surface-2" onClick={() => refetch()}>Retry</button>
            </div>
          </div>
        ) : (
          data.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No sales yet.</p>
          )
        )}
        {data.map((sale) => (
          <div key={sale.id} className="flex items-center gap-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-gold-soft text-gold flex items-center justify-center text-[12px] font-semibold shrink-0">
              {initials(sale.customerName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">{sale.customerName}</p>
              <p className="text-[11.5px] text-muted-foreground truncate">{sale.customerPhoneNo}</p>
            </div>
            <span className="text-[13px] font-semibold text-success tabular-nums shrink-0">
              +{formatINR(sale.grandTotal)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};