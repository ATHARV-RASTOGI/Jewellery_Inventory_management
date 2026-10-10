import { useQuery } from "@tanstack/react-query";
import { fetchRecentSales } from "@/lib/api/sales";
import { formatINR } from "@/lib/utils";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { ShoppingBag } from "lucide-react";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const RecentSales = () => {
  const { data = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: () => fetchRecentSales(5),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-between p-5 rounded-lg border border-border/60 bg-surface/50 h-full">
        <div className="space-y-1.5 mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-md shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between p-3.5 rounded border border-border bg-surface shadow-xs h-full">
      <div className="pb-2 border-b border-border/60 mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
            Recent Counter Invoices
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {data.length} latest transaction{data.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 min-h-[160px] flex flex-col justify-center">
        {isError ? (
          <ErrorState
            title="Failed to load transactions"
            message="Could not retrieve recent sales from server."
            onRetry={() => refetch()}
            className="py-4"
          />
        ) : data.length > 0 ? (
          <div className="divide-y divide-border/40">
            {data.map((sale) => (
              <div
                key={sale.id}
                className="py-2 px-1.5 flex items-center justify-between hover:bg-surface-2/60 rounded transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-primary/15 text-primary flex items-center justify-center text-[10.5px] font-bold shrink-0 font-mono border border-primary/20">
                    {initials(sale.customerName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {sale.customerName}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground font-mono">
                      Invoice #{sale.id} · {sale.itemCount ?? 1} item
                      {(sale.itemCount ?? 1) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-mono text-foreground tabular-nums">
                    {formatINR(sale.grandTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-8 h-8 rounded bg-surface-2 flex items-center justify-center text-muted-foreground mb-1.5">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              No recent sales recorded
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
              Completed counter sales will list here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};