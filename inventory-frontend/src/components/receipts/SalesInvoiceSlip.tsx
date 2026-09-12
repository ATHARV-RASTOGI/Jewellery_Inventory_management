import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@/lib/utils";
import { numberToIndianWords } from "@/lib/numberToWords";
import { type Sale, type SaleItem } from "@/lib/api/sales";
import { fetchStoreProfile } from "@/lib/api/storeProfile";
import { fmtDate } from "@/lib/utils";

interface SalesInvoiceSlipProps {
  sale: Sale;
  items: SaleItem[];
}

export const SalesInvoiceSlip: React.FC<SalesInvoiceSlipProps> = ({
  sale,
  items,
}) => {
  const { data: profile } = useQuery({
    queryKey: ["store-profile"],
    queryFn: fetchStoreProfile,
  });

  const shopName = profile?.shopName ?? "SWARNA MAHAL JEWELLERS";
  const shopAddress = profile?.address ?? "123, Sarafa Bazar, Main Road, City (U.P.)";
  const shopGstin = profile?.gstin ?? "09AAAAA0000A1Z5";
  const stateCode = profile?.stateCode ?? "09 (U.P.)";
  const shopPhone = profile?.phone ?? "+91 98765 43210";
  const jurisdiction = profile?.jurisdictionCourt ?? "City Court";

  const invoiceId = sale.invoiceNumber ?? `#${sale.id}`;
  const cgst = sale.cgstAmount ?? sale.gstAmount / 2;
  const sgst = sale.sgstAmount ?? sale.gstAmount / 2;

  return (
    <div className="font-sans text-black bg-white p-6 sm:p-8 max-w-[700px] w-full mx-auto border-2 border-black print:border print:shadow-none print:p-3 print:max-w-none">
      {/* ── Top GSTIN Banner ── */}
      <div className="flex items-center justify-between text-[11px] font-medium border-b-2 border-black pb-2">
        <span>GSTIN : {shopGstin}</span>
        <span className="font-bold tracking-wider uppercase">Tax Invoice</span>
        <span>State Code : {stateCode}</span>
      </div>

      {/* ── Shop Header ── */}
      <div className="text-center py-3 border-b-2 border-black">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight uppercase leading-tight">
          {shopName}
        </h1>
        <p className="text-xs font-medium text-gray-800 mt-0.5">{shopAddress}</p>
        {shopPhone && (
          <p className="text-[11px] text-gray-600">Phone: {shopPhone}</p>
        )}
      </div>

      {/* ── Invoice No & Date Row ── */}
      <div className="flex items-center justify-between py-2.5 border-b border-black text-xs">
        <div>
          <span className="font-bold">No. </span>
          <span className="font-mono font-bold text-sm">{invoiceId}</span>
        </div>
        <div>
          <span className="font-bold">Date: </span>
          <span className="font-medium">{fmtDate(sale.saleDate)}</span>
        </div>
      </div>

      {/* ── Customer Details ── */}
      <div className="py-2.5 border-b border-black text-xs space-y-1">
        <div className="flex gap-8">
          <p>
            <span className="font-bold">Customer Name: </span>
            <span className="font-medium">{sale.customerName}</span>
          </p>
          {sale.customerPhoneNo && (
            <p>
              <span className="font-bold">Mobile: </span>
              <span className="font-mono">{sale.customerPhoneNo}</span>
            </p>
          )}
        </div>
        {sale.customerAddress && (
          <p>
            <span className="font-bold">Address: </span>
            <span>{sale.customerAddress}</span>
          </p>
        )}
        <p>
          <span className="font-bold">GSTIN: </span>
          <span className="font-mono">{sale.customerGstin || "—"}</span>
        </p>
      </div>

      {/* ── 6-Column Items Table ── */}
      <div className="py-2">
        <table className="w-full text-xs border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="border border-black p-2 text-center w-[8%]">S.No.</th>
              <th className="border border-black p-2 text-left">Description</th>
              <th className="border border-black p-2 text-center w-[12%]">Gross Wt</th>
              <th className="border border-black p-2 text-center w-[12%]">Net Wt</th>
              <th className="border border-black p-2 text-right w-[16%]">Rate</th>
              <th className="border border-black p-2 text-right w-[16%]">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2 text-center font-mono">
                  {index + 1}
                </td>
                <td className="border border-black p-2">
                  <div className="font-bold">{item.productName}</div>
                  <div className="text-[10px] text-gray-600">
                    {item.material} {item.purity}
                    {item.hsnCode && ` · HSN: ${item.hsnCode}`}
                  </div>
                </td>
                <td className="border border-black p-2 text-center font-mono">
                  {item.weight ? `${item.weight} g` : "—"}
                </td>
                <td className="border border-black p-2 text-center font-mono">
                  {item.weight ? `${item.weight} g` : "—"}
                </td>
                <td className="border border-black p-2 text-right font-mono text-[11px]">
                  {item.appliedRatePer10g
                    ? `${formatINR(item.appliedRatePer10g)} /10g`
                    : "—"}
                </td>
                <td className="border border-black p-2 text-right font-mono font-bold">
                  {formatINR(item.lineTotal)}
                </td>
              </tr>
            ))}
            {/* Empty rows to pad out invoice if fewer than 3 items */}
            {items.length < 3 &&
              Array.from({ length: 3 - items.length }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td className="border border-black p-2 text-center text-gray-300">
                    {items.length + i + 1}
                  </td>
                  <td className="border border-black p-2">&nbsp;</td>
                  <td className="border border-black p-2">&nbsp;</td>
                  <td className="border border-black p-2">&nbsp;</td>
                  <td className="border border-black p-2">&nbsp;</td>
                  <td className="border border-black p-2">&nbsp;</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Amount in Words + Totals Box ── */}
      <div className="flex border-2 border-black">
        {/* Left: Amount in words */}
        <div className="flex-1 p-2.5 border-r-2 border-black text-xs">
          <p className="font-bold text-gray-700 mb-1">Amount in words:</p>
          <p className="font-bold text-[11px] leading-snug">
            Rupees {numberToIndianWords(sale.grandTotal)} Only
          </p>
        </div>

        {/* Right: Totals */}
        <div className="w-[220px] text-xs">
          <div className="flex justify-between p-2 border-b border-black">
            <span className="font-bold">Taxable Value</span>
            <span className="font-mono font-bold">{formatINR(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between p-2 border-b border-black">
            <span>CGST @ 1.5%</span>
            <span className="font-mono">{formatINR(cgst)}</span>
          </div>
          <div className="flex justify-between p-2 border-b border-black">
            <span>SGST @ 1.5%</span>
            <span className="font-mono">{formatINR(sgst)}</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-50">
            <span className="font-extrabold uppercase">Grand Total</span>
            <span className="font-mono font-extrabold text-sm">
              {formatINR(sale.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-between pt-4 mt-3 border-t-2 border-black text-[10.5px]">
        <div className="space-y-0.5 text-gray-700">
          <p className="font-bold">E. &amp; O.E.</p>
          <p>All disputes subject to {jurisdiction} jurisdiction.</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">For — {shopName}</p>
          <div className="border-b border-black w-36 ml-auto mt-4 mb-1" />
          <p className="font-bold text-gray-700">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
};
