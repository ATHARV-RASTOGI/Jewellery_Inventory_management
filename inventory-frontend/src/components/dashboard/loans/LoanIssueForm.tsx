import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  UserCheck,
  Sparkles,
  Loader2,
  User,
  Users,
  Phone,
  Calendar,
  IndianRupee,
  ShieldAlert,
  RotateCcw,
  Tag,
  Printer,
  CheckCircle2,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { issueLoan, findLoanByCustomer, type Loan } from "@/lib/api/loans";
import { fetchGoldRate, fetchSilverRate } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR, cn, todayIso } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoanSlip } from "@/components/receipts/LoanSlip";
import { type SlipLanguage } from "@/lib/receiptTranslations";
import { fieldLabel, fieldInput } from "@/lib/styles";

type FormState = {
  name: string;
  fatherName: string;
  phoneNumber: string;
  address: string;
  metalType: "Gold" | "Silver";
  loanAmount: number | "";
  issueDate: string;
  description?: string;
  weight?: number;
};

const initialForm = (): FormState => ({
  name: "",
  fatherName: "",
  phoneNumber: "",
  address: "",
  metalType: "Gold",
  loanAmount: "",
  issueDate: todayIso(),
  description: "",
  weight: 0,
});

export const LoanIssueForm = ({ onClose }: { onClose?: () => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm());
  const [existingCustomer, setExistingCustomer] = useState<Loan | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [lastIssuedLoan, setLastIssuedLoan] = useState<Loan | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipLang, setSlipLang] = useState<SlipLanguage>(() => {
    return (localStorage.getItem("kk_slip_lang") as SlipLanguage) || "bilingual";
  });
  const slipRef = useRef<HTMLDivElement>(null);

  const handleSlipLangChange = (lang: SlipLanguage) => {
    setSlipLang(lang);
    localStorage.setItem("kk_slip_lang", lang);
  };

  const { data: goldRate } = useQuery({ queryKey: ["dashboard-gold-rate"], queryFn: fetchGoldRate, staleTime: 300000 });
  const { data: silverRate } = useQuery({ queryKey: ["dashboard-silver-rate"], queryFn: fetchSilverRate, staleTime: 300000 });

  useEffect(() => {
    const trimmedName = form.name.trim();
    const trimmedFather = form.fatherName.trim();
    if (trimmedName.length < 2 || trimmedFather.length < 2) {
      setExistingCustomer(null);
      setIsSearchingCustomer(false);
      return;
    }
    setIsSearchingCustomer(true);
    const timer = setTimeout(async () => {
      try {
        const found = await findLoanByCustomer(trimmedName, trimmedFather);
        setExistingCustomer(found);
      } catch (err) {
        console.error("Customer search error:", err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.name, form.fatherName]);

  const handleAutofill = () => {
    if (!existingCustomer) return;
    setForm((prev) => ({
      ...prev,
      phoneNumber: existingCustomer.mobileNo || prev.phoneNumber,
      address: existingCustomer.address || prev.address,
    }));
    toast.success("Phone & address auto-filled from customer profile");
  };

  const mutation = useMutation({
    mutationFn: () =>
      issueLoan({
        name: form.name,
        fatherName: form.fatherName || undefined,
        mobileNo: form.phoneNumber,
        address: form.address,
        metal: form.metalType,
        loanAmount: Number(form.loanAmount),
        issueDate: form.issueDate || todayIso(),
        description: form.description || "",
        weight: form.weight || 0,
      }),
    onSuccess: (createdLoan) => {
      toast.success("Loan issued and entered into ledger successfully!");
      qc.invalidateQueries({ queryKey: queryKeys.loans });
      setLastIssuedLoan(createdLoan);
    },
    onError: () => toast.error("Failed to issue loan"),
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.phoneNumber)) return toast.error("Mobile number must be exactly 10 digits");
    mutation.mutate();
  };

  const resetFormForNextLoan = () => {
    setForm(initialForm());
    setExistingCustomer(null);
    setLastIssuedLoan(null);
  };

  const weight = Number(form.weight) || 0;
  const loanPrincipal = Number(form.loanAmount) || 0;
  const currentRatePerGram =
    form.metalType === "Gold" ? (goldRate?.rate ? goldRate.rate / 10 : 7400) : (silverRate?.rate ?? 95);
  const estimatedCollateralValue = Math.round(weight * currentRatePerGram);
  const ltvRatio = estimatedCollateralValue > 0 ? Math.round((loanPrincipal / estimatedCollateralValue) * 100) : 0;
  const maxSafeDisbursal = Math.round(estimatedCollateralValue * 0.75);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      <PageHeader
        breadcrumbs={["Dashboard", "Loans", "New Loan Origination"]}
        title="Girvi Loan Origination"
        subtitle="Originate open-ended jewelry pledge loans, evaluate real-time collateral risk, and print official slips."
        actions={
          <div className="flex items-center gap-2">
            {lastIssuedLoan ? (
              <>
                <Button type="button" variant="primary" size="sm" onClick={() => setShowSlipModal(true)} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                  Print Voucher #{lastIssuedLoan.id}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={resetFormForNextLoan} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Issue Another Loan
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={resetFormForNextLoan} leftIcon={<RotateCcw className="w-3 h-3" />}>
                  Reset
                </Button>
                <Button type="submit" form="loan-issue-form" variant="primary" size="sm" isLoading={mutation.isPending} leftIcon={<Scale className="w-3.5 h-3.5" />}>
                  {mutation.isPending ? "Registering…" : "Issue Collateral Loan"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {lastIssuedLoan && (
        <div className="border border-success/30 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-success/20 text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Girvi Loan #{lastIssuedLoan.id} Registered</p>
              <p className="text-xs text-muted-foreground">Principal amount of {formatINR(lastIssuedLoan.loanAmount)} for borrower <strong>{lastIssuedLoan.name}</strong> entered into ledger.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="button" variant="primary" size="sm" onClick={() => setShowSlipModal(true)} leftIcon={<Printer className="w-3.5 h-3.5" />} className="flex-1 sm:flex-initial">
              Print Loan Slip (A5)
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={resetFormForNextLoan} className="flex-1 sm:flex-initial">
              New Origination
            </Button>
          </div>
        </div>
      )}

      <form id="loan-issue-form" onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Inputs (65% / 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section 1: Borrower */}
          <div className="bg-surface border border-border p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">1. Borrower Identification</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Verified customer identity and residential address.</p>
              </div>
              {isSearchingCustomer && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-mono">
                  <Loader2 className="w-3 h-3 animate-spin" /><span>Checking history…</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input label="Customer Full Name" required leftIcon={<User className="w-3.5 h-3.5 text-muted-foreground" />} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Ramesh Kumar" />
              <Input label="Father's / Husband's Name" leftIcon={<Users className="w-3.5 h-3.5 text-muted-foreground" />} value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} placeholder="e.g. Shyam Lal" />

              {existingCustomer && (
                <div className="sm:col-span-2 border border-primary/30 bg-primary/5 p-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="font-bold text-foreground">Existing Customer Found: </span>
                        <span className="text-muted-foreground">Previous Loan #{existingCustomer.id} · {existingCustomer.status}</span>
                      </div>
                    </div>
                    {existingCustomer.status === "ACTIVE" && (
                      <StatusBadge variant="warning" withDot>Active ({formatINR(existingCustomer.loanAmount)})</StatusBadge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground pl-6">
                    {existingCustomer.mobileNo && <span>Tel: {existingCustomer.mobileNo} · </span>}
                    {existingCustomer.address && <span>{existingCustomer.address}</span>}
                  </div>
                  <div className="pl-6 pt-1">
                    <Button type="button" variant="secondary" size="sm" onClick={handleAutofill} leftIcon={<Sparkles className="w-3 h-3 text-primary" />} className="text-xs h-7">
                      Auto-fill Address &amp; Contact Info
                    </Button>
                  </div>
                </div>
              )}

              <Input label="Mobile Phone Number" required leftIcon={<Phone className="w-3.5 h-3.5 text-muted-foreground" />} value={form.phoneNumber} onChange={(e) => update("phoneNumber", e.target.value)} placeholder="10-digit mobile number" />
              <div className="sm:col-span-2 space-y-1">
                <label className={fieldLabel}>Residence / Village Address <span className="text-danger">*</span></label>
                <textarea className={cn(fieldInput, "min-h-[70px] resize-y pl-3 text-xs")} value={form.address} onChange={(e) => update("address", e.target.value)} required placeholder="House no., Mohalla, Village / City, Post, District" />
              </div>
            </div>
          </div>

          {/* Section 2: Collateral Pledged */}
          <div className="bg-surface border border-border p-4 space-y-3">
            <div className="pb-2 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">2. Pledged Collateral Details</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Precious metal classification and assessed net weight.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className={fieldLabel}>Precious Metal</label>
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-surface-2 border border-border rounded text-xs font-medium">
                  {(["Gold", "Silver"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update("metalType", m)}
                      className={cn(
                        "py-1.5 px-2 text-center rounded transition-all cursor-pointer font-medium",
                        form.metalType === m ? "bg-surface font-bold shadow-xs border border-border/80 text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m} Pledge
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Net Collateral Weight (grams)" type="number" step="0.01" min={0} required leftIcon={<Scale className="w-3.5 h-3.5 text-muted-foreground" />} value={form.weight || ""} onChange={(e) => update("weight", parseFloat(e.target.value) || 0)} placeholder="0.00" />
              <div className="sm:col-span-2">
                <Input label="Pledged Article Hallmarks &amp; Description" leftIcon={<Tag className="w-3.5 h-3.5 text-muted-foreground" />} value={form.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="e.g. 2 Solid Gold Bangles 916 BIS, 1 Plain Chain" />
              </div>
            </div>
          </div>

          {/* Section 3: Principal */}
          <div className="bg-surface border border-border p-4 space-y-3">
            <div className="pb-2 border-b border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">3. Principal Disbursed &amp; Terms</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Principal amount handed to borrower and origination date.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input label="Principal Amount Disbursed (₹)" type="number" min={1} required leftIcon={<IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />} value={form.loanAmount} onChange={(e) => update("loanAmount", parseFloat(e.target.value) || "")} placeholder="₹ 0" />
              <Input label="Origination Date" type="date" required leftIcon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />} value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Valuation & Risk Gauge (Sticky, 35% / 4 cols) */}
        <div className="lg:col-span-4 sticky top-16 space-y-3 text-xs">
          <div className="bg-surface border border-border overflow-hidden">
            <div className="bg-surface-2 p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Live Risk Gauge
              </div>
              <StatusBadge variant={ltvRatio > 85 ? "danger" : ltvRatio > 70 ? "warning" : "success"} withDot>
                {ltvRatio > 0 ? `${ltvRatio}% LTV` : "0% LTV"}
              </StatusBadge>
            </div>

            <div className="p-3.5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Market Reference</span>
                <span className="font-mono font-medium text-foreground">{formatINR(currentRatePerGram)} / g ({form.metalType})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Assessed Collateral</span>
                <span className="font-mono font-bold text-foreground">{weight ? `${weight.toFixed(2)} g` : "0.00 g"}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Est. Market Value</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">{formatINR(estimatedCollateralValue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Requested Principal</span>
                <span className="font-mono font-bold text-primary text-sm">{formatINR(loanPrincipal)}</span>
              </div>

              {/* LTV Safety Bar */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground"><span>LTV Ratio</span><span className="font-mono font-bold">{ltvRatio}%</span></div>
                <div className="w-full h-2 bg-surface-2 border border-border overflow-hidden rounded-xs">
                  <div className={cn("h-full transition-all duration-300", ltvRatio > 85 ? "bg-red-500" : ltvRatio > 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, ltvRatio)}%` }} />
                </div>
              </div>

              {estimatedCollateralValue > 0 && (
                <div className="bg-surface-2 p-2.5 border border-border text-[11.5px] space-y-1">
                  <div className="flex justify-between text-muted-foreground"><span>Safe Ceiling (75% LTV):</span><span className="font-mono font-semibold text-foreground">{formatINR(maxSafeDisbursal)}</span></div>
                  {loanPrincipal > maxSafeDisbursal && (
                    <div className="flex items-start gap-1 text-danger text-[11px] font-medium pt-1">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>Exceeds recommended 75% loan-to-value threshold.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={mutation.isPending} className="w-full justify-center" leftIcon={<Scale className="w-4 h-4" />}>
                  {mutation.isPending ? "Issuing Loan…" : "Issue Collateral Loan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {lastIssuedLoan && (
        <Modal
          open={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          title={`Loan Collateral Voucher #${lastIssuedLoan.id}`}
          subtitle="Official A5 print voucher with Nehru Road store header, collateral specs, and signatures."
          maxWidth="3xl"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowSlipModal(false)}>Close</Button>
              <Button variant="primary" size="sm" onClick={() => setTimeout(() => window.print(), 200)} leftIcon={<Printer className="w-4 h-4" />}>
                Print Slip (A5 / Half-Page)
              </Button>
            </>
          }
        >
          <div ref={slipRef} className="overflow-x-auto py-2 flex justify-center">
            <LoanSlip
              loan={lastIssuedLoan}
              language={slipLang}
              onLanguageChange={handleSlipLangChange}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};