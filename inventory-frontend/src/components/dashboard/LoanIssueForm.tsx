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
  loanAmount: "", // Starts empty so the placeholder "0" shows naturally
  issueDate: today(),
  description: "",
  weight: 0, // Default to 0 for weight
});

// Added onClose prop so the form can close itself after success
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
      description: "",
      weight: 0, 
    }),

    onSuccess: () => {
      toast.success("Loan issued successfully");
      // Fixed: Using the 'qc' variable we defined above
      qc.invalidateQueries({ queryKey: queryKeys.loans});
      // Fixed: Calls the optional onClose prop safely
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
    <div className="max-w-3xl mx-auto">
      <form
        onSubmit={submit}
        className="rounded-2xl bg-surface p-6 md:p-8 space-y-6"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Issue new loan</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Open-ended loan · close date recorded on settlement
          </p>
        </div>

        {/* Customer */}
        <section className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="md:col-span-2 space-y-1.5">
              <label className={fieldLabel}>Address</label>
              <textarea
                className={`${fieldInput} min-h-[80px] resize-y`}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
                placeholder="House no., street, area, city, PIN"
              />
            </div>
          </div>
        </section>

        {/* Collateral */}
        <section className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Collateral</h3>
          <div className="space-y-1.5">
            <label className={fieldLabel}>Metal type</label>
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-surface-2">
              {(["Gold", "Silver"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => update("metalType", m)}
                  className={
                    "px-4 py-1.5 rounded-md text-[12.5px] font-medium transition-colors " +
                    (form.metalType === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 pt-2">
            <label className={fieldLabel}>Base Weight (g)</label>
            <input
              type="number"
              step="0.01"
              value={form.weight || ""}
              onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border/50 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0.00"
            />
          </div>

           <div className="space-y-1.5 pt-2">
            <label className={fieldLabel}>Description</label>
            <input
              type="string"
              value={form.description || ""}
              onChange={(e) => update("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border/50 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Type i.e ring , necklace etc"
            />
          </div>
            
          </div>
          
        </section>

        {/* Loan & Date */}
        <section className="space-y-3">
          <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Loan details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            onClick={() => setForm(initialForm())}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Scale className="w-4 h-4" />
            {mutation.isPending ? "Issuing…" : "Issue Loan"}
          </button>
        </div>
      </form>
    </div>
  );
};