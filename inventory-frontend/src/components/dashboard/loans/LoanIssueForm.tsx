import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { toast } from "sonner";

import { issueLoan } from "@/lib/api/loans";
import { queryKeys } from "@/lib/api/query-keys";

const fieldLabel = "text-[11.5px] font-medium text-muted-foreground tracking-wide";
const fieldInput =
  "w-full bg-surface-2 border border-transparent rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all";

const today = () => new Date().toISOString().slice(0, 10);

type FormState = {
  name: string;
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

  const mutation = useMutation({
    mutationFn: () => issueLoan({
      name: form.name,
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
              onClick={() => setForm(initialForm())}
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
            <div className="pb-2 border-b border-border/20">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Customer Profile
              </h3>
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