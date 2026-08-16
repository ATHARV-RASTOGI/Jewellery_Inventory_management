import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Scale, UserCheck, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { issueLoan, findLoanByCustomer, type Loan } from "@/lib/api/loans";
import { queryKeys } from "@/lib/api/query-keys";
import { formatINR } from "@/lib/utils";

const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all";

const today = () => new Date().toISOString().slice(0, 10);

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
  issueDate: today(),
  description: "",
  weight: 0,
});

export const LoanIssueForm = ({ onClose }: { onClose?: () => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm());
  const [existingCustomer, setExistingCustomer] = useState<Loan | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

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
    toast.success("Phone & Address autofilled from existing record!");
  };

  const mutation = useMutation({
    mutationFn: () => issueLoan({
      name: form.name,
      fatherName: form.fatherName || undefined,
      mobileNo: form.phoneNumber,
      address: form.address,
      metal: form.metalType,
      loanAmount: Number(form.loanAmount),
      issueDate: form.issueDate || today(),
      description: form.description || "",
      weight: form.weight || 0, 
    }),
    onSuccess: () => {
      toast.success("Loan issued successfully");
      qc.invalidateQueries({ queryKey: queryKeys.loans});
      onClose?.(); 
    },
    onError: () => {
      toast.error("Failed to issue loan");
    }
  });

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phoneNumber.length !== 10 || !/^\d+$/.test(form.phoneNumber)) {
      toast.error("Mobile no should be exactly 10 digits");
      return;
    }
    mutation.mutate();
  };

  return (
    // Removed max-w-3xl and mx-auto, allowing it to expand naturally
    <div className="w-full h-full pb-8">
      <form onSubmit={submit} className="flex flex-col space-y-8 animate-in fade-in duration-300">
        
        {/* Top Actions & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/40">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Loan Origination</h2>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              Open-ended loan · close date recorded on settlement
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
              onClick={() => {
                setForm(initialForm());
                setExistingCustomer(null);
              }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
            >
              <Scale className="w-4 h-4" />
              {mutation.isPending ? "Issuing…" : "Issue Loan"}
            </button>
          </div>
        </div>

        {/* Two-Column Grid Layout for Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Customer Profile */}
          <section className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-border/20">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Customer Profile
              </h3>
              {isSearchingCustomer && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking customer…</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className={fieldLabel}>Customer name</label>
                <input
                  className={fieldInput}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  placeholder="e.g. Anjali Verma"
                />
              </div>
              <div className="space-y-1.5">
                <label className={fieldLabel}>Father's / Husband's name</label>
                <input
                  className={fieldInput}
                  value={form.fatherName}
                  onChange={(e) => update("fatherName", e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                />
              </div>

              {/* Existing Customer Detected Card */}
              {existingCustomer && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Existing Customer Found
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Previous Loan #{existingCustomer.id} · {existingCustomer.status === "ACTIVE" ? "Active" : "Closed"}
                        </p>
                      </div>
                    </div>
                    {existingCustomer.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <AlertCircle className="w-3 h-3" /> Active Loan ({formatINR(existingCustomer.loanAmount)})
                      </span>
                    )}
                  </div>

                  <div className="text-[11.5px] text-muted-foreground space-y-0.5 pl-7">
                    {existingCustomer.mobileNo && <p>📱 {existingCustomer.mobileNo}</p>}
                    {existingCustomer.address && <p className="truncate">📍 {existingCustomer.address}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={handleAutofill}
                    className="w-full mt-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-fill Phone & Address
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className={fieldLabel}>Phone number</label>
                <input
                  className={fieldInput}
                  value={form.phoneNumber}
                  onChange={(e) => update("phoneNumber", e.target.value)}
                  required
                  placeholder="+91 ..."
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
                <label className={fieldLabel}>Address</label>
                <textarea
                  className={`${fieldInput} min-h-[140px] resize-y`}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  required
                  placeholder="House no., street, area, city, PIN"
                />
              </div>
            </div>
          </section>

          {/* Right Column: Collateral & Terms */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Collateral */}
            <section className="space-y-5">
              <div className="pb-2 border-b border-border/20">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Collateral Details
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Metal type</label>
                  <div className="inline-flex items-center gap-1 p-1 w-full rounded-lg bg-surface-2">
                    {(["Gold", "Silver"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => update("metalType", m)}
                        className={
                          "flex-1 py-1.5 rounded-md text-[12.5px] font-medium transition-colors " +
                          (form.metalType === m
                            ? "bg-background text-foreground shadow-sm border border-border/50"
                            : "text-muted-foreground hover:text-foreground")
                        }
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Base Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.weight || ""}
                    onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
                    className={fieldInput}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className={fieldLabel}>Description</label>
                  <input
                    type="text"
                    value={form.description || ""}
                    onChange={(e) => update("description", e.target.value)}
                    className={fieldInput}
                    placeholder="e.g. 2 Bangles, 1 Ring"
                  />
                </div>
              </div>
            </section>

            {/* Loan & Date */}
            <section className="space-y-5">
              <div className="pb-2 border-b border-border/20">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Loan Terms
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Loan amount issued (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className={fieldInput}
                    value={form.loanAmount}
                    onChange={(e) => update("loanAmount", parseFloat(e.target.value) || "")}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={fieldLabel}>Issue date</label>
                  <input
                    type="date"
                    className={fieldInput}
                    value={form.issueDate}
                    onChange={(e) => update("issueDate", e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>
            
          </div>
        </div>
      </form>
    </div>
  );
};