import React from "react";
import { formatINR, fmtDate } from "@/lib/utils";
import { numberToIndianWords } from "@/lib/numberToWords";
import { type Loan, type InterestPayment, type PendingDisbursement } from "@/lib/api/loans";
import { PrintSlip } from "./PrintSlip";

interface LoanSlipProps {
  loan: Loan;
  payments?: InterestPayment[];
  pendingDisbursements?: PendingDisbursement[];
  currentBalance?: number;
}

export const LoanSlip: React.FC<LoanSlipProps> = ({
  loan,
  payments = [],
  pendingDisbursements = [],
  currentBalance,
}) => {
  const hasHistory = payments.length > 0 || pendingDisbursements.length > 0;
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <PrintSlip
      title={hasHistory ? "Loan Statement & Payment Record" : "Collateral Loan Pledge Voucher"}
      idLabel="Loan Account No"
      id={loan.id}
      customer={{
        name: loan.name,
        fatherName: loan.fatherName,
        phone: loan.mobileNo,
        address: loan.address,
        date: loan.issueDate,
        dateLabel: "Origination Date",
        statusBadge: (
          <span className="font-bold uppercase px-2 py-0.5 rounded border border-black inline-block text-[11px]">
            {loan.status === "ACTIVE" ? "Active" : "Closed / Settled"}
          </span>
        ),
      }}
      footerNotes={
        <div className="py-3 text-[11px] text-gray-700 leading-relaxed space-y-1 text-left">
          <p className="font-bold text-gray-800">Terms &amp; Conditions:</p>
          <p>
            1. The borrower has pledged the jewelry ornaments mentioned above in sound physical condition as collateral against the received principal loan amount.
          </p>
          <p>
            2. Interest is calculated monthly as agreed. Collateral shall be safely redeemed upon full clearance of principal and accrued interest.
          </p>
        </div>
      }
    >
      {/* ── Collateral Details Table ── */}
      <div className="py-3.5 border-b border-gray-300">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
          Collateral Pledged (Girvi)
        </p>
        <table className="w-full text-xs border border-collapse border-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black p-2 text-left">Metal</th>
              <th className="border border-black p-2 text-right">Net Weight</th>
              <th className="border border-black p-2 text-left">Item Description &amp; Marks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold">{loan.metal}</td>
              <td className="border border-black p-2 text-right font-mono font-bold">
                {loan.weight ? `${loan.weight} g` : "—"}
              </td>
              <td className="border border-black p-2">
                {loan.description || "As per physical assessment"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Principal Financial Terms ── */}
      <div className="py-3.5 border-b border-gray-300 bg-gray-50/70 p-3 rounded my-2 border border-gray-200">
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase font-bold text-gray-700">
            Principal Loan Amount Disbursed:
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-black">
            {formatINR(loan.loanAmount)}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-800 mt-1 italic">
          Amount in words: <span className="font-bold not-italic">{numberToIndianWords(loan.loanAmount)}</span>
        </p>
      </div>

      {/* ── Payment History & Account Statement Table ── */}
      {hasHistory && (
        <div className="py-3.5 border-b border-gray-300">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
            Payment History &amp; Settlements Till Date
          </p>
          <table className="w-full text-xs border border-collapse border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-1.5 text-left">Date</th>
                <th className="border border-black p-1.5 text-left">Transaction Type</th>
                <th className="border border-black p-1.5 text-right">Amount Deposited</th>
                <th className="border border-black p-1.5 text-right">Balance Remaining</th>
              </tr>
            </thead>
            <tbody>
              {pendingDisbursements.map((d) => (
                <tr key={d.id}>
                  <td className="border border-black p-1.5">{fmtDate(d.disbursedDate)}</td>
                  <td className="border border-black p-1.5 font-medium text-blue-800">
                    Additional Collateral Disbursement
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono font-semibold text-blue-800">
                    + {formatINR(d.amount)}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">—</td>
                </tr>
              ))}

              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="border border-black p-1.5">{fmtDate(p.paymentDate)}</td>
                  <td className="border border-black p-1.5 font-medium">Interest / Part Payment</td>
                  <td className="border border-black p-1.5 text-right font-mono font-bold text-green-800">
                    − {formatINR(p.amountPaid)}
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">
                    {formatINR(p.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold border-t border-black">
                <td colSpan={2} className="border border-black p-2 text-right uppercase">
                  Total Payments Applied Till Date:
                </td>
                <td className="border border-black p-2 text-right font-mono text-green-900">
                  {formatINR(totalPaid)}
                </td>
                <td className="border border-black p-2 text-right font-mono font-extrabold text-black">
                  {currentBalance !== undefined ? formatINR(currentBalance) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </PrintSlip>
  );
};
