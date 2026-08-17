import React from "react";
import { formatINR } from "@/lib/utils";
import { numberToIndianWords } from "@/lib/numberToWords";
import { type Sale, type SaleItem } from "@/lib/api/sales";

interface SalesInvoiceSlipProps {
  sale: Sale;
  items: SaleItem[];
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

export const SalesInvoiceSlip: React.FC<SalesInvoiceSlipProps> = ({
  sale,
  items,
}) => {
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

      {/* ── Invoice Title & Number ── */}
      <div className="flex items-center justify-between py-3 border-b border-gray-300 text-xs sm:text-sm">
        <div>
          <span className="font-bold text-gray-800 uppercase tracking-wider">
            GST Sales Tax Invoice &amp; Cash Receipt
          </span>
        </div>
        <div className="text-right">
          <span className="font-bold">Invoice No: </span>
          <span className="font-mono font-bold text-base">#{sale.id}</span>
        </div>
      </div>

      {/* ── Customer Details ── */}
      <div className="grid grid-cols-2 gap-4 py-3.5 border-b border-gray-300 text-xs leading-relaxed">
        <div className="space-y-0.5">
          <p>
            <span className="font-bold text-gray-700">Customer Name: </span>
            <span className="font-bold text-sm text-black">{sale.customerName}</span>
          </p>
          <p>
            <span className="font-bold text-gray-700">Mobile No: </span>
            <span className="font-mono">{sale.customerPhoneNo || "—"}</span>
          </p>
          {sale.customerAddress && (
            <p>
              <span className="font-bold text-gray-700">Address: </span>
              <span>{sale.customerAddress}</span>
            </p>
          )}
        </div>
        <div className="space-y-0.5 sm:text-right">
          <p>
            <span className="font-bold text-gray-700">Invoice Date: </span>
            <span className="font-medium">{fmtDate(sale.saleDate)}</span>
          </p>
          <p>
            <span className="font-bold text-gray-700">Payment Status: </span>
            <span className="font-bold text-green-900 bg-green-100 px-2 py-0.5 rounded border border-green-300 inline-block text-[11px]">
              Paid in Full
            </span>
          </p>
        </div>
      </div>

      {/* ── Itemized Ornaments Table ── */}
      <div className="py-3.5 border-b border-gray-300">
        <table className="w-full text-xs border border-collapse border-black">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="border border-black p-2 text-left">SKU</th>
              <th className="border border-black p-2 text-left">Product Title &amp; Spec</th>
              <th className="border border-black p-2 text-left">Purity</th>
              <th className="border border-black p-2 text-right">Net Wt</th>
              <th className="border border-black p-2 text-center">Qty</th>
              <th className="border border-black p-2 text-right">Rate (₹)</th>
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
                <td className="border border-black p-1.5 text-center font-mono font-semibold">
                  {item.quantity}
                </td>
                <td className="border border-black p-1.5 text-right font-mono">
                  {formatINR(item.pricePerPiece)}
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

      {/* ── Guarantee & Declarations ── */}
      <div className="py-3 text-[11px] text-gray-700 leading-relaxed space-y-1">
        <p className="font-bold text-gray-800">Guarantee &amp; Terms:</p>
        <p>
          1. 100% Certified pure gold, silver and diamond ornaments.
        </p>
        <p>
          2. Goods once sold can be exchanged as per prevailing market valuation policy.
        </p>
      </div>

      {/* ── Dual Signature Blocks ── */}
      <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-black text-xs">
        <div className="text-center space-y-1">
          <div className="border-b border-black w-40 mx-auto mb-1 h-6" />
          <p className="font-bold">Customer's Signature</p>
          <p className="text-[10px] text-gray-600">({sale.customerName})</p>
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
