import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Scale,
  Calculator,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  PenTool,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatWeight,
  calculateLoanValue,
  cn,
} from "../../../lib/utils";
import {
  BASE_GOLD_RATE_24K,
  PURITY_MULTIPLIERS,
  MAX_LTV_RATIO,
  MONTHLY_INTEREST_RATE,
  MIN_LOAN_MONTHS,
  MAX_LOAN_MONTHS,
  type PurityType,
} from "../../../lib/constants";
import { issueNewLoan } from "../api/loan.api";
import React from "react";

type FormData = {
  customerName: string;
  phone: string;
  address: string;
  jewelryDescription: string;
  weightGrams: number;
  purity: PurityType;
  ltvPercentage: number;
  tenureMonths: number;
};

const INITIAL_FORM: FormData = {
  customerName: "",
  phone: "",
  address: "",
  jewelryDescription: "",
  weightGrams: 0,
  purity: "22K",
  ltvPercentage: 70,
  tenureMonths: 6,
};

const STEPS = [
  { num: 1, label: "Collateral & Details", icon: Scale },
  { num: 2, label: "Loan Terms", icon: Calculator },
  { num: 3, label: "Verification", icon: CheckCircle2 },
] as const;

export const LoanIssueForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const queryClient = useQueryClient();

  const effectiveRate =
    BASE_GOLD_RATE_24K * PURITY_MULTIPLIERS[formData.purity];
  const { goldValue: actualGoldValue, suggestedLoan: requestedLoanAmount } =
    calculateLoanValue(
      formData.weightGrams,
      effectiveRate,
      formData.ltvPercentage / 100
    );
  const monthlyInterest = requestedLoanAmount * MONTHLY_INTEREST_RATE;
  const totalRepayable =
    requestedLoanAmount + monthlyInterest * formData.tenureMonths;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["weightGrams", "ltvPercentage", "tenureMonths"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const step1Invalid =
    !formData.customerName.trim() ||
    !formData.phone.trim() ||
    formData.weightGrams <= 0;

  // Single source of truth: useMutation handles loading, error, success
  const mutation = useMutation({
    mutationFn: issueNewLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setStep(1);
      setFormData(INITIAL_FORM);
    },
  });

  const handleSubmit = () => {
    const payload = {
      name: formData.customerName,
      mobileNo: formData.phone,
      address: formData.address,
      jewelryDescription:
        formData.jewelryDescription ||
        `${formatWeight(formData.weightGrams)} ${formData.purity} Gold`,
      amountGiven: requestedLoanAmount,
      weightGrams: formData.weightGrams,
      purity: formData.purity,
      ltvPercentage: formData.ltvPercentage,
      tenureMonths: formData.tenureMonths,
    };

    mutation.mutate(payload);
  };

  const isSubmitting = mutation.isPending;

  const inputClass =
    "w-full bg-obsidian border border-gold-muted rounded-md py-2.5 px-4 text-slate-200 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all placeholder:text-slate-600";

  return (
    <div className="glass-card max-w-3xl mx-auto flex flex-col h-full relative overflow-hidden">
      <div className="flex border-b border-gold-muted bg-obsidian-light/50">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isPassed = step > s.num;
          return (
            <div
              key={s.num}
              className={cn(
                "flex-1 flex items-center justify-center py-4 border-b-2 transition-all duration-300",
                isActive
                  ? "border-gold text-gold bg-obsidian/50"
                  : isPassed
                  ? "border-emerald-500/50 text-emerald-400"
                  : "border-transparent text-slate-500"
              )}
            >
              <Icon className="w-4 h-4 mr-2 shrink-0" />
              <span className="font-medium text-sm hidden sm:inline">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif text-gold-light">
              Customer & Collateral
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">
                  Customer Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Ramesh Kumar"
                    className={cn(inputClass, "pl-10")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm text-slate-400">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Enter complete residential address..."
                    className={cn(inputClass, "pl-10 resize-none")}
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm text-slate-400">
                  Jewelry Description
                </label>
                <input
                  type="text"
                  name="jewelryDescription"
                  value={formData.jewelryDescription}
                  onChange={handleInputChange}
                  placeholder="e.g. 2 Gold Bangles, 1 Chain"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="h-px w-full bg-gold-muted/40" />

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">
                  Gold Weight (grams)
                </label>
                <input
                  type="number"
                  name="weightGrams"
                  min={0}
                  step={0.1}
                  value={formData.weightGrams || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={cn(inputClass, "font-mono")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Gold Purity</label>
                <select
                  name="purity"
                  value={formData.purity}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="24K">24 Karat (99.9%)</option>
                  <option value="22K">22 Karat (91.6%)</option>
                  <option value="22KT">22 KT Hallmark (91.67%)</option>
                  <option value="18K">18 Karat (75.0%)</option>
                  <option value="14K">14 Karat (58.5%)</option>
                </select>
              </div>
            </div>

            {formData.weightGrams > 0 && (
              <div className="p-4 bg-obsidian-light border border-gold/30 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-400">
                    Calculated Market Value
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {formatWeight(formData.weightGrams)} × ₹
                    {effectiveRate.toFixed(0)}/g ({formData.purity})
                  </p>
                </div>
                <p className="text-2xl text-gold font-bold font-mono">
                  {formatCurrency(actualGoldValue)}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif text-gold-light">
              Loan Configuration
            </h2>

            <div className="bg-obsidian-light p-6 rounded-lg border border-gold-muted">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <label className="text-sm text-slate-400">
                    Loan to Value (LTV) Ratio
                  </label>
                  <p className="text-2xl text-gold font-bold font-mono mt-1">
                    {formData.ltvPercentage}%
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Max: {MAX_LTV_RATIO * 100}%
                </p>
              </div>
              <input
                type="range"
                name="ltvPercentage"
                min={10}
                max={MAX_LTV_RATIO * 100}
                step={5}
                value={formData.ltvPercentage}
                onChange={handleInputChange}
                className="w-full h-1.5 bg-obsidian rounded-lg appearance-none cursor-pointer accent-gold"
              />
            </div>

            <div className="bg-obsidian-light p-6 rounded-lg border border-gold-muted space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-400">Loan Tenure</label>
                <span className="text-gold font-bold font-mono">
                  {formData.tenureMonths} months
                </span>
              </div>
              <input
                type="range"
                name="tenureMonths"
                min={MIN_LOAN_MONTHS}
                max={MAX_LOAN_MONTHS}
                value={formData.tenureMonths}
                onChange={handleInputChange}
                className="w-full h-1.5 bg-obsidian rounded-lg appearance-none cursor-pointer accent-gold"
              />
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>{MIN_LOAN_MONTHS}m</span>
                <span>{MAX_LOAN_MONTHS}m</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Loan Principal",
                  value: formatCurrency(requestedLoanAmount),
                  color: "text-slate-200",
                },
                {
                  label: "Monthly Interest",
                  value: formatCurrency(monthlyInterest),
                  color: "text-amber-400",
                },
                {
                  label: "Total Repayable",
                  value: formatCurrency(totalRepayable),
                  color: "text-gold",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-4 border border-gold-muted rounded-md bg-obsidian text-center"
                >
                  <p className="text-xs text-slate-500 mb-1.5">{label}</p>
                  <p className={cn("text-lg font-bold font-mono", color)}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-serif text-gold-light">
              Final Verification
            </h2>

            {mutation.isError && (
              <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-md text-red-400 text-sm">
                Failed to save loan. Is Spring Boot running on :8080?
              </div>
            )}

            <div className="bg-obsidian-light p-6 rounded-lg border border-gold/40">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                {[
                  { label: "Customer", value: formData.customerName || "—" },
                  { label: "Phone", value: formData.phone || "—" },
                  { label: "Address", value: formData.address || "—" },
                  {
                    label: "Collateral",
                    value: formData.jewelryDescription
                      ? `${formData.jewelryDescription} — ${formatWeight(
                          formData.weightGrams
                        )} ${formData.purity}`
                      : `${formatWeight(formData.weightGrams)} ${
                          formData.purity
                        } Gold`,
                  },
                  {
                    label: "Tenure",
                    value: `${formData.tenureMonths} months`,
                  },
                  {
                    label: "LTV Ratio",
                    value: `${formData.ltvPercentage}%`,
                  },
                ].map(({ label, value }) => (
                  <React.Fragment key={label}>
                    <div className="text-slate-400">{label}</div>
                    <div className="text-slate-200 font-medium text-right">
                      {value}
                    </div>
                  </React.Fragment>
                ))}

                <div className="col-span-2 h-px bg-gold-muted/40 my-1" />

                <div className="text-slate-300 font-medium text-lg">
                  Amount to Disburse
                </div>
                <div className="text-gold font-bold text-xl text-right font-mono">
                  {formatCurrency(requestedLoanAmount)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-gold" />
                Customer Signature
              </label>
              <div className="w-full h-32 bg-slate-200 rounded-md border-2 border-dashed border-slate-400 flex items-center justify-center">
                <p className="text-slate-500 text-sm select-none">
                  Digital Signature Pad Active
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gold-muted bg-obsidian flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="px-6 py-2.5 rounded-md text-slate-400 border border-transparent hover:text-slate-200 hover:border-slate-700 disabled:opacity-30 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={nextStep}
            disabled={step === 1 && step1Invalid}
            className="px-6 py-2.5 bg-obsidian-light border border-gold text-gold rounded-md hover:bg-gold hover:text-obsidian disabled:opacity-40 transition-all flex items-center gap-2"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-gold-gradient text-obsidian font-bold rounded-md shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Authorize & Issue Loan"
            )}
          </button>
        )}
      </div>
    </div>
  );
};