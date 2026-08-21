import React from "react";
import { formatINR } from "@/lib/utils";
import { numberToIndianWords } from "@/lib/numberToWords";
import { type Sale, type SaleItem } from "@/lib/api/sales";
import { PrintSlip } from "./PrintSlip";

interface SalesInvoiceSlipProps {
  sale: Sale;
  items: SaleItem[];
}

export const SalesInvoiceSlip: React.FC<SalesInvoiceSlipProps> = ({
  sale,
  items,
}) => {
  return (
    <PrintSlip
      title="GST Sales Tax Invoice & Cash Receipt"
      idLabel="Invoice No"
      id={sale.id}
      customer={{
        name: sale.customerName,
        phone: sale.customerPhoneNo,
        address: sale.customerAddress,
        date: sale.saleDate,
        dateLabel: "Invoice Date",
        statusBadge: (
          <span className="font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded border border-green-300 inline-block text-[11px]">
            Paid in Full
          </span>
        ),
      }}
      footerNotes={
        <div className="py-3 text-[11px] text-gray-700 leading-relaxed space-y-1 text-left">
          <p className="font-bold text-gray-800">Guarantee &amp; Terms:</p>
          <p>1. 100% Certified pure gold, silver and diamond ornaments.</p>
          <p>
            2. Goods once sold can be exchanged as per prevailing market valuation policy.
          </p>
        </div>
      }
    >
      {/* ── Itemized Ornaments Table ── */}
      <div className="py-3.5 border-b border-gray-300">
        <table className="w-full text-xs border border-collapse border-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black p-2 text-left">SKU</th>
              <th className="border border-black p-2 text-left">Product Title &amp; Spec</th>
              <th className="border border-black p-2 text-left">Purity</th>
              <th className="border border-black p-2 text-right">Net Wt</th>
              <th className="border border-black p-2 text-center">Metal Rate (₹/10g)</th>
              <th className="border border-black p-2 text-center">Making %</th>
              <th className="border border-black p-2 text-right">Unit Rate (₹)</th>
              <th className="border border-black p-2 text-center">Qty</th>
              <th className="border border-black p-2 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border border-black p-1.5 font-mono text-[11px] text-gray-600">
                  {item.sku}
                </td>
                <td className="border border-black p-1.5 font-bold">
                  {item.productName}
                </td>
                <td className="border border-black p-1.5 font-medium">
                  {item.material} {item.purity}
                </td>
                <td className="border border-black p-1.5 text-right font-mono">
                  {item.weight ? `${item.weight} g` : "—"}
                </td>
                <td className="border border-black p-1.5 text-center font-mono text-gray-700">
                  {item.appliedRatePer10g ? formatINR(item.appliedRatePer10g) : "—"}
                </td>
                <td className="border border-black p-1.5 text-center font-mono text-gray-700">
                  {item.makingChargePercent ? `${item.makingChargePercent}%` : "—"}
                </td>
                <td className="border border-black p-1.5 text-right font-mono">
                  {formatINR(item.pricePerPiece)}
                </td>
                <td className="border border-black p-1.5 text-center font-mono font-semibold">
                  {item.quantity}
                </td>
                <td className="border border-black p-1.5 text-right font-mono font-bold">
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Financial Summary ── */}
      <div className="py-3.5 border-b border-gray-300 bg-gray-50/70 p-3.5 rounded my-2 border border-gray-200 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-700">
          <span>Taxable Subtotal:</span>
          <span className="font-mono font-bold text-black">{formatINR(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-700">
          <span>GST (3%):</span>
          <span className="font-mono font-bold text-black">{formatINR(sale.gstAmount)}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-black">
          <span className="text-xs uppercase font-extrabold text-black">
            Grand Total (Net Paid):
          </span>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-black">
            {formatINR(sale.grandTotal)}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-800 pt-1 italic">
          Amount in words: <span className="font-bold not-italic">{numberToIndianWords(sale.grandTotal)}</span>
        </p>
      </div>
    </PrintSlip>
  );
};
