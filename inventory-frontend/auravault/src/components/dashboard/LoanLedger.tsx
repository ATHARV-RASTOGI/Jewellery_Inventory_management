import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { cn, formatINR, calculateLoanSettlement, LOAN_MONTHLY_INTEREST } from "@/lib/utils";
import { closeLoan, fetchLoans, settleLoan, type Loan } from "@/lib/api/loans";
import { queryKeys } from "@/lib/api/query-keys";

// We define LoanStatus locally since it's mapped to specific string values
type LoanStatus = "active" | "closed";

const statusStyle: Record<string, string> = {
  active: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  closed: "Closed",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const todayIso = () => new Date().toISOString().slice(0, 10);

export const LoanLedger = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | LoanStatus>("all");
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [closeDate, setCloseDate] = useState<string>(todayIso());
  const [settlementAmount, setSettlementAmount] = useState<number>(0);

  const { data: loans = [] } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: fetchLoans,
  });

  const closeMutation = useMutation({
    mutationFn: closeLoan,
    onSuccess: () => {
      toast.success("Loan deleted");
      qc.invalidateQueries({ queryKey: queryKeys.loans });
    },
  });

  const settleMutation = useMutation({
    mutationFn: settleLoan,
    onSuccess: () => {
      toast.success("Loan settled");
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      setSettleTarget(null);
    },
    onError: () => toast.error("Failed to settle loan"),
  });

  const openSettle = (l: Loan) => {
    setSettleTarget(l);
    const today = todayIso();
    setCloseDate(today);
    const { totalAmount } = calculateLoanSettlement(l.loanAmount, l.issueDate, today);
    setSettlementAmount(totalAmount);
  };

  const computed = useMemo(() => {
    if (!settleTarget) return null;
    return calculateLoanSettlement(settleTarget.loanAmount, settleTarget.issueDate, closeDate);
  }, [settleTarget, closeDate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l: Loan) => {
      const tabMatch = tab === "all" || l.status === tab;
      const qMatch =
        !q ||
        l.customerName.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.metalType.toLowerCase().includes(q);
      return tabMatch && qMatch;
    });
  }, [loans, search, tab]);

  const totals = useMemo(() => {
    // Only calculate outstanding amount for active loans
    const activeLoans = filtered.filter(l => l.status === "active");
    const outstanding = activeLoans.reduce((s, l) => s + l.loanAmount, 0);
    return { outstanding };
  }, [filtered]);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, loan ID or metal type"
            className="w-full bg-surface rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors",
                tab === t.id
                  ? "bg-surface-2 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Loans</p>
          <p className="text-[18px] font-semibold mt-1">{filtered.length}</p>
        </div>
        <div className="rounded-xl bg-surface px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Outstanding Principal</p>
          <p className="text-[18px] font-semibold mt-1">{formatINR(totals.outstanding)}</p>
        </div>
      </div>

      {/* Ledger table */}
      <div className="rounded-xl bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
                <th className="text-left font-medium px-5 py-3">Loan ID</th>
                <th className="text-left font-medium px-5 py-3">Customer</th>
                <th className="text-left font-medium px-5 py-3">Collateral</th>
                <th className="text-left font-medium px-5 py-3">Issued</th>
                <th className="text-right font-medium px-5 py-3">Amount</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground text-sm">
                    No loans found.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => l.status !== "closed" && openSettle(l)}
                    className={cn(
                      "border-t border-border-subtle transition-colors",
                      l.status !== "closed"
                        ? "cursor-pointer hover:bg-surface-2/40"
                        : "hover:bg-surface-2/20",
                    )}
                  >
                    <td className="px-5 py-4 font-mono text-[12.5px] text-muted-foreground">
                      {l.id}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[13.5px]">{l.customerName}</p>
                      <p className="text-[11.5px] text-muted-foreground">{l.phoneNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[13px] font-medium">{l.metalType}</span>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-muted-foreground">
                      {fmtDate(l.issueDate)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums font-medium">
                      {formatINR(l.loanAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          statusStyle[l.status] || statusStyle.active,
                        )}
                      >
                        {statusLabel[l.status] || statusLabel.active}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {l.status !== "closed" && (
                          <button
                            onClick={() => openSettle(l)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                            aria-label="Settle loan"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {l.status !== "closed" && (
                          <button
                            onClick={() => closeMutation.mutate(l.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                            aria-label="Delete loan"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle dialog */}
      {settleTarget && computed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSettleTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-5 animate-in zoom-in-95"
            style={{ boxShadow: "var(--shadow-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Close loan {settleTarget.id}</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {settleTarget.customerName} · {settleTarget.metalType}
                </p>
              </div>
              <button
                onClick={() => setSettleTarget(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Issue date</p>
                <p className="text-[13px] font-medium mt-0.5">{fmtDate(settleTarget.issueDate)}</p>
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Loan amount</p>
                <p className="text-[13px] font-medium mt-0.5 tabular-nums">
                  {formatINR(settleTarget.loanAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                Close date
              </label>
              <input
                type="date"
                value={closeDate}
                min={settleTarget.issueDate}
                onChange={(e) => {
                  const d = e.target.value;
                  setCloseDate(d);
                  const { totalAmount } = calculateLoanSettlement(
                    settleTarget.loanAmount,
                    settleTarget.issueDate,
                    d,
                  );
                  setSettlementAmount(totalAmount);
                }}
                className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Duration</span>
                <span className="tabular-nums">
                  {computed.months} month(s)
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Interest @ {LOAN_MONTHLY_INTEREST * 100}%/mo</span>
                <span className="tabular-nums">{formatINR(computed.interestAmount)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border-subtle">
                <span className="font-medium text-foreground">Total calculated</span>
                <span className="font-semibold tabular-nums text-foreground">{formatINR(computed.totalAmount)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                Agreed settlement amount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={settlementAmount || ""}
                onChange={(e) => setSettlementAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setSettleTarget(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                disabled={settleMutation.isPending}
                onClick={() =>
                  settleMutation.mutate({
                    id: settleTarget.id,
                    closeDate,
                    settlementAmount,
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                {settleMutation.isPending ? "Closing…" : "Close loan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};