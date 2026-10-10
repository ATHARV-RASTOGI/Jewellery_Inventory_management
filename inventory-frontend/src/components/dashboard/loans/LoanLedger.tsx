import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  IndianRupee,
  PlusCircle,
  User,
  MapPin,
  Trash2,
  FileSpreadsheet,
  Printer,
  Eye,
  Scale,
  Clock,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  calculateSettlement,
  type SettlementCalculation,
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
import { LoanSlip } from "@/components/receipts/LoanSlip";
import { type SlipLanguage } from "@/lib/receiptTranslations";
import { formatINR, fmtDate, todayIso } from "@/lib/utils";
import { queryKeys } from "@/lib/api/query-keys";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { SearchToolbar, SearchInput, FilterTabs } from "@/components/ui/SearchToolbar";
import { DetailDrawer } from "@/components/ui/DetailDrawer";

type LoanStatus = "ACTIVE" | "CLOSED";

export const LoanLedger = () => {
  const qc = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [tab, setTab] = useState<"all" | LoanStatus>("all");
  const [baseComputed, setBaseComputed] = useState<SettlementCalculation | null>(null);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [settleTarget, setSettleTarget] = useState<Loan | null>(null);
  const [closeDate, setCloseDate] = useState(todayIso());
  const [settleRate, setSettleRate] = useState(2);
  const [settlementAmount, setSettlementAmount] = useState(0);

  const computed = useMemo<SettlementCalculation | null>(() => {
    if (!baseComputed) return null;
    const baseRate = baseComputed.rate || 2;
    if (settleRate === baseRate) return baseComputed;
    const interestAmount = Math.round(baseComputed.interestAmount * (settleRate / baseRate));
    return { ...baseComputed, interestAmount, totalAmount: baseComputed.principal + interestAmount, rate: settleRate };
  }, [baseComputed, settleRate]);

  const [interestTarget, setInterestTarget] = useState<Loan | null>(null);
  const [interestAmount, setInterestAmount] = useState(0);
  const [interestFromDate, setInterestFromDate] = useState(todayIso());
  const [interestToDate, setInterestToDate] = useState(todayIso());
  const [interestRate, setInterestRate] = useState(2);
  const [interestComputed, setInterestComputed] = useState<SettlementCalculation | null>(null);

  const [disburseTarget, setDisburseTarget] = useState<Loan | null>(null);
  const [disburseAmount, setDisburseAmount] = useState(0);
  const [disburseDate, setDisburseDate] = useState(todayIso());

  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [printStatementTarget, setPrintStatementTarget] = useState<Loan | null>(null);
  const [slipLang, setSlipLang] = useState<SlipLanguage>(() => {
    return (localStorage.getItem("kk_slip_lang") as SlipLanguage) || "bilingual";
  });

  const handleSlipLangChange = (lang: SlipLanguage) => {
    setSlipLang(lang);
    localStorage.setItem("kk_slip_lang", lang);
  };

  const { data: loans = [], isLoading } = useQuery({ queryKey: queryKeys.loans, queryFn: fetchLoans });

  const { data: drawerPayments = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", selectedLoan?.id],
    queryFn: () => fetchInterestPayments(selectedLoan!.id),
    enabled: !!selectedLoan,
  });

  const { data: drawerDisbursements = [] } = useQuery<PendingDisbursement[]>({
    queryKey: ["pending-disbursements", selectedLoan?.id],
    queryFn: () => fetchPendingDisbursements(selectedLoan!.id),
    enabled: !!selectedLoan,
  });

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

  const { data: interestPayment = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", interestTarget?.id],
    queryFn: () => fetchInterestPayments(interestTarget!.id),
    enabled: !!interestTarget,
  });

  const { data: disbursePayments = [] } = useQuery<InterestPayment[]>({
    queryKey: ["payments", disburseTarget?.id],
    queryFn: () => fetchInterestPayments(disburseTarget!.id),
    enabled: !!disburseTarget,
  });

  const minDisburseDate = useMemo(() => {
    if (!disburseTarget) return todayIso();
    return disbursePayments.length > 0 ? disbursePayments[disbursePayments.length - 1].paymentDate : disburseTarget.issueDate;
  }, [disburseTarget, disbursePayments]);

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
      if (selectedLoan?.id === deleteTarget?.id) setSelectedLoan(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
    },
    onError: () => toast.error("Failed to delete loan"),
  });

  const settleMutation = useMutation({
    mutationFn: settleLoan,
    onSuccess: () => {
      toast.success("Loan settled and closed");
      setSettleTarget(null);
      if (selectedLoan?.id === settleTarget?.id) setSelectedLoan((p) => p ? { ...p, status: "CLOSED" } : null);
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
    mutationFn: (d: { id: string; amount: number; date: string }) => addDisbursement(d.id, d.amount, d.date),
    onSuccess: () => {
      toast.success("Disbursement added to loan balance");
      setDisburseTarget(null);
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      qc.invalidateQueries({ queryKey: ["pending-disbursements"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to add disbursement"),
  });

  useEffect(() => {
    if (!settleTarget) return;
    const t = setTimeout(async () => {
      try {
        const res = await calculateSettlement(settleTarget.id, closeDate, 2);
        setBaseComputed(res);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(t);
  }, [settleTarget, closeDate]);

  useEffect(() => {
    if (computed) setSettlementAmount(computed.totalAmount);
  }, [computed]);

  const openSettle = (l: Loan) => {
    setSettleTarget(l);
    setBaseComputed(null);
    setCloseDate(todayIso());
    setSettleRate(2);
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
    } else if (interestTarget) {
      setInterestFromDate(interestTarget.issueDate);
    }
  }, [interestPayment, interestTarget]);

  useEffect(() => {
    if (!interestTarget) return;
    const t = setTimeout(async () => {
      try {
        if (new Date(interestToDate) < new Date(interestFromDate)) {
          setInterestComputed(null);
          return;
        }
        const res = await previewInterestForLoan(interestTarget.id, interestFromDate, interestToDate, interestRate);
        setInterestComputed(res);
      } catch (err) {
        setInterestComputed(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [interestTarget, interestFromDate, interestToDate, interestRate, pendingDisbursements]);

  const filtered = useMemo(() => {
    const cQ = customerSearch.trim().toLowerCase();
    const aQ = addressSearch.trim().toLowerCase();
    return loans.filter((l: Loan) => {
      if (tab !== "all" && l.status !== tab) return false;
      const cMatch = !cQ || l.name?.toLowerCase().includes(cQ) || l.fatherName?.toLowerCase().includes(cQ) || String(l.id).toLowerCase().includes(cQ);
      const aMatch = !aQ || l.address?.toLowerCase().includes(aQ);
      return cQ && aQ ? cMatch || aMatch : cQ ? cMatch : aQ ? aMatch : true;
    });
  }, [loans, customerSearch, addressSearch, tab]);

  const summary = useMemo(() => {
    const active = filtered.filter((l) => l.status === "ACTIVE");
    return {
      totalCount: filtered.length,
      activeCount: active.length,
      closedCount: filtered.length - active.length,
      pledgedWeight: active.reduce((s, l) => s + (l.weight || 0), 0),
      outstanding: active.reduce((s, l) => s + (l.loanAmount || 0), 0),
    };
  }, [filtered]);

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      <SearchToolbar>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <SearchInput value={customerSearch} onChange={setCustomerSearch} placeholder="Search by customer, father name, loan #…" icon={User} />
          <SearchInput value={addressSearch} onChange={setAddressSearch} placeholder="Filter by address…" icon={MapPin} />
        </div>
        <FilterTabs
          options={[
            { id: "all", label: `All (${loans.length})` },
            { id: "ACTIVE", label: "Active" },
            { id: "CLOSED", label: "Closed" },
          ]}
          active={tab}
          onChange={(t) => setTab(t as any)}
        />
      </SearchToolbar>

      {/* Portfolio Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border bg-surface border border-border text-xs">
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Filtered Loans</div>
          <div className="text-base font-bold font-mono text-foreground mt-0.5">
            {summary.totalCount} <span className="text-xs font-normal text-muted-foreground font-sans">({summary.activeCount} active)</span>
          </div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Active Portfolio</div>
          <div className="text-base font-bold font-mono text-primary mt-0.5">{summary.activeCount} accounts</div>
        </div>
        <div className="px-4 py-2.5">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Active Pledged Net</div>
          <div className="text-base font-bold font-mono text-amber-600 mt-0.5">{summary.pledgedWeight.toFixed(2)} g</div>
        </div>
        <div className="px-4 py-2.5 bg-surface-2/40">
          <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding Principal</div>
          <div className="text-base font-bold font-mono text-foreground mt-0.5">{formatINR(summary.outstanding)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-surface-2 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-16">Loan #</th>
                <th className="py-2.5 px-3 min-w-[160px]">Borrower</th>
                <th className="py-2.5 px-3 min-w-[130px]">Care Of</th>
                <th className="py-2.5 px-3 w-24">Collateral</th>
                <th className="py-2.5 px-3 text-right w-24">Weight</th>
                <th className="py-2.5 px-3 min-w-[180px]">Pledged Item Description</th>
                <th className="py-2.5 px-3 w-24">Origination</th>
                <th className="py-2.5 px-3 text-right min-w-[110px]">Principal</th>
                <th className="py-2.5 px-3 text-center w-24">Status</th>
                <th className="py-2.5 px-3 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">Loading Girvi ledger…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="p-8"><EmptyState icon={FileSpreadsheet} title="No loan records match" description="Adjust search filters." /></td></tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLoan(l)}
                    className={`cursor-pointer transition-colors ${selectedLoan?.id === l.id ? "bg-primary/5 font-medium" : "hover:bg-surface-2/60"}`}
                  >
                    <td className="py-2 px-3 font-mono font-medium text-primary">#{l.id}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-foreground text-xs leading-tight">{l.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{l.mobileNo || "—"}</div>
                    </td>
                    <td className="py-2 px-3 text-foreground/80">{l.fatherName || "—"}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase ${l.metal.toLowerCase() === "gold" ? "bg-amber-500/10 text-amber-700" : "bg-slate-500/10 text-slate-700"}`}>
                        {l.metal}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-foreground tabular-nums">{l.weight ? `${Number(l.weight).toFixed(2)} g` : "—"}</td>
                    <td className="py-2 px-3 text-muted-foreground max-w-[200px] truncate" title={l.description || ""}>{l.description || "—"}</td>
                    <td className="py-2 px-3 font-mono text-muted-foreground whitespace-nowrap">{fmtDate(l.issueDate)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-foreground tabular-nums whitespace-nowrap">{formatINR(l.loanAmount)}</td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <StatusBadge variant={l.status === "ACTIVE" ? "success" : "neutral"} withDot>{l.status === "ACTIVE" ? "Active" : "Closed"}</StatusBadge>
                    </td>
                    <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="secondary" size="sm" className="h-7 px-2 text-[11px]" onClick={() => setSelectedLoan(l)} leftIcon={<Eye className="w-3 h-3" />}>Inspect</Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setPrintStatementTarget(l)}><Printer className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <DetailDrawer
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title={selectedLoan ? `Girvi Pledge #${selectedLoan.id}` : ""}
        subtitle={selectedLoan ? `${selectedLoan.name} · ${selectedLoan.metal.toUpperCase()} (${selectedLoan.weight ? `${selectedLoan.weight}g` : "unweighed"})` : undefined}
        actions={
          selectedLoan && (
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => setPrintStatementTarget(selectedLoan)} leftIcon={<Printer className="w-3.5 h-3.5" />}>Print Slip</Button>
              {selectedLoan.status === "ACTIVE" && (
                <Button variant="primary" size="sm" onClick={() => openSettle(selectedLoan)} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>Settle &amp; Close</Button>
              )}
            </div>
          )
        }
      >
        {selectedLoan && (
          <div className="space-y-4">
            <div className="bg-surface-2 p-3.5 border border-border flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Portfolio Status</div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge variant={selectedLoan.status === "ACTIVE" ? "success" : "neutral"} withDot>{selectedLoan.status === "ACTIVE" ? "Active Collateral" : "Closed"}</StatusBadge>
                  <span className="text-xs font-mono text-muted-foreground">Issued {fmtDate(selectedLoan.issueDate)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Principal</div>
                <div className="text-lg font-bold font-mono text-primary tabular-nums">{formatINR(selectedLoan.loanAmount)}</div>
              </div>
            </div>

            {selectedLoan.status === "ACTIVE" && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" onClick={() => openInterest(selectedLoan)} leftIcon={<IndianRupee className="w-3.5 h-3.5 text-warning" />} className="justify-center">Record Interest</Button>
                <Button variant="secondary" size="sm" onClick={() => openDisburse(selectedLoan)} leftIcon={<PlusCircle className="w-3.5 h-3.5 text-primary" />} className="justify-center">Add Disbursement</Button>
              </div>
            )}

            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider"><User className="w-3.5 h-3.5 text-primary" />Borrower</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
                <div><span className="text-muted-foreground block text-[11px]">Name</span><span className="font-semibold text-foreground">{selectedLoan.name}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Care Of</span><span className="font-medium text-foreground">{selectedLoan.fatherName || "—"}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Mobile</span><span className="font-mono text-foreground">{selectedLoan.mobileNo || "—"}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Origination</span><span className="font-mono text-foreground">{fmtDate(selectedLoan.issueDate)}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground block text-[11px]">Address</span><span className="text-foreground">{selectedLoan.address || "—"}</span></div>
              </div>
            </div>

            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider"><Scale className="w-3.5 h-3.5 text-amber-600" />Collateral Asset</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
                <div><span className="text-muted-foreground block text-[11px]">Metal</span><span className="font-bold text-foreground uppercase">{selectedLoan.metal}</span></div>
                <div><span className="text-muted-foreground block text-[11px]">Weight</span><span className="font-mono font-bold text-foreground">{selectedLoan.weight ? `${Number(selectedLoan.weight).toFixed(2)} g` : "—"}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground block text-[11px]">Description</span><p className="text-foreground bg-surface-2 p-2 rounded text-xs mt-0.5">{selectedLoan.description || "No marks recorded"}</p></div>
              </div>
            </div>

            {drawerDisbursements.length > 0 && (
              <div className="border border-amber-300/40 bg-amber-500/5 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-amber-800 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-amber-600" />Disbursements ({drawerDisbursements.length})</span>
                  <span className="font-mono">+{formatINR(drawerDisbursements.reduce((s, d) => s + d.amount, 0))}</span>
                </div>
                <div className="divide-y divide-border/60">
                  {drawerDisbursements.map((d) => (
                    <div key={d.id} className="py-1 flex justify-between font-mono"><span className="text-muted-foreground text-[11px]">{fmtDate(d.disbursedDate)}</span><span className="font-bold text-amber-800">+{formatINR(d.amount)}</span></div>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-border p-3.5 space-y-2 bg-surface">
              <div className="flex justify-between text-xs font-semibold text-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />Payment Ledger</span>
                <span className="text-[11px] font-mono text-muted-foreground font-normal">{drawerPayments.length} payment(s)</span>
              </div>
              {drawerPayments.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">No interest payments recorded yet.</div>
              ) : (
                <div className="divide-y divide-border/60 text-xs font-mono max-h-40 overflow-y-auto">
                  {drawerPayments.map((p) => (
                    <div key={p.id} className="py-1.5 flex justify-between">
                      <div><div className="text-[11px] text-muted-foreground">{fmtDate(p.paymentDate)}</div></div>
                      <div className="text-right"><div className="font-bold text-success">− {formatINR(p.amountPaid)}</div><div className="text-[10px] text-muted-foreground">Bal: {formatINR(p.balanceAfter)}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border">
              <span>Delete this loan record?</span>
              <Button variant="danger" size="sm" className="h-7 text-xs" onClick={() => setDeleteTarget(selectedLoan)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* DISBURSEMENT MODAL */}
      {disburseTarget && (
        <Modal
          open={!!disburseTarget}
          onClose={() => setDisburseTarget(null)}
          title="Add Collateral Disbursement"
          subtitle={`Loan #${disburseTarget.id} · ${disburseTarget.name}`}
          maxWidth="sm"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setDisburseTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={disburseMutation.isPending || disburseAmount <= 0 || Boolean(disburseDate && disburseDate < minDisburseDate)}
                isLoading={disburseMutation.isPending}
                onClick={() => {
                  if (disburseDate < minDisburseDate) return toast.error(`Date cannot be earlier than ${fmtDate(minDisburseDate)}`);
                  disburseMutation.mutate({ id: disburseTarget.id, amount: disburseAmount, date: disburseDate });
                }}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Add Funds
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Amount to Disburse (₹)" type="number" min={1} value={disburseAmount || ""} onChange={(e) => setDisburseAmount(parseFloat(e.target.value) || 0)} placeholder="e.g. 5000" />
            <Input label="Disbursed Date" type="date" value={disburseDate} min={minDisburseDate} max={todayIso()} onChange={(e) => setDisburseDate(e.target.value)} helperText={`Earliest allowed date: ${fmtDate(minDisburseDate)}`} />
          </div>
        </Modal>
      )}

      {/* INTEREST PAYMENT MODAL */}
      {interestTarget && (
        <Modal
          open={!!interestTarget}
          onClose={() => setInterestTarget(null)}
          title="Record Interest Payment"
          subtitle={`Loan #${interestTarget.id} · ${interestTarget.name}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setInterestTarget(null)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={interestMutation.isPending || interestAmount <= 0}
                isLoading={interestMutation.isPending}
                onClick={() => interestMutation.mutate({ id: interestTarget.id, amountPaid: interestAmount, fromDate: interestFromDate, toDate: interestToDate, interestRate })}
                leftIcon={<IndianRupee className="w-4 h-4" />}
              >
                Record Payment
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <Input label="From Date" type="date" value={interestFromDate} disabled />
              <Input label="To Date" type="date" value={interestToDate} min={interestFromDate} onChange={(e) => setInterestToDate(e.target.value)} />
              <Input label="Monthly Rate (%)" type="number" min={0} step={0.1} value={interestRate} onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)} />
            </div>

            <div className="bg-surface-2 p-3 space-y-1.5 text-xs border border-border">
              {pendingDisbursements.map((d) => (
                <div key={d.id} className="flex justify-between bg-amber-500/10 text-amber-800 px-2 py-1 rounded">
                  <span>Pending disbursement ({fmtDate(d.disbursedDate)})</span>
                  <span className="tabular-nums font-semibold font-mono">+{formatINR(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-muted-foreground"><span>Principal</span><span className="font-mono font-medium text-foreground">{formatINR(interestComputed ? interestComputed.principal : interestTarget.loanAmount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Interest</span><span className="font-mono font-medium text-foreground">{interestComputed ? formatINR(interestComputed.interestAmount) : "—"}</span></div>
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground"><span>Total due</span><span className="font-mono">{interestComputed ? formatINR(interestComputed.totalAmount) : "—"}</span></div>
              <div className="flex justify-between border-t border-border pt-1"><span>Payment applied</span><span className="font-mono text-success font-semibold">− {formatINR(interestAmount)}</span></div>
              <div className="flex justify-between font-semibold text-foreground"><span>New balance</span><span className="font-mono text-primary font-bold">{interestComputed ? formatINR(Math.max(0, interestComputed.totalAmount - interestAmount)) : "—"}</span></div>
            </div>

            <Input label="Amount Deposited (₹)" type="number" min={0} value={interestAmount || ""} onChange={(e) => setInterestAmount(parseFloat(e.target.value) || 0)} placeholder="₹ 0" />
          </div>
        </Modal>
      )}

      {/* SETTLEMENT MODAL */}
      {settleTarget && computed && (
        <Modal
          open={!!settleTarget}
          onClose={() => setSettleTarget(null)}
          title={`Close & Settle Loan #${settleTarget.id}`}
          subtitle={`${settleTarget.name} · ${settleTarget.metal}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setSettleTarget(null)}>Cancel</Button>
              <Button variant="primary" size="sm" disabled={settleMutation.isPending} isLoading={settleMutation.isPending} onClick={() => settleMutation.mutate({ id: settleTarget.id, closeDate, settlementAmount })} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Close &amp; Settle
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-2 p-2.5 border border-border"><p className="text-[10.5px] uppercase text-muted-foreground">Origination Date</p><p className="text-sm font-semibold font-mono text-foreground mt-0.5">{fmtDate(settleTarget.issueDate)}</p></div>
              <div className="bg-surface-2 p-2.5 border border-border"><p className="text-[10.5px] uppercase text-muted-foreground">Initial Principal</p><p className="text-sm font-semibold text-foreground mt-0.5 tabular-nums font-mono">{formatINR(settleTarget.loanAmount)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Settlement Date" type="date" value={closeDate} min={settleTarget.issueDate} onChange={(e) => setCloseDate(e.target.value)} />
              <Input label="Interest Rate (% / mo)" type="number" step="0.1" min={0} value={settleRate || ""} onChange={(e) => setSettleRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="bg-surface-2 p-3 space-y-1.5 text-xs border border-border">
              <div className="flex justify-between text-muted-foreground"><span>Duration</span><span>{computed.isMinimumMonthApplied ? "1 month (min applied)" : `${computed.months} month(s)`}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Accrued Interest @ {computed?.rate ?? settleRate}%/mo</span><span className="font-mono font-medium text-foreground">{formatINR(computed.interestAmount)}</span></div>
              <div className="flex justify-between pt-1 border-t border-border font-bold text-foreground"><span>Total Amount</span><span className="font-mono text-primary font-bold">{formatINR(computed.totalAmount)}</span></div>
            </div>
            <Input label="Agreed Settlement Amount (₹)" type="number" min={0} value={settlementAmount || ""} onChange={(e) => setSettlementAmount(parseFloat(e.target.value) || 0)} placeholder="₹ 0" />
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => closeMutation.mutate(deleteTarget.id)}
          title="Delete Loan Record?"
          description={<>Are you sure you want to delete loan <strong>#{deleteTarget.id}</strong> for <strong>{deleteTarget.name}</strong>?</>}
          confirmText="Delete Loan"
          isLoading={closeMutation.isPending}
          isDestructive={true}
        />
      )}

      {/* PRINT SLIP MODAL */}
      {printStatementTarget && (
        <Modal
          open={!!printStatementTarget}
          onClose={() => setPrintStatementTarget(null)}
          title={`Loan Statement & Slip #${printStatementTarget.id}`}
          subtitle={`${printStatementTarget.name} · Pledged collateral record`}
          maxWidth="3xl"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setPrintStatementTarget(null)}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => setTimeout(() => window.print(), 200)} leftIcon={<Printer className="w-4 h-4" />}>Print (A5)</Button>
            </>
          }
        >
          <div className="overflow-x-auto py-2 flex justify-center">
            <LoanSlip
              loan={printStatementTarget}
              payments={statementPayments}
              pendingDisbursements={statementDisbursements}
              language={slipLang}
              onLanguageChange={handleSlipLangChange}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
