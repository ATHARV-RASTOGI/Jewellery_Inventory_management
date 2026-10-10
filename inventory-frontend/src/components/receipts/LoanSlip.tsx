import React from "react";
import { formatINR, fmtDate } from "@/lib/utils";
import { numberToIndianWords, numberToHindiWords } from "@/lib/numberToWords";
import { SLIP_TEXT, type SlipLanguage } from "@/lib/receiptTranslations";
import { type Loan, type InterestPayment, type PendingDisbursement } from "@/lib/api/loans";
import { PrintSlip } from "./PrintSlip";

interface LoanSlipProps {
  loan: Loan;
  payments?: InterestPayment[];
  pendingDisbursements?: PendingDisbursement[];
  currentBalance?: number;
  language?: SlipLanguage;
  onLanguageChange?: (lang: SlipLanguage) => void;
}

export const LoanSlip: React.FC<LoanSlipProps> = ({
  loan,
  payments = [],
  pendingDisbursements = [],
  currentBalance,
  language = "bilingual",
  onLanguageChange,
}) => {
  const t = SLIP_TEXT[language] || SLIP_TEXT.bilingual;
  const hasHistory = payments.length > 0 || pendingDisbursements.length > 0;
  const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);

  return (
    <PrintSlip
      title={hasHistory ? t.titleStatement : t.titleLoanPledge}
      idLabel={t.accountNo}
      id={loan.id}
      language={language}
      onLanguageChange={onLanguageChange}
      customer={{
        name: loan.name,
        fatherName: loan.fatherName,
        phone: loan.mobileNo,
        address: loan.address,
        date: loan.issueDate,
        dateLabel: t.originationDate,
        statusBadge: (
          <span className="font-bold uppercase px-2 py-0.5 rounded border border-black inline-block text-[11px]">
            {loan.status === "ACTIVE" ? t.activeStatus : t.closedStatus}
          </span>
        ),
      }}
      footerNotes={
        <div className="py-3 text-[11px] text-gray-700 leading-relaxed space-y-1 text-left">
          <p className="font-bold text-gray-800">{t.termsTitle}:</p>
          <p>{t.term1}</p>
          <p>{t.term2}</p>
          <p>{t.term3}</p>
        </div>
      }
    >
      {/* ── Collateral Details Table ── */}
      <div className="py-3.5 border-b border-gray-300">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
          {t.collateralHeader}
        </p>
        <table className="w-full text-xs border border-collapse border-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black p-2 text-left">{t.metal}</th>
              <th className="border border-black p-2 text-right">{t.netWeight}</th>
              <th className="border border-black p-2 text-left">{t.itemDescription}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold">{loan.metal}</td>
              <td className="border border-black p-2 text-right font-mono font-bold">
                {loan.weight ? `${loan.weight} g` : "—"}
              </td>
              <td className="border border-black p-2">
                {loan.description || (language === "hi" ? "शारीरिक निरीक्षणानुसार" : "As per physical assessment")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Principal Financial Terms ── */}
      <div className="py-3.5 border-b border-gray-300 bg-gray-50/70 p-3 rounded my-2 border border-gray-200">
        <div className="flex justify-between items-baseline">
          <span className="text-xs uppercase font-bold text-gray-700">
            {t.principalAmount}:
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-black">
            {formatINR(loan.loanAmount)}
          </span>
        </div>
        <div className="text-xs font-medium text-gray-800 mt-1">
          <span className="font-semibold text-gray-700">{t.amountInWords}: </span>
          {language === "en" && (
            <span className="font-bold text-gray-900">{numberToIndianWords(loan.loanAmount)}</span>
          )}
          {language === "hi" && (
            <span className="font-bold text-gray-900">{numberToHindiWords(loan.loanAmount)}</span>
          )}
          {language === "bilingual" && (
            <span className="inline-flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold text-gray-900">{numberToHindiWords(loan.loanAmount)}</span>
              <span className="text-[11px] text-gray-600 font-sans">({numberToIndianWords(loan.loanAmount)})</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Payment History & Account Statement Table ── */}
      {hasHistory && (
        <div className="py-3.5 border-b border-gray-300">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2">
            {t.paymentHistoryHeader}
          </p>
          <table className="w-full text-xs border border-collapse border-black">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-1.5 text-left">{t.paidDate}</th>
                <th className="border border-black p-1.5 text-left">
                  {language === "hi"
                    ? "लेनदेन का प्रकार"
                    : language === "bilingual"
                    ? "Transaction / विवरण"
                    : "Transaction Type"}
                </th>
                <th className="border border-black p-1.5 text-right">{t.interestPaid}</th>
                <th className="border border-black p-1.5 text-right">{t.balanceRemaining}</th>
              </tr>
            </thead>
            <tbody>
              {pendingDisbursements.map((d) => (
                <tr key={d.id}>
                  <td className="border border-black p-1.5">{fmtDate(d.disbursedDate)}</td>
                  <td className="border border-black p-1.5 font-medium text-blue-800">
                    {language === "hi"
                      ? "अतिरिक्त मूलधन वितरण"
                      : language === "bilingual"
                      ? "Additional Collateral / अतिरिक्त वितरण"
                      : "Additional Collateral Disbursement"}
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
                  <td className="border border-black p-1.5 font-medium">
                    {language === "hi"
                      ? "ब्याज / आंशिक भुगतान"
                      : language === "bilingual"
                      ? "Interest / ब्याज भुगतान"
                      : "Interest / Part Payment"}
                  </td>
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
                  {t.totalPaid}:
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
