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
import { fieldLabel, fieldInput } from "@/lib/styles";
import { FormSection } from "@/components/ui/FormSection";

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
  const slipRef = useRef<HTMLDivElement>(null);

  // Live gold & silver market rates for estimated collateral value calculation
  const { data: goldRate } = useQuery({
    queryKey: ["dashboard-gold-rate"],
    queryFn: fetchGoldRate,
    staleTime: 1000 * 60 * 5,
  });

  const { data: silverRate } = useQuery({
    queryKey: ["dashboard-silver-rate"],
    queryFn: fetchSilverRate,
    staleTime: 1000 * 60 * 5,
  });

  // Live lookup of existing customer by Name & Father's Name
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
    onError: () => {
      toast.error("Failed to issue loan");
    },
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phoneNumber.length !== 10 || !/^\d+$/.test(form.phoneNumber)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    mutation.mutate();
  };

  const handlePrintSlip = () => {
    if (!lastIssuedLoan) return;
    setTimeout(() => window.print(), 200);
  };

  const resetFormForNextLoan = () => {
    setForm(initialForm());
    setExistingCustomer(null);
    setLastIssuedLoan(null);
  };

  // Estimated collateral value based on live rate
  const weight = Number(form.weight) || 0;
  const loanPrincipal = Number(form.loanAmount) || 0;
  const currentRatePerGram =
    form.metalType === "Gold"
      ? goldRate?.rate
        ? goldRate.rate / 10
        : 7400
      : silverRate?.rate ?? 95;
  const estimatedCollateralValue = Math.round(weight * currentRatePerGram);
  const ltvRatio =
    estimatedCollateralValue > 0
      ? Math.round((loanPrincipal / estimatedCollateralValue) * 100)
      : 0;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <PageHeader
        breadcrumbs={["Dashboard", "Loans", "New Loan Origination"]}
        title="Loan Origination Workstation"
        subtitle="Issue open-ended collateral loans, verify customer credit history, and register pledged jewelry."
        actions={
          <div className="flex items-center gap-2">
            {lastIssuedLoan ? (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setShowSlipModal(true)}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Voucher #{lastIssuedLoan.id}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={resetFormForNextLoan}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Issue Another Loan
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFormForNextLoan}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  form="loan-issue-form"
                  variant="primary"
                  size="md"
                  isLoading={mutation.isPending}
                  leftIcon={<Scale className="w-4 h-4" />}
                >
                  {mutation.isPending ? "Issuing Loan…" : "Issue Collateral Loan"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Success Notification Banner after issuance */}
      {lastIssuedLoan && (
        <div className="rounded-xl border border-success/30 bg-success-soft/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Loan #{lastIssuedLoan.id} Successfully Registered
              </p>
              <p className="text-xs text-muted-foreground">
                Principal amount of {formatINR(lastIssuedLoan.loanAmount)} for {lastIssuedLoan.name} entered into active ledger.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowSlipModal(true)}
              leftIcon={<Printer className="w-4 h-4" />}
              className="flex-1 sm:flex-initial"
            >
              Print Loan Slip
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFormForNextLoan}
              className="flex-1 sm:flex-initial"
            >
              New Loan
            </Button>
          </div>
        </div>
      )}

      <form
        id="loan-issue-form"
        onSubmit={submit}
        className="max-w-4xl space-y-8 pt-2"
      >
        <FormSection
          title="Borrower Information"
          description="Identity details, family reference, and verified residential address."
        >
          {isSearchingCustomer && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground -mt-2 pb-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Checking ledger history…</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Full Name"
              required
              leftIcon={<User className="w-4 h-4 text-muted-foreground" />}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Anjali Verma"
            />
            <Input
              label="Father's / Husband's Name"
              leftIcon={<Users className="w-4 h-4 text-muted-foreground" />}
              value={form.fatherName}
              onChange={(e) => update("fatherName", e.target.value)}
              placeholder="e.g. Ramesh Verma"
            />

            {existingCustomer && (
              <div className="sm:col-span-2 rounded-lg border border-primary/30 bg-primary/10 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/20 text-primary">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Existing Customer Record Found
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Previous Loan #{existingCustomer.id} ·{" "}
                        {existingCustomer.status === "ACTIVE" ? "Active" : "Settled"}
                      </p>
                    </div>
                  </div>
                  {existingCustomer.status === "ACTIVE" && (
                    <StatusBadge variant="warning" withDot>
                      Active ({formatINR(existingCustomer.loanAmount)})
                    </StatusBadge>
                  )}
                </div>

                <div className="text-[11.5px] text-muted-foreground space-y-0.5 pl-8">
                  {existingCustomer.mobileNo && <p>📱 {existingCustomer.mobileNo}</p>}
                  {existingCustomer.address && (
                    <p className="truncate">📍 {existingCustomer.address}</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAutofill}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
                  className="w-full text-xs font-semibold"
                >
                  Auto-fill Verified Address &amp; Contact
                </Button>
              </div>
            )}

            <Input
              label="Mobile Number"
              required
              leftIcon={<Phone className="w-4 h-4 text-muted-foreground" />}
              value={form.phoneNumber}
              onChange={(e) => update("phoneNumber", e.target.value)}
              placeholder="10-digit mobile number"
            />

            <div className="sm:col-span-2 space-y-1.5">
              <label className={fieldLabel}>
                Residence Address <span className="text-danger">*</span>
              </label>
              <textarea
                className={cn(fieldInput, "min-h-[85px] resize-y pl-3")}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
                placeholder="House no., street name, landmark, city, PIN code"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Collateral Pledged (Girvi)"
          description="Metal classification, assessed net weight, and hallmark description."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={fieldLabel}>Metal Classification</label>
              <div className="inline-flex items-center gap-1 p-1 w-full rounded-lg bg-surface-2 border border-border/70">
                {(["Gold", "Silver"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update("metalType", m)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-semibold transition-all select-none",
                      form.metalType === m
                        ? m === "Gold"
                          ? "bg-surface text-amber-400 font-bold shadow-xs border border-border/80"
                          : "bg-surface text-slate-200 font-bold shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Net Collateral Weight (g)"
              type="number"
              step="0.01"
              min={0}
              required
              leftIcon={<Scale className="w-4 h-4 text-muted-foreground" />}
              value={form.weight || ""}
              onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />

            <div className="sm:col-span-2">
              <Input
                label="Pledged Item Description &amp; Hallmarks"
                leftIcon={<Tag className="w-4 h-4 text-muted-foreground" />}
                value={form.description || ""}
                onChange={(e) => update("description", e.target.value)}
                placeholder="e.g. 2 Solid Gold Bangles, 1 Floral Pendant Chain, BIS 916 Stamp"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Principal Amount & Origination Terms"
          description="Disbursed loan value and calendar origination date."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Principal Amount Disbursed (₹)"
              type="number"
              min={1}
              required
              leftIcon={<IndianRupee className="w-4 h-4 text-muted-foreground" />}
              value={form.loanAmount}
              onChange={(e) =>
                update("loanAmount", parseFloat(e.target.value) || "")
              }
              placeholder="₹ 0"
            />
            <Input
              label="Origination Date"
              type="date"
              required
              leftIcon={<Calendar className="w-4 h-4 text-muted-foreground" />}
              value={form.issueDate}
              onChange={(e) => update("issueDate", e.target.value)}
            />
          </div>

          {weight > 0 && (
            <div className="p-4 rounded-lg bg-surface-2 border border-border/70 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Live Collateral Valuation &amp; Risk Safety
                </span>
                <StatusBadge
                  variant={
                    ltvRatio > 85 ? "danger" : ltvRatio > 70 ? "warning" : "success"
                  }
                  withDot
                >
                  {ltvRatio}% Loan-to-Value (LTV)
                </StatusBadge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded-md bg-surface border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Assessed Weight
                  </p>
                  <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">
                    {weight} g
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-surface border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Estimated Market Value
                  </p>
                  <p className="text-sm font-bold text-success mt-0.5 font-mono tabular-nums">
                    {formatINR(estimatedCollateralValue)}
                  </p>
                </div>
                <div className="p-2.5 rounded-md bg-surface border border-border/50">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Disbursed Principal
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5 font-mono tabular-nums">
                    {formatINR(loanPrincipal)}
                  </p>
                </div>
              </div>

              {ltvRatio > 85 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-danger-soft text-danger text-xs border border-danger/20">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    High LTV Alert: Loan amount exceeds 85% of estimated collateral market value.
                  </span>
                </div>
              )}
            </div>
          )}
        </FormSection>

        <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={resetFormForNextLoan}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset Form
          </Button>

          {lastIssuedLoan && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowSlipModal(true)}
              className="font-bold border-primary/40 text-primary shadow-xs"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Voucher #{lastIssuedLoan.id}
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={mutation.isPending}
            className="font-bold px-6 shadow-sm"
            leftIcon={<Scale className="w-4.5 h-4.5" />}
          >
            {mutation.isPending ? "Issuing Loan…" : "Issue Collateral Loan"}
          </Button>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSlipModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrintSlip}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip (A5 / Half-Page)
              </Button>
            </>
          }
        >
          <div ref={slipRef} className="overflow-x-auto py-2 flex justify-center">
            <LoanSlip loan={lastIssuedLoan} />
          </div>
        </Modal>
      )}
    </div>
  );
};