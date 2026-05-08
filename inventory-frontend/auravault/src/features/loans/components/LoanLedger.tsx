import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, AlertCircle, IndianRupee } from "lucide-react";
import { formatCurrency, formatWeight } from "../../../lib/utils";
import { MONTHLY_INTEREST_RATE } from "../../../lib/constants";
import { apiClient } from "../../../lib/api-client";

export interface CustomerJewelry {
  description: string;
  weightGrams: number;
  purity: string;
}

export interface LoanEntity {
  id: string;
  issueDate: string;
  customerName: string;
  jewelryTaken: CustomerJewelry;
  principalAmount: number;
  monthlyInterestRate: number;
}

type GroupedLoans = Record<string, Record<string, Record<string, LoanEntity[]>>>;

const fetchLoans = async (): Promise<LoanEntity[]> => {
  const response = await apiClient.get<LoanEntity[]>("/loans");
  return response.data;
};

const groupLoansByDate = (loans: LoanEntity[]): GroupedLoans => {
  return loans.reduce<GroupedLoans>((acc, loan) => {
    const date = new Date(loan.issueDate + "T00:00:00");
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("en-IN", { month: "long" });
    const day = date.getDate().toString();

    acc[year] ??= {};
    acc[year][month] ??= {};
    acc[year][month][day] ??= [];
    acc[year][month][day].push(loan);

    return acc;
  }, {});
};

const getDayTotal = (loans: LoanEntity[]): number =>
  loans.reduce((sum, l) => sum + l.principalAmount, 0);

export const LoanLedger = () => {
  const { data: loans = [], isLoading, isError } = useQuery<LoanEntity[]>({
    queryKey: ["loans"],
    queryFn: fetchLoans,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-obsidian">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-400 font-medium">Failed to load loan ledger</p>
        <p className="text-slate-600 text-sm">Is the Spring Boot server running on :8080?</p>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian gap-3">
        <IndianRupee className="w-10 h-10 text-slate-700" />
        <p className="text-slate-400 font-medium">No active loans</p>
        <p className="text-slate-600 text-sm">Issued loans will appear here</p>
      </div>
    );
  }

  const groupedData = groupLoansByDate(loans);

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-obsidian">

      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold-light">Active Loan Ledger</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {loans.length} active {loans.length === 1 ? "loan" : "loans"} · Total{" "}
          <span className="text-gold font-medium">{formatCurrency(getDayTotal(loans))}</span> outstanding
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedData)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([year, months]) => (
            <div key={year} className="glass-card p-6 border border-gold-muted/50 rounded-xl">

              <h2 className="text-2xl font-serif text-gold border-b border-gold/20 pb-3 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 shrink-0" />
                {year}
              </h2>

              <div className="space-y-6">
                {Object.entries(months).map(([month, days]) => (
                  <div key={month} className="ml-4 border-l border-gold-muted/30 pl-6">

                    <h3 className="text-base font-medium text-slate-300 mb-4 tracking-wide">{month}</h3>

                    <div className="space-y-4">
                      {Object.entries(days)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .map(([day, dayLoans]) => (
                          <div key={day} className="bg-obsidian-light/50 rounded-lg overflow-hidden border border-gold-muted/20">

                            <div className="bg-obsidian py-2 px-4 border-b border-gold-muted/20 flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {month} {day}, {year}
                              </span>
                              <span className="text-xs font-mono text-gold">
                                {formatCurrency(getDayTotal(dayLoans))} · {dayLoans.length} {dayLoans.length === 1 ? "loan" : "loans"}
                              </span>
                            </div>

                            <table className="w-full text-left text-sm">
                              <thead className="text-xs text-slate-500 uppercase bg-obsidian-light/30">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Loan ID</th>
                                  <th className="px-4 py-3 font-medium">Customer</th>
                                  <th className="px-4 py-3 font-medium">Collateral</th>
                                  <th className="px-4 py-3 font-medium text-right">Principal</th>
                                  <th className="px-4 py-3 font-medium text-right">Rate</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gold-muted/10">
                                {dayLoans.map((loan) => (
                                  <tr key={loan.id} className="hover:bg-obsidian-light transition-colors group">
                                    <td className="px-4 py-4 font-mono text-xs text-slate-500 group-hover:text-gold-muted transition-colors">
                                      {loan.id}
                                    </td>
                                    <td className="px-4 py-4 text-slate-300 font-medium">{loan.customerName}</td>
                                    <td className="px-4 py-4">
                                      <p className="text-slate-300">{loan.jewelryTaken.description}</p>
                                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        {formatWeight(loan.jewelryTaken.weightGrams)} · {loan.jewelryTaken.purity}
                                      </p>
                                    </td>
                                    <td className="px-4 py-4 text-right text-gold font-medium font-mono">
                                      {formatCurrency(loan.principalAmount)}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono text-xs">
                                      <span className={
                                        loan.monthlyInterestRate > MONTHLY_INTEREST_RATE * 100
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                      }>
                                        {loan.monthlyInterestRate}% / mo
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};