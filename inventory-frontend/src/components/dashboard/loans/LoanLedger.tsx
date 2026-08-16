import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MoreHorizontal, X, CheckCircle2, IndianRupee, PlusCircle, User, MapPin } from "lucide-react";
import { toast } from "sonner";
import { calculateSettlement, type SettlementCalculation } from "@/lib/api/loans";

import { cn, formatINR } from "@/lib/utils";
import {
  closeLoan,
  fetchLoans,
  settleLoan,
  payInterest,
  fetchInterestPayments,
  previewInterestForLoan,
  fetchPendingDisbursements,
  addDisbursement,
  type Loan,
  type InterestPayment,
  type PendingDisbursement,
} from "@/lib/api/loans";
import { queryKeys } from "@/lib/api/query-keys";

type LoanStatus = "ACTIVE" | "CLOSED";

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success",
  CLOSED: "bg-muted text-muted-foreground",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const todayIso = () => new Date().toISOString().slice(0, 10);

// Fallback monthly interest rate when backend does not provide one
const FALLBACK_MONTHLY_INTEREST_RATE = 0.02;

export const LoanLedger = () => {
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [tab, setTab] = useState<"all" | LoanStatus>("all");
  const [computed, setComputed] = useState<SettlementCalculation | null>(null);

  const displayMonthlyRate = computed ? computed.monthlyInterest * 100 : FALLBACK_MONTHLY_INTEREST_RATE * 100;

  // settle state
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [closeDate, setCloseDate] = useState(todayIso());
  const [settlementAmount, setSettlementAmount] = useState(0);

  // interest payment state
  const [interestTarget, setInterestTarget] = useState<Loan | null>(null);
  const [interestAmount, setInterestAmount] = useState(0);
  const [interestNote, setInterestNote] = useState("Interest payment");
  const [interestFromDate, setInterestFromDate] = useState(todayIso());
  const [interestToDate, setInterestToDate] = useState(todayIso());
  const [interestRate, setInterestRate] = useState(2);
  const [interestComputed, setInterestComputed] = useState<SettlementCalculation | null>(null);

  // disbursement state
  const [disburseTarget, setDisburseTarget] = useState<Loan | null>(null);
  const [disburseAmount, setDisburseAmount] = useState(0);
  const [disburseDate, setDisburseDate] = useState(todayIso());

  const { data: loans = [] } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: fetchLoans,
  });

  // fetch payment history when interest dialog opens
  const { data: interestPayment = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", interestTarget?.id],
    queryFn: () => fetchInterestPayments(interestTarget!.id),
    enabled: !!interestTarget,
  });

  // fetch payment history when disbursement dialog opens
  const { data: disbursePayments = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", disburseTarget?.id],
    queryFn: () => fetchInterestPayments(disburseTarget!.id),
    enabled: !!disburseTarget,
  });

  const minDisburseDate = useMemo(() => {
    if (!disburseTarget) return todayIso();
    if (disbursePayments.length > 0) {
      return disbursePayments[disbursePayments.length - 1].paymentDate;
    }
    return disburseTarget.issueDate;
  }, [disburseTarget, disbursePayments]);

  // fetch pending disbursements when dialog opens
  const { data: pendingDisbursements = [] } = useQuery<PendingDisbursement[]>({
    queryKey: ["pending-disbursements", interestTarget?.id],
    queryFn: () => fetchPendingDisbursements(interestTarget!.id),
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
      qc.invalidateQueries({ queryKey: ["pending-disbursements"] });
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const disburseMutation = useMutation({
    mutationFn: (d: { id: string; amount: number; date: string }) =>
      addDisbursement(d.id, d.amount, d.date),
    onSuccess: () => {
      toast.success("Disbursement added");
      setDisburseTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: ["pending-disbursements"] });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to add disbursement";
      toast.error(msg);
    },
  });


  useEffect(() => {
    if (!settleTarget) return;
    const timer = setTimeout(async () => {
      try {
        const result = await calculateSettlement(settleTarget.id, closeDate);
        setComputed(result);
        setSettlementAmount(result.totalAmount);
      } catch (err) {
        console.error("Settlement calc failed:", err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [settleTarget, closeDate]);

  const openSettle = (l: Loan) => {
    setSettleTarget(l);
    setComputed(null);
    const today = todayIso();
    setCloseDate(today);
  };

  const openInterest = (l: Loan) => {
    setInterestTarget(l);
    setInterestAmount(0);
    setInterestComputed(null);
    setInterestFromDate(l.issueDate);
    setInterestToDate(todayIso());
    setInterestRate(2);
  };

  const openDisburse = (l: Loan) => {
    setDisburseTarget(l);
    setDisburseAmount(0);
    setDisburseDate(todayIso());
  };

  useEffect(() => {
    if (interestPayment.length > 0 && interestTarget) {
      setInterestFromDate(interestPayment[interestPayment.length - 1].paymentDate);
    } else if (interestPayment.length === 0 && interestTarget) {
      setInterestFromDate(interestTarget.issueDate);
    }
  }, [interestPayment, interestTarget]);

  useEffect(() => {
    if (!interestTarget) return;
    const timer = setTimeout(async () => {
      try {
        if (new Date(interestToDate) < new Date(interestFromDate)) {
          setInterestComputed(null);
          return;
        }
        const result = await previewInterestForLoan(interestTarget.id, interestFromDate, interestToDate, interestRate);
        setInterestComputed(result);
      } catch (err) {
        console.error("Interest calc failed:", err);
        setInterestComputed(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [interestTarget, interestFromDate, interestToDate, interestRate, pendingDisbursements]);


  const filtered = useMemo(() => {
    const cQuery = customerSearch.trim().toLowerCase();
    const aQuery = addressSearch.trim().toLowerCase();

    return loans.filter((l: Loan) => {
      const tabMatch = tab === "all" || l.status === tab;

      const customerMatch =
        !cQuery ||
        (l.name ? l.name.toLowerCase().includes(cQuery) : false) ||
        (l.fatherName ? l.fatherName.toLowerCase().includes(cQuery) : false) ||
        String(l.id || "").toLowerCase().includes(cQuery);

      const addressMatch =
        !aQuery ||
        (l.address ? l.address.toLowerCase().includes(aQuery) : false);

      let searchMatch = true;
      if (cQuery && aQuery) {
        // Independent OR match as requested: matches either customer or address
        searchMatch = customerMatch || addressMatch;
      } else if (cQuery) {
        searchMatch = customerMatch;
      } else if (aQuery) {
        searchMatch = addressMatch;
      }

      return tabMatch && searchMatch;
    });
  }, [loans, customerSearch, addressSearch, tab]);

  const totals = useMemo(() => {
    const activeLoans = filtered.filter((l) => l.status === "ACTIVE");
    return { outstanding: activeLoans.reduce((s, l) => s + l.loanAmount, 0) };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* ── toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Customer / Father Name Search */}
          <div className="relative flex-1 max-w-sm">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search name / father's name…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-surface-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => setCustomerSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Address Search */}
          <div className="relative flex-1 max-w-sm">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              placeholder="Search by address…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-surface-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {addressSearch && (
              <button
                type="button"
                onClick={() => setAddressSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 shrink-0">
          {(["all", "ACTIVE", "CLOSED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md capitalize",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-2",
              )}
            >
              {t.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Outstanding across active loans:{" "}
        <span className="font-semibold text-foreground">{formatINR(totals.outstanding)}</span>
      </p>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              {[
                "Loan ID",
                "Customer",
                "Father's Name",
                "Metal",
                "Weight",
                "Description",
                "Issued",
                "Amount",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((l: Loan) => (
              <tr key={l.id} className="hover:bg-surface-2/50 transition-colors">
                <td className="px-4 py-3.5 text-muted-foreground text-xs font-mono">{l.id}</td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <p className="font-semibold text-[13px]">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground">{l.mobileNo}</p>
                </td>
                <td className="px-4 py-3.5 text-[13px] whitespace-nowrap">
                  {l.fatherName ? (
                    <span className="font-medium text-foreground/90">{l.fatherName}</span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 font-medium text-[13px] whitespace-nowrap">{l.metal}</td>
                <td className="px-4 py-3.5 text-[13px] tabular-nums font-medium whitespace-nowrap">
                  {l.weight ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11.5px] font-medium bg-surface-2 text-foreground/90 border border-border/50">
                      {l.weight} g
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-[12.5px] text-muted-foreground max-w-[200px] truncate" title={l.description || ""}>
                  {l.description || <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-[13px] whitespace-nowrap">
                  {fmtDate(l.issueDate)}
                </td>
                <td className="px-4 py-3.5 font-semibold tabular-nums whitespace-nowrap">
                  {formatINR(l.loanAmount)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                      statusStyle[l.status] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {l.status === "ACTIVE" && (
                      <>
                        {/* ── Add disbursement button ── */}
                        <button
                          title="Add disbursement"
                          onClick={() => openDisburse(l)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        
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
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No loans found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DISBURSEMENT MODAL */}
      {disburseTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setDisburseTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface p-6 space-y-5 animate-in zoom-in-95"
            style={{ boxShadow: "var(--shadow-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold">Add Disbursement</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Loan #{disburseTarget.id} · {disburseTarget.name} · {disburseTarget.metal}
                  {disburseTarget.weight ? ` (${disburseTarget.weight}g)` : ""}
                </p>
              </div>
              <button
                onClick={() => setDisburseTarget(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                  Amount to disburse (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={disburseAmount || ""}
                  onChange={(e) => setDisburseAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11.5px] font-medium text-muted-foreground tracking-wide">
                  Disbursed Date
                </label>
                <input
                  type="date"
                  value={disburseDate}
                  min={minDisburseDate}
                  max={todayIso()}
                  onChange={(e) => setDisburseDate(e.target.value)}
                  className="w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">
                  Earliest allowed date: <span className="font-medium text-foreground">{fmtDate(minDisburseDate)}</span>
                  {disbursePayments.length > 0 ? " (last interest payment)" : " (loan origination)"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDisburseTarget(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                disabled={
                  disburseMutation.isPending ||
                  disburseAmount <= 0 ||
                  Boolean(disburseDate && disburseDate < minDisburseDate)
                }
                onClick={() => {
                  if (disburseDate < minDisburseDate) {
                    toast.error(`Disbursement date cannot be earlier than ${fmtDate(minDisburseDate)}`);
                    return;
                  }
                  disburseMutation.mutate({
                    id: disburseTarget.id,
                    amount: disburseAmount,
                    date: disburseDate,
                  });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                {disburseMutation.isPending ? "Saving…" : "Add funds"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Loan #{interestTarget.id} · {interestTarget.name} · {interestTarget.metal}
                  {interestTarget.weight ? ` (${interestTarget.weight}g)` : ""}
                </p>
              </div>
              <button
                onClick={() => setInterestTarget(null)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dates & Rate inputs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">From</label>
                <input
                  type="date"
                  value={interestFromDate}
                  readOnly
                  className="w-full bg-surface-2 rounded-md py-1.5 px-2 text-[13px] opacity-70 cursor-not-allowed focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">To</label>
                <input
                  type="date"
                  value={interestToDate}
                  min={interestFromDate}
                  onChange={(e) => setInterestToDate(e.target.value)}
                  className="w-full bg-surface-2 rounded-md py-1.5 px-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-2 rounded-md py-1.5 px-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Live preview of new balance */}
            <div className="rounded-lg bg-surface-2 px-4 py-3 space-y-1.5 text-[12.5px]">
              {pendingDisbursements.map((d) => (
                <div key={d.id} className="flex justify-between text-muted-foreground text-[11px] bg-amber-500/10 px-2 py-1 rounded">
                  <span>Pending: disbursed {fmtDate(d.disbursedDate)}</span>
                  <span className="tabular-nums">+ {formatINR(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground">
                <span>Base amount</span>
                <span className="tabular-nums">{interestComputed ? formatINR(interestComputed.principal) : formatINR(interestTarget.loanAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Computed interest</span>
                <span className="tabular-nums">{interestComputed ? formatINR(interestComputed.interestAmount) : "..."}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total due</span>
                <span className="tabular-nums">{interestComputed ? formatINR(interestComputed.totalAmount) : "..."}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border-subtle">
                <span className="font-medium">Payment</span>
                <span className="tabular-nums text-amber-400 font-medium">− {formatINR(interestAmount)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>New balance</span>
                <span className="tabular-nums">
                  {interestComputed ? formatINR(Math.max(0, interestComputed.totalAmount - interestAmount)) : "..."}
                </span>
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

            {/* Payment history */}
            {interestPayment.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
                  Payment history
                </p>
                <div className="rounded-lg bg-surface-2 divide-y divide-border max-h-36 overflow-y-auto">
                  {interestPayment.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center px-3 py-2 text-[12px]"
                    >
                      <span className="text-muted-foreground">{fmtDate(p.paymentDate)}</span>
                      <span className="tabular-nums text-amber-400">
                        − {formatINR(p.amountPaid)}
                      </span>
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
                    fromDate: interestFromDate,
                    toDate: interestToDate,
                    interestRate: interestRate
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
                  {settleTarget.weight ? ` (${settleTarget.weight}g)` : ""}
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
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Issue date
                </p>
                <p className="text-[13px] font-medium mt-0.5">{fmtDate(settleTarget.issueDate)}</p>
              </div>
              <div className="rounded-lg bg-surface-2 px-3 py-2">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Loan amount
                </p>
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
                <span>Interest @ {displayMonthlyRate}%/mo</span>
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
