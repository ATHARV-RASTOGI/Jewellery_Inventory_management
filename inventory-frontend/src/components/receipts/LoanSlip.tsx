import React from "react";
import { formatINR } from "@/lib/utils";
import { numberToIndianWords } from "@/lib/numberToWords";
import { type Loan, type InterestPayment, type PendingDisbursement } from "@/lib/api/loans";

interface LoanSlipProps {
  loan: Loan;
  payments?: InterestPayment[];
  pendingDisbursements?: PendingDisbursement[];
  currentBalance?: number;
}

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const LoanSlip: React.FC<LoanSlipProps> = ({
  loan,
  payments = [],
  pendingDisbursements = [],
  currentBalance,
}) => {
  const hasHistory = payments.length > 0 || pendingDisbursements.length > 0;
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <div className="font-sans text-black bg-white p-6 sm:p-8 max-w-[650px] w-full mx-auto border border-gray-300 rounded-lg shadow-sm print:border-none print:shadow-none print:p-2 print:max-w-none">
      {/* ── Official Shop Header ── */}
      <div className="text-center pb-4 border-b-2 border-black">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase">
          K.K. JEWELLERS
        </h1>
        <p className="text-xs sm:text-[13px] font-semibold text-gray-800 tracking-wide mt-0.5">
          Gold, Silver &amp; Diamond Merchants · Bankers
        </p>
        <p className="text-xs text-gray-700 mt-1">
          Nehru Road, Farrukhabad, U.P. — 209625
        </p>
        <p className="text-xs text-gray-600 font-medium">
          Phone: +91 94151 88470 / 98380 12345
        </p>
      </div>

      {/* ── Voucher Title & Number ── */}
      <div className="flex items-center justify-between py-3 border-b border-gray-300 text-xs sm:text-sm">
        <div>
          <span className="font-bold text-gray-800 uppercase tracking-wider">
            {hasHistory ? "Loan Statement & Payment Record" : "Collateral Loan Pledge Voucher"}
          </span>
        </div>
        <div className="text-right">
          <span className="font-bold">Loan Account No: </span>
          <span className="font-mono font-bold text-base">#{loan.id}</span>
        </div>
      </div>

      {/* ── Borrower & Loan Origination Details ── */}
      <div className="grid grid-cols-2 gap-4 py-3.5 border-b border-gray-300 text-xs leading-relaxed">
        <div className="space-y-1">
          <p>
            <span className="font-bold text-gray-700">Borrower Name: </span>
            <span className="font-bold text-sm text-black">{loan.name}</span>
          </p>
          {loan.fatherName && (
            <p>
              <span className="font-bold text-gray-700">Father's / Husband's Name: </span>
              <span>{loan.fatherName}</span>
            </p>
          )}
          <p>
            <span className="font-bold text-gray-700">Mobile No: </span>
            <span className="font-mono">{loan.mobileNo || "—"}</span>
          </p>
          <p>
            <span className="font-bold text-gray-700">Address: </span>
            <span>{loan.address || "—"}</span>
          </p>
        </div>

        <div className="space-y-1 sm:text-right">
          <p>
            <span className="font-bold text-gray-700">Origination Date: </span>
            <span className="font-medium">{fmtDate(loan.issueDate)}</span>
          </p>
          <p>
            <span className="font-bold text-gray-700">Loan Status: </span>
            <span className="font-bold uppercase px-2 py-0.5 rounded border border-black inline-block text-[11px]">
              {loan.status === "ACTIVE" ? "Active" : "Closed / Settled"}
            </span>
          </p>
        </div>
      </div>

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

      {/* ── Payment History & Account Statement Table (If any payments exist) ── */}
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

      {/* ── Terms & Declarations ── */}
      <div className="py-3 text-[11px] text-gray-700 leading-relaxed space-y-1">
        <p className="font-bold text-gray-800">Terms &amp; Conditions:</p>
        <p>
          1. The borrower has pledged the jewelry ornaments mentioned above in sound physical condition as collateral against the received principal loan amount.
        </p>
        <p>
          2. Interest is calculated monthly as agreed. Collateral shall be safely redeemed upon full clearance of principal and accrued interest.
        </p>
      </div>

      {/* ── Dual Signature Blocks ── */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-black text-xs">
        <div className="text-center space-y-1">
          <div className="border-b border-black w-40 mx-auto mb-1 h-6" />
          <p className="font-bold">Borrower's Signature / Thumb Impression</p>
          <p className="text-[10px] text-gray-600">({loan.name})</p>
        </div>
        <div className="text-center space-y-1">
          <div className="border-b border-black w-40 mx-auto mb-1 h-6" />
          <p className="font-bold">For K.K. JEWELLERS</p>
          <p className="text-[10px] text-gray-600">(Authorized Signatory)</p>
        </div>
      </div>
    </div>
  );
};
