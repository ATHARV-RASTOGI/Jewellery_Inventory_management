import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, X, CheckCircle2, IndianRupee } from "lucide-react";
import { toast } from "sonner";

import { cn, formatINR, calculateLoanSettlement, LOAN_MONTHLY_INTEREST } from "@/lib/utils";
import {
  closeLoan, fetchLoans, settleLoan, payInterest,
  fetchInterestPayments, type Loan, type InterestPayment,
} from "@/lib/api/loans";
import { queryKeys } from "@/lib/api/query-keys";

type LoanStatus = "active" | "closed";

const statusStyle: Record<string, string> = {
  active: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

const todayIso = () => new Date().toISOString().slice(0, 10);

export const LoanLedger = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | LoanStatus>("all");

  // settle state
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [closeDate, setCloseDate] = useState(todayIso());
  const [settlementAmount, setSettlementAmount] = useState(0);

  // interest payment state
  const [interestTarget, setInterestTarget] = useState<Loan | null>(null);
  const [interestAmount, setInterestAmount] = useState(0);
  const [interestNote, setInterestNote] = useState("Interest payment");

  const { data: loans = [] } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: fetchLoans,
  });

  // fetch payment history when dialog opens
  const { data: interestPayment = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", interestTarget?.id],
    queryFn: () => fetchInterestPayments(interestTarget!.id),
    enabled: !!interestTarget,
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
      setSettleTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
    },
    onError: () => toast.error("Failed to settle loan"),
  });

  const interestMutation = useMutation({
    mutationFn: payInterest,
    onSuccess: () => {
      toast.success("Interest payment recorded");
      setInterestTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const openSettle = (l: Loan) => {
    setSettleTarget(l);
    const today = todayIso();
    setCloseDate(today);
    const { totalAmount } = calculateLoanSettlement(l.loanAmount, l.issueDate, today);
    setSettlementAmount(totalAmount);
  };

  const openInterest = (l: Loan) => {
    setInterestTarget(l);
    // pre-fill with one month's interest
    const monthlyInterest = Math.round(l.loanAmount * LOAN_MONTHLY_INTEREST);
    setInterestAmount(monthlyInterest);
    setInterestNote("Interest payment");
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
        l.name.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.metal.toLowerCase().includes(q);
      return tabMatch && qMatch;
    });
  }, [loans, search, tab]);

  const totals = useMemo(() => {
    const activeLoans = filtered.filter((l) => l.status === "active");
    return { outstanding: activeLoans.reduce((s, l) => s + l.loanAmount, 0) };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* ── toolbar ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loans…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "closed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md capitalize",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-2"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── summary ── */}
      <p className="text-xs text-muted-foreground">
        Outstanding across active loans:{" "}
        <span className="font-semibold text-foreground">{formatINR(totals.outstanding)}</span>
      </p>

      {/* ── table ── */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {["Loan ID", "Customer", "Collateral", "Issued", "Amount", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l: Loan) => (
              <tr key={l.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3.5 text-muted-foreground text-xs">{l.id}</td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-[13px]">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground">{l.mobileNo}</p>
                </td>
                <td className="px-4 py-3.5 font-medium">{l.metal}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-[13px]">
                  {fmtDate(l.issueDate)}
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums">
                  {formatINR(l.loanAmount)}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                      statusStyle[l.status] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {l.status === "active" && (
                      <>
                        {/* ── Pay Interest button ── */}
                        <button
                          title="Pay interest"
                          onClick={() => openInterest(l)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                        >
                          <IndianRupee className="w-4 h-4" />
                        </button>

                        {/* settle */}
                        <button
                          title="Settle loan"
                          onClick={() => openSettle(l)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        {/* delete */}
                        <button
                          title="Delete loan"
                          onClick={() => closeMutation.mutate(l.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No loans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════
          Pay Interest Dialog
      ══════════════════════════════════════ */}
      {interestTarget && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in"
    onClick={() => setInterestTarget(null)}
  >
    <div
      className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-5 animate-in zoom-in-95"
      style={{ boxShadow: "var(--shadow-elevated)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">Pay Interest</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Loan #{interestTarget.id} · {interestTarget.name}
          </p>
        </div>
        <button
          onClick={() => setInterestTarget(null)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Current balance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Current balance
          </p>
          <p className="text-[13px] font-semibold mt-0.5 tabular-nums text-foreground">
            {formatINR(interestTarget.loanAmount)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-2 px-3 py-2">
          <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Monthly interest (2%)
          </p>
          <p className="text-[13px] font-medium mt-0.5 tabular-nums">
            {formatINR(Math.round(interestTarget.loanAmount * LOAN_MONTHLY_INTEREST))}
          </p>
        </div>
      </div>

      {/* Amount input */}
      <div className="space-y-1.5">
        <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
          Amount deposited (₹)
        </label>
        <input
          type="number"
          min={0}
          value={interestAmount || ""}
          onChange={(e) => setInterestAmount(parseFloat(e.target.value) || 0)}
          className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Live preview of new balance */}
      {interestAmount > 0 && (
        <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
          <div className="flex justify-between text-muted-foreground">
            <span>Current balance</span>
            <span className="tabular-nums">{formatINR(interestTarget.loanAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Payment</span>
            <span className="tabular-nums text-amber-400">− {formatINR(interestAmount)}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-border-subtle font-medium text-foreground">
            <span>New balance</span>
            <span className="tabular-nums">
              {formatINR(Math.max(0, interestTarget.loanAmount - interestAmount))}
            </span>
          </div>
        </div>
      )}

      {/* Payment history */}
      {interestPayment.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
            Payment history
          </p>
          <div className="rounded-lg bg-surface-2 divide-y divide-border max-h-36 overflow-y-auto">
            {interestPayment.map((p) => (
              <div key={p.id} className="flex justify-between items-center px-3 py-2 text-[12px]">
                <span className="text-muted-foreground">{fmtDate(p.paymentDate)}</span>
                <span className="tabular-nums text-amber-400">− {formatINR(p.amountPaid)}</span>
                <span className="tabular-nums text-muted-foreground">
                  bal: {formatINR(p.balanceAfter)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={() => setInterestTarget(null)}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          disabled={interestMutation.isPending || interestAmount <= 0}
          onClick={() =>
            interestMutation.mutate({
              id: interestTarget.id,
              amountPaid: interestAmount,
            })
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          <IndianRupee className="w-4 h-4" />
          {interestMutation.isPending ? "Recording…" : "Record payment"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ══════════════════════════════════════
          Settle Dialog (unchanged)
      ══════════════════════════════════════ */}
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
                <h3 className="text-base font-semibold">Close loan #{settleTarget.id}</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {settleTarget.name} · {settleTarget.metal}
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
                    d
                  );
                  setSettlementAmount(totalAmount);
                }}
                className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Duration</span>
                <span className="tabular-nums">{computed.months} month(s)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Interest @ {LOAN_MONTHLY_INTEREST * 100}%/mo</span>
                <span className="tabular-nums">{formatINR(computed.interestAmount)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border-subtle">
                <span className="font-medium text-foreground">Total calculated</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatINR(computed.totalAmount)}
                </span>
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