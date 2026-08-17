import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  X,
  CheckCircle2,
  IndianRupee,
  PlusCircle,
  User,
  MapPin,
  Trash2,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { calculateSettlement, type SettlementCalculation } from "@/lib/api/loans";
import { LoanSlip } from "@/components/receipts/LoanSlip";

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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TableSkeleton } from "@/components/feedback/Skeleton";

type LoanStatus = "ACTIVE" | "CLOSED";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const todayIso = () => new Date().toISOString().slice(0, 10);

const FALLBACK_MONTHLY_INTEREST_RATE = 0.02;

export const LoanLedger = () => {
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [tab, setTab] = useState<"all" | LoanStatus>("all");
  const [computed, setComputed] = useState<SettlementCalculation | null>(null);

  const displayMonthlyRate = computed
    ? computed.monthlyInterest * 100
    : FALLBACK_MONTHLY_INTEREST_RATE * 100;

  // settle state
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [closeDate, setCloseDate] = useState(todayIso());
  const [settlementAmount, setSettlementAmount] = useState(0);

  // interest payment state
  const [interestTarget, setInterestTarget] = useState<Loan | null>(null);
  const [interestAmount, setInterestAmount] = useState(0);
  const [interestFromDate, setInterestFromDate] = useState(todayIso());
  const [interestToDate, setInterestToDate] = useState(todayIso());
  const [interestRate, setInterestRate] = useState(2);
  const [interestComputed, setInterestComputed] =
    useState<SettlementCalculation | null>(null);

  // disbursement state
  const [disburseTarget, setDisburseTarget] = useState<Loan | null>(null);
  const [disburseAmount, setDisburseAmount] = useState(0);
  const [disburseDate, setDisburseDate] = useState(todayIso());

  // delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);

  // print statement state
  const [printStatementTarget, setPrintStatementTarget] = useState<Loan | null>(null);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: queryKeys.loans,
    queryFn: fetchLoans,
  });

  // fetch payments for statement
  const { data: statementPayments = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", printStatementTarget?.id],
    queryFn: () => fetchInterestPayments(printStatementTarget!.id),
    enabled: !!printStatementTarget,
  });

  const { data: statementDisbursements = [] } = useQuery<PendingDisbursement[]>({
    queryKey: ["pending-disbursements", printStatementTarget?.id],
    queryFn: () => fetchPendingDisbursements(printStatementTarget!.id),
    enabled: !!printStatementTarget,
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
      toast.success("Loan record removed");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
    },
    onError: () => toast.error("Failed to delete loan"),
  });

  const settleMutation = useMutation({
    mutationFn: settleLoan,
    onSuccess: () => {
      toast.success("Loan settled and marked closed");
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
      toast.success("Disbursement added to loan balance");
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
    setCloseDate(todayIso());
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
      setInterestFromDate(
        interestPayment[interestPayment.length - 1].paymentDate
      );
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
        const result = await previewInterestForLoan(
          interestTarget.id,
          interestFromDate,
          interestToDate,
          interestRate
        );
        setInterestComputed(result);
      } catch (err) {
        console.error("Interest calc failed:", err);
        setInterestComputed(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    interestTarget,
    interestFromDate,
    interestToDate,
    interestRate,
    pendingDisbursements,
  ]);

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
    return {
      count: activeLoans.length,
      outstanding: activeLoans.reduce((s, l) => s + l.loanAmount, 0),
    };
  }, [filtered]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Customer / Father Name Search */}
          <div className="relative flex-1 max-w-sm">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search by customer / father's name…"
              className="w-full pl-9 pr-8 py-2 text-xs bg-surface-2 border border-border/60 hover:border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
              placeholder="Filter by city / address…"
              className="w-full pl-9 pr-8 py-2 text-xs bg-surface-2 border border-border/60 hover:border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border/60 shrink-0">
          {(["all", "ACTIVE", "CLOSED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                tab === t
                  ? "bg-surface text-primary font-semibold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "All Loans" : t.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary metric bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <p>
          Showing <span className="font-medium text-foreground">{filtered.length}</span> loans ·{" "}
          Outstanding balance:{" "}
          <span className="font-semibold text-foreground">
            {formatINR(totals.outstanding)}
          </span>
        </p>
      </div>

      {/* Main Ledger Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No loan records found"
          description="Try adjusting your customer name or address search filters."
          action={
            customerSearch || addressSearch ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomerSearch("");
                  setAddressSearch("");
                  setTab("all");
                }}
              >
                Reset Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-surface overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/80">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Father's Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Collateral
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Weight
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Issued
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Principal
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((l: Loan) => (
                <tr
                  key={l.id}
                  className="hover:bg-surface-2/50 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    #{l.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-[13px] text-foreground">
                      {l.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {l.mobileNo}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] whitespace-nowrap">
                    {l.fatherName ? (
                      <span className="text-foreground/90">{l.fatherName}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-[12.5px] whitespace-nowrap">
                    <span
                      className={
                        l.metal.toLowerCase() === "gold"
                          ? "text-gold font-semibold"
                          : "text-slate-300 font-semibold"
                      }
                    >
                      {l.metal}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12.5px] tabular-nums text-right whitespace-nowrap">
                    {l.weight ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11.5px] font-medium bg-surface-2 text-foreground border border-border/50">
                        {l.weight} g
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px] text-muted-foreground max-w-[180px] truncate"
                    title={l.description || ""}
                  >
                    {l.description || (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[12.5px] whitespace-nowrap">
                    {fmtDate(l.issueDate)}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-right text-foreground whitespace-nowrap">
                    {formatINR(l.loanAmount)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <StatusBadge
                      variant={l.status === "ACTIVE" ? "success" : "neutral"}
                      withDot
                    >
                      {l.status === "ACTIVE" ? "Active" : "Closed"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Print Statement & Payment History Voucher */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Print Loan Statement & History"
                        aria-label="Print Loan Statement & History"
                        onClick={() => setPrintStatementTarget(l)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>

                      {l.status === "ACTIVE" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Add Disbursement"
                            aria-label="Add Disbursement"
                            onClick={() => openDisburse(l)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Record Interest Payment"
                            aria-label="Record Interest Payment"
                            onClick={() => openInterest(l)}
                            className="h-8 w-8 text-muted-foreground hover:text-warning hover:bg-warning/10"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Settle & Close Loan"
                            aria-label="Settle & Close Loan"
                            onClick={() => openSettle(l)}
                            className="h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Loan"
                            aria-label="Delete Loan"
                            onClick={() => setDeleteTarget(l)}
                            className="h-8 w-8 text-muted-foreground hover:text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DISBURSEMENT MODAL */}
      {disburseTarget && (
        <Modal
          open={!!disburseTarget}
          onClose={() => setDisburseTarget(null)}
          title="Add Collateral Disbursement"
          subtitle={`Loan #${disburseTarget.id} · ${disburseTarget.name} · ${disburseTarget.metal}${
            disburseTarget.weight ? ` (${disburseTarget.weight}g)` : ""
          }`}
          maxWidth="sm"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDisburseTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={
                  disburseMutation.isPending ||
                  disburseAmount <= 0 ||
                  Boolean(disburseDate && disburseDate < minDisburseDate)
                }
                isLoading={disburseMutation.isPending}
                onClick={() => {
                  if (disburseDate < minDisburseDate) {
                    toast.error(
                      `Disbursement date cannot be earlier than ${fmtDate(
                        minDisburseDate
                      )}`
                    );
                    return;
                  }
                  disburseMutation.mutate({
                    id: disburseTarget.id,
                    amount: disburseAmount,
                    date: disburseDate,
                  });
                }}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Add Funds
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Amount to Disburse (₹)"
              type="number"
              min={1}
              value={disburseAmount || ""}
              onChange={(e) =>
                setDisburseAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="e.g. 5000"
            />

            <Input
              label="Disbursed Date"
              type="date"
              value={disburseDate}
              min={minDisburseDate}
              max={todayIso()}
              onChange={(e) => setDisburseDate(e.target.value)}
              helperText={`Earliest allowed date: ${fmtDate(minDisburseDate)} (${
                disbursePayments.length > 0
                  ? "last payment"
                  : "origination"
              })`}
            />
          </div>
        </Modal>
      )}

      {/* INTEREST PAYMENT MODAL */}
      {interestTarget && (
        <Modal
          open={!!interestTarget}
          onClose={() => setInterestTarget(null)}
          title="Record Interest Payment"
          subtitle={`Loan #${interestTarget.id} · ${interestTarget.name} · ${interestTarget.metal}${
            interestTarget.weight ? ` (${interestTarget.weight}g)` : ""
          }`}
          maxWidth="md"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInterestTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={interestMutation.isPending || interestAmount <= 0}
                isLoading={interestMutation.isPending}
                onClick={() =>
                  interestMutation.mutate({
                    id: interestTarget.id,
                    amountPaid: interestAmount,
                    fromDate: interestFromDate,
                    toDate: interestToDate,
                    interestRate: interestRate,
                  })
                }
                leftIcon={<IndianRupee className="w-4 h-4" />}
              >
                Record Payment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Dates & Rate Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <Input
                label="From Date"
                type="date"
                value={interestFromDate}
                disabled
              />
              <Input
                label="To Date"
                type="date"
                value={interestToDate}
                min={interestFromDate}
                onChange={(e) => setInterestToDate(e.target.value)}
              />
              <Input
                label="Monthly Rate (%)"
                type="number"
                min={0}
                step={0.1}
                value={interestRate}
                onChange={(e) =>
                  setInterestRate(parseFloat(e.target.value) || 0)
                }
              />
            </div>

            {/* Calculated Breakdown Card */}
            <div className="rounded-xl bg-surface-2 p-3.5 space-y-2 text-xs border border-border/60">
              {pendingDisbursements.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between text-muted-foreground bg-warning-soft text-warning px-2.5 py-1 rounded-md"
                >
                  <span>Pending disbursement ({fmtDate(d.disbursedDate)})</span>
                  <span className="tabular-nums font-semibold">
                    + {formatINR(d.amount)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between text-muted-foreground">
                <span>Principal base</span>
                <span className="tabular-nums font-medium text-foreground">
                  {interestComputed
                    ? formatINR(interestComputed.principal)
                    : formatINR(interestTarget.loanAmount)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Calculated interest</span>
                <span className="tabular-nums font-medium text-foreground">
                  {interestComputed
                    ? formatINR(interestComputed.interestAmount)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/40 font-semibold text-foreground">
                <span>Total due</span>
                <span className="tabular-nums">
                  {interestComputed
                    ? formatINR(interestComputed.totalAmount)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border/40">
                <span className="font-medium text-foreground">Payment applied</span>
                <span className="tabular-nums text-success font-semibold">
                  − {formatINR(interestAmount)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-foreground">
                <span>New balance</span>
                <span className="tabular-nums text-primary font-bold">
                  {interestComputed
                    ? formatINR(
                        Math.max(
                          0,
                          interestComputed.totalAmount - interestAmount
                        )
                      )
                    : "—"}
                </span>
              </div>
            </div>

            <Input
              label="Amount Deposited (₹)"
              type="number"
              min={0}
              value={interestAmount || ""}
              onChange={(e) =>
                setInterestAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="₹ 0"
            />

            {/* Payment history */}
            {interestPayment.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Previous Payment Records ({interestPayment.length})
                </p>
                <div className="rounded-lg bg-surface-2 divide-y divide-border/40 max-h-32 overflow-y-auto border border-border/60">
                  {interestPayment.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center px-3 py-2 text-[12px]"
                    >
                      <span className="text-muted-foreground">
                        {fmtDate(p.paymentDate)}
                      </span>
                      <span className="tabular-nums text-success font-medium">
                        − {formatINR(p.amountPaid)}
                      </span>
                      <span className="tabular-nums text-muted-foreground font-mono">
                        bal: {formatINR(p.balanceAfter)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* SETTLEMENT & CLOSE MODAL */}
      {settleTarget && computed && (
        <Modal
          open={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          title={`Close & Settle Loan #${settleTarget.id}`}
          subtitle={`${settleTarget.name} · ${settleTarget.metal}${
            settleTarget.weight ? ` (${settleTarget.weight}g)` : ""
          }`}
          maxWidth="md"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettleTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={settleMutation.isPending}
                isLoading={settleMutation.isPending}
                onClick={() =>
                  settleMutation.mutate({
                    id: settleTarget.id,
                    closeDate,
                    settlementAmount,
                  })
                }
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Close &amp; Settle Loan
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-2 p-3 border border-border/60">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Origination Date
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {fmtDate(settleTarget.issueDate)}
                </p>
              </div>
              <div className="rounded-lg bg-surface-2 p-3 border border-border/60">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Initial Principal
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums">
                  {formatINR(settleTarget.loanAmount)}
                </p>
              </div>
            </div>

            <Input
              label="Settlement Closing Date"
              type="date"
              value={closeDate}
              min={settleTarget.issueDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />

            <div className="rounded-xl bg-surface-2 p-3.5 space-y-2 text-xs border border-border/60">
              <div className="flex justify-between text-muted-foreground">
                <span>Duration</span>
                <span className="tabular-nums font-medium text-foreground">
                  {computed.months} month(s)
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Accrued Interest @ {displayMonthlyRate}%/mo</span>
                <span className="tabular-nums font-medium text-foreground">
                  {formatINR(computed.interestAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-border/40 font-bold text-foreground">
                <span>Total Calculated Amount</span>
                <span className="tabular-nums text-primary font-bold">
                  {formatINR(computed.totalAmount)}
                </span>
              </div>
            </div>

            <Input
              label="Agreed Settlement Amount (₹)"
              type="number"
              min={0}
              value={settlementAmount || ""}
              onChange={(e) =>
                setSettlementAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="₹ 0"
            />
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => closeMutation.mutate(deleteTarget.id)}
          title="Delete Loan Record?"
          description={
            <>
              Are you sure you want to delete loan <strong>#{deleteTarget.id}</strong> for{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </>
          }
          confirmText="Delete Loan"
          isLoading={closeMutation.isPending}
          isDestructive={true}
        />
      )}

      {/* PRINT STATEMENT & PAYMENT RECORD MODAL */}
      {printStatementTarget && (
        <Modal
          open={!!printStatementTarget}
          onClose={() => setPrintStatementTarget(null)}
          title={`Loan Statement & Payment Record #${printStatementTarget.id}`}
          subtitle={`${printStatementTarget.name} · Complete payment history, pending disbursements, and collateral pledge record`}
          maxWidth="3xl"
          footer={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPrintStatementTarget(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTimeout(() => window.print(), 200);
                }}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Statement (A5)
              </Button>
            </>
          }
        >
          <div className="overflow-x-auto py-2 flex justify-center">
            <LoanSlip
              loan={printStatementTarget}
              payments={statementPayments}
              pendingDisbursements={statementDisbursements}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
